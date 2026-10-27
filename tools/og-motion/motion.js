// The animated link-preview thumbnail, built from the Figma Thumbnail page's five
// "Website thumbnail - Motion" frames. Same 20-unit icons scaled 6× and centred, on
// grayscale-950, at the 1200 × 630 link-preview size.
//
//   1 loader (spinning) → 2 current (half fill) → 3 done (disc + tick)
//   → 4 Icon Mark → 5 mark slides left as "Axxess" is revealed.
//
// 1→2 closes the loader's lines into the ring; 2→3 folds the half's edge into the tick; 3→4 morphs the circle into the mark;
// 4→5 is the text reveal. `draw(ctx, t)` renders any moment, so the preview and the GIF
// export share one timeline.
import { MARK, WORD, WORD_STROKE } from "./logo-paths.js";

export const W = 1200;
export const H = 630;
const S = 6; // 20-unit icon → 120px box (the Figma frames' size)
const BG = "#131316"; // grayscale-950
const GREEN = [25, 165, 73]; // primary-base
const WHITE = [255, 255, 255];
const DARK = BG; // the tick and the chevron are cut-outs in the background colour

// Timeline (ms)
export const T = {
  current: 1000, // loader has spun for a second; it spins out into the half fill (820ms)
  done: 2100, // half fill → disc + tick (520ms)
  morph: 3000, // circle → Icon Mark (600ms)
  reveal: 3900, // mark slides left, wordmark revealed (720ms)
  end: 4620,
  hold: 2600, // final logo holds before the loop starts again
};

// Full logo is 59.543 × 20 units; final position centres it. Before the reveal the mark
// alone sits centred, which is the same box the icons use.
const LOGO_W = 59.543 * S;
const FINAL_X = W / 2 - LOGO_W / 2;
const TOP = H / 2 - 10 * S;
const MARK_CENTRED_X = W / 2 - 10 * S;

const clamp = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, p) => a + (b - a) * p;
const mix = (a, b, p) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], p))).join(",")})`;

/** CSS-style cubic-bezier easing. */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const x = (u) => ((ax * u + bx) * u + cx) * u;
  const y = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const err = x(u) - t;
      if (Math.abs(err) < 1e-5) break;
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    return y(Math.min(1, Math.max(0, u)));
  };
}
const easeOutSoft = bezier(0.22, 1, 0.36, 1); // the system's soft landing
const easeInOut = bezier(0.65, 0, 0.35, 1);
const easeSpin = bezier(0.45, 0, 0.25, 1);

const LOADER = new Path2D(
  "M10 2.5V5M10 15V17.5M4.697 4.697L6.465 6.464M13.536 13.536L15.304 15.303M2.5 10H5M15 10H17.5M4.697 15.303L6.465 13.536M13.536 6.464L15.304 4.697",
);
const HALF = new Path2D("M10 2.5A7.5 7.5 0 0 0 10 17.5Z");
// The tick and the mark's chevron as matching three-point strokes (start, point, end), so one
// can travel into the other. The chevron's centre line and weight are read off the mark's cut-out.
const TICK_POINTS = [[7.08, 10.83], [8.75, 12.5], [12.5, 7.92]];
const CHEVRON_POINTS = [[9.792, 8.333], [11.667, 6.458], [13.542, 8.333]];
const CHEVRON_WEIGHT = 1.25;
// The half's straight edge (inside the ring) as three points matching the tick's: bottom → short
// tip, middle → corner, top → long tip.
const SEAM_POINTS = [[10, 16.667], [10, 10], [10, 3.333]];
const RIGHT_HALF = new Path2D("M10 2.5A7.5 7.5 0 0 1 10 17.5Z");
const MARK_PATH = new Path2D(MARK);
// The chevron is the mark's cut-out; drawn on its own it can fade in over the morphing square
const CHEVRON = new Path2D(MARK.slice(MARK.indexOf("M12.1086")));
const WORD_PATHS = WORD.map((d) => new Path2D(d));
const WORD_STROKE_PATHS = WORD_STROKE.map((d) => new Path2D(d));

/** Run `fn` in icon units (20 × 20), scaled about the icon's centre. */
function inIcon(ctx, x, fn, { scale = 1, rotate = 0, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, TOP);
  ctx.scale(S, S);
  ctx.translate(10, 10);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-10, -10);
  fn();
  ctx.restore();
}

export function draw(ctx, t) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const x = MARK_CENTRED_X;

  // 1 → 2: the loader spins, then makes one slowing turn. As it slows, its broken lines close
  // into the ring: each line shortens towards its outer end while an arc grows out of it both
  // ways along the ring, until the eight arcs meet, turning green and thinning to the ring's weight.
  const RING_CLOSED = 640;
  if (t < T.current + RING_CLOSED) {
    const spinIn = T.current / 1000;
    let rotate = (Math.min(t, T.current) / 1000) * 360;
    let k = 0;
    if (t >= T.current) {
      rotate = spinIn * 360 + 360 * easeSpin(clamp((t - T.current) / RING_CLOSED));
      k = easeOutSoft(clamp((t - T.current - 160) / (RING_CLOSED - 160)));
    }
    inIcon(ctx, x, () => {
      ctx.strokeStyle = mix(WHITE, GREEN, k);
      ctx.lineWidth = lerp(2, 1.667, k);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (k <= 0) {
        ctx.stroke(LOADER);
        return;
      }
      // The plain ring settles in underneath as the arcs meet, so their joins never show
      const settle = clamp((k - 0.85) / 0.1);
      if (settle > 0) {
        ctx.globalAlpha = settle;
        ctx.beginPath();
        ctx.arc(10, 10, 7.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      const span = (k * Math.PI) / 8; // half of each line's share of the ring
      // Lines are gone before the arcs meet, so no stubs poke into the ring
      const inner = lerp(5, 7.5, clamp(k / 0.7));
      // ...then the arcs fade off it, leaving exactly the ring frame 2 continues with
      ctx.globalAlpha = 1 - clamp((k - 0.95) / 0.05);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.moveTo(10 + Math.cos(a) * inner, 10 + Math.sin(a) * inner);
        ctx.lineTo(10 + Math.cos(a) * 7.5, 10 + Math.sin(a) * 7.5);
        ctx.moveTo(10 + Math.cos(a - span) * 7.5, 10 + Math.sin(a - span) * 7.5);
        ctx.arc(10, 10, 7.5, a - span, a + span);
      }
      ctx.stroke();
    }, { rotate });
  }
  // Ring (closed from the loader) and half (grows in from 60%). At the very end of the 2 → 3 fold,
  // once the solid disc covers them, they fade out beneath it so only the disc's edge remains.
  const grow = (delay) => easeOutSoft(clamp((t - T.current - delay) / 360));
  const foldQ = t >= T.done ? easeInOut(clamp((t - T.done) / 520)) : 0;
  const under = 1 - clamp((foldQ - 0.9) / 0.1);
  if (t >= T.current + RING_CLOSED && t < T.morph) {
    inIcon(ctx, x, () => {
      ctx.strokeStyle = mix(GREEN, GREEN, 0);
      ctx.lineWidth = 1.667;
      ctx.beginPath();
      ctx.arc(10, 10, 7.5, 0, Math.PI * 2);
      ctx.stroke();
    }, { alpha: under });
  }
  if (t >= T.current && t < T.morph) {
    let half = grow(560);
    inIcon(ctx, x, () => {
      ctx.fillStyle = mix(GREEN, GREEN, 0);
      ctx.fill(HALF);
    }, { scale: 0.6 + 0.4 * half, alpha: half * under });
  }
  // 2 → 3: the half's straight edge folds into the tick. A dark line sitting on the edge
  // (unseen against the dark half) is left behind as the right half fills in green; its three
  // points travel to the tick's (top → long tip, middle → corner, bottom → short tip) as it
  // shortens, bends and thickens to the tick's weight.
  if (t >= T.done && t < T.morph) {
    const q = easeInOut(clamp((t - T.done) / 520));
    const fill = easeOutSoft(clamp((t - T.done) / 360));
    inIcon(ctx, x, () => {
      ctx.fillStyle = mix(GREEN, GREEN, 0);
      ctx.globalAlpha = fill * under;
      ctx.fill(RIGHT_HALF);
      // As the fold lands, the solid disc settles over the halves and ring (same green, so nothing
      // dips), which is exactly what the circle → mark morph starts from.
      const solid = clamp((q - 0.8) / 0.1);
      if (solid > 0) {
        ctx.globalAlpha = solid;
        ctx.beginPath();
        ctx.arc(10, 10, 8.333, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (q <= 0) return;
      ctx.strokeStyle = DARK;
      ctx.lineWidth = lerp(0, 2, q);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      SEAM_POINTS.forEach(([x0, y0], i) => {
        const [x1, y1] = TICK_POINTS[i];
        if (i === 0) ctx.moveTo(lerp(x0, x1, q), lerp(y0, y1, q));
        else ctx.lineTo(lerp(x0, x1, q), lerp(y0, y1, q));
      });
      ctx.stroke();
    });
  }
  // 3 → 4: the green circle becomes the white rounded square while the tick flips into the
  // mark's chevron: its three points travel to the chevron's (the point swings from the bottom,
  // through flat, to the top) and the stroke thins to the chevron's weight. In the last stretch
  // the drawn chevron dissolves into the mark's exact cut-out.
  if (t >= T.morph && t < T.reveal) {
    const p = easeInOut(clamp((t - T.morph) / 600));
    const size = lerp(16.667, 15, p);
    const radius = lerp(8.333, 0.625, p);
    // Drawn chevron → exact cut-out: the cut-out fades in beneath (80–90%), then the drawn
    // stroke fades out on top of it (90–100%), so it never dips and ends on the real mark.
    const settle = clamp((p - 0.8) / 0.1);
    const strokeAlpha = 1 - clamp((p - 0.9) / 0.1);
    inIcon(ctx, x, () => {
      ctx.fillStyle = mix(GREEN, WHITE, p);
      ctx.beginPath();
      ctx.roundRect(10 - size / 2, 10 - size / 2, size, size, radius);
      ctx.fill();
      // The real cut-out fades in underneath; the drawn chevron stays solid on top (two half-faded
      // copies would dip to grey), and the two coincide exactly by the end.
      if (settle > 0) {
        ctx.globalAlpha = settle;
        ctx.fillStyle = DARK;
        ctx.fill(CHEVRON);
      }
      ctx.globalAlpha = strokeAlpha;
      ctx.strokeStyle = DARK;
      ctx.lineWidth = lerp(2, CHEVRON_WEIGHT, p);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      TICK_POINTS.forEach(([x0, y0], i) => {
        const [x1, y1] = CHEVRON_POINTS[i];
        const px = lerp(x0, x1, p);
        const py = lerp(y0, y1, p);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
  }
  // 4 → 5: the mark slides left into place while "Axxess" is revealed left to right
  if (t >= T.reveal) {
    const slide = easeInOut(clamp((t - T.reveal) / 720));
    const left = lerp(MARK_CENTRED_X, FINAL_X, slide);
    ctx.save();
    ctx.translate(left, TOP);
    ctx.scale(S, S);
    ctx.fillStyle = "#ffffff";
    ctx.fill(MARK_PATH, "evenodd");
    const w = easeOutSoft(clamp((t - T.reveal - 120) / 600));
    if (w > 0) {
      ctx.globalAlpha = clamp(w / 0.6);
      ctx.beginPath();
      ctx.rect(20, 0, 39.6 * w + 0.01, 20);
      ctx.clip();
      ctx.translate((1 - w) * 1.2, 0); // the text drifts in a few px as it appears
      ctx.save();
      ctx.translate(20.19, 5.266);
      WORD_PATHS.forEach((p) => ctx.fill(p));
      ctx.restore();
      ctx.translate(20, 5.166);
      WORD_STROKE_PATHS.forEach((p) => ctx.fill(p));
    }
    ctx.restore();
  }
}
