import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import { icons, type IconName } from "./icons";
import "./Icon.css";

export type { IconName };
export const iconNames = Object.keys(icons) as IconName[];

export interface IconProps {
  /** Which icon to draw. */
  name: IconName;
  /** Width and height in px. Defaults to the size it was drawn at. */
  size?: number;
  /** Accessible name when the icon stands alone. Otherwise it is hidden from assistive tech. */
  title?: string;
  className?: string;
}

export function Icon({ name, size, title, className }: IconProps) {
  const { viewBox, body } = icons[name];
  const [, , w, h] = viewBox.split(" ");
  return (
    <svg
      className={cx("axo-icon", className)}
      viewBox={viewBox}
      width={size ?? w}
      height={size ?? h}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** Accepts an icon name or any element, so props can take either. */
export function renderIcon(icon: IconName | ReactNode): ReactNode {
  return typeof icon === "string" && icon in icons ? <Icon name={icon as IconName} /> : icon;
}
