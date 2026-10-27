// Renders the timeline frame by frame and encodes an animated GIF.
//
// - The first frame is the finished logo (20ms): platforms that only show a GIF's first
//   frame (WhatsApp, LinkedIn, iMessage, X) get the logo, and since the animation also ends
//   on the logo, the loop is seamless where it does play.
// - 25fps through the motion; still stretches collapse into one frame with a long delay.
// - One global palette; pixels unchanged from the previous frame are transparent, which
//   keeps the file small (only the moving area is stored for each frame).
import { GIFEncoder, quantize, applyPalette } from "https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js";
import { draw, W, H, T } from "./motion.js";

const STEP = 40;

export async function exportGif() {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const pixels = (t) => {
    draw(ctx, t);
    return ctx.getImageData(0, 0, W, H).data;
  };

  // Palette from key moments of the timeline
  const keys = [500, T.current + 500, T.done + 300, T.morph + 300, T.reveal + 300, T.end];
  const sample = new Uint8Array(keys.length * W * H * 4);
  keys.forEach((t, i) => sample.set(pixels(t), i * W * H * 4));
  const palette = quantize(sample, 255);
  const transparentIndex = palette.length;
  const fullPalette = [...palette, [0, 0, 0]];

  const plan = [{ t: T.end, delay: 20 }];
  for (let t = 0; t < T.end; t += STEP) plan.push({ t, delay: STEP });
  plan.push({ t: T.end, delay: T.hold });

  const gif = GIFEncoder();
  let prev = null;
  let pending = null; // held back one frame so identical frames can merge their delays
  let written = 0;
  const flush = () => {
    if (!pending) return;
    gif.writeFrame(pending.index, W, H, {
      palette: written === 0 ? fullPalette : undefined,
      delay: pending.delay,
      transparent: written > 0,
      transparentIndex,
      dispose: 1,
      repeat: 0,
    });
    written++;
  };
  for (const { t, delay } of plan) {
    const index = applyPalette(pixels(t), palette);
    if (prev) {
      let changed = false;
      const out = new Uint8Array(index.length);
      for (let i = 0; i < index.length; i++) {
        if (index[i] === prev[i]) out[i] = transparentIndex;
        else {
          out[i] = index[i];
          changed = true;
        }
      }
      if (!changed) {
        pending.delay += delay;
        continue;
      }
      flush();
      pending = { index: out, delay };
    } else {
      pending = { index, delay };
    }
    prev = index;
  }
  flush();
  gif.finish();
  return { bytes: gif.bytes(), frames: written };
}
