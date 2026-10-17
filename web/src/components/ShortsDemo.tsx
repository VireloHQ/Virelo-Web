import { useEffect, useRef, useState } from 'react';
import { usePublicLocale } from './PublicLocale';
import { Pause, Play } from '@phosphor-icons/react';

export function ShortsDemo() {
  const { t } = usePublicLocale();
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const manuallyPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = video.current;
    const container = frame.current;
    if (!element || !container) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let disposed = false;
    const update = () => {
      if (visible && !document.hidden && !reducedMotion.matches && !manuallyPaused.current) {
        void element.play().then(() => {
          if (disposed || !visible || document.hidden || reducedMotion.matches || manuallyPaused.current) element.pause();
        }).catch(() => { /* Autoplay can be blocked; the custom play button remains available. */ });
      } else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !element.getAttribute('src')) {
        element.src = '/landing/shorts-blender-demo.mp4';
        element.load();
      }
      update();
    }, { threshold: 0.15 });
    observer.observe(container);
    document.addEventListener('visibilitychange', update);
    reducedMotion.addEventListener('change', update);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
      reducedMotion.removeEventListener('change', update);
      element.pause();
    };
  }, []);

  function togglePlayback() {
    const element = video.current;
    if (!element) return;
    if (element.paused) {
      manuallyPaused.current = false;
      void element.play().catch(() => setFailed(true));
    } else {
      manuallyPaused.current = true;
      element.pause();
    }
  }

  return <figure className="landing-shorts-demo">
    <div ref={frame} className="landing-phone" onContextMenu={event => event.preventDefault()}>
      <div className="landing-phone-screen">
        <video ref={video} muted loop playsInline preload="none" poster="/landing/shorts-blender-demo.webp"
          controls={false} controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture disableRemotePlayback aria-label={t("Virelo Shorts demonstration")}
          onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />
      </div>
    </div>
    <figcaption className="landing-demo-caption">
      <span>{failed ? t("Demo unavailable. Try the web player.") : t("Actual Virelo Shorts")}</span>
      <button type="button" onClick={togglePlayback} disabled={failed}
        aria-label={playing ? t("Pause Shorts demo") : t("Play Shorts demo")}>
        {playing ? <Pause weight="fill" /> : <Play weight="fill" />}{playing ? t("Pause demo") : t("Play demo")}
      </button>
    </figcaption>
    <p className="landing-demo-credits">
      <a href="https://peach.blender.org/about/">Big Buck Bunny</a>{' · '}
      <a href="https://durian.blender.org/sharing/">Sintel</a><br />
      © 2008 / 2010 Blender Foundation · <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a><br />
      <a href="/landing/shorts-blender-credits.txt">{t('Excerpt credits and edits')}</a>
    </p>
  </figure>;
}
