import { aiStack, experience } from '@/content/film';
import { Chapter, cue, KeepCase, Pin, Scene } from './parts';

// 02 · Intelligence, 8–18 s. Footage: documents stream into a vector space.
// Labels are pinned to the footage and drift outward as the camera flies in.
export function Intelligence() {
  const intern = experience.find((r) => r.scene === 'intelligence')!;
  const OUT = 16.9;
  return (
    <Scene id="intelligence" tin={8.6} tout={18.3} label="Intelligence">
      <div className="plate-space">
        <Pin x={0.17} y={0.3} tin={9.4} tout={OUT} label="Documents" left />
        <Pin x={0.56} y={0.58} tin={10.9} tout={OUT} label={aiStack.pipeline[1]} sub={aiStack.languages} />
        <Pin x={0.63} y={0.72} tin={12.1} tout={OUT} label={aiStack.pipeline[3]} sub="Vector retrieval" />
        <Pin x={0.5} y={0.4} tin={13.3} tout={OUT} label={<span className="nc">{aiStack.pipeline[4]}</span>} sub="Two-tier inference" />
        <Pin x={0.55} y={0.26} tin={14.2} tout={OUT} label={`${aiStack.models[0]} / ${aiStack.models[1]}`} sub={aiStack.quantisation} />
        <Pin x={0.7} y={0.44} tin={15.0} tout={OUT} label={aiStack.hardware} sub={aiStack.deployment} />
      </div>
      {/* Phones show the same labels as one line of telemetry instead of pins. */}
      <ol className="flow flow--phone mono" aria-hidden="true" {...cue(9.4, 16.9, 'none')}>
        {[aiStack.pipeline[0], aiStack.pipeline[1], aiStack.pipeline[3], aiStack.pipeline[4], ...aiStack.models, aiStack.hardware].map((l, i) => (
          <li key={l} {...cue(9.4 + i * 1.0, 16.9, 'fade', { d: 0.3 })}><KeepCase text={l} /></li>
        ))}
      </ol>
      <h2 className="title-l title-l--low" {...cue(16.1, 18.2, 'wipe', { d: 0.8, do: 0.5 })}>AI systems</h2>
      <div className="chapters">
        <Chapter tin={15.6} tout={18.2} title={intern.title} org={intern.org} dates={intern.dates} />
      </div>
    </Scene>
  );
}
