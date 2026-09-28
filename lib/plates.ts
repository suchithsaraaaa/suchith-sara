import { clipOrder, keyed, plateOpacity, plates, type ClipId, type Plate } from '@/content/plates';
import { setStyle } from './anim';

// Two <video> "decks", never more.
//
// The footage flows; it is never scrubbed. Seeking a video to follow scroll
// is what makes footage stutter, and correcting it back into sync after a
// pause is what makes it jump. So within a plate the video only ever plays
// forward, continuously:
//
//   rate  = max(1×, how fast the film is moving × the plate's own slope)
//           eased toward its target so speed changes glide, clamped to 4×.
//           At rest it plays at 1×; scrolling or Play pushes it faster.
//   entry = when a plate first appears, its deck is positioned once, while
//           still invisible, at the plate's frame for that film time.
//   end   = near the end of the clip it dissolves into a second pass over
//           its last seconds on the other deck, so it never freezes.
//   exit  = a plate fading out holds its frame, so only one video decodes.
//
// Clips are fetched whole into memory in film order, so no frame waits on
// the network, and a deck is never shown before its frame is decoded.
// Reduced motion shows a still frame instead.

type Deck = { el: HTMLVideoElement; clip: ClipId | null; ready: boolean; opacity: number; rate: number };
type Want = { p: Plate; opacity: number };

const MAX_RATE = 4;
const EASE = 0.08;    // playback-rate easing per frame
const XFADE = 1.0;    // loop dissolve, seconds
const LOOP_LEN = 5;   // the loop replays the clip's last seconds

/** The plate's video seconds per film second at t (its keyframe slope). */
function slope(p: Plate, t: number) {
  const a = keyed(p.v, t - 0.05), b = keyed(p.v, t + 0.05);
  return Math.max(0, (b - a) / 0.1);
}

export class PlateManager {
  private decks: Deck[];
  private blobs = new Map<ClipId, Promise<string>>();
  private portrait: boolean;
  private raf = 0;
  private disposed = false;

  private t = 0;
  private wants: Want[] = [];
  private speed = 0;     // film seconds per real second (smoothed)
  private stamp = 0;
  private main: Deck | null = null;
  private loop: { from: Deck; to: Deck; start: number } | null = null;

  constructor(videos: HTMLVideoElement[], private reduced: boolean) {
    this.portrait = window.innerWidth / window.innerHeight < 0.8;
    this.decks = videos.map((el) => {
      // React does not reliably reflect `muted` onto server-rendered video,
      // and browsers refuse to autoplay unmuted video. Set it here, for sure.
      el.muted = true;
      el.defaultMuted = true;
      el.setAttribute('muted', '');
      el.playsInline = true;
      const deck: Deck = { el, clip: null, ready: false, opacity: 0, rate: 1 };
      el.addEventListener('loadeddata', () => { deck.ready = true; this.kick(); });
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

  /** Puts a clip on a deck at a time. The deck shows nothing until that frame is decoded. */
  private load(deck: Deck, clip: ClipId, at: number) {
    const { el } = deck;
    if (deck.clip === clip && el.src) {
      el.currentTime = at;
      return;
    }
    deck.clip = clip;
    deck.ready = false;
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

  // ---- input from the film -------------------------------------------------

  /** Called by the clock whenever film time changes. */
  render(t: number) {
    const now = performance.now();
    const dt = (now - this.stamp) / 1000;
    if (this.stamp && dt > 0 && dt < 0.25) {
      const v = Math.max(0, (t - this.t) / dt); // backward motion does not reverse footage
      this.speed += (v - this.speed) * 0.2;
    }
    this.stamp = now;
    this.t = t;
    this.wants = plates
      .map((p) => ({ p, opacity: plateOpacity(p, t) }))
      .filter((w) => w.opacity > 0.001)
      .slice(0, 2);
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

  /** Plays a deck at an eased rate. */
  private flow(deck: Deck, target: number) {
    deck.rate += (target - deck.rate) * EASE;
    const { el } = deck;
    if (Math.abs(el.playbackRate - deck.rate) > 0.02) el.playbackRate = deck.rate;
    if (el.paused && deck.ready && el.src && !el.ended) el.play().catch(() => {});
  }

  private hold(deck: Deck) {
    if (!deck.el.paused) deck.el.pause();
  }

  private frame = () => {
    this.raf = 0;
    if (performance.now() - this.stamp > 150) this.speed *= 0.85; // the film has come to rest

    if (this.reduced) {
      this.wants.forEach((w, i) => {
        const deck = this.decks.find((d) => d.clip === w.p.clip) ?? this.decks[i];
        if (deck.clip !== w.p.clip) this.load(deck, w.p.clip, 0);
        this.show(deck, w.opacity);
      });
      for (const d of this.decks) if (!this.wants.some((w) => w.p.clip === d.clip)) this.show(d, 0);
      return;
    }

    if (this.wants.length === 0) {
      this.main = null;
      this.loop = null;
      for (const d of this.decks) { this.show(d, 0); this.hold(d); }
      this.preload();
    } else if (this.wants.length === 2) {
      this.sceneChange();
    } else {
      this.single(this.wants[0]);
    }
    this.kick();
  };

  /** Two plates: each on its own deck, cross-dissolving by film time. */
  private sceneChange() {
    this.loop = null;
    const used = new Set<Deck>();
    for (const w of this.wants) {
      let deck = this.decks.find((d) => d.clip === w.p.clip && !used.has(d));
      if (!deck) {
        deck = this.decks.find((d) => !used.has(d) && !this.wants.some((x) => x.p.clip === d.clip)) ?? this.decks.find((d) => !used.has(d))!;
        this.load(deck, w.p.clip, keyed(w.p.v, this.t));
      }
      used.add(deck);
      this.show(deck, w.opacity);
      const leaving = w.p.fo > 0 && this.t > w.p.t1 - w.p.fo;
      if (leaving) this.hold(deck); else this.flow(deck, this.rateFor(w.p));
    }
    const incoming = this.wants.reduce((a, b) => (a.p.t0 > b.p.t0 ? a : b));
    this.main = this.decks.find((d) => d.clip === incoming.p.clip) ?? null;
  }

  /** One plate: flow, and loop its tail by dissolving deck to deck. */
  private single(w: Want) {
    const clip = w.p.clip;
    if (!this.main || this.main.clip !== clip) {
      this.loop = null;
      this.main = this.decks.find((d) => d.clip === clip) ?? this.decks.find((d) => d.opacity < 0.01) ?? this.decks[0];
      if (this.main.clip !== clip) this.load(this.main, clip, keyed(w.p.v, this.t));
    }
    const main = this.main;
    const other = this.other(main);
    const rate = this.rateFor(w.p);

    if (this.loop) {
      const { from, to } = this.loop;
      const k = Math.min(1, (performance.now() - this.loop.start) / (XFADE * 1000));
      const eased = k * k * (3 - 2 * k);
      this.show(to, w.opacity * eased);
      this.show(from, w.opacity * (1 - eased));
      this.flow(to, rate);
      this.hold(from); // the outgoing pass freezes as it fades: one decode at a time
      if (k >= 1) {
        this.hold(from);
        this.show(from, 0);
        this.main = to;
        this.loop = null;
      }
      return;
    }

    this.show(main, w.opacity);
    this.show(other, 0);
    this.flow(main, rate);

    const el = main.el;
    if (!main.ready || !el.duration) return;
    const end = el.duration - 0.05;
    const loopAt = Math.max(0, end - LOOP_LEN);
    const next = plates.find((p) => p.clip !== clip && p.t0 > this.t && p.t0 - this.t < 3);

    // Well before the loop point, the spare deck decodes the next scene's
    // clip, so a scene change never waits on a first frame.
    if (next && el.currentTime < end - XFADE - 1.2) {
      if (other.clip !== next.clip && other.opacity < 0.01) this.load(other, next.clip, keyed(next.v, next.t0));
      return;
    }
    if (next && next.t0 - this.t < 1.2) return; // the scene change will cover the end

    // Prepare the loop's second pass on the other deck, then dissolve into it.
    if (el.currentTime >= end - XFADE - 0.6 && (other.clip !== clip || Math.abs(other.el.currentTime - loopAt) > 0.2) && other.opacity < 0.01) {
      this.load(other, clip, loopAt);
      this.hold(other);
    }
    if (el.currentTime >= end - XFADE && other.clip === clip && other.ready && !other.el.seeking) {
      this.loop = { from: main, to: other, start: performance.now() };
      other.rate = main.rate;
    }
  }

  private rateFor(p: Plate) {
    return Math.min(MAX_RATE, Math.max(1, this.speed * slope(p, this.t)));
  }

  /** Nothing on screen: warm a deck with the clip the viewer is heading toward. */
  private preload() {
    const deck = this.decks.find((d) => d.opacity < 0.01);
    const next = plates.find((p) => p.t0 > this.t && p.t0 - this.t < 12);
    if (deck && next && !this.decks.some((d) => d.clip === next.clip)) this.load(deck, next.clip, keyed(next.v, next.t0));
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    for (const p of this.blobs.values()) p.then((u) => URL.revokeObjectURL(u)).catch(() => {});
  }
}
