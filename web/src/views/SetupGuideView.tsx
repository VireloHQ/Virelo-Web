import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  DeviceMobile,
  FolderOpen,
  GithubLogo,
  TerminalWindow,
  WarningCircle,
  WifiHigh,
  Wrench
} from '@phosphor-icons/react';
import { PublicLanguageSelect, PublicLocaleProvider, usePublicLocale } from '../components/PublicLocale';
import type { PublicMessage } from '../i18n/public-messages';
import '../landing.css';
import '../setup-guide.css';

const githubUrl = 'https://github.com/VireloHQ/Virelo';

const guideSections = [
  ['quick-start', 'Quick start'],
  ['media-folders', 'Choose folders'],
  ['network', 'Network access'],
  ['termux', 'Termux'],
  ['tools', 'Media tools'],
  ['cli', 'CLI options'],
  ['troubleshooting', 'Troubleshooting']
] as const;

function CommandBlock({ command, label }: { command: string; label: PublicMessage }) {
  const { t } = usePublicLocale();
  const [copyState, setCopyState] = useState<'idle'|'copied'|'error'>('idle');

  const copyCommand = async () => {
    try { await navigator.clipboard.writeText(command);setCopyState('copied'); }
    catch { setCopyState('error'); }
  };

  return (
    <div className="setup-command-block"><div className="setup-command">
      <code>{command}</code>
      <button type="button" onClick={copyCommand} aria-label={t("Copy {label}", { label: t(label) })}>
        {copyState==='copied' ? <Check weight="bold" /> : <Copy />}
        <span>{copyState==='copied' ? t("Copied") : t("Copy")}</span>
      </button>
    </div><p role="status" className={copyState==='error'?'setup-copy-error':'sr-only'}>{copyState==='error'?t("Copy isn’t available here. Select the command and copy it manually."):copyState==='copied'?t("Command copied."):''}</p></div>
  );
}

function SectionHeading({ title, children }: { title: string; children: string }) {
  return (
    <div className="setup-section-heading">
      <h2>{title}</h2>
      <span>{children}</span>
    </div>
  );
}

function SetupGuideContent() {
  const { t } = usePublicLocale();
  return (
    <div className="landing-page setup-page">
      <a className="landing-skip" href="#setup-main">{t("Skip to content")}</a>
      <header className="landing-header">
        <div className="landing-header-inner">
          <Link to="/" className="landing-brand" aria-label={t("Virelo home")}>
            <img src="/virelo-icon-180.png?v=transparent-1" alt="" width="40" height="40" />
            <span>Virelo</span>
          </Link>
          <span className="setup-header-label">{t("Setup guide")}</span>
          <div className="landing-header-actions"><PublicLanguageSelect />
            <a className="landing-github-link" href={githubUrl} target="_blank" rel="noreferrer">
              <GithubLogo weight="fill" />
              <span>GitHub</span>
            </a>
            <Link to="/app" className="landing-open-link">{t("Open Virelo")}</Link>
          </div>
        </div>
      </header>

      <main className="setup-main" id="setup-main" tabIndex={-1}>
        <section className="setup-hero" aria-labelledby="setup-title">
          <Link to="/" className="setup-back"><ArrowLeft />{' '}{t("Back to Virelo")}</Link>
          <h1 id="setup-title">{t("Run Virelo locally.")}</h1>
          <p>{t("Start Virelo from a video folder, keep it on a predictable local address, or make it available to devices on your trusted network.")}</p>
          <ul className="setup-requirements" aria-label={t("Requirements")}>
            <li><CheckCircle weight="fill" />{' '}{t("Node.js 22.23.4+, 24.22.1+ or 26.12.1+ within those release lines")}</li>
            <li><CheckCircle weight="fill" />{' '}{t("Windows, macOS, Linux, or Termux")}</li>
            <li><CheckCircle weight="fill" />{' '}{t("FFmpeg is optional")}</li>
          </ul>
        </section>

        <div className="setup-layout">
          <aside className="setup-toc">
            <p>{t("On this page")}</p>
            <nav aria-label={t("Setup guide sections")}>
              {guideSections.map(([href, label]) => <a key={href} href={`#${href}`}>{t(label)}</a>)}
            </nav>
          </aside>

          <article className="setup-content">
            <section id="quick-start" className="setup-section">
              <SectionHeading title={t("Quick start")}>{t("Run Virelo from the folder that contains your videos.")}</SectionHeading>
              <div className="setup-steps">
                <div className="setup-step">
                  <span>1</span>
                  <div>
                    <h3>{t("Open a terminal in your video folder")}</h3>
                    <p>{t("Virelo uses the current directory when you do not pass a media path.")}</p>
                  </div>
                </div>
                <div className="setup-step">
                  <span>2</span>
                  <div>
                    <h3>{t("Start Virelo")}</h3>
                    <CommandBlock command="npx virelo" label="quick start command" />
                  </div>
                </div>
                <div className="setup-step">
                  <span>3</span>
                  <div>
                    <h3>{t("Open your library")}</h3>
                    <p>{t("Your browser opens automatically at")}{' '}<code>http://127.0.0.1:41777</code>{t(". Keep the terminal running while you use Virelo.")}</p>
                    <p>{t("On first launch in Virelo 0.4+, open localhost on the device running Virelo to create the administrator account. Add other users in Account Manager.")}</p>
                  </div>
                </div>
              </div>
              <div className="setup-note"><CheckCircle weight="fill" /><p>{t("Your source videos stay in their original folders. Virelo stores only its database, thumbnails, artwork, and playback cache in")}{' '}<code>~/.virelo</code>{t(".")}</p></div>
            </section>

            <section id="media-folders" className="setup-section">
              <SectionHeading title={t("Choose your media folders")}>{t("Point Virelo at any folder without changing your terminal location.")}</SectionHeading>
              <div className="setup-command-group">
                <div><h3>Windows</h3><CommandBlock command={'npx virelo --media "C:\\Users\\You\\Videos"'} label="Windows media folder command" /></div>
                <div><h3>{t("macOS and Linux")}</h3><CommandBlock command="npx virelo --media ~/Videos" label="macOS and Linux media folder command" /></div>
                <div><h3>{t("More than one folder")}</h3><CommandBlock command="npx virelo --media ~/Movies --media ~/Clips" label="multiple media folders command" /></div>
              </div>
              <p className="setup-body-copy"><FolderOpen />{' '}{t("Repeat")}{' '}<code>--media</code>{' '}{t("for every folder you want in the same library. Supplying it replaces the current-directory default for that run.")}</p>
            </section>

            <section id="network" className="setup-section">
              <SectionHeading title={t("Watch on another device")}>{t("Bind Virelo to your local network for phones, tablets, and TVs.")}</SectionHeading>
              <CommandBlock command="npx virelo --host 0.0.0.0" label="local network command" />
              <div className="setup-split">
                <div>
                  <WifiHigh />
                  <h3>{t("Use your computer's LAN address")}</h3>
                  <p>{t("On another device, open")}{' '}<code>http://YOUR-COMPUTER-IP:41777</code>{t(". Both devices must be on the same network.")}</p>
                </div>
                <div>
                  <WarningCircle />
                  <h3>{t("Use a trusted network")}</h3>
                  <p>{t("Virelo 0.4+ requires sign-in. Older versions have no authentication. Use a trusted network and never expose Virelo directly to the public internet.")}</p>
                </div>
              </div>
              <div className="setup-subsection">
                <h3>{t("Keep a fixed address")}</h3>
                <p>{t("The default port is")}{' '}<code>41777</code>{t(". A fixed port is best when you install Virelo as a PWA. If that port is unavailable, choose another fixed port:")}</p>
                <CommandBlock command="npx virelo --port 41888" label="custom fixed port command" />
                <p>{t("For a temporary session, let the operating system pick an available port:")}</p>
                <CommandBlock command="npx virelo --random-port" label="random port command" />
              </div>
            </section>

            <section id="termux" className="setup-section">
              <SectionHeading title={t("Run on Android with Termux")}>{t("Serve videos stored on your Android device without scanning the Termux home directory.")}</SectionHeading>
              <div className="setup-platform-heading"><DeviceMobile /><div><h3>{t("Install the prerequisites")}</h3><p>{t("Use a current Termux release, then grant shared-storage access.")}</p></div></div>
              <CommandBlock command={'pkg update && pkg upgrade\npkg install nodejs ffmpeg\ntermux-setup-storage'} label="Termux prerequisites" />
              <div className="setup-platform-heading"><TerminalWindow /><div><h3>{t("Start your Movies folder")}</h3><p>{t("Pass the folder explicitly so package caches are not scanned as media.")}</p></div></div>
              <CommandBlock command={'npx virelo --media "$HOME/storage/shared/Movies" --no-open'} label="Termux start command" />
              <p className="setup-body-copy">{t("Open")}{' '}<code>http://127.0.0.1:41777</code>{' '}{t("in your Android browser. Current Virelo releases automatically use a Termux-friendly file-watching mode.")}</p>
            </section>

            <section id="tools" className="setup-section">
              <SectionHeading title={t("Optional media tools")}>{t("Virelo starts without FFmpeg. Installing it improves compatibility and artwork generation.")}</SectionHeading>
              <div className="setup-split setup-tools-grid">
                <div><TerminalWindow /><h3>{t("Without FFmpeg")}</h3><p>{t("Files that your browser can decode directly will play normally.")}</p></div>
                <div><Wrench /><h3>{t("With FFmpeg and ffprobe")}</h3><p>{t("Virelo can probe codecs, create thumbnails, and use HLS fallback for formats browsers cannot play directly.")}</p></div>
              </div>
              <p className="setup-body-copy">{t("Install FFmpeg with your operating system's package manager, restart Virelo, then check its status under")}{' '}<strong>{t("Settings → Media tools")}</strong>{t(".")}</p>
            </section>

            <section id="cli" className="setup-section">
              <SectionHeading title={t("CLI reference")}>{t("All options currently supported by the Virelo command.")}</SectionHeading>
              <div className="setup-table-wrap">
                <table>
                  <thead><tr><th>{t("Option")}</th><th>{t("Purpose")}</th></tr></thead>
                  <tbody>
                    <tr><td><code>-m, --media &lt;path&gt;</code></td><td>{t("Use a media directory. Repeat for multiple folders.")}</td></tr>
                    <tr><td><code>-d, --data &lt;path&gt;</code></td><td>{t("Choose where Virelo stores its database and cache.")}</td></tr>
                    <tr><td><code>-H, --host &lt;host&gt;</code></td><td>{t("Set the bind address. Default:")}{' '}<code>127.0.0.1</code>{t(".")}</td></tr>
                    <tr><td><code>-p, --port &lt;port&gt;</code></td><td>{t("Set the HTTP port. Default:")}{' '}<code>41777</code>{t("; use")}{' '}<code>0</code>{' '}{t("for an available port.")}</td></tr>
                    <tr><td><code>--random-port</code></td><td>{t("Select an available HTTP port automatically.")}</td></tr>
                    <tr><td><code>--no-open</code></td><td>{t("Do not open a browser after startup.")}</td></tr>
                    <tr><td><code>-h, --help</code></td><td>{t("Show command help.")}</td></tr>
                    <tr><td><code>-v, --version</code></td><td>{t("Show the installed Virelo version.")}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="troubleshooting" className="setup-section">
              <SectionHeading title={t("Troubleshooting")}>{t("The most common startup problems have short fixes.")}</SectionHeading>
              <div className="setup-faq">
                <details>
                  <summary>{t("Port 41777 is already in use")}</summary>
                  <p>{t("Close the older Virelo process, choose another fixed port with")}{' '}<code>--port</code>{t(", or use")}{' '}<code>--random-port</code>{' '}{t("for a temporary session.")}</p>
                </details>
                <details>
                  <summary>{t("The library is empty")}</summary>
                  <p>{t("Confirm that the terminal is open in the correct folder, or pass the full folder path with")}{' '}<code>--media</code>{t(". Virelo scans supported video files recursively.")}</p>
                </details>
                <details>
                  <summary>{t("Another device cannot connect")}</summary>
                  <p>{t("Start Virelo with")}{' '}<code>--host 0.0.0.0</code>{t(", use the host computer's LAN IP rather than")}{' '}<code>127.0.0.1</code>{t(", and allow Node.js through the operating system firewall on private networks.")}</p>
                </details>
                <details>
                  <summary>{t("A video will not play in the browser")}</summary>
                  <p>{t("Install FFmpeg and ffprobe, restart Virelo, and check")}{' '}<strong>{t("Settings → Media tools")}</strong>{t(". Virelo can then create an HLS fallback for unsupported formats.")}</p>
                </details>
              </div>
              <div className="setup-support">
                <div><GithubLogo weight="fill" /><div><h3>{t("Still stuck?")}</h3><p>{t("Open an issue with your operating system, Node.js version, command, and terminal output.")}</p></div></div>
                <a href="https://github.com/VireloHQ/Virelo/issues" target="_blank" rel="noreferrer">{t("Open GitHub Issues")}{' '}<ArrowRight /></a>
              </div>
            </section>
          </article>
        </div>
      </main>

      <footer className="landing-footer setup-footer">
        <Link to="/" className="landing-brand" aria-label={t("Virelo home")}>
          <img src="/virelo-icon-180.png?v=transparent-1" alt="" width="32" height="32" />
          <span>Virelo</span>
        </Link>
        <p>{t("Your private video library.")}</p>
        <div>
          <Link to="/">{t("Home")}</Link>
          <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>
          <Link to="/app">{t("Web player")}</Link>
        </div>
      </footer>
    </div>
  );
}

export function SetupGuideView() {
  return <PublicLocaleProvider page="setup"><SetupGuideContent /></PublicLocaleProvider>;
}
