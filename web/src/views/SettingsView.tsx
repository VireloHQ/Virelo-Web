import { PageSkeleton } from '../components/PageSkeleton';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Switch } from '@heroui/react';
import { ArrowLeft, ArrowsClockwise, CheckCircle, DeviceMobile, FolderPlus, Folders, HardDrives, ImageSquare, PlayCircle, ShieldCheck, Trash, WarningCircle } from '@phosphor-icons/react';
import { api } from '../api';
import { ScanProgress } from '../components/ScanProgress';
import { Select } from '../components/Select';
import { SettingsNavigation } from '../components/SettingsNavigation';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { QueueLayoutSetting } from '../components/QueueLayoutSetting';
import type { QueueBehavior, Settings } from '../types';

const settingsSections = [
  { id:'libraries', label:'Libraries', description:'Folders and browser access', icon:Folders },
  { id:'metadata', label:'Metadata', description:'Titles and artwork', icon:ImageSquare },
  { id:'playback', label:'Playback', description:'What plays next', icon:PlayCircle },
  { id:'shorts', label:'Shorts', description:'Videos in your vertical feed', icon:DeviceMobile },
  { id:'privacy', label:'Privacy', description:'Your files stay on your device', icon:ShieldCheck }
] as const;

const QUEUE_OPTIONS = [
  { value: 'auto', label: 'Auto next, stop at end' },
  { value: 'loop', label: 'Auto next, loop folder' },
  { value: 'manual', label: 'Manual next only' }
];

type SettingsSectionId = (typeof settingsSections)[number]['id'];

export function SettingsView() {
  const client = useQueryClient();
  const settingsQuery = useQuery({ queryKey:['settings'], queryFn:api.settings });
  const libraries = useQuery({ queryKey:['libraries'], queryFn:api.libraries });
  const capabilities = useQuery({ queryKey:['capabilities'], queryFn:api.capabilities });
  const scan = useQuery({ queryKey:['scan'], queryFn:api.scanStatus, refetchInterval:(query)=>query.state.data?.running ? 400 : 2_000 });
  const [form, setForm] = useState<Settings | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('libraries');
  const [mobileDetail,setMobileDetail]=useState(false);
  const openSection=(id:string)=>{
    setActiveSection(id as SettingsSectionId);
    setMobileDetail(true);
    if(window.matchMedia('(max-width: 900px)').matches) window.requestAnimationFrame(()=>document.querySelector<HTMLElement>(`#settings-title-${id}`)?.focus());
  };
  const closeSection=()=>{
    setMobileDetail(false);
    window.requestAnimationFrame(()=>document.getElementById(`settings-nav-${activeSection}`)?.focus());
  };

  useEffect(() => { if (settingsQuery.data && !form) setForm(settingsQuery.data); }, [settingsQuery.data, form]);

  const invalidateLibrary = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey:['libraries'] }),
      client.invalidateQueries({ queryKey:['home'] }),
      client.invalidateQueries({ queryKey:['media'] }),
      client.invalidateQueries({ queryKey:['thumbnail'] }),
      client.invalidateQueries({ queryKey:['folders'] }),
      client.invalidateQueries({ queryKey:['shorts'] }),
      client.invalidateQueries({ queryKey:['scan'] })
    ]);
  };
  const save = useMutation({ mutationFn:()=>api.saveSettings(form!), onSuccess:(data)=>{ setForm(data); client.setQueryData(['settings'], data); void client.invalidateQueries({ queryKey:['shorts'] }); } });
  const add = useMutation({ mutationFn:api.addLibrary, onSuccess:invalidateLibrary });
  const reconnect = useMutation({ mutationFn:(id:number)=>api.reconnectLibrary(id), onSuccess:invalidateLibrary });
  const remove = useMutation({ mutationFn:(id:number)=>api.removeLibrary(id), onSuccess:invalidateLibrary });
  const clearMetadata = useMutation({mutationFn:api.clearAllMetadata,onSuccess:()=>client.invalidateQueries({predicate:(query)=>['home','media','related','shorts','watch-queue','queue','search'].includes(String(query.queryKey[0]))})});

  if (!form) return <PageSkeleton kind="settings" />;
  const hasChanges = JSON.stringify(form) !== JSON.stringify(settingsQuery.data);

  const startScan = async () => {
    await api.startScan();
    await client.invalidateQueries({ queryKey:['scan'] });
    window.setTimeout(() => { void invalidateLibrary(); }, 500);
  };

  return <div className={`content-view settings-view${mobileDetail?' settings-detail-open':''}`}>
    <header className="settings-heading"><h1>Settings</h1><div className="settings-heading-actions"><span aria-live="polite">{save.isSuccess && !hasChanges && <span className="settings-saved"><CheckCircle/> Saved</span>}</span><Button isPending={save.isPending} isDisabled={!hasChanges} onPress={()=>save.mutate()}>Save settings</Button></div></header>
    {save.error && <p className="error-copy settings-save-error">{save.error.message}</p>}

    <div className="settings-layout">
      <SettingsNavigation sections={settingsSections} activeSection={activeSection} onSelect={openSection}/>

      <div className="settings-content">
        <button type="button" className="settings-back" onClick={closeSection}><ArrowLeft aria-hidden="true"/> All settings</button>
        {activeSection === 'libraries' && <section id="settings-panel-libraries" className="settings-card settings-section" aria-labelledby="settings-title-libraries">
          <div className="settings-card-head">
            <div><h2 id="settings-title-libraries" tabIndex={-1}>Libraries</h2><p>Choose folders that Virelo can read in this browser.</p></div>
            <Button isPending={add.isPending} onPress={()=>add.mutate()}><FolderPlus/> Add folder</Button>
          </div>
          {!capabilities.data?.secureContext && <p className="browser-warning"><WarningCircle/> Folder access requires HTTPS or localhost.</p>}
          {capabilities.data && !capabilities.data.directoryPicker && <p className="browser-warning"><WarningCircle/> This browser can use selected files for the current session, but may ask for the folder again after a reload.</p>}
          {(add.error || reconnect.error) && (add.error?.name !== 'AbortError' && reconnect.error?.name !== 'AbortError') && <p className="error-copy">{add.error?.message || reconnect.error?.message}</p>}

          <div className="library-list">
            {libraries.data?.map((library) => <div key={library.id}>
              <div>
                <strong>{library.label}</strong>
                <span className={library.connected ? 'library-connected' : 'library-disconnected'}>{library.connected ? <CheckCircle/> : <WarningCircle/>}{library.connected ? 'Connected' : 'Reconnect required'}{library.persistent ? '' : ' · session only'}</span>
              </div>
              <div className="library-actions">
                {!library.connected && <Button size="sm" variant="secondary" isPending={reconnect.isPending} onPress={()=>reconnect.mutate(library.id)}>Reconnect</Button>}
                <Button isIconOnly variant="ghost" aria-label={`Remove ${library.label}`} onPress={()=>remove.mutate(library.id)}><Trash/></Button>
              </div>
            </div>)}
            {libraries.data?.length === 0 && <p className="settings-empty-copy">No folders selected.</p>}
          </div>

          <div className="scan-strip">
            {scan.data?.running ? <ScanProgress status={scan.data} compact/> : <div><CheckCircle/><span><strong>{scan.data?.message || 'Ready'}</strong></span></div>}
            <Button variant="secondary" isDisabled={scan.data?.running || !libraries.data?.length} onPress={()=>void startScan()}><ArrowsClockwise/> Scan now</Button>
          </div>
        </section>}

        {activeSection === 'metadata' && <section id="settings-panel-metadata" className="settings-card settings-section" aria-labelledby="settings-title-metadata">
          <div className="settings-card-head"><div><h2 id="settings-title-metadata" tabIndex={-1}>Metadata</h2><p>Manage titles and artwork stored in this browser.</p></div></div>
          <div className="setting-row settings-action-row"><div className="setting-copy"><div><strong>Clear all metadata</strong><p>Reset titles and remove matched descriptions and artwork from every added library. Videos, generated thumbnails, favorites and watch progress stay intact.</p></div></div><ConfirmationDialog triggerLabel="Clear all metadata" title="Clear all metadata?" confirmLabel="Clear metadata" onConfirm={()=>clearMetadata.mutateAsync()}><p>Clear matched titles, descriptions and artwork from <strong>every added library</strong>. Titles will return to filenames.</p><p>Your videos, generated thumbnails, favorites and watch progress will stay intact.</p></ConfirmationDialog></div>
          <div role="status">{clearMetadata.isSuccess&&<p>Metadata cleared for {clearMetadata.data.cleared} videos.</p>}</div>
        </section>}

        {activeSection === 'playback' && <section id="settings-panel-playback" className="settings-card settings-section" aria-labelledby="settings-title-playback">
          <div className="settings-card-head"><div><h2 id="settings-title-playback" tabIndex={-1}>Playback</h2><p>Choose what happens when a video ends in a folder queue.</p></div></div>
          <QueueLayoutSetting/>
          <div className="setting-row"><div className="setting-copy"><div><strong>Queue advance</strong><p>Auto-advance, loop, or manually step through the folder.</p></div></div>
            <Select className="settings-picker" label="Queue advance" value={form.queueBehavior} options={QUEUE_OPTIONS} align="end" onChange={(value)=>setForm({...form, queueBehavior:value as QueueBehavior})}/></div>
        </section>}

        {activeSection === 'shorts' && <section id="settings-panel-shorts" className="settings-card settings-section" aria-labelledby="settings-title-shorts">
          <div className="settings-card-head"><div><h2 id="settings-title-shorts" tabIndex={-1}>Shorts</h2><p>Choose which local videos appear in the vertical feed.</p></div></div>
          <SettingSwitch checked={form.shortsIncludeLandscapes} onChange={(value)=>setForm({...form, shortsIncludeLandscapes:value})} title="Include landscape videos" description="Fit landscape videos by width in the Shorts player."/>
        </section>}

        {activeSection === 'privacy' && <section id="settings-panel-privacy" className="settings-card settings-section compact-card" aria-labelledby="settings-title-privacy">
          <div className="settings-card-head"><div><h2 id="settings-title-privacy" tabIndex={-1}>Privacy</h2><p>Virelo Web runs entirely in your browser.</p></div></div>
          <div className="privacy-facts">
            <div><ShieldCheck/><span><strong>No file uploads</strong><small>Video data stays on this device.</small></span></div>
            <div><HardDrives/><span><strong>Local browser index</strong><small>Titles, thumbnails, favorites and progress are stored in IndexedDB.</small></span></div>
            <div><WarningCircle/><span><strong>You control access</strong><small>Remove a library at any time or revoke site permissions in your browser.</small></span></div>
          </div>
        </section>}
      </div>
    </div>
    <footer className="settings-legal" aria-label="Virelo licensing">
      <span>Copyright (c) 2026 Virelo contributors. No warranty.</span>
      <nav aria-label="Source and license"><a href="https://github.com/VireloHQ/Virelo-Web" target="_blank" rel="noreferrer">Source code</a><a href="/LICENSE.txt" target="_blank" rel="noreferrer">AGPL-3.0-only</a></nav>
    </footer>
  </div>;
}

function SettingSwitch({ checked, onChange, title, description }: { checked:boolean; onChange:(value:boolean)=>void; title:string; description:string }) {
  return <div className="setting-row"><div className="setting-copy"><div><strong>{title}</strong><p>{description}</p></div></div><Switch isSelected={checked} onChange={onChange} aria-label={title}><Switch.Content><Switch.Control><Switch.Thumb/></Switch.Control></Switch.Content></Switch></div>;
}
