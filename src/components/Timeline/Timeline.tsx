import { useState, type ReactNode } from "react";
import { cx } from "../internal/cx";
import "./Timeline.css";

export type TimelineStatus = "done" | "current" | "pending" | "failed";

export interface TimelineItem {
  id: string;
  status: TimelineStatus;
  /** Small uppercase line on top: a time or a stage name. */
  caption: ReactNode;
  /** Main line(s) under the caption. */
  children?: ReactNode;
}

/**
 * The 20px stage icon, drawn in layers so it can move between states with the step tracker's
 * motion (see StepIcon): a loader (grey when not started, amber while waiting), a green disc
 * with a tick (done) and a red ring with a cross (failed). It animates only when the status
 * changes, never on first render.
 */
function TimelineIcon({ status }: { status: TimelineStatus }) {
  const [prev, setPrev] = useState(status);
  const [from, setFrom] = useState<TimelineStatus | null>(null);
  if (status !== prev) {
    setFrom(prev);
    setPrev(status);
  }
  return (
    <svg
      className={cx("axo-timeline__icon", from && `from-${from}`)}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="axo-timeline__loader"
        d="M10 2.5V5M10 15V17.5M4.697 4.697L6.465 6.464M13.536 13.536L15.304 15.303M2.5 10H5M15 10H17.5M4.697 15.303L6.465 13.536M13.536 6.464L15.304 4.697"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="axo-timeline__disc" cx={10} cy={10} r={8.333} />
      <path
        className="axo-timeline__tick"
        d="M7.08 10.83L8.75 12.5L12.5 7.92"
        pathLength={1}
        strokeWidth={1.667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The system's "close, x, circle" icon (24px grid) at 20px */}
      <circle className="axo-timeline__ring" cx={10} cy={10} r={7.708} strokeWidth={1.5} />
      <path
        className="axo-timeline__cross"
        d="M12.5 7.5L7.5 12.5M12.5 12.5L7.5 7.5"
        pathLength={1}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Vertical timeline of stages. Each item's connector takes its status color: green when
 * done, amber while in progress, grey when not started. Like the step tracker, a connector
 * fills down when its stage starts and changes color as it finishes.
 */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cx("axo-timeline", className)}>
      {items.map((item) => (
        <li key={item.id} className={cx("axo-timeline__item", `is-${item.status}`)}>
          <span className="axo-timeline__rail" aria-hidden="true">
            <TimelineIcon status={item.status} />
            <span className="axo-timeline__line" />
          </span>
          <div className="axo-timeline__body">
            <span className="axo-timeline__caption">{item.caption}</span>
            {item.children}
          </div>
        </li>
      ))}
    </ol>
  );
}
