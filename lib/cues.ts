import { range, setStyle, settle, smooth } from './anim';

// Declarative choreography. Scene markup carries its own timing:
//   data-in="9.2" data-out="12" data-fx="wipe" data-d="0.5" data-do="0.4"
// and this one renderer turns film time into styles for every cue on the
// stage. Outside its window a cue is visibility:hidden, so hidden links are
// never focusable and hidden layers are never painted.
//
// Effects (transform, opacity and clip-path only, so nothing re-lays out):
//   none   window only        fade   opacity           rise   fade + lift
//   wipe   mask from left     wipec  mask from centre  track  tracking collapse
//   width  condensed → full   draw   SVG stroke draw   pin    leader line + label
//   roll   rises in, then hands off upward (for a readout that changes in place)
//   cut    hard on, hard off

type Cue = {
  el: HTMLElement | SVGElement;
  fx: string;
  tin: number;
  tout: number;
  d: number;
  dout: number;
  drift: number;
  x: number;
  y: number;
  parts?: { leader?: HTMLElement; label?: HTMLElement };
  letters?: { el: HTMLElement; slot: number }[];
};

const num = (v: string | undefined, dflt: number) => (v === undefined || v === '' ? dflt : Number(v));

export function collectCues(root: ParentNode): Cue[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-in]')).map((el) => {
    const ds = el.dataset;
    const fx = ds.fx ?? 'fade';
    const cue: Cue = {
      el,
      fx,
      tin: num(ds.in, 0),
      tout: num(ds.out, Infinity),
      d: num(ds.d, fx === 'cut' ? 0 : 0.8),
      dout: num(ds.do, fx === 'cut' ? 0 : 0.6),
      drift: num(ds.drift, 0),
      x: num(ds.x, 0.5),
      y: num(ds.y, 0.5),
    };
    if (fx === 'pin') {
      cue.parts = {
        leader: el.querySelector<HTMLElement>('[data-part="leader"]') ?? undefined,
        label: el.querySelector<HTMLElement>('[data-part="label"]') ?? undefined,
      };
    }
    if (fx === 'track') {
      cue.letters = Array.from(el.querySelectorAll<HTMLElement>('[data-letter]')).map((l) => {
        const sib = Array.from(l.parentElement!.children);
        return { el: l, slot: sib.indexOf(l) - (sib.length - 1) / 2 };
      });
    }
    return cue;
  });
}

/** Called when the film moves forward into a cue's window (for sound). */
export type CueEnter = (el: Element) => void;

export function createCueRenderer(cues: Cue[], reduced: boolean, onEnter?: CueEnter) {
  let prev = -1;
  return (t: number) => {
    const forward = prev >= 0 && t > prev && t - prev < 2;
    for (const c of cues) {
      const el = c.el as HTMLElement;
      const on = t >= c.tin && t <= c.tout;
      if (forward && onEnter && prev < c.tin && t >= c.tin) onEnter(el);
      setStyle(el, 'visibility', on ? 'visible' : 'hidden');
      if (!on || c.fx === 'none') continue;

      const p = c.d > 0 ? settle(range(t, c.tin, c.tin + c.d)) : 1;
      const q = c.dout > 0 && c.tout !== Infinity ? range(t, c.tout - c.dout, c.tout) : 0;
      const alpha = (reduced ? (c.d > 0 ? range(t, c.tin, c.tin + c.d) : 1) : 1) * (1 - q);
      const drift = !reduced && c.drift
        ? `translate3d(${((c.x - 0.5) * c.drift * (t - c.tin)).toFixed(3)}vw,${((c.y - 0.5) * c.drift * (t - c.tin)).toFixed(3)}vh,0)`
        : '';

      switch (reduced && c.fx !== 'cut' && c.fx !== 'draw' ? 'fade' : c.fx) {
        case 'cut':
          setStyle(el, 'opacity', '1');
          break;
        case 'fade':
          setStyle(el, 'opacity', (p * (1 - q)).toFixed(3));
          if (drift) setStyle(el, 'transform', drift);
          break;
        case 'roll': {
          const a = smooth(range(t, c.tin, c.tin + c.d));
          const b = c.tout === Infinity ? 0 : smooth(range(t, c.tout - c.dout, c.tout));
          setStyle(el, 'opacity', (a * (1 - b)).toFixed(3));
          setStyle(el, 'transform', `translate3d(0,${((1 - a) * 22 - b * 22).toFixed(2)}px,0)`);
          break;
        }
        case 'rise':
          setStyle(el, 'opacity', (p * (1 - q)).toFixed(3));
          setStyle(el, 'transform', `translate3d(0,${((1 - p) * 18).toFixed(2)}px,0)`);
          break;
        case 'wipe':
          setStyle(el, 'opacity', (1 - q).toFixed(3));
          setStyle(el, 'clip-path', `inset(-0.2em ${(100 * (1 - p)).toFixed(2)}% -0.2em 0)`);
          break;
        case 'wipec': {
          const s = (50 * (1 - p)).toFixed(2);
          setStyle(el, 'opacity', (1 - q).toFixed(3));
          setStyle(el, 'clip-path', `inset(-0.2em ${s}% -0.2em ${s}%)`);
          break;
        }
        case 'width':
          // Condensed to full width, as a transform: re-laying out display type
          // every frame costs frames; scaling it is free on the compositor.
          setStyle(el, 'opacity', (range(t, c.tin, c.tin + c.d * 0.5) * (1 - q)).toFixed(3));
          setStyle(el, 'transform', `scaleX(${(0.62 + 0.38 * p).toFixed(4)})`);
          break;
        case 'track': {
          setStyle(el, 'opacity', (1 - q).toFixed(3));
          for (const { el: l, slot } of c.letters!) {
            const k = settle(range(t, c.tin + Math.abs(slot) * 0.04, c.tin + c.d + Math.abs(slot) * 0.04));
            setStyle(l, 'opacity', k.toFixed(3));
            setStyle(l, 'transform', `translate3d(${(slot * 0.55 * (1 - k)).toFixed(4)}em,0,0)`);
          }
          break;
        }
        case 'draw':
          setStyle(el, 'stroke-dashoffset', (1 - p).toFixed(4));
          setStyle(el, 'opacity', (1 - q).toFixed(3));
          break;
        case 'pin': {
          const a = settle(range(t, c.tin, c.tin + 0.35));
          const b = settle(range(t, c.tin + 0.2, c.tin + 0.7));
          setStyle(el, 'opacity', (reduced ? alpha : 1 - q).toFixed(3));
          if (drift) setStyle(el, 'transform', drift);
          if (c.parts?.leader) setStyle(c.parts.leader, 'transform', `scaleX(${reduced ? 1 : a.toFixed(3)})`);
          if (c.parts?.label) setStyle(c.parts.label, 'clip-path', reduced ? 'none' : `inset(-0.3em ${(100 * (1 - b)).toFixed(2)}% -0.3em 0)`);
          break;
        }
      }
    }
    prev = t;
  };
}
