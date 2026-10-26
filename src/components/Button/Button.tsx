import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../internal/cx";
import { renderIcon, type IconName } from "../Icon";
import "./Button.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Default "primary". "black" is the grayscale-800 pill used on dark surfaces such as toasts. */
  variant?: "primary" | "neutral" | "text" | "destructive" | "destructive-outline" | "black";
  /** large 50px, medium 40px, small 30px. Default "large". */
  size?: "large" | "medium" | "small";
  /** An icon name or any element. */
  icon?: IconName | ReactNode;
  /** Default "leading". "only" hides the label, so pass an aria-label. */
  iconPosition?: "leading" | "trailing" | "only";
}

export function Button({
  variant = "primary",
  size = "large",
  icon,
  iconPosition = "leading",
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const iconNode = icon ? renderIcon(icon) : null;
  const iconOnly = Boolean(iconNode) && iconPosition === "only";
  return (
    <button
      type={type}
      className={cx(
        "axo-btn",
        `axo-btn--${variant}`,
        `axo-btn--${size}`,
        iconOnly && "axo-btn--icon-only",
        className,
      )}
      {...rest}
    >
      {iconPosition !== "trailing" && iconNode}
      {!iconOnly && children}
      {iconPosition === "trailing" && iconNode}
    </button>
  );
}
