import { experience, person } from '@/content/film';
import { cue, Scene } from './parts';

// 04 · Real world, 28–40 s. Footage: an aerial city at night, its routes
// lighting up. Software becomes infrastructure; then the city goes dark and
// one point remains.
export function RealWorld() {
  const role = experience.find((r) => r.scene === 'real-world')!;
  return (
    <Scene id="real-world" tin={28.3} tout={38.8} label="Real world">
      <p className="telemetry telemetry--tl mono" {...cue(28.6, 31.2)}>
        <span>Location signal</span>
        <b>{person.coordinates}</b>
      </p>
      <div className="lower-left">
        <h2 className="title-l" {...cue(30.4, 33.6, 'wipe', { d: 0.9 })}>{role.org.replace(' IT Cell', '')}<br />IT Cell</h2>
        <p className="role mono" {...cue(31.2, 33.6, 'rise')}>{role.title} / {role.dates}</p>
      </div>
      <div className="lower-left">
        <p className="statement" {...cue(33.8, 35.7, 'wipe', { d: 0.8 })}>Software stopped being a project.</p>
      </div>
      <div className="lower-left">
        <p className="statement" {...cue(35.9, 38.5, 'wipe', { d: 0.8 })}>It became infrastructure.</p>
      </div>
    </Scene>
  );
}
