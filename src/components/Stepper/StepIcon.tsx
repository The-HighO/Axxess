import { useState } from "react";
import { cx } from "../internal/cx";
import type { StepStatus } from "./Stepper";

/**
 * The 20px step icon, drawn in layers so it can move between its states: a grey loader
 * (pending), a ring with its left half filled (current), and a green disc with a white tick
 * (done). It animates only when its status changes, never on first render:
 *
 * - pending → current: the loader spins once and fades as the ring and half fill grow in.
 * - current (or pending) → done: the disc fills out from the half, then the tick draws itself.
 */
export function StepIcon({ status, className }: { status: StepStatus; className?: string }) {
  const [prev, setPrev] = useState(status);
  const [from, setFrom] = useState<StepStatus | null>(null);
  if (status !== prev) {
    setFrom(prev);
    setPrev(status);
  }
  return (
    <svg
      className={cx("axo-step-icon", `is-${status}`, from && `from-${from}`, className)}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="axo-step-icon__loader"
        d="M10 2.5V5M10 15V17.5M4.697 4.697L6.465 6.464M13.536 13.536L15.304 15.303M2.5 10H5M15 10H17.5M4.697 15.303L6.465 13.536M13.536 6.464L15.304 4.697"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="axo-step-icon__ring" cx={10} cy={10} r={7.5} strokeWidth={1.667} />
      {/* The half fill runs to the middle of the ring (r 7.5, not its inner edge at 6.667), so
          the two overlap and no anti-aliased seam shows between them. */}
      <path className="axo-step-icon__half" d="M10 2.5A7.5 7.5 0 0 0 10 17.5Z" />
      <circle className="axo-step-icon__disc" cx={10} cy={10} r={8.333} />
      <path
        className="axo-step-icon__tick"
        d="M7.08 10.83L8.75 12.5L12.5 7.92"
        pathLength={1}
        strokeWidth={1.667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
