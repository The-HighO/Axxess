import type { ButtonHTMLAttributes } from "react";
import { cx } from "../internal/cx";
import "./Tab.css";

export interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The selected tab: dark label and underline. */
  active?: boolean;
}

/** One tab. Place tabs in a row inside an element with role="tablist". */
export function Tab({ active = false, className, children, ...rest }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cx("axo-tab", active && "is-active", className)}
      {...rest}
    >
      <span className="axo-tab__label">{children}</span>
      <span className="axo-tab__bar" aria-hidden="true" />
    </button>
  );
}
