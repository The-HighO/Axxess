import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import { ScrollThumb } from "../internal/ScrollThumb";
import { useFloatingPanel } from "../internal/useFloatingPanel";
import { placeholderFor } from "../internal/placeholder";
import "../internal/Field.css";
import "./Combobox.css";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Second line, such as an email address. Also searched. */
  description?: string;
  /** Avatar or icon before the label. */
  leading?: ReactNode;
}

export interface ComboboxProps {
  label: ReactNode;
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Shown in the field until something is chosen. Defaults to one built from the label ("Select application"); "" for none. */
  placeholder?: string;
  /** Groups options under their first letter (A, B, …). */
  groupByInitial?: boolean;
  /** Shown when the search matches nothing. */
  emptyText?: string;
  /** Space kept between the open list and the edge of the screen, in px. */
  screenMargin?: number;
  disabled?: boolean;
  className?: string;
}

/** A select with a search box and a popover list, built on the Input/text field. */
export function Combobox({
  label, options, value, onChange, searchPlaceholder = "Search", placeholder, groupByInitial, emptyText = "No matches", screenMargin = 24,
  disabled, className,
}: ComboboxProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Floats under the field, ends 24px above the screen bottom, and keeps scrolling inside the list.
  const float = useFloatingPanel({
    open,
    anchorRef,
    rootRef,
    onDismiss: () => setOpen(false),
    scrollAreas: () => [listRef.current],
    chrome: 43, // 40px search row, its 1px rule, 2px of borders
    comfortable: 280,
    maxFlex: 360,
    screenMargin,
  });
  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter((o) => o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q))
      : options;
    return groupByInitial ? [...list].sort((a, b) => a.label.localeCompare(b.label)) : list;
  }, [options, query, groupByInitial]);

  useEffect(() => {
    if (open) searchRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => setActive(0), [query]);

  // Keep the keyboard-highlighted option in view inside the list.
  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`#${CSS.escape(optionId(active))}`);
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop - 4;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight + 4;
  }, [active, open]);

  function openList() {
    setQuery("");
    setActive(Math.max(0, filtered.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(option: ComboboxOption) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
  }

  const optionId = (i: number) => `${id}-opt-${i}`;
  const rows: ReactNode[] = [];
  let lastInitial = "";
  filtered.forEach((option, i) => {
    const initial = option.label.charAt(0).toUpperCase();
    if (groupByInitial && initial !== lastInitial) {
      lastInitial = initial;
      rows.push(<li key={`g-${initial}`} className="axo-combobox__group" role="presentation">{initial}</li>);
    }
    rows.push(
      <li
        key={option.value}
        id={optionId(i)}
        role="option"
        aria-selected={option.value === value}
        className={cx("axo-combobox__option", i === active && "is-active", option.description && "has-description")}
        onMouseEnter={() => setActive(i)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => choose(option)}
      >
        {option.leading}
        <span className="axo-combobox__option-text">
          <span className="axo-combobox__option-label">{option.label}</span>
          {option.description && <span className="axo-combobox__option-desc">{option.description}</span>}
        </span>
      </li>,
    );
  });

  return (
    <div ref={rootRef} className={cx("axo-field", "axo-combobox", disabled && "axo-field--disabled", className)}>
      <label className="axo-field__label" htmlFor={`${id}-trigger`}>{label}</label>
      <div className="axo-combobox__anchor" ref={anchorRef}>
        <button
          ref={triggerRef}
          id={`${id}-trigger`}
          type="button"
          className={cx("axo-field__box", "axo-field__box--input", "axo-combobox__trigger", selected && "is-filled", open && "is-open")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              e.preventDefault();
              openList();
            }
          }}
        >
          {selected ? (
            <span className="axo-combobox__value">{selected.label}</span>
          ) : (
            <span className="axo-combobox__value axo-field__placeholder">{placeholderFor(label, "Select", placeholder)}</span>
          )}
          <Icon name="chevron-bottom" size={16} />
        </button>
        {open && (
          <div
            ref={popoverRef}
            className="axo-combobox__popover"
            style={{ top: float.top, left: float.left, width: float.width }}
          >
            <input
              ref={searchRef}
              className="axo-combobox__search"
              type="text"
              role="combobox"
              aria-label={searchPlaceholder}
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={filtered[active] ? optionId(active) : undefined}
              aria-autocomplete="list"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
            />
            <div className="axo-combobox__list-wrap">
              <ul
                ref={listRef}
                className="axo-combobox__list"
                style={{ maxHeight: float.flexMax }}
                id={`${id}-list`}
                role="listbox"
                aria-label={typeof label === "string" ? label : undefined}
              >
                {rows.length ? rows : <li className="axo-combobox__empty" role="presentation">{emptyText}</li>}
              </ul>
              <ScrollThumb targetRef={listRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
