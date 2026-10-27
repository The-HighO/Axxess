// Opening splash: plays the thumbnail motion once over the page (the `#splash` overlay in
// index.html, dark from the first paint), holds on the logo, then fades to reveal the app.
// A click or key skips it; with reduced motion it isn't shown at all.
import { draw, W, H, T } from "./motion.js";

const HOLD = 500; // on the finished logo before fading
const FADE = 400;

const splash = document.getElementById("splash");
if (splash) {
  const canvas = splash.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  let leaving = false;

  const leave = () => {
    if (leaving) return;
    leaving = true;
    splash.style.transition = `opacity ${FADE}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";
    setTimeout(() => splash.remove(), FADE);
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    splash.remove();
  } else {
    // The 1200 × 630 thumbnail frame, centred; scaled so the mark is about 72px on large
    // screens and smaller on phones.
    let scale = 1;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      scale = Math.min(0.6, window.innerWidth / 800) * dpr;
    };
    fit();
    window.addEventListener("resize", fit);

    const start = performance.now();
    const frame = (now) => {
      if (leaving) return;
      const t = Math.min(now - start, T.end);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#131316";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, (canvas.width - W * scale) / 2, (canvas.height - H * scale) / 2);
      draw(ctx, t);
      if (now - start >= T.end + HOLD) leave();
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    splash.addEventListener("click", leave);
    window.addEventListener("keydown", leave, { once: true });
  }
}
