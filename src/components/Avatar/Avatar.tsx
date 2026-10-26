import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import "./Avatar.css";

export type AvatarSize = 20 | 25 | 30 | 40 | 50;

export interface AvatarProps {
  /** Default 40. */
  size?: AvatarSize;
  /** Inferred when left out: image if `src`, initials if `name`, else icon. */
  type?: "icon" | "initial" | "initials" | "image";
  /** Used for initials and as the accessible name. */
  name?: string;
  src?: string;
  alt?: string;
  /** Fill behind initials or the icon. Defaults to grayscale-900; flows use the accent colors. */
  color?: string;
  className?: string;
}

// Font sizes per avatar size, from the Figma variants.
const INITIALS_SIZE: Record<AvatarSize, number> = { 20: 8, 25: 10, 30: 14, 40: 16, 50: 20 };
const INITIAL_SIZE: Record<AvatarSize, number> = { 20: 12, 25: 14, 30: 16, 40: 20, 50: 24 };
const ICON_SIZE: Record<AvatarSize, number> = { 20: 12.5, 25: 15, 30: 20, 40: 25, 50: 35 };

function initialsOf(name: string, one: boolean): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (one || words.length === 1) return words[0].charAt(0);
  return words[0].charAt(0) + words[words.length - 1].charAt(0);
}

export function Avatar({ size = 40, type, name, src, alt, color, className }: AvatarProps) {
  const kind = type ?? (src ? "image" : name ? "initials" : "icon");
  const box = { width: size, height: size, background: color };

  if (kind === "image") {
    return (
      <span className={cx("axo-avatar", "axo-avatar--image", className)} style={box}>
        <img src={src} alt={alt ?? name ?? ""} />
      </span>
    );
  }
  if (kind === "icon" || !name) {
    return (
      <span className={cx("axo-avatar", className)} style={box} role="img" aria-label={name ?? "User"}>
        <Icon name="contrast" size={ICON_SIZE[size]} />
      </span>
    );
  }
  const text = initialsOf(name, kind === "initial");
  const fontSize = (text.length < 2 ? INITIAL_SIZE : INITIALS_SIZE)[size];
  return (
    <span className={cx("axo-avatar", className)} style={{ ...box, fontSize }} role="img" aria-label={name}>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
