import { useState } from "react";
import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import { DATE_PICKER_HEIGHT, DatePicker } from "../DatePicker";
import { formatDate } from "../DateInput";
import "./DateRangePicker.css";

export interface DateRange {
  /** ISO dates (yyyy-mm-dd), or "" while not chosen. */
  start: string;
  end: string;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Earliest choosable ISO date. */
  min?: string;
  /** Latest choosable ISO date. */
  max?: string;
  /** Called with the finished range once both ends are chosen, so a surrounding popover can close. */
  onDone?: (range: DateRange) => void;
  className?: string;
}

/** Height of the whole picker panel: the start/end bar and its gap on top of the calendar. */
export const DATE_RANGE_PICKER_HEIGHT = DATE_PICKER_HEIGHT + 48 + 12;

/**
 * Range version of the calendar DatePicker. A start → end bar on top shows both ends and
 * which one the next click sets; below it is the same calendar, with the range drawn as one
 * grayscale-950 band. Pick a start, then an end (a day before the start begins again from there).
 */
export function DateRangePicker({ value, onChange, min, max, onDone, className }: DateRangePickerProps) {
  const [editing, setEditing] = useState<"start" | "end">(value.start && !value.end ? "end" : "start");
  // Clicking an end in the bar jumps the calendar to its month (by remounting it there).
  const [jump, setJump] = useState({ to: value.start || value.end, n: 0 });

  function pick(d: string) {
    if (editing === "start" || !value.start || d < value.start) {
      // A new start; an end before it no longer makes sense.
      onChange({ start: d, end: value.end && value.end >= d ? value.end : "" });
      setEditing("end");
      return;
    }
    const done = { start: value.start, end: d };
    onChange(done);
    setEditing("start");
    onDone?.(done);
  }

  function edit(which: "start" | "end") {
    setEditing(which);
    const to = value[which];
    if (to) setJump((j) => ({ to, n: j.n + 1 }));
  }

  const endButton = (which: "start" | "end") => {
    const date = value[which];
    const name = which === "start" ? "Start date" : "End date";
    return (
      <button
        type="button"
        className={cx("axo-range__end", editing === which && "is-active", !date && "is-empty")}
        aria-pressed={editing === which}
        aria-label={`${name}: ${date ? formatDate(date) : "not chosen"}${editing === which ? ", choosing" : ""}`}
        onClick={() => edit(which)}
      >
        {date ? formatDate(date) : name}
      </button>
    );
  };

  return (
    <div className={cx("axo-range", className)}>
      <div className="axo-range__bar">
        {endButton("start")}
        <Icon name="arrow-right" size={20} className="axo-range__arrow" />
        {endButton("end")}
      </div>
      <DatePicker
        key={jump.n}
        className="axo-range__calendar"
        value={jump.to}
        onChange={pick}
        min={min}
        max={max}
        range={{ start: value.start, end: value.end, editing }}
      />
    </div>
  );
}
