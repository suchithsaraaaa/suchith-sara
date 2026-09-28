import { mapStory } from '@/content/film';
import { experience } from '@/content/film';
import { cue, Scene, Spotlight } from '../parts';
import { MAP_T, stationPoints } from './geometry';

const fmt = (n: number) => n.toLocaleString('en-US');

// 05 · The night the map went live, 40–70 s. The signature scene.
// Footage (map-a/b/c/e) carries the city; everything countable is drawn here.
export function TheMap() {
  const stations = stationPoints();
  const role = experience.find((r) => r.scene === 'real-world')!;
  const T = MAP_T;
  return (
    <Scene id="the-map" tin={40.1} tout={70.3} label={mapStory.title}>
      {/* 01 · black, two lines of telemetry */}
      <p className="slate-lines mono" {...cue(40.3, 42.3, 'fade', { d: 0.6 })}>
        <b>{mapStory.occasion}</b>
        <span>{mapStory.city}</span>
      </p>

      {/* 05 · who it was for */}
      <div className="lower-left">
        <h2 className="title-l" {...cue(49.6, 52.3, 'wipe', { d: 0.9 })}>Telangana Police<br />IT Cell</h2>
        <p className="role mono signal" {...cue(50.3, 52.3, 'rise')}>{mapStory.purpose}</p>
      </div>

      {/* 06–07 · the requirement and the pressure */}
      <div className="letterbox" data-letterbox {...cue(54.4, T.cut, 'cut')} aria-hidden="true">
        <span className="letterbox-bar letterbox-bar--top" />
        <span className="letterbox-bar letterbox-bar--bottom" />
      </div>
      <div className="requirement">
        <p className="mono eyebrow" {...cue(52.4, T.cut, 'fade', { do: 0 })}>The requirement</p>
        <p className="big-number" data-counter {...cue(52.8, T.cut, 'width', { d: 1.3, do: 0 })}>{fmt(mapStory.requirement)}</p>
        <p className="mono unit" {...cue(53.4, T.cut, 'rise', { do: 0 })}>Concurrent users</p>
      </div>
      <ol className="ticker mono" aria-hidden="true" {...cue(53.6, T.cut, 'fade', { do: 0 })}>
        {mapStory.detents.map((d, i) => <li key={d} data-detent={i}>{fmt(d)}</li>)}
      </ol>

      {/* 08 · the one hard cut, then amber */}
      <div className="online" {...cue(T.amber, 58.8, 'cut', { do: 0.3 })}>
        <p className="big-number amber">{fmt(mapStory.held)}</p>
        <p className="mono unit">Concurrent users</p>
        <p className="mono unit amber online-flag"><span className="flag" aria-hidden="true" />System online</p>
      </div>
      <p className="online-side mono" {...cue(T.amber + 0.3, 58.8, 'cut', { do: 0.3 })}>
        <span>Target {fmt(mapStory.requirement)}</span>
        <b>Held {fmt(mapStory.held)}</b>
      </p>

      {/* 09 · the payoff */}
      <p className="lower-left mono keeps-moving" {...cue(58.9, 60.9, 'rise')}>The city keeps moving.</p>

      {/* 10 · inside one journey */}
      <div className="journey" {...cue(61.1, 64.1, 'none')}>
        <ol className="pipeline mono">
          {mapStory.journey.map((n, i) => <li key={n} {...cue(61.2 + i * 0.25, 64.1, 'fade', { d: 0.25 })}>{n}</li>)}
        </ol>
        <div className="packet-track" aria-hidden="true"><span className="packet" data-packet /></div>
        <svg className="journey-route" viewBox="0 0 800 120" aria-hidden="true">
          <path d="M20 90 C 150 10, 260 120, 400 60 S 640 20, 780 70" pathLength={1} className="route-future" {...cue(62.6, 64.1, 'fade', { d: 0.3 })} />
          <path d="M20 90 C 150 10, 260 120, 400 60" pathLength={1} className="route-history" {...cue(62.6, 64.1, 'draw', { d: 0.9 })} />
          <circle cx="20" cy="90" r="4" className="route-start" {...cue(62.7, 64.1)} />
          <circle cx="400" cy="60" r="6" className="route-head" {...cue(63.1, 64.1)} />
          <rect x="772" y="62" width="16" height="16" className="route-end" {...cue(63.5, 64.1)} />
        </svg>
        <ol className="journey-states mono">
          {mapStory.journeyStates.map((s, i) => <li key={s} {...cue(62.8 + i * 0.3, 64.1, 'rise', { d: 0.3 })}>{s}</li>)}
        </ol>
      </div>

      {/* 11 · the scale, in place: exactly 14,900 points and 72 marks, drawn by code */}
      <div className="plate-space">
        <canvas className="idols" data-idols={mapStory.idolPoints} aria-hidden="true" {...cue(64.0, 66.2, 'fade', { d: 0.8 })} />
        <svg className="stations" viewBox="0 0 1600 900" aria-hidden="true" {...cue(64.1, 66.2, 'none')}>
          {stations.map(([x, y], i) => (
            <path key={i} data-station={i} d={`M${x - 7} ${y}h14M${x} ${y - 7}v14`} />
          ))}
        </svg>
      </div>
      <p className="count count--tl" {...cue(64.3, 66.2, 'fade')}>
        <span className="count-n" {...cue(64.3, 66.2, 'width', { d: 1.1 })}>{mapStory.idols}</span>
        <span className="mono">Idols</span>
      </p>
      <p className="count count--br" {...cue(64.5, 66.2, 'fade')}>
        <span className="count-n" data-station-count>{mapStory.stations}</span>
        <span className="mono">Police stations</span>
      </p>

      {/* 12 · one live system */}
      <div className="lower-left three-lines mono">
        <p {...cue(66.2, 68.2, 'wipe', { d: 0.4 })}>Thousands of journeys.</p>
        <p {...cue(66.8, 68.2, 'wipe', { d: 0.4 })}>One city.</p>
        <p {...cue(67.4, 68.2, 'wipe', { d: 0.4 })}>One live system.</p>
      </div>

      {/* 13 · it was the operation */}
      <div className="operation">
        <p className="statement dim" {...cue(68.3, 69.2, 'wipe', { d: 0.35, do: 0.15 })}>The map wasn’t a visualization.</p>
        <p className="statement" {...cue(68.6, 69.2, 'wipe', { d: 0.35, do: 0.15 })}>It was the operation.</p>
      </div>

      {/* The role behind it, centre stage. Every line is a supplied fact. */}
      <Spotlight
        tin={69.22}
        tout={70.05}
        title={role.title}
        org={role.org}
        dates={role.dates}
        lines={[
          `Built the web system for ${mapStory.purpose.toLowerCase()} across ${mapStory.city}.`,
          `Required to serve ${fmt(mapStory.requirement)} concurrent users. It held ${fmt(mapStory.held)}.`,
          `${mapStory.idols} registered idols across ${mapStory.stations} police stations, followed live.`,
        ]}
      />

      <p className="caption mono" {...cue(42, 68.3, 'fade', { d: 1 })}>{mapStory.caption}</p>
    </Scene>
  );
}
