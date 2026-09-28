import { plateOpacity, plates, type ClipId } from '@/content/plates';
import { mapStory } from '@/content/film';
import { range } from './anim';
import { MAP_T } from '@/scenes/map/geometry';

// Optional sound. Off until the visitor turns it on (a user gesture, as
// browsers require). Each clip's ambience loops as a bed whose gain follows
// its plate; scenes without footage borrow the origin room tone.
//
// The countdown in scene 05 is scored, all synthesised here, no files:
//   from THE REQUIREMENT  a low drone that rises in pitch and brightness
//   each detent           a deep heartbeat thump, heavier every time
//   the cut at 4,200      total silence
//   amber 4,200           a sub-bass impact with a long, bright tail

const TENSION: [number, number] = [52.4, MAP_T.cut];

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private beds = new Map<ClipId, GainNode>();
  private drone: { gain: GainNode; filter: BiquadFilterNode; oscs: OscillatorNode[] } | null = null;
  private noise: AudioBuffer | null = null;
  private lastDetent = -1;
  private lastT = 0;
  private t = 0;
  enabled = false;

  async enable() {
    this.enabled = true;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.buildScore();
      const ids = Array.from(new Set(plates.map((p) => p.clip)));
      await Promise.all(ids.map((id) => this.load(id)));
    }
    await this.ctx.resume();
    this.master!.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.3);
    this.lastT = this.t;
    this.render(this.t);
  }

  disable() {
    this.enabled = false;
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
  }

  private async load(id: ClipId) {
    const ctx = this.ctx!;
    try {
      const buf = await fetch(`/media/${id}.m4a`).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b));
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g).connect(this.master!);
      src.start();
      this.beds.set(id, g);
    } catch {
      // A missing bed only means that scene is quieter.
    }
  }

  // ---- the countdown score --------------------------------------------------

  private buildScore() {
    const ctx = this.ctx!;
    // One second of white noise, reused for textures.
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // Tension drone: two detuned saws and a sub sine through a closing low-pass.
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 6;
    const oscs = [
      Object.assign(ctx.createOscillator(), { type: 'sawtooth' as OscillatorType }),
      Object.assign(ctx.createOscillator(), { type: 'sawtooth' as OscillatorType }),
      Object.assign(ctx.createOscillator(), { type: 'sine' as OscillatorType }),
    ];
    oscs[0].frequency.value = 55;
    oscs[1].frequency.value = 55;
    oscs[1].detune.value = 12;
    oscs[2].frequency.value = 27.5;
    for (const o of oscs) { o.connect(filter); o.start(); }
    filter.connect(gain).connect(this.master!);
    this.drone = { gain, filter, oscs };
  }

  /** A deep heartbeat: a pitched-down sine thump with a soft click on top. */
  private thump(strength: number) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(95, now);
    o.frequency.exponentialRampToValueAtTime(38, now + 0.35);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.5 + 0.35 * strength, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    o.connect(g).connect(this.master!);
    o.start(now);
    o.stop(now + 0.6);

    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2200;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.12, now);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    n.connect(f).connect(ng).connect(this.master!);
    n.start(now);
    n.stop(now + 0.05);
  }

  /** The 4,200 impact: sub drop, a dark noise swell and a bright ringing tail. */
  private impact() {
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(64, now);
    sub.frequency.exponentialRampToValueAtTime(26, now + 2.2);
    sg.gain.setValueAtTime(0.0001, now);
    sg.gain.exponentialRampToValueAtTime(1.0, now + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
    sub.connect(sg).connect(this.master!);
    sub.start(now);
    sub.stop(now + 3.3);

    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    n.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3200, now);
    lp.frequency.exponentialRampToValueAtTime(90, now + 2.5);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.exponentialRampToValueAtTime(0.35, now + 0.03);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
    n.connect(lp).connect(ng).connect(this.master!);
    n.start(now);
    n.stop(now + 2.7);

    // A cold, bright ring: the system is online.
    for (const [freq, level] of [[880, 0.05], [1318.5, 0.035], [1760, 0.02]] as const) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(level, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
      o.connect(g).connect(this.master!);
      o.start(now);
      o.stop(now + 4.6);
    }
  }

  // ---- per frame --------------------------------------------------------------

  render(t: number) {
    const prev = this.lastT;
    this.lastT = t;
    this.t = t;
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const forward = t > prev && t - prev < 3; // scored moments play only when the film moves forward through them
    const silent = t >= MAP_T.cut && t < MAP_T.amber;

    // Ambience beds follow their plates' presence (not their dimming).
    const gains = new Map<ClipId, number>();
    for (const p of plates) {
      const o = plateOpacity({ ...p, dim: undefined }, t);
      gains.set(p.clip, Math.max(gains.get(p.clip) ?? 0, o));
    }
    // Scenes without footage (ResQMesh, NestIQ, Contact) keep the origin room tone.
    if (t >= 70) gains.set('origin', 0.5);
    // Under the countdown the beds duck, so the drone carries it.
    const duck = 1 - 0.7 * range(t, TENSION[0], TENSION[0] + 1.5) * (t < MAP_T.cut ? 1 : 0);
    for (const [id, g] of this.beds) g.gain.setTargetAtTime(silent ? 0 : (gains.get(id) ?? 0) * 0.8 * duck, now, silent ? 0.005 : 0.12);

    // The drone rises from THE REQUIREMENT to the cut, then stops dead.
    if (this.drone) {
      const k = t >= TENSION[0] && t < MAP_T.cut ? range(t, TENSION[0], MAP_T.cut) : 0;
      this.drone.gain.gain.setTargetAtTime(k > 0 ? 0.08 + 0.2 * k : 0, now, k > 0 ? 0.15 : 0.005);
      this.drone.filter.frequency.setTargetAtTime(180 + 2200 * k * k, now, 0.1);
      const f = 55 * (1 + 0.5 * k);
      this.drone.oscs[0].frequency.setTargetAtTime(f, now, 0.1);
      this.drone.oscs[1].frequency.setTargetAtTime(f, now, 0.1);
      this.drone.oscs[2].frequency.setTargetAtTime(f / 2, now, 0.1);
    }

    // A heartbeat on every detent.
    if (t >= MAP_T.counter && t < MAP_T.cut) {
      const i = Math.min(mapStory.detents.length - 2, Math.floor((t - MAP_T.counter) / MAP_T.step));
      if (i > this.lastDetent && forward) this.thump(i / (mapStory.detents.length - 2));
      this.lastDetent = i;
    } else if (t < MAP_T.counter) {
      this.lastDetent = -1;
    }

    // 4,200.
    if (forward && prev < MAP_T.amber && t >= MAP_T.amber) this.impact();
  }

  dispose() {
    this.ctx?.close();
  }
}
