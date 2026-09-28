import { nestiq } from '@/content/film';
import { rng } from '@/lib/anim';
import { cue, Letters, Scene } from './parts';

// 07 · NestIQ, 78–84 s. No footage. A street grid is drawn in; one parcel is
// picked out; the livability layers ring it; then a forecast line rises.
// The line is a shape, not data: no values are implied.

function streets() {
  const r = rng(1507);
  const d: string[] = [];
  for (let x = 20; x < 620; x += 36 + r() * 30) d.push(`M${x.toFixed(0)} 10V470`);
  for (let y = 16; y < 470; y += 30 + r() * 26) d.push(`M10 ${y.toFixed(0)}H630`);
  d.push('M10 420 L630 60', 'M40 20 C 220 180, 380 260, 620 300');
  return d;
}

const RINGS = [60, 104, 150, 196];

export function NestIQ() {
  const grid = streets();
  return (
    <Scene id="nestiq" tin={78.0} tout={84.1} label={`${nestiq.name}: ${nestiq.tagline}`}>
      <div className="nestiq">
        <div className="nestiq-text">
          <p className="mono lab-n" {...cue(78.1, 83.9, 'fade')}>{nestiq.tagline}</p>
          <h2 className="title-l" {...cue(78.2, 83.9, 'track', { d: 0.8 })}><Letters text={nestiq.name} /></h2>
          <p className="lab-what" {...cue(78.6, 83.9, 'rise')}>{nestiq.what}</p>
          <p className="lab-why" {...cue(81.3, 83.9, 'rise')}>{nestiq.why}</p>
          <p className="mono lab-stack" {...cue(82.5, 83.9, 'rise')}>{nestiq.stack.join(' / ')}</p>
          <a className="mono lab-link" href={nestiq.link} target="_blank" rel="noopener" {...cue(82.7, 83.9, 'rise')}>Source</a>
        </div>
        <svg className="nestiq-map" viewBox="0 0 640 480" aria-hidden="true">
          <g className="nestiq-grid">
            {grid.map((d, i) => <path key={i} d={d} pathLength={1} {...cue(78.9 + (i % 10) * 0.05, 83.9, 'draw', { d: 0.6 })} />)}
          </g>
          {RINGS.map((r, i) => (
            <circle key={r} className="nestiq-ring" cx={330} cy={236} r={r} pathLength={1} {...cue(79.8 + i * 0.35, 83.9, 'draw', { d: 0.5 })} />
          ))}
          <rect className="nestiq-parcel" x={318} y={224} width={24} height={24} {...cue(79.4, 83.9, 'fade', { d: 0.3 })} />
          <path className="nestiq-forecast" d="M40 440 L150 420 L240 428 L330 390 L420 360 L510 318 L600 262" pathLength={1} {...cue(82.0, 83.9, 'draw', { d: 0.8 })} />
        </svg>
        <ol className="nestiq-layers mono">
          {nestiq.layers.map((l, i) => <li key={l} {...cue(79.9 + i * 0.35, 83.9, 'rise', { d: 0.3 })}>{l}</li>)}
          <li className="signal" {...cue(82.2, 83.9, 'rise', { d: 0.3 })}>5-year forecast</li>
        </ol>
      </div>
    </Scene>
  );
}
