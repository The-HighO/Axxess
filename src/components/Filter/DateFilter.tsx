import { useEffect, useRef, useState } from "react";
import { cx } from "../internal/cx";
import { DATE_RANGE_PICKER_HEIGHT, DateRangePicker, type DateRange } from "../DateRangePicker";
import { useFloatingPanel } from "../internal/useFloatingPanel";
import { FilterMenu } from "./FilterMenu";
import "../DateInput/DateInput.css";
import "./Filter.css";

export type DatePreset = "today" | "yesterday" | "week" | "month" | "year" | "custom";

/** A preset, with the ISO dates it covers (both ends included). */
export interface DateFilterValue extends DateRange {
  preset: DatePreset;
}

const PRESETS: Array<{ value: DatePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom" },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The dates a preset covers on `today`. Weeks run Monday to Sunday, like the calendar. */
export function presetRange(preset: Exclude<DatePreset, "custom">, today = new Date()): DateRange {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  switch (preset) {
    case "today":
      return { start: isoOf(today), end: isoOf(today) };
    case "yesterday": {
      const t = isoOf(new Date(y, m, d - 1));
      return { start: t, end: t };
    }
    case "week": {
      const monday = d - ((today.getDay() + 6) % 7);
      return { start: isoOf(new Date(y, m, monday)), end: isoOf(new Date(y, m, monday + 6)) };
    }
    case "month":
      return { start: isoOf(new Date(y, m, 1)), end: isoOf(new Date(y, m + 1, 0)) };
    case "year":
      return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
}

/** "5 May – 11 May, 2025", "30 Dec, 2025 – 3 Jan, 2026", or "5 May, 2025" for one day. */
export function formatRange({ start, end }: DateRange): string {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  const day = (dd: number, mm: number) => `${dd} ${MONTHS_SHORT[mm - 1]}`;
  if (start === end) return `${day(sd, sm)}, ${sy}`;
  if (sy === ey) return `${day(sd, sm)} – ${day(ed, em)}, ${ey}`;
  return `${day(sd, sm)}, ${sy} – ${day(ed, em)}, ${ey}`;
}

/** True if the ISO date (or the date part of an ISO timestamp) falls in the range. */
export function inRange(iso: string, { start, end }: DateRange): boolean {
  const day = iso.slice(0, 10);
  return day >= start && day <= end;
}

export interface DateFilterProps {
  /** Default "Date". */
  label?: string;
  value: DateFilterValue | null;
  onChange: (value: DateFilterValue | null) => void;
  className?: string;
}

const PANEL_WIDTH = 344;

/**
 * Date filter chip: Today, Yesterday, This week, This month, This year, or Custom, which
 * opens the DateRangePicker under the chip. The chip then shows the chosen dates.
 */
export function DateFilter({ label = "Date", value, onChange, className }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>({ start: "", end: "" });
  const rootRef = useRef<HTMLSpanElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    anchorRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
  };

  const place = useFloatingPanel({
    open,
    anchorRef,
    rootRef,
    onDismiss: () => setOpen(false),
    scrollAreas: () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>(".axo-calendar__scroll") ?? []),
    chrome: DATE_RANGE_PICKER_HEIGHT,
    comfortable: 0,
    maxFlex: 0,
    minFlex: 0,
  });

  // Start on a day of the calendar so the arrow keys work straight away.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('.axo-calendar__day[tabindex="0"]')?.focus({ preventScroll: true });
  }, [open]);

  function choose(preset: string | null) {
    if (preset === null) return onChange(null);
    if (preset === "custom") {
      // Reopen on the current custom range, or start fresh.
      setDraft(value?.preset === "custom" ? { start: value.start, end: value.end } : { start: "", end: "" });
      setOpen(true);
      return;
    }
    onChange({ preset: preset as DatePreset, ...presetRange(preset as Exclude<DatePreset, "custom">) });
  }

  // Keep the panel on screen when the chip sits near the right edge.
  const left = Math.max(16, Math.min(place.left, window.innerWidth - PANEL_WIDTH - 16));

  return (
    <span ref={rootRef} className={cx("axo-date-filter", className)}>
      <span ref={anchorRef} className="axo-date-filter__anchor">
        <FilterMenu
          label={label}
          options={PRESETS}
          value={value?.preset ?? null}
          valueLabel={value?.preset === "custom" ? formatRange(value) : undefined}
          onChange={choose}
        />
      </span>
      {open && (
        <div
          ref={panelRef}
          className="axo-date__panel"
          role="dialog"
          aria-label={`${label}: choose a range`}
          style={{ top: place.top, left, width: PANEL_WIDTH }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close();
            }
          }}
        >
          <DateRangePicker
            value={draft}
            onChange={setDraft}
            onDone={(range) => {
              onChange({ preset: "custom", ...range });
              close();
            }}
          />
        </div>
      )}
    </span>
  );
}
