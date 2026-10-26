import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import { Menu } from "../Menu";
import "./Filter.css";

export interface FilterMenuProps {
  /** The field name, such as "Status". */
  label: string;
  options: Array<{ value: string; label: string }>;
  /** Selected option value, or null for none. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Shown in the chip instead of the option's label, e.g. the dates of a custom range. */
  valueLabel?: string;
  className?: string;
}

/** A Filter chip that opens a menu of options; dashed when empty, solid with a clear button once set. */
export function FilterMenu({ label, options, value, onChange, valueLabel, className }: FilterMenuProps) {
  const found = options.find((o) => o.value === value) ?? null;
  const selected = found && valueLabel ? { ...found, label: valueLabel } : found;
  const menu = (
    <Menu
      label={`${label} filter`}
      items={options.map((o) => ({ id: o.value, label: o.label, selected: o.value === value, onSelect: () => onChange(o.value) }))}
      trigger={(t) =>
        selected ? (
          <button type="button" className="axo-filter__open" aria-label={`${label}: ${selected.label}. Change filter`} {...t}>
            <span className="axo-filter__pair">
              <span>{label}</span>
              <span className="axo-filter__rule" aria-hidden="true" />
              <span className="axo-filter__value">{selected.label}</span>
            </span>
            <Icon name="chevron-down-small" />
          </button>
        ) : (
          <button type="button" className={cx("axo-filter", className)} {...t}>
            {label}
            <Icon name="chevron-down-small" />
          </button>
        )
      }
    />
  );
  if (!selected) return menu;
  return (
    <span className={cx("axo-filter", "axo-filter--active", className)}>
      <button type="button" className="axo-filter__clear" onClick={() => onChange(null)} aria-label={`Clear ${label} filter`}>
        <Icon name="crossed-small" />
      </button>
      {menu}
    </span>
  );
}
