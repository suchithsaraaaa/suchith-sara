// A continuous, generative score in D, synthesised with Web Audio (no files).
//
// Six instrument buses play all the time; each section of the film is a
// "mood": a chord progression and a mix of the buses. Moving between
// sections, bus levels and the filter glide over ~2 s and chords glide from
// note to note, so the theme never cuts, it transforms.
//
//   pad    four voices of detuned saws through a low-pass: the harmony
//   bass   a sine an octave below the root
//   arp    soft sine plucks walking the chord, on a lookahead scheduler
//   pulse  a quiet eighth-note tick and a low beat, for momentum
//   bells  occasional high sines with long decays, from the scale
//   wind   filtered noise, breathing slowly

export type MoodId =
  | 'origin' | 'intelligence' | 'systems' | 'real-world' | 'night'
  | 'countdown' | 'silence' | 'online' | 'resqmesh' | 'nestiq' | 'contact';

type Mood = {
  chords: number[][];  // MIDI notes; each chord lasts `bars` bars
  bars: number;
  bpm: number;
  cutoff: number;
  mix: { pad: number; bass: number; arp: number; pulse: number; bells: number; wind: number };
};

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// D minor home; D major for the lift after 4,200 and for the resolution.
const Dm9 = [50, 57, 60, 64, 65];
const Bbmaj7 = [46, 58, 62, 65, 69];
const Gm9 = [43, 58, 62, 65, 69];
const Fmaj7 = [41, 57, 60, 64, 69];
const Cadd9 = [48, 55, 62, 64, 67];
const Dsus = [50, 57, 62, 64, 69];
const Dmaj9 = [50, 57, 62, 64, 66];
const Bm7 = [47, 57, 62, 66, 69];
const Gmaj7 = [43, 59, 62, 66, 67];
const Aadd9 = [45, 57, 61, 64, 71];
const Em9 = [40, 55, 59, 62, 66];

const MOODS: Record<MoodId, Mood> = {
  origin:        { chords: [Dm9, Dsus], bars: 4, bpm: 72, cutoff: 700, mix: { pad: 0.55, bass: 0.25, arp: 0, pulse: 0, bells: 0.35, wind: 0.15 } },
  intelligence:  { chords: [Dm9, Bbmaj7], bars: 2, bpm: 84, cutoff: 1300, mix: { pad: 0.45, bass: 0.3, arp: 0.5, pulse: 0, bells: 0.15, wind: 0.05 } },
  systems:       { chords: [Gm9, Dm9], bars: 2, bpm: 96, cutoff: 1700, mix: { pad: 0.4, bass: 0.4, arp: 0.45, pulse: 0.45, bells: 0, wind: 0 } },
  'real-world':  { chords: [Bbmaj7, Fmaj7, Cadd9, Dm9], bars: 1, bpm: 80, cutoff: 2200, mix: { pad: 0.6, bass: 0.45, arp: 0.2, pulse: 0.15, bells: 0.2, wind: 0.1 } },
  night:         { chords: [Dm9, Bbmaj7], bars: 2, bpm: 60, cutoff: 650, mix: { pad: 0.45, bass: 0.5, arp: 0, pulse: 0.35, bells: 0.25, wind: 0.25 } },
  countdown:     { chords: [Dm9], bars: 4, bpm: 60, cutoff: 400, mix: { pad: 0.05, bass: 0, arp: 0, pulse: 0, bells: 0, wind: 0.05 } },
  silence:       { chords: [Dm9], bars: 4, bpm: 60, cutoff: 400, mix: { pad: 0, bass: 0, arp: 0, pulse: 0, bells: 0, wind: 0 } },
  online:        { chords: [Dmaj9, Bm7, Gmaj7, Aadd9], bars: 1, bpm: 88, cutoff: 2600, mix: { pad: 0.6, bass: 0.45, arp: 0.45, pulse: 0.3, bells: 0.25, wind: 0 } },
  resqmesh:      { chords: [Em9, Dsus], bars: 4, bpm: 64, cutoff: 900, mix: { pad: 0.35, bass: 0.2, arp: 0, pulse: 0, bells: 0.5, wind: 0.45 } },
  nestiq:        { chords: [Gmaj7, Dmaj9], bars: 2, bpm: 90, cutoff: 2000, mix: { pad: 0.4, bass: 0.35, arp: 0.5, pulse: 0.15, bells: 0.15, wind: 0 } },
  contact:       { chords: [Dmaj9, Gmaj7], bars: 4, bpm: 70, cutoff: 1500, mix: { pad: 0.55, bass: 0.3, arp: 0.2, pulse: 0, bells: 0.3, wind: 0.05 } },
};

/** Which mood plays at a film time. */
export function moodAt(t: number): MoodId {
  if (t < 8) return 'origin';
  if (t < 18) return 'intelligence';
  if (t < 28) return 'systems';
  if (t < 40) return 'real-world';
  if (t < 52.4) return 'night';
  if (t < 57) return 'countdown';
  if (t < 57.35) return 'silence';
  if (t < 70) return 'online';
  if (t < 78) return 'resqmesh';
  if (t < 84) return 'nestiq';
  return 'contact';
}

type Bus = GainNode;

export class Music {
  private buses: Record<keyof Mood['mix'], Bus>;
  private padVoices: OscillatorNode[][] = [];
  private padFilter: BiquadFilterNode;
  private bass: OscillatorNode;
  private noise: AudioBuffer;
  private mood: Mood = MOODS.origin;
  private moodId: MoodId = 'origin';
  private chordIndex = 0;
  private nextStep = 0;
  private step = 0;
  private nextBell = 0;
  private timer = 0;

  constructor(private ctx: AudioContext, out: AudioNode) {
    const bus = () => { const g = ctx.createGain(); g.gain.value = 0; g.connect(out); return g; };
    this.buses = { pad: bus(), bass: bus(), arp: bus(), pulse: bus(), bells: bus(), wind: bus() };

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // Pad: four voices, two detuned saws each, one shared low-pass.
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 700;
    this.padFilter.Q.value = 0.7;
    this.padFilter.connect(this.buses.pad);
    const chord = this.mood.chords[0];
    for (let v = 0; v < 4; v++) {
      const pair = [-7, 7].map((detune) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hz(chord[v + 1]);
        o.detune.value = detune;
        const g = ctx.createGain();
        g.gain.value = 0.06;
        o.connect(g).connect(this.padFilter);
        o.start();
        return o;
      });
      this.padVoices.push(pair);
    }

    // Bass.
    this.bass = ctx.createOscillator();
    this.bass.type = 'sine';
    this.bass.frequency.value = hz(chord[0] - 12);
    const bg = ctx.createGain();
    bg.gain.value = 0.5;
    this.bass.connect(bg).connect(this.buses.bass);
    this.bass.start();

    // Wind: looped noise through a slowly breathing band-pass.
    const wind = ctx.createBufferSource();
    wind.buffer = this.noise;
    wind.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500;
    bp.Q.value = 0.8;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(bp.frequency);
    lfo.start();
    const wg = ctx.createGain();
    wg.gain.value = 0.25;
    wind.connect(bp).connect(wg).connect(this.buses.wind);
    wind.start();

    this.nextStep = ctx.currentTime + 0.1;
    this.nextBell = ctx.currentTime + 1;
    this.applyMix(0.01);
    this.timer = window.setInterval(this.schedule, 25);
  }

  /** The current chord's notes. */
  chord() {
    return this.mood.chords[this.chordIndex % this.mood.chords.length];
  }

  setMood(id: MoodId) {
    if (id === this.moodId) return;
    const hard = id === 'silence' || this.moodId === 'silence';
    this.moodId = id;
    this.mood = MOODS[id];
    this.chordIndex = 0;
    this.glideChord(hard ? 0.02 : 0.9);
    this.applyMix(hard ? 0.02 : 0.9);
  }

  private applyMix(tc: number) {
    const now = this.ctx.currentTime;
    for (const k of Object.keys(this.buses) as (keyof Mood['mix'])[]) {
      this.buses[k].gain.setTargetAtTime(this.mood.mix[k], now, tc);
    }
    this.padFilter.frequency.setTargetAtTime(this.mood.cutoff, now, tc);
  }

  private glideChord(tc: number) {
    const now = this.ctx.currentTime;
    const c = this.chord();
    this.padVoices.forEach((pair, v) => pair.forEach((o) => o.frequency.setTargetAtTime(hz(c[v + 1]), now, tc)));
    this.bass.frequency.setTargetAtTime(hz(c[0] - 12), now, tc);
  }

  /** Lookahead scheduler: arp notes, pulse ticks, bells and chord changes. */
  private schedule = () => {
    const ctx = this.ctx;
    const ahead = ctx.currentTime + 0.12;
    const eighth = 60 / this.mood.bpm / 2;
    while (this.nextStep < ahead) {
      const at = this.nextStep;
      const stepInBar = this.step % 8;
      if (this.step > 0 && this.step % (8 * this.mood.bars) === 0) {
        this.chordIndex++;
        this.glideChord(0.6);
      }
      const c = this.chord();
      if (this.mood.mix.arp > 0) {
        const tones = [c[1], c[2], c[3], c[4], c[3] + 12, c[4], c[2] + 12, c[3]];
        this.pluck(hz(tones[stepInBar] + 12), at);
      }
      if (this.mood.mix.pulse > 0) {
        this.tick(at, stepInBar % 2 === 0 ? 0.5 : 0.25);
        if (stepInBar === 0 || stepInBar === 4) this.beat(at);
      }
      this.nextStep += eighth;
      this.step++;
    }
    if (this.mood.mix.bells > 0 && this.nextBell < ahead) {
      const c = this.chord();
      this.bell(hz(c[1 + Math.floor(Math.random() * 4)] + 24), this.nextBell);
      this.nextBell += 2 + Math.random() * 3;
    }
  };

  private pluck(freq: number, at: number) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.06, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.45);
    o.connect(g).connect(this.buses.arp);
    o.start(at);
    o.stop(at + 0.5);
  }

  private tick(at: number, level: number) {
    const ctx = this.ctx;
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05 * level, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
    n.connect(hp).connect(g).connect(this.buses.pulse);
    n.start(at, Math.random());
    n.stop(at + 0.05);
  }

  private beat(at: number) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(80, at);
    o.frequency.exponentialRampToValueAtTime(40, at + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.35, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
    o.connect(g).connect(this.buses.pulse);
    o.start(at);
    o.stop(at + 0.45);
  }

  private bell(freq: number, at: number) {
    const ctx = this.ctx;
    for (const [mult, level] of [[1, 0.05], [2.76, 0.012]] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = freq * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(level, at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 3.5);
      o.connect(g).connect(this.buses.bells);
      o.start(at);
      o.stop(at + 3.6);
    }
  }

  pause() {
    clearInterval(this.timer);
    this.timer = 0;
  }

  resume() {
    if (this.timer) return;
    this.nextStep = Math.max(this.nextStep, this.ctx.currentTime + 0.05);
    this.nextBell = Math.max(this.nextBell, this.ctx.currentTime + 1);
    this.timer = window.setInterval(this.schedule, 25);
  }

  dispose() {
    this.pause();
  }
}
