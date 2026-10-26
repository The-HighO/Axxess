import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "./cx";
import "./Choice.css";

export interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Text shown beside the control. Without it, pass an aria-label. */
  label?: ReactNode;
  /** Ref to the underlying <input>. */
  inputRef?: Ref<HTMLInputElement>;
}

interface ChoiceBaseProps extends ChoiceProps {
  kind: "check" | "radio" | "toggle";
  mark?: ReactNode;
}

/** Shared shell for Checkbox, Radio and Toggle: a native input with a drawn control. */
export function Choice({ kind, mark, label, className, style, disabled, inputRef, ...rest }: ChoiceBaseProps) {
  return (
    <label className={cx("axo-choice", disabled && "axo-choice--disabled", className)} style={style}>
      <input
        ref={inputRef}
        type={kind === "radio" ? "radio" : "checkbox"}
        role={kind === "toggle" ? "switch" : undefined}
        disabled={disabled}
        {...rest}
      />
      <span className={`axo-${kind}`} aria-hidden="true">{mark}</span>
      {label != null && <span>{label}</span>}
    </label>
  );
}
