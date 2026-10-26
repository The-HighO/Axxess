import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "../internal/cx";
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
  children: ReactNode;
  className?: string;
}

/**
 * Floating 468px panel docked to the right of the page for record details.
 * The page behind stays usable; focus moves into the panel when it opens.
 */
export function SidePanel({ label, header, footer, onClose, children, className }: SidePanelProps) {
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
