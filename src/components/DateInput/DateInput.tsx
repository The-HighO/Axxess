import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import { DATE_PICKER_HEIGHT, DatePicker } from "../DatePicker";
import { useFloatingPanel } from "../internal/useFloatingPanel";
import { usePresence } from "../internal/usePresence";
import "../internal/Popover.css";
import { placeholderFor } from "../internal/placeholder";
import "../internal/Field.css";
import "./DateInput.css";

export interface DateInputProps {
  label: ReactNode;
  /** ISO date, yyyy-mm-dd, or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable ISO date. */
  min?: string;
  /** Latest selectable ISO date. */
  max?: string;
  /** Shown until a date is chosen. Defaults to one built from the label ("Select end date"); "" for none. */
  placeholder?: string;
  /** Space kept between the open picker and the bottom of the screen, in px. */
  screenMargin?: number;
  className?: string;
}

/** Shows an ISO date (yyyy-mm-dd) as "30 - 12 - 2026", the format the designs use. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d} - ${m} - ${y}` : "";
}

/**
 * Date field in the Input/text style with a calendar icon. It opens the
 * calendar DatePicker in a panel under the field; picking a day closes it.
 */
export function DateInput({ label, value, onChange, min, max, placeholder, screenMargin = 24, className }: DateInputProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  // Stays in the page for its fade-out, placed where it was, so nothing shifts under it.
  const { present, leaving } = usePresence(open);
  const place = useFloatingPanel({
    open: present,
    leaving,
    anchorRef,
    rootRef,
    onDismiss: () => close(false),
    scrollAreas: () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(".axo-calendar__scroll") ?? []),
    chrome: DATE_PICKER_HEIGHT,
    comfortable: 0,
    maxFlex: 0,
    minFlex: 0,
    screenMargin,
  });

  // Start on the chosen (or current) day so the arrow keys work straight away.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('.axo-calendar__day[tabindex="0"]')?.focus({ preventScroll: true });
  }, [open]);

  return (
    <div ref={rootRef} className={cx("axo-field", "axo-date", className)}>
      <label className="axo-field__label" htmlFor={id}>{label}</label>
      <div ref={anchorRef}>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className={cx("axo-field__box", "axo-field__box--input", "axo-date__trigger", value && "is-filled", open && "is-open")}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={value ? undefined : typeof label === "string" ? `${label}, no date chosen` : undefined}
          onClick={() => (open ? close() : setOpen(true))}
        >
          {value ? (
            <span className="axo-date__display">{formatDate(value)}</span>
          ) : (
            <span className="axo-date__display axo-field__placeholder">{placeholderFor(label, "Select", placeholder)}</span>
          )}
          <Icon name="calendar" size={16} />
        </button>
      </div>
      {present && (
        <div
          ref={panelRef}
          className={cx("axo-date__panel", "axo-pop", place.above && "is-above", leaving && "is-leaving")}
          role="dialog"
          aria-label={typeof label === "string" ? label : "Choose a date"}
          style={{ top: place.top, left: place.left, width: place.width }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close();
            }
          }}
        >
          <DatePicker value={value} onChange={onChange} min={min} max={max} onDone={() => close()} />
        </div>
      )}
    </div>
  );
}
