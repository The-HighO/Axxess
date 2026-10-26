import { useEffect, useRef, type InputHTMLAttributes } from "react";
import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import "./SearchField.css";

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Shows the ⌘K hint and focuses the field on ⌘K / Ctrl+K. */
  shortcut?: boolean;
}

/** 40px pill search box from the top navigation. */
export function SearchField({ shortcut = true, className, "aria-label": ariaLabel, placeholder, ...rest }: SearchFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);
  return (
    <label className={cx("axo-search", className)}>
      <Icon name="search" size={20} />
      <input ref={ref} type="search" placeholder={placeholder} aria-label={ariaLabel ?? placeholder} {...rest} />
      {shortcut && (
        <kbd className="axo-search__kbd" aria-hidden="true">
          <Icon name="cmd" size={12} />K
        </kbd>
      )}
    </label>
  );
}
