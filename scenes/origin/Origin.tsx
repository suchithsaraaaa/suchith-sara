import { person } from '@/content/film';
import { cue, Letters, Scene } from '../parts';

// 01 · Origin, 0–8 s. Footage: the point of light becoming a lattice tunnel.
export function Origin() {
  return (
    <Scene id="origin" tin={0} tout={8.4} label="Origin">
      <div className="origin-title">
        <h1 className="origin-name" {...cue(2.4, 7.8, 'track', { d: 2.2, do: 1.0 })}>
          <Letters text={person.name.toUpperCase()} />
        </h1>
        <p className="origin-roles mono" {...cue(4.3, 7.6, 'wipec', { d: 1.1, do: 0.8 })}>
          <span>{person.roles[0]}</span>
          <span className="origin-edge" aria-hidden="true" />
          <span>{person.roles[1]}</span>
        </p>
      </div>
      <p className="corner corner--bl mono" {...cue(5.0, 7.2, 'rise', { d: 1 })}>
        <b>{person.location}</b>
        <span>{person.coordinates}</span>
      </p>
      <p className="corner corner--br mono" {...cue(5.2, 7.2, 'rise', { d: 1 })}>
        <span>{person.education.short} / {person.education.school}</span>
        <span>{person.education.years}</span>
      </p>
    </Scene>
  );
}
