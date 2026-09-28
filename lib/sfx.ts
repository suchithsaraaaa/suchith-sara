// Sound effects for type and counts, tuned to the score's current chord.
//
//   title  big display type arriving: a filtered air swell and a low tone
//   stage  a readout stage or label rolling in: a soft blip
//   line   a spotlight line: a small chime
//   tick   small telemetry: a barely-there click
//   count  a counter stepping: a click that rises with the count
//
// Each kind has a minimum gap, so a burst of cues reads as one gesture
// rather than a clatter.

export type SfxKind = 'title' | 'stage' | 'line' | 'tick' | 'count';

const GAP: Record<SfxKind, number> = { title: 0.22, stage: 0.12, line: 0.18, tick: 0.09, count: 0.05 };

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class Sfx {
  private last: Record<SfxKind, number> = { title: 0, stage: 0, line: 0, tick: 0, count: 0 };
  private noise: AudioBuffer;
  private lineIndex = 0;

  constructor(private ctx: AudioContext, private out: AudioNode, private chord: () => number[]) {
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  play(kind: SfxKind, amount = 0) {
    const now = this.ctx.currentTime;
    if (now - this.last[kind] < GAP[kind]) return;
    this.last[kind] = now;
    const c = this.chord();
    switch (kind) {
      case 'title': {
        this.swell(now, 0.09, 0.55);
        this.tone(hz(c[1] + 12), now + 0.05, 0.05, 1.6, 'sine');
        this.tone(hz(c[0]), now + 0.05, 0.08, 1.2, 'sine');
        break;
      }
      case 'stage':
        this.tone(hz(c[2 + (Math.floor(now * 3) % 3)] + 24), now, 0.035, 0.22, 'sine');
        this.click(now, 0.03, 3200);
        break;
      case 'line': {
        const note = c[1 + (this.lineIndex++ % 4)] + 24;
        this.tone(hz(note), now, 0.04, 0.9, 'sine');
        this.tone(hz(note) * 2.01, now, 0.008, 0.5, 'sine');
        break;
      }
      case 'tick':
        this.click(now, 0.018, 2600);
        break;
      case 'count':
        this.tone(900 + amount * 900, now, 0.02, 0.06, 'square');
        break;
    }
  }

  private tone(freq: number, at: number, level: number, decay: number, type: OscillatorType) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    o.connect(g).connect(this.out);
    o.start(at);
    o.stop(at + decay + 0.05);
  }

  private click(at: number, level: number, freq: number) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    n.connect(bp).connect(g).connect(this.out);
    n.start(at, Math.random() * 0.9);
    n.stop(at + 0.04);
  }

  /** A soft rush of air, band-passed and rising. */
  private swell(at: number, level: number, dur: number) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(350, at);
    bp.frequency.exponentialRampToValueAtTime(2600, at + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    n.connect(bp).connect(g).connect(this.out);
    n.start(at, Math.random() * 0.3);
    n.stop(at + dur + 0.05);
  }
}
