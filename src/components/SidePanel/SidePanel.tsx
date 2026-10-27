import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "../internal/cx";
import { usePresence } from "../internal/usePresence";
import { Icon } from "../Icon";
import "./SidePanel.css";

export interface SidePanelProps {
  /** Accessible name for the panel. */
  label: string;
  /** Top row: usually an avatar on the left and a menu on the right. */
  header?: ReactNode;
  /** Sticky footer, usually the main action. */
  footer?: ReactNode;
  /** Called on Escape. */
  onClose: () => void;
  /** Laid over the whole panel, such as a PanelSheet. */
  overlay?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Floating 468px panel docked to the right of the page for record details.
 * The page behind stays usable; focus moves into the panel when it opens.
 */
export function SidePanel({ label, header, footer, onClose, overlay, children, className }: SidePanelProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [label]);
  return (
    <aside
      ref={ref}
      className={cx("axo-panel", className)}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !e.defaultPrevented) onClose();
      }}
    >
      {header && <div className="axo-panel__header">{header}</div>}
      <div className="axo-panel__scroll">{children}</div>
      {footer && <div className="axo-panel__footer">{footer}</div>}
      {overlay}
    </aside>
  );
}

export interface PanelSectionProps {
  title: ReactNode;
  /** Open by default. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/** A collapsible section inside a SidePanel, separated by a soap-200 rule. */
export function PanelSection({ title, defaultOpen = true, children }: PanelSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="axo-panel__section">
      <h3 className="axo-panel__section-head">
        <button type="button" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen(!open)}>
          <span>{title}</span>
          <Icon name={open ? "chevron-top" : "chevron-down"} size={20} />
        </button>
      </h3>
      {open && (
        <div className="axo-panel__section-body" id={`${id}-body`}>
          {children}
        </div>
      )}
    </section>
  );
}

/** How long a PanelSheet takes to close: its 380ms glide down (SidePanel.css), plus a frame. */
export const SHEET_LEAVE_MS = 400;

export interface PanelSheetProps {
  open: boolean;
  /** Called on Escape or a press on the dimmed panel behind it. */
  onClose: () => void;
  /** Accessible name for the sheet. */
  label: string;
  children: ReactNode;
}

/**
 * A sheet that rises from the bottom of a SidePanel (pass it as `overlay`) for a decision
 * about the record, such as confirming a rejection. The panel behind is dimmed and softly
 * blurred; the sheet is the panel's full width, as tall as its content, with the panel's own
 * corner radius and padding. Focus moves to the sheet's first field (or the sheet) on open.
 */
export function PanelSheet({ open, onClose, label, children }: PanelSheetProps) {
  const { present, leaving } = usePresence(open, SHEET_LEAVE_MS);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const sheet = ref.current;
    const field = sheet?.querySelector<HTMLElement>("textarea, input, select");
    (field ?? sheet)?.focus({ preventScroll: true });
  }, [open]);
  if (!present) return null;
  return (
    <div className={cx("axo-panel-sheet", leaving && "is-leaving")}>
      <div className="axo-panel-sheet__scrim" onMouseDown={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className="axo-panel-sheet__sheet"
        role="alertdialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          // Close the sheet, not the panel under it
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      >
        {children}
      </div>
    </div>
  );
}
