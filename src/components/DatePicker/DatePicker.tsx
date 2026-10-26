import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "../internal/cx";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { ScrollThumb } from "../internal/ScrollThumb";
import "./DatePicker.css";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface DatePickerProps {
  /** ISO date (yyyy-mm-dd), or "" for none yet. */
  value: string;
  /** Called with an ISO date when a day is picked. */
  onChange: (iso: string) => void;
  /** Earliest choosable ISO date. Earlier days, months and years show faded. */
  min?: string;
  /** Latest choosable ISO date. */
  max?: string;
  /** Called after a day is picked, so a surrounding popover can close. */
  onDone?: () => void;
  /**
   * Range mode (used by DateRangePicker): highlights `start` to `end` as one band, and while
   * `editing` is "end" previews the band up to the hovered day. `value` then only sets the
   * month shown first.
   */
  range?: { start: string; end: string; editing: "start" | "end" };
  className?: string;
}

type View = "days" | "months" | "years";
interface Ym { y: number; m: number }

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => {
  const date = new Date(y, m, d); // normalises overflow, e.g. day 0 or month 12
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const parse = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
};
const todayIso = () => {
  const t = new Date();
  return iso(t.getFullYear(), t.getMonth(), t.getDate());
};
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

/** Body height shared by all three views, so the panel never changes size. */
const BODY_HEIGHT = 276; // weekday row 32 + 4 gap + 6 weeks x 40
/** Height of the whole picker panel (padding, header, gap, body, borders), for placing it on screen. */
export const DATE_PICKER_HEIGHT = 16 + 48 + 12 + BODY_HEIGHT + 16 + 2;

/**
 * Calendar date picker: a month of days, with "Choose month" and "Choose year"
 * views opened from the header. Built on the Axxess OS tokens: a pill header on
 * grayscale-50, and the chosen day, month or year filled grayscale-950.
 */
export function DatePicker({ value, onChange, min, max, onDone, range, className }: DatePickerProps) {
  const selected = range ? null : parse(value);
  const start = parse(value || (min && todayIso() < min ? min : max && todayIso() > max ? max : todayIso()))!;
  const [view, setView] = useState<View>("days");
  const [shown, setShown] = useState<Ym>({ y: start.y, m: start.m });
  // Keyboard focus inside the day grid (roving tabindex).
  const [focusDay, setFocusDay] = useState(iso(start.y, start.m, start.d));
  const rootRef = useRef<HTMLDivElement>(null);
  const yearsRef = useRef<HTMLDivElement>(null);
  const focusAfterRender = useRef(false);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  // Which edges of the year list have more years past them (those edges fade out).
  const [yearEdges, setYearEdges] = useState({ top: false, bottom: true });
  const measureYearEdges = () => {
    const el = yearsRef.current;
    if (el) setYearEdges({ top: el.scrollTop > 1, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1 });
  };

  const allowed = (d: string) => (!min || d >= min) && (!max || d <= max);
  // A month or year can be opened if any of its days are allowed.
  const overlaps = (first: string, last: string) => (!min || last >= min) && (!max || first <= max);
  const monthAllowed = (y: number, m: number) => overlaps(iso(y, m, 1), iso(y, m, daysIn(y, m)));
  const yearAllowed = (y: number) => overlaps(iso(y, 0, 1), iso(y, 11, 31));

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const from = min ? parse(min)!.y : now - 50;
    const to = max ? parse(max)!.y : Math.max(now + 20, shown.y);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }, [min, max, shown.y]);

  // The weeks the month spans (4 to 6), starting on the Monday on or before the 1st.
  const cells = useMemo(() => {
    const first = new Date(shown.y, shown.m, 1);
    const lead = (first.getDay() + 6) % 7;
    const weeks = Math.ceil((lead + daysIn(shown.y, shown.m)) / 7);
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const date = new Date(shown.y, shown.m, 1 - lead + i);
      return { iso: iso(date.getFullYear(), date.getMonth(), date.getDate()), day: date.getDate(), inMonth: date.getMonth() === shown.m, weekday: i % 7 };
    });
  }, [shown]);

  // After keyboard moves or a view change, put focus on the right button.
  useEffect(() => {
    if (!focusAfterRender.current) return;
    focusAfterRender.current = false;
    rootRef.current?.querySelector<HTMLElement>('[data-roving="true"]')?.focus({ preventScroll: view !== "years" });
  });
  // Show the chosen (or current) year near the middle of the year list.
  useLayoutEffect(() => {
    if (view !== "years") return;
    const list = yearsRef.current;
    const el = list?.querySelector<HTMLElement>('[data-roving="true"]');
    if (list && el) list.scrollTop = el.offsetTop - list.clientHeight / 2 + el.offsetHeight / 2;
    measureYearEdges();
  }, [view]);

  const goTo = (next: View) => {
    setView(next);
    focusAfterRender.current = true;
  };
  const moveMonth = (delta: number) => {
    const d = new Date(shown.y, shown.m + delta, 1);
    setShown({ y: d.getFullYear(), m: d.getMonth() });
  };

  function pickDay(d: string) {
    if (!allowed(d)) return;
    const p = parse(d)!;
    setShown({ y: p.y, m: p.m });
    setFocusDay(d);
    onChange(d);
    onDone?.();
  }

  function onDayKey(e: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const cur = parse(focusDay)!;
    let next: string | null = null;
    if (e.key in steps) next = iso(cur.y, cur.m, cur.d + steps[e.key]);
    else if (e.key === "PageUp") next = iso(cur.y, cur.m - 1, Math.min(cur.d, daysIn(cur.y, cur.m - 1)));
    else if (e.key === "PageDown") next = iso(cur.y, cur.m + 1, Math.min(cur.d, daysIn(cur.y, cur.m + 1)));
    else if (e.key === "Home") next = iso(cur.y, cur.m, cur.d - ((new Date(cur.y, cur.m, cur.d).getDay() + 6) % 7));
    else if (e.key === "End") next = iso(cur.y, cur.m, cur.d + (6 - ((new Date(cur.y, cur.m, cur.d).getDay() + 6) % 7)));
    if (!next) return;
    e.preventDefault();
    const p = parse(next)!;
    setFocusDay(next);
    if (p.y !== shown.y || p.m !== shown.m) setShown({ y: p.y, m: p.m });
    focusAfterRender.current = true;
  }

  /** Arrow keys over a grid of buttons with `cols` columns; returns the new index or null. */
  function gridKey(e: KeyboardEvent, index: number, count: number, cols: number): number | null {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols };
    if (!(e.key in steps)) return null;
    e.preventDefault();
    const next = index + steps[e.key];
    return next >= 0 && next < count ? next : null;
  }

  // Escape in a sub-view goes back to the days rather than closing the popover.
  function onRootKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape" && view !== "days") {
      e.preventDefault();
      e.stopPropagation();
      goTo("days");
    }
  }

  const header =
    view === "days" ? (
      <div className="axo-calendar__header">
        <Button variant="neutral" size="small" icon="chevron-left-small" iconPosition="only" aria-label="Previous month" onClick={() => moveMonth(-1)} />
        <span className="axo-calendar__title" aria-live="polite">
          <button type="button" className="axo-calendar__title-btn" onClick={() => goTo("months")} aria-label={`${MONTHS[shown.m]}, choose month`}>
            {MONTHS[shown.m].slice(0, 3)},
          </button>
          <button type="button" className="axo-calendar__title-btn" onClick={() => goTo("years")} aria-label={`${shown.y}, choose year`}>
            {shown.y}
          </button>
        </span>
        <Button variant="neutral" size="small" icon="chevron-right-16" iconPosition="only" aria-label="Next month" onClick={() => moveMonth(1)} />
      </div>
    ) : (
      <div className="axo-calendar__header axo-calendar__header--sub">
        <button type="button" className="axo-calendar__back" onClick={() => goTo("days")} aria-label="Back to days">
          <Icon name="arrow-right" size={20} />
        </button>
        <span className="axo-calendar__title">{view === "months" ? "Choose month" : "Choose year"}</span>
        <span className="axo-calendar__spacer" aria-hidden="true" />
      </div>
    );

  let body;
  if (view === "days") {
    const focusInView = cells.some((c) => c.iso === focusDay) ? focusDay : cells.find((c) => c.inMonth)!.iso;
    // Range band: the chosen range, or while choosing the end, a lighter preview up to the hovered day.
    const lo = range?.start || null;
    const previewing = !!range && range.editing === "end" && !!lo && !!hoverDay && hoverDay >= lo && hoverDay !== range.end;
    const hi = previewing ? hoverDay : range?.end || null;
    body = (
      <div
        className="axo-calendar__days"
        role="grid"
        aria-label={`${MONTHS[shown.m]} ${shown.y}`}
        aria-multiselectable={range ? true : undefined}
        onKeyDown={onDayKey}
        onMouseLeave={() => setHoverDay(null)}
      >
        <div className="axo-calendar__weekdays" role="row">
          {WEEKDAYS.map((w, i) => (
            <span key={i} role="columnheader" aria-label={WEEKDAY_NAMES[i]}>{w}</span>
          ))}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, week) => (
          <div className="axo-calendar__week" role="row" key={week}>
            {cells.slice(week * 7, week * 7 + 7).map((c) => {
              const isEnd = !!range && (c.iso === range.start || c.iso === range.end);
              const isSelected = range ? isEnd : !!selected && c.iso === value;
              const inBand = !!lo && !!hi && lo < hi && c.iso >= lo && c.iso <= hi;
              const disabled = !allowed(c.iso);
              const roving = c.iso === focusInView;
              return (
                <span
                  role="gridcell"
                  key={c.iso}
                  aria-selected={isSelected || (inBand && !previewing)}
                  className={cx(
                    inBand && (previewing ? "in-preview" : "in-range"),
                    inBand && c.iso === lo && "band-start",
                    inBand && c.iso === hi && "band-end",
                  )}
                  onMouseEnter={range ? () => setHoverDay(c.iso) : undefined}
                >
                  <button
                    type="button"
                    className={cx("axo-calendar__day", !c.inMonth && "is-outside", isSelected && "is-selected", c.iso === todayIso() && "is-today")}
                    disabled={disabled}
                    tabIndex={roving ? 0 : -1}
                    data-roving={roving}
                    aria-label={new Date(`${c.iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    onClick={() => pickDay(c.iso)}
                  >
                    {c.day}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );
  } else if (view === "months") {
    const focusM = selected && selected.y === shown.y ? selected.m : shown.m;
    body = (
      <div className="axo-calendar__months">
        {MONTHS.map((name, m) => {
          const isSelected = m === shown.m;
          return (
            <button
              key={name}
              type="button"
              className={cx("axo-calendar__cell", isSelected && "is-selected")}
              disabled={!monthAllowed(shown.y, m)}
              tabIndex={m === focusM ? 0 : -1}
              data-roving={m === focusM}
              aria-pressed={isSelected}
              aria-label={`${name} ${shown.y}`}
              onKeyDown={(e) => {
                const n = gridKey(e, m, 12, 3);
                if (n != null) (e.currentTarget.parentElement!.children[n] as HTMLElement).focus();
              }}
              onClick={() => {
                setShown({ y: shown.y, m });
                const d = Math.min(parse(focusDay)!.d, daysIn(shown.y, m));
                setFocusDay(iso(shown.y, m, d));
                goTo("days");
              }}
            >
              {name.slice(0, 3)}
            </button>
          );
        })}
      </div>
    );
  } else {
    body = (
      <div className="axo-calendar__years-wrap">
        <div
          className={cx("axo-calendar__years", "axo-calendar__scroll", yearEdges.top && "fade-top", yearEdges.bottom && "fade-bottom")}
          ref={yearsRef}
          onScroll={measureYearEdges}
        >
          {years.map((y, i) => {
            const isSelected = y === shown.y;
            return (
              <button
                key={y}
                type="button"
                className={cx("axo-calendar__cell", isSelected && "is-selected")}
                disabled={!yearAllowed(y)}
                tabIndex={isSelected ? 0 : -1}
                data-roving={isSelected}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  const n = gridKey(e, i, years.length, 4);
                  if (n != null) (e.currentTarget.parentElement!.children[n] as HTMLElement).focus();
                }}
                onClick={() => {
                  // Keep the month, nudged into range if the new year cuts it off.
                  let m = shown.m;
                  if (!monthAllowed(y, m)) m = MONTHS.findIndex((_, k) => monthAllowed(y, k));
                  setShown({ y, m });
                  setFocusDay(iso(y, m, Math.min(parse(focusDay)!.d, daysIn(y, m))));
                  goTo("days");
                }}
              >
                {y}
              </button>
            );
          })}
        </div>
        <ScrollThumb targetRef={yearsRef} />
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cx("axo-calendar", className)} onKeyDown={onRootKey}>
      {header}
      <div className="axo-calendar__body" style={{ height: BODY_HEIGHT }}>{body}</div>
    </div>
  );
}
