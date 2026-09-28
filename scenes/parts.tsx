import type { CSSProperties, ReactNode } from 'react';

// Shared building blocks for scene markup. Timing lives in data attributes
// read by lib/cues.ts; see there for the effect vocabulary.

type Fx = 'none' | 'fade' | 'rise' | 'roll' | 'wipe' | 'wipec' | 'track' | 'width' | 'draw' | 'pin' | 'cut';

export function cue(tin: number, tout?: number, fx: Fx = 'fade', o: { d?: number; do?: number; drift?: number; x?: number; y?: number } = {}) {
  const a: Record<string, string> = { 'data-in': String(tin), 'data-fx': fx };
  if (tout !== undefined) a['data-out'] = String(tout);
  if (o.d !== undefined) a['data-d'] = String(o.d);
  if (o.do !== undefined) a['data-do'] = String(o.do);
  if (o.drift !== undefined) a['data-drift'] = String(o.drift);
  if (o.x !== undefined) a['data-x'] = String(o.x);
  if (o.y !== undefined) a['data-y'] = String(o.y);
  return a;
}

/** Text split into letters for the tracking-collapse effect; reads as one word to assistive tech. */
export function Letters({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, wi) => (
        <span className="word" key={wi} aria-hidden="true">
          {[...w].map((ch, i) => <span className="letter" data-letter key={i}>{ch}</span>)}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </>
  );
}

/** Uppercase mono text that keeps the real casing of names like vLLM and mDNS. */
export function KeepCase({ text }: { text: string }) {
  return (
    <>
      {text.split(/(vLLM|mDNS)/).map((part, i) => (i % 2 ? <span className="nc" key={i}>{part}</span> : part))}
    </>
  );
}

/** A mono label on a leader line, placed in plate space (0–1 of the footage frame). */
export function Pin({ x, y, tin, tout, label, sub, left, drift = 0.35 }: {
  x: number; y: number; tin: number; tout: number; label: ReactNode; sub?: string; left?: boolean; drift?: number;
}) {
  return (
    <div className={`pin mono${left ? ' pin--left' : ''}`} style={{ left: `${x * 100}%`, top: `${y * 100}%` }} {...cue(tin, tout, 'pin', { drift, x, y, do: 0.5 })}>
      <span className="pin-body">
        <span className="pin-dot" />
        <span className="pin-leader" data-part="leader" />
        <span className="pin-label" data-part="label">
          {label}
          {sub && <small>{sub}</small>}
        </span>
      </span>
    </div>
  );
}

/** A scene's root: a full-stage layer that exists only inside its window. */
export function Scene({ id, tin, tout, label, children, className, style }: {
  id: string; tin: number; tout: number; label: string; children: ReactNode; className?: string; style?: CSSProperties;
}) {
  return (
    <section className={`layer scene ${className ?? ''}`} data-scene={id} aria-label={label} {...cue(tin, tout, 'none')} style={style}>
      {children}
    </section>
  );
}

/**
 * A readout that changes in place: one stage at a time, each rolling in and
 * handing off upward to the next, with a rail showing how far along it is.
 * Anchored lower-left, like a film's lower third, so nothing appears out of
 * nowhere.
 */
export function Stages({ items, tin, step, tout, label }: {
  items: { name: ReactNode; sub?: ReactNode }[]; tin: number; step: number; tout: number; label: string;
}) {
  const n = items.length;
  return (
    <div className="stages" aria-label={label} {...cue(tin, tout, 'none')}>
      <ol className="stage-list">
        {items.map((it, i) => {
          // Hand-offs never overlap: each stage has fully left before the next arrives.
          const a = tin + i * step + (i ? 0.04 : 0);
          const b = i === n - 1 ? tout : tin + (i + 1) * step;
          return (
            <li key={i} className="stage-item" {...cue(a, b, 'roll', { d: 0.5, do: 0.35 })}>
              <span className="mono stage-n">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
              <span className="stage-name">{it.name}</span>
              {it.sub && <span className="mono stage-sub">{it.sub}</span>}
            </li>
          );
        })}
      </ol>
      <div className="stage-rail" aria-hidden="true">
        {items.map((_, i) => (
          <span key={i} className="stage-tick"><b {...cue(tin + i * step + 0.1, tout, 'fade', { d: 0.6, do: 0.55 })} /></span>
        ))}
      </div>
    </div>
  );
}

/**
 * Experience in the spotlight: the footage dims, a soft light opens behind
 * the centre of frame, and the role takes the stage, then its organisation
 * and dates, then what the work was, one line at a time.
 */
export function Spotlight({ tin, tout, title, org, dates, lines }: {
  tin: number; tout: number; title: string; org: string; dates: string; lines: string[];
}) {
  const span = tout - tin;
  const at = (k: number) => tin + span * k; // positions as fractions of the window
  return (
    <div className="spotlight" {...cue(tin, tout, 'none')}>
      <div className="spotlight-light" aria-hidden="true" {...cue(tin, tout, 'fade', { d: span * 0.2, do: span * 0.12 })} />
      <div className="spotlight-body">
        <p className="mono spotlight-org" {...cue(at(0.1), tout, 'roll', { d: span * 0.12, do: span * 0.1 })}>{org}</p>
        <h3 className="spotlight-title" {...cue(at(0.03), tout, 'roll', { d: span * 0.16, do: span * 0.1 })}>{title}</h3>
        <p className="mono spotlight-dates" {...cue(at(0.16), tout, 'roll', { d: span * 0.12, do: span * 0.1 })}>{dates}</p>
        <ul className="spotlight-lines">
          {lines.map((l, i) => (
            <li key={l} {...cue(at(0.3 + i * 0.16), tout, 'roll', { d: span * 0.12, do: span * 0.1 })}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Chapter mark: a role, surfacing inside the scene whose world it belongs to. */
export function Chapter({ tin, tout, title, org, dates, note }: { tin: number; tout: number; title: string; org: string; dates: string; note?: string }) {
  return (
    <p className="chapter mono" {...cue(tin, tout, 'rise')}>
      <b>{title}</b>
      <span>{org}</span>
      <span>{dates}</span>
      {note && <span className="chapter-note">{note}</span>}
    </p>
  );
}
