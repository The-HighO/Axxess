import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../internal/cx";
import { usePresence } from "../internal/usePresence";
import "../internal/Popover.css";
import "./Menu.css";

export interface MenuItem {
  id: string;
  label: ReactNode;
  /** Second line, such as why the item is disabled. */
  hint?: ReactNode;
  disabled?: boolean;
  /** Marks the current choice with a check-style emphasis. */
  selected?: boolean;
  tone?: "default" | "danger";
  onSelect?: () => void;
}

export interface MenuProps {
  /** Renders the trigger. Spread `triggerProps` onto a button. */
  trigger: (triggerProps: {
    ref: (el: HTMLButtonElement | null) => void;
    onClick: () => void;
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => ReactNode;
  items: MenuItem[];
  /** Which edge of the trigger the menu lines up with. */
  align?: "start" | "end";
  /** Accessible name for the menu. */
  label: string;
  minWidth?: number;
  className?: string;
}

/** Popover menu on the dropdown surface (cards-shadow-large), opened from any button. */
export function Menu({ trigger, items, align = "start", label, minWidth = 200, className }: MenuProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Show `active` highlighted only once the keyboard or a hover has picked it, so nothing
  // looks hovered when the menu opens from a click.
  const [highlight, setHighlight] = useState(false);
  const { present, leaving } = usePresence(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function show(at: "first" | "last" = "first", fromKeyboard = false) {
    setHighlight(fromKeyboard);
    const sel = items.findIndex((it) => it.selected && !it.disabled);
    setActive(sel >= 0 ? sel : at === "first" ? enabled[0] ?? 0 : enabled[enabled.length - 1] ?? 0);
    setOpen(true);
  }
  function close(refocus = true) {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }
  function choose(item: MenuItem) {
    if (item.disabled) return;
    close();
    item.onSelect?.();
  }
  function move(dir: 1 | -1) {
    const pos = enabled.indexOf(active);
    const next = enabled[(pos + dir + enabled.length) % enabled.length];
    if (next != null) setActive(next);
  }
  function onListKey(e: KeyboardEvent<HTMLUListElement>) {
    // The first arrow press lights up the current item rather than skipping past it.
    if (e.key === "ArrowDown") { e.preventDefault(); if (highlight) move(1); setHighlight(true); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (highlight) move(-1); setHighlight(true); }
    else if (e.key === "Home") { e.preventDefault(); setActive(enabled[0]); setHighlight(true); }
    else if (e.key === "End") { e.preventDefault(); setActive(enabled[enabled.length - 1]); setHighlight(true); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (highlight && items[active]) choose(items[active]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") { close(false); }
  }

  return (
    <div ref={rootRef} className={cx("axo-menu", className)}>
      {trigger({
        ref: (el) => { triggerRef.current = el; },
        onClick: () => (open ? close() : show()),
        onKeyDown: (e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            show(e.key === "ArrowUp" ? "last" : "first", true);
          }
        },
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": `${id}-menu`,
      })}
      {present && (
        <ul
          ref={listRef}
          id={`${id}-menu`}
          role="menu"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={highlight ? `${id}-item-${active}` : undefined}
          className={cx("axo-menu__list", "axo-pop", align === "end" && "axo-menu__list--end is-end", leaving && "is-leaving")}
          style={{ minWidth }}
          onKeyDown={onListKey}
        >
          {items.map((item, i) => (
            <li
              key={item.id}
              id={`${id}-item-${i}`}
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              className={cx(
                "axo-menu__item",
                highlight && i === active && "is-active",
                item.selected && "is-selected",
                item.disabled && "is-disabled",
                item.tone === "danger" && "is-danger",
              )}
              onMouseEnter={() => {
                if (item.disabled) return;
                setActive(i);
                setHighlight(true);
              }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(item)}
            >
              <span className="axo-menu__label">{item.label}</span>
              {item.hint && <span className="axo-menu__hint">{item.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
