import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import { Icon, renderIcon, type IconName } from "../Icon";
import "./Badge.css";

export type BadgeStatus =
  | "black" | "green" | "red" | "yellow" | "blue"
  | "pink" | "purple" | "brown" | "primary" | "coral";

export interface BadgeProps {
  /** Default "black". green successful, red failed, yellow processing, blue refunded. */
  status?: BadgeStatus;
  /** true for the half-filled contrast icon, or an icon name or element. */
  icon?: boolean | IconName | ReactNode;
  /** The word. Write it in lowercase; the badge sets it in uppercase. */
  children: ReactNode;
  /** "pill" (default) for statuses; "tag" (4px corners) for identifiers like REQ-0842. */
  shape?: "pill" | "tag";
  className?: string;
}

export function Badge({ status = "black", icon, children, shape = "pill", className }: BadgeProps) {
  const iconNode = icon === true ? <Icon name="contrast" /> : icon ? renderIcon(icon) : null;
  return (
    <span className={cx("axo-badge", `axo-badge--${status}`, shape === "tag" && "axo-badge--tag", iconNode != null && "axo-badge--icon", className)}>
      {iconNode}
      {children}
    </span>
  );
}
