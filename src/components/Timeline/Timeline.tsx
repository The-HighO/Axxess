import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import { Icon } from "../Icon";
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

const ICON = { done: "check-circle", current: "loader", pending: "loader", failed: "crossed-small" } as const;

/**
 * Vertical timeline of stages. Each item's connector takes its status color:
 * green when done, amber while in progress, grey when not started.
 */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cx("axo-timeline", className)}>
      {items.map((item) => (
        <li key={item.id} className={cx("axo-timeline__item", `is-${item.status}`)}>
          <span className="axo-timeline__rail" aria-hidden="true">
            <Icon name={ICON[item.status]} size={20} className="axo-timeline__icon" />
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
