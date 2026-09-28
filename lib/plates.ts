import { clipOrder, keyed, plateOpacity, plates, type ClipId, type Plate } from '@/content/plates';
import { setStyle } from './anim';

// Two <video> "decks", never more. The film (scroll, Play, the self-playing
// opening) says which plates are visible at film time t and where each
// should be; one loop decides, per frame, what each deck plays and shows.
//
//   Moving   the deck plays natively with its rate chasing the film's target
//            (feed-forward on the target's speed plus a spring on the gap).
//            Seeking every frame is what stutters, so only backward motion
//            and long jumps seek, and a long jump is a short dissolve to the
//            other deck, pre-seeked, rather than a visible cut.
//   Resting  the footage stays alive: it plays on at 1× and loops its last
//            seconds, dissolving deck to deck at the loop point.
//   Scene    two plates at once (a scene change) cross-dissolve; the
//   change   outgoing one holds its frame so only one video decodes.
//
// Clips are fetched whole into memory in film order, so no frame waits on
// the network, and a deck is never shown before its frame is decoded.
// Reduced motion shows a still frame instead.

type Deck = {
  el: HTMLVideoElement;
  clip: ClipId | null;
  ready: boolean;
  opacity: number;
};

type Want = { p: Plate; target: number; opacity: number };

const FRAME = 1 / 24;
const CHASE_MAX = 2.5; // seconds ahead that playback will chase
const RESYNC = 0.35;   // gaps larger than this dissolve instead of cutting
const XFADE = 0.9;     // loop dissolve, seconds
const SYNC_FADE = 0.3; // resync dissolve, seconds
const LOOP_LEN = 5;    // the resting loop covers the clip's last seconds

export class PlateManager {
  private decks: Deck[];
  private blobs = new Map<ClipId, Promise<string>>();
  private portrait: boolean;
  private raf = 0;
  private disposed = false;

  private t = 0;
  private wants: Want[] = [];
  private idle = false;
  private vel = 0;        // target speed, video s per real s (smoothed)
  private stamp = 0;
  private lastTarget = 0;
  private main: Deck | null = null;
  private fade: { from: Deck; to: Deck; start: number; dur: number } | null = null;
  private pending: { deck: Deck; time: number; dur: number } | null = null;

  constructor(videos: HTMLVideoElement[], private reduced: boolean) {
    this.portrait = window.innerWidth / window.innerHeight < 0.8;
    this.decks = videos.map((el) => {
      // React does not reliably reflect `muted` onto server-rendered video,
      // and browsers refuse to autoplay unmuted video. Set it here, for sure.
      el.muted = true;
      el.defaultMuted = true;
      el.setAttribute('muted', '');
      el.playsInline = true;
      const deck: Deck = { el, clip: null, ready: false, opacity: 0 };
      el.addEventListener('loadeddata', () => { deck.ready = true; this.kick(); });
      el.addEventListener('seeked', () => this.kick());
      return deck;
    });
  }

  // ---- loading ------------------------------------------------------------

  private variant() {
    return this.portrait ? '9x16' : '16x9';
  }

  private fetchClip(id: ClipId): Promise<string> {
    let p = this.blobs.get(id);
    if (!p) {
      p = fetch(`/media/${id}-${this.variant()}.mp4`)
        .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
        .then((b) => URL.createObjectURL(b));
      p.catch(() => this.blobs.delete(id));
      this.blobs.set(id, p);
    }
    return p;
  }

  private load(deck: Deck, clip: ClipId, at: number) {
    if (deck.clip === clip) {
      if (deck.ready && Math.abs(deck.el.currentTime - at) > FRAME) deck.el.currentTime = at;
      return;
    }
    deck.clip = clip;
    deck.ready = false;
    const { el } = deck;
    el.pause();
    el.removeAttribute('src');
    el.poster = `/media/${clip}${this.reduced ? '-still' : ''}-${this.variant()}.webp`;
    if (this.reduced) { deck.ready = true; return; }
    el.load();
    this.fetchClip(clip).then((url) => {
      if (deck.clip !== clip) return;
      el.src = url;
      el.currentTime = at;
    }).catch(() => {
      if (deck.clip === clip) el.src = `/media/${clip}-${this.variant()}.mp4`;
    });
  }

  /** Fetch clips in film order: the first two at once, the rest one by one. */
  warm() {
    if (this.reduced) return;
    const [first, second, ...rest] = clipOrder;
    Promise.all([this.fetchClip(first), this.fetchClip(second)])
      .then(() => rest.reduce<Promise<unknown>>((chain, id) => chain.then(() => this.fetchClip(id)), Promise.resolve()))
      .catch(() => {});
  }

  // ---- inputs from the film ----------------------------------------------

  /** Called by the clock whenever film time changes. */
  render(t: number) {
    this.t = t;
    const wants: Want[] = [];
    for (const p of plates) {
      const opacity = plateOpacity(p, t);
      if (opacity <= 0.001) continue;
      // A plate fading out holds its frame, so only one video decodes at a time.
      const target = keyed(p.v, p.fo && t > p.t1 - p.fo ? p.t1 - p.fo : t);
      wants.push({ p, target, opacity });
    }
    this.wants = wants.slice(0, 2);

    // How fast the target moves, for feed-forward.
    const now = performance.now();
    const single = this.wants.length === 1 ? this.wants[0] : null;
    const dt = (now - this.stamp) / 1000;
    if (single && this.stamp && dt > 0 && dt < 0.25 && single.p.clip === this.main?.clip) {
      this.vel += ((single.target - this.lastTarget) / dt - this.vel) * 0.25;
    } else {
      this.vel = 0;
    }
    if (single) this.lastTarget = single.target;
    this.stamp = now;
    this.kick();
  }

  /** At rest the footage plays on and loops; moving again, it rejoins the film. */
  setIdle(idle: boolean) {
    if (idle === this.idle) return;
    this.idle = idle;
    if (idle) this.vel = 0;
    this.kick();
  }

  // ---- the per-frame loop -------------------------------------------------

  private kick() {
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame(this.frame);
  }

  private other(d: Deck) {
    return this.decks[0] === d ? this.decks[1] : this.decks[0];
  }

  private show(deck: Deck, opacity: number) {
    deck.opacity = opacity;
    setStyle(deck.el, 'opacity', (deck.ready ? opacity : 0).toFixed(3));
  }

  private frame = () => {
    this.raf = 0;
    if (this.reduced) return this.stills();
    if (performance.now() - this.stamp > 140) this.vel = 0; // the target has stopped moving

    let busy = false;
    if (this.wants.length === 0) {
      this.fade = null; this.pending = null; this.main = null;
      for (const d of this.decks) { this.show(d, 0); if (!d.el.paused) d.el.pause(); }
      this.preload();
    } else if (this.wants.length === 2) {
      busy = this.sceneChange();
    } else {
      busy = this.single(this.wants[0]);
    }
    if (busy) this.kick();
  };

  /** Reduced motion: each visible plate is its still frame. */
  private stills() {
    this.wants.forEach((w, i) => {
      const deck = this.decks.find((d) => d.clip === w.p.clip) ?? this.decks[i];
      this.load(deck, w.p.clip, 0);
      this.show(deck, w.opacity);
    });
    for (const d of this.decks) if (!this.wants.some((w) => w.p.clip === d.clip)) this.show(d, 0);
  }

  /** Two plates: give each a deck, chase both, cross-dissolve by film time. */
  private sceneChange() {
    this.fade = null; this.pending = null;
    let busy = false;
    const used = new Set<Deck>();
    for (const w of this.wants) {
      let deck = this.decks.find((d) => d.clip === w.p.clip && !used.has(d));
      if (!deck) {
        deck = this.decks.find((d) => !used.has(d) && !this.wants.some((x) => x.p.clip === d.clip)) ?? this.decks.find((d) => !used.has(d))!;
        this.load(deck, w.p.clip, w.target);
      }
      used.add(deck);
      this.show(deck, w.opacity);
      busy = this.chase(deck, w.target, 0) || busy;
    }
    // The incoming plate becomes the main deck.
    const incoming = this.wants.reduce((a, b) => (a.p.t0 > b.p.t0 ? a : b));
    this.main = this.decks.find((d) => d.clip === incoming.p.clip) ?? null;
    return busy;
  }

  /** One plate on screen. */
  private single(w: Want) {
    const now = performance.now();
    const clip = w.p.clip;
    if (!this.main || this.main.clip !== clip) {
      this.main = this.decks.find((d) => d.clip === clip) ?? this.decks.find((d) => d.opacity < 0.01) ?? this.decks[0];
      this.load(this.main, clip, w.target);
      this.fade = null; this.pending = null;
    }
    const main = this.main;
    const other = this.other(main);

    // A dissolve in progress (loop point or resync).
    if (this.fade) {
      const { from, to } = this.fade;
      const k = Math.min(1, (now - this.fade.start) / (this.fade.dur * 1000));
      this.show(to, w.opacity * k);
      this.show(from, w.opacity * (1 - k));
      if (this.idle) this.playAt(to, 1); else this.chase(to, w.target, this.vel);
      if (k >= 1) {
        from.el.pause();
        this.show(from, 0);
        this.main = to;
        this.fade = null;
      }
      return true;
    }

    // Waiting for the other deck to decode its frame before dissolving to it.
    if (this.pending) {
      const { deck, time, dur } = this.pending;
      this.show(main, w.opacity);
      this.show(other, 0);
      if (this.idle) this.playAt(main, 1);
      if (deck.ready && !deck.el.seeking && Math.abs(deck.el.currentTime - time) < 0.1) {
        this.pending = null;
        this.fade = { from: main, to: deck, start: now, dur };
        if (this.idle) this.playAt(deck, 1);
      }
      return true;
    }

    this.show(main, w.opacity);
    this.show(other, 0);
    // Near a scene change, the spare deck decodes the next clip in advance.
    const next = this.neighbour(3.5);
    if (next && other.clip !== next.clip) this.load(other, next.clip, keyed(next.v, next.t0 > this.t ? next.t0 : next.t1));
    if (!main.ready || !main.el.src) return true;
    const el = main.el;
    const end = (el.duration || 10) - 0.05;

    if (this.idle) {
      // Resting: play on at 1×; near the end, dissolve back into the loop.
      this.playAt(main, 1);
      if (el.currentTime >= end - XFADE) this.dissolveTo(other, clip, Math.max(0, end - LOOP_LEN), XFADE);
      return true;
    }

    // Moving: follow the film. A big gap dissolves instead of jumping.
    const d = w.target - el.currentTime;
    const chaseable = d > -0.2 && d < CHASE_MAX && (d > 0 || this.vel > 0.05);
    if (Math.abs(d) > RESYNC && !chaseable) {
      this.dissolveTo(other, clip, w.target, SYNC_FADE);
      return true;
    }
    return this.chase(main, w.target, this.vel);
  }

  private dissolveTo(deck: Deck, clip: ClipId, time: number, dur: number) {
    this.load(deck, clip, time);
    deck.el.pause();
    this.pending = { deck, time, dur };
  }

  private playAt(deck: Deck, rate: number) {
    const el = deck.el;
    if (Math.abs(el.playbackRate - rate) > 0.02) el.playbackRate = rate;
    if (el.paused && deck.ready && el.src) el.play().catch(() => {});
  }

  /** Move a deck toward a target time. Returns true while still moving. */
  private chase(deck: Deck, target: number, vel: number) {
    const el = deck.el;
    if (!deck.ready || !el.src) return true;
    const d = target - el.currentTime;
    const moving = vel > 0.05;
    if (!moving && Math.abs(d) <= FRAME * 0.75) {
      if (!el.paused) el.pause();
      return false;
    }
    if (d > -0.2 && d < CHASE_MAX && (d > 0 || moving)) {
      this.playAt(deck, Math.min(4, Math.max(0.25, vel + d * 2.5)));
    } else if (!el.seeking) {
      if (!el.paused) el.pause();
      el.currentTime = target;
    }
    return true;
  }

  /** The plate that starts within `ahead` seconds, or ended within half that. */
  private neighbour(ahead: number): Plate | null {
    const t = this.t;
    const current = this.wants[0]?.p.clip;
    return plates.find((p) => p.clip !== current && p.t0 > t && p.t0 - t < ahead)
      ?? [...plates].reverse().find((p) => p.clip !== current && p.t1 < t && t - p.t1 < ahead / 2)
      ?? null;
  }

  /** Nothing on screen: warm a deck with the clip the viewer is heading toward. */
  private preload() {
    const deck = this.decks.find((d) => d.opacity < 0.01);
    const next = this.neighbour(12);
    if (deck && next && !this.decks.some((d) => d.clip === next.clip)) this.load(deck, next.clip, next.v[0][1]);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    for (const p of this.blobs.values()) p.then((u) => URL.revokeObjectURL(u)).catch(() => {});
  }
}
