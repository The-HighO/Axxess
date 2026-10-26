import { useEffect, useRef } from "react";
import { Choice, type ChoiceProps } from "../internal/Choice";
import { Icon } from "../Icon";
import "./Checkbox.css";

export interface CheckboxProps extends ChoiceProps {
  /** "round" (default): the 25px form checkbox. "table": the 16px square used to select table rows. */
  variant?: "round" | "table";
  /** Shows a dash for a partly selected group, such as a select-all box. */
  indeterminate?: boolean;
}

/** Round 25px checkbox: grayscale-150 ring off, grayscale-950 disc with a white check on. */
export function Checkbox({ variant = "round", indeterminate = false, className, ...props }: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <Choice
      inputRef={ref}
      kind="check"
      mark={<Icon name="check" />}
      className={variant === "table" ? ["axo-choice--table", className].filter(Boolean).join(" ") : className}
      {...props}
    />
  );
}
