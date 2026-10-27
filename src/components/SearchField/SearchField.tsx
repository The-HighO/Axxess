import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import "./SearchField.css";

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Shows the ⌘K hint and focuses the field on ⌘K / Ctrl+K. */
  shortcut?: boolean;
}

/**
 * 40px pill search box from the top navigation. While it's active (focused or holding text)
 * the ⌘K hint gives way, and once there's text a DS clear button (crossed-small) replaces the
 * browser's own one.
 */
export function SearchField({ shortcut = true, className, "aria-label": ariaLabel, placeholder, onChange, ...rest }: SearchFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  const controlled = rest.value !== undefined;
  const [typed, setTyped] = useState(String(rest.defaultValue ?? ""));
  const hasValue = (controlled ? String(rest.value ?? "") : typed) !== "";

  // Empty the field the way typing would, so onChange (and a controlled value) follow.
  function clear() {
    const input = ref.current;
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }
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
    <label className={cx("axo-search", hasValue && "has-value", className)}>
      <Icon name="search" size={20} />
      <input
        ref={ref}
        type="search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        onChange={(e) => {
          setTyped(e.target.value);
          onChange?.(e);
        }}
        {...rest}
      />
      {hasValue && (
        <button
          type="button"
          className="axo-search__clear"
          aria-label="Clear search"
          // Keep focus in the field rather than moving it to the button.
          onMouseDown={(e) => e.preventDefault()}
          onClick={clear}
        >
          <Icon name="crossed-small" size={18} />
        </button>
      )}
      {shortcut && (
        <kbd className="axo-search__kbd" aria-hidden="true">
          <Icon name="cmd" size={12} />K
        </kbd>
      )}
    </label>
  );
}
