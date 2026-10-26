import type { ReactNode } from "react";
import "../../components/Radio/Radio.css";

interface RadioRowProps {
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  title: ReactNode;
  description?: ReactNode;
}

/** A radio inside an option card: text on the left, the control on the right. */
export function RadioRow({ name, value, checked, onSelect, title, description }: RadioRowProps) {
  return (
    <label className="ra-radio-row">
      <span className="ra-radio-row__text">
        <span className="ra-radio-row__title">{title}</span>
        {description && <span className="ra-radio-row__desc">{description}</span>}
      </span>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onSelect(value)} />
      <span className="axo-radio" aria-hidden="true" />
    </label>
  );
}
