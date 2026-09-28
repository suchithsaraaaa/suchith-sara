import { plateOpacity, plates, type ClipId } from '@/content/plates';
import { mapStory } from '@/content/film';

// Optional sound. Off until the visitor turns it on (a user gesture, as
// browsers require). Each clip's ambience loops as a bed whose gain follows
// its plate; scenes without footage borrow the origin room tone. The counter's
// detents tick, and at 4,200 everything drops to silence for 600 ms.

const CUT = 57.0;
const SILENCE = 0.6;
const COUNTER = [54.5, 57.0];

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private beds = new Map<ClipId, GainNode>();
  private lastDetent = -1;
  private t = 0;
  enabled = false;

  async enable() {
    this.enabled = true;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      const ids = Array.from(new Set(plates.map((p) => p.clip)));
      await Promise.all(ids.map((id) => this.load(id)));
    }
    await this.ctx.resume();
    this.master!.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.3);
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

  private tick() {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = 0.35;
    src.buffer = buf;
    src.connect(g).connect(this.master!);
    src.start();
  }

  render(t: number) {
    this.t = t;
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const silent = t >= CUT && t < CUT + SILENCE;
    const gains = new Map<ClipId, number>();
    for (const p of plates) {
      // Beds follow the plate's presence, not its dimming.
      const o = plateOpacity({ ...p, dim: undefined }, t);
      gains.set(p.clip, Math.max(gains.get(p.clip) ?? 0, o));
    }
    // Scenes without footage (ResQMesh, NestIQ, Contact) keep the origin room tone.
    if (t >= 70) gains.set('origin', 0.5);
    for (const [id, g] of this.beds) g.gain.setTargetAtTime(silent ? 0 : (gains.get(id) ?? 0) * 0.8, now, silent ? 0.01 : 0.12);

    if (t >= COUNTER[0] && t < COUNTER[1]) {
      const i = Math.min(mapStory.detents.length - 2, Math.floor((t - COUNTER[0]) / 0.5));
      if (i !== this.lastDetent) {
        if (this.lastDetent !== -1) this.tick();
        this.lastDetent = i;
      }
    } else {
      this.lastDetent = -1;
    }
  }

  dispose() {
    this.ctx?.close();
  }
}
