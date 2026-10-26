import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import "./Filter.css";

export interface FilterProps {
  /** The field name, such as "To" or "Status". */
  label: string;
  /** The applied value. Leave empty for the dashed default state. */
  value?: ReactNode;
  /** Opens your picker. */
  onClick?: () => void;
  /** Clears the applied value. */
  onClear?: () => void;
  className?: string;
}

/** 28px filter chip: dashed when empty, solid with a clear button once a value is applied. */
export function Filter({ label, value, onClick, onClear, className }: FilterProps) {
  const active = value != null && value !== "";
  if (!active) {
    return (
      <button type="button" className={cx("axo-filter", className)} onClick={onClick}>
        {label}
        <Icon name="chevron-down-small" />
      </button>
    );
  }
  return (
    <span className={cx("axo-filter", "axo-filter--active", className)}>
      <button type="button" className="axo-filter__clear" onClick={onClear} aria-label={`Clear ${label} filter`}>
        <Icon name="crossed-small" />
      </button>
      <button type="button" className="axo-filter__open" onClick={onClick}>
        <span className="axo-filter__pair">
          <span>{label}</span>
          <span className="axo-filter__rule" aria-hidden="true" />
          <span className="axo-filter__value">{value}</span>
        </span>
        <Icon name="chevron-down-small" />
      </button>
    </span>
  );
}
