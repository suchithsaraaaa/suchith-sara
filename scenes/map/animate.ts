import { mapStory } from '@/content/film';
import { range, setStyle, settle } from '@/lib/anim';
import { drawIdols, MAP_T } from './geometry';

// The parts of scene 05 that are more than timing: the counter's detents,
// the closing letterbox, the travelling packet, and the station marks
// counting themselves in.
export function createMapAnimator(root: HTMLElement, reduced: boolean, onStation?: (shown: number, total: number, forward: boolean) => void) {
  const counter = root.querySelector<HTMLElement>('[data-counter]')!;
  const detents = Array.from(root.querySelectorAll<HTMLElement>('[data-detent]'));
  const bars = Array.from(root.querySelectorAll<HTMLElement>('.letterbox-bar'));
  const packet = root.querySelector<HTMLElement>('[data-packet]')!;
  const marks = Array.from(root.querySelectorAll<SVGPathElement>('[data-station]'));
  const stationCount = root.querySelector<HTMLElement>('[data-station-count]')!;
  const idols = root.querySelector<HTMLCanvasElement>('[data-idols]')!;

  const paintIdols = () => drawIdols(idols, Number(idols.dataset.idols));
  paintIdols();
  const ro = new ResizeObserver(paintIdols);
  ro.observe(idols);

  const values = mapStory.detents.map((d) => d.toLocaleString('en-US'));
  let lastIndex = -1, lastMarks = -1;

  const render = (t: number) => {
    // Six deliberate detents, never a rolling counter. The last one (4,200)
    // is not shown here: it arrives in amber after the cut.
    const i = t < MAP_T.counter + MAP_T.step ? 0 : Math.min(4, Math.floor((t - MAP_T.counter) / MAP_T.step));
    if (i !== lastIndex) {
      lastIndex = i;
      counter.textContent = values[i];
      detents.forEach((d, k) => d.classList.toggle('is-now', k === i));
    }
    const squeeze = reduced ? 0 : i / 4;
    bars.forEach((b) => setStyle(b, 'transform', `scaleY(${squeeze.toFixed(3)})`));

    setStyle(packet, 'transform', `translate3d(${(settle(range(t, 61.2, 62.6)) * 100).toFixed(2)}%,0,0)`);

    const shown = Math.round(range(t, MAP_T.stations[0], MAP_T.stations[1]) * marks.length);
    if (shown !== lastMarks) {
      if (lastMarks >= 0) onStation?.(shown, marks.length, shown > lastMarks);
      lastMarks = shown;
      marks.forEach((m, k) => m.classList.toggle('is-on', k < shown));
      stationCount.textContent = String(shown);
    }
  };
  return { render, dispose: () => ro.disconnect() };
}
