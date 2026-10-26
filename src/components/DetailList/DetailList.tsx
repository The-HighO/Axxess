import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import "./DetailList.css";

export interface DetailRow {
  label: ReactNode;
  value: ReactNode;
  /** Small avatar or icon shown before the value. */
  leading?: ReactNode;
}

export interface DetailListProps {
  /** Section title, such as "Beneficiary details". */
  title?: ReactNode;
  rows: DetailRow[];
  className?: string;
}

/** Label/value pairs: labels in secondary text on the left, values right-aligned. */
export function DetailList({ title, rows, className }: DetailListProps) {
  return (
    <section className={cx("axo-details", className)}>
      {title && <h3 className="axo-details__title">{title}</h3>}
      <dl className="axo-details__rows">
        {rows.map((row, i) => (
          <div className="axo-details__row" key={i}>
            <dt>{row.label}</dt>
            <dd>
              {row.leading}
              <span>{row.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
