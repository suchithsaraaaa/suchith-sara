import { scenes } from '@/content/film';
import { range, setStyle } from '@/lib/anim';
import { formatLength, formatTime, sceneIndexAt, toPresentation } from '@/lib/timeline';

// Frame chrome: four corners of 11 px mono. Text changes only when the value
// changes (the timecode at most once per second); the rail fills by transform.
export function Hud() {
  return (
    <div className="hud mono">
      <span className="hud-name" data-h="name">Suchith Sara</span>
      <span className="hud-time" aria-hidden="true"><b data-h="time">00:00</b> / {formatLength()}</span>
      <div className="hud-actions">
        <button type="button" className="hud-button" data-sound aria-pressed="false" aria-keyshortcuts="M">Sound off</button>
        <a className="hud-button" href="/text/">Read as text</a>
      </div>
      <div className="hud-bottom">
        <span className="hud-scene" data-h="scene" aria-live="polite">01 / Origin</span>
        <nav aria-label="Scenes" style={{ flex: 1, display: 'flex' }}>
          <ol className="rail">
            {scenes.map((s) => (
              <li key={s.id} style={{ flexGrow: toPresentation(s.t1) - toPresentation(s.t0) }}>
                <a href={`#s-${s.id}`} data-scene-link={s.id}>
                  <span className="rail-track" />
                  <span className="rail-fill" data-h="fill" />
                  <span className="rail-label">{s.n} / {s.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <button type="button" className="hud-play mono" data-play aria-pressed="false" aria-label="Play the film" aria-keyshortcuts="Space">
          <span className="when-paused"><PlayIcon /> Play</span>
          <span className="when-playing"><PauseIcon /> Pause</span>
        </button>
      </div>
    </div>
  );
}

export function PlayIcon() {
  return <svg className="icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>;
}

export function PauseIcon() {
  return <svg className="icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" /></svg>;
}

export function createHudRenderer(root: HTMLElement) {
  const q = (k: string) => Array.from(root.querySelectorAll<HTMLElement>(`[data-h="${k}"]`));
  const [name] = q('name'), [time] = q('time'), [scene] = q('scene');
  const fills = q('fill');
  let lastSecond = -1, lastScene = -1;

  return (t: number) => {
    const sec = Math.floor(t);
    if (sec !== lastSecond) {
      lastSecond = sec;
      time.textContent = formatTime(t);
    }
    const i = sceneIndexAt(t);
    if (i !== lastScene) {
      lastScene = i;
      scene.textContent = `${scenes[i].n} / ${scenes[i].label}`;
    }
    scenes.forEach((s, k) => setStyle(fills[k], 'transform', `scaleX(${range(t, s.t0, s.t1).toFixed(4)})`));
    // The name stays hidden while the title itself is on screen.
    setStyle(name, 'opacity', range(t, 7.4, 8.2).toFixed(3));
  };
}
