import { useId, type CSSProperties, type ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "../Icon";
import "./Field.css";

export interface FieldOwnProps {
  /** Label above the field. */
  label?: ReactNode;
  /** Helper or error text under the field. */
  feedback?: ReactNode;
  /** Negative state: red border. Say what's wrong in `feedback`. */
  invalid?: boolean;
}

interface FieldShellProps extends FieldOwnProps {
  id?: string;
  info?: boolean | string;
  multiline?: boolean;
  disabled?: boolean;
  filled: boolean;
  trailing?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Renders the control, given the ids it must carry. */
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
}

/** Shared label, box and feedback shell for TextInput and TextArea. */
export function FieldShell({
  id: givenId, label, info, feedback, invalid, multiline, disabled, filled, trailing, className, style, children,
}: FieldShellProps) {
  const autoId = useId();
  const id = givenId ?? autoId;
  const feedbackId = feedback ? `${id}-feedback` : undefined;
  const infoTitle = typeof info === "string" ? info : "More information";
  return (
    <div
      className={cx("axo-field", invalid && "axo-field--negative", disabled && "axo-field--disabled", className)}
      style={style}
    >
      {label != null && (
        <label className="axo-field__label" htmlFor={id}>
          {label}
          {info && (
            <span className="axo-field__info" title={infoTitle}>
              <Icon name="info-circle" title={infoTitle} />
            </span>
          )}
        </label>
      )}
      <div className={cx("axo-field__box", multiline ? "axo-field__box--area" : "axo-field__box--input", filled && "is-filled")}>
        {children({ id, describedBy: feedbackId })}
        {trailing}
      </div>
      {feedback && <div className="axo-field__feedback" id={feedbackId}>{feedback}</div>}
    </div>
  );
}

export function hasValue(value: unknown, defaultValue: unknown): boolean {
  const v = value ?? defaultValue;
  return v != null && String(v).length > 0;
}
