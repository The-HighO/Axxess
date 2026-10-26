import type { TextareaHTMLAttributes } from "react";
import { FieldShell, hasValue, type FieldOwnProps } from "../internal/Field";
import { placeholderFor } from "../internal/placeholder";

export interface TextAreaProps extends FieldOwnProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}

/** Labelled 90px multi-line field (Input/message in Figma). Without a `placeholder` it builds one from the label. */
export function TextArea({ id, label, feedback, invalid, placeholder, className, style, ...rest }: TextAreaProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      feedback={feedback}
      invalid={invalid}
      multiline
      disabled={rest.disabled}
      filled={hasValue(rest.value, rest.defaultValue)}
      className={className}
      style={style}
    >
      {({ id: inputId, describedBy }) => (
        <textarea
          id={inputId}
          className="axo-field__control"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          placeholder={placeholderFor(label, "Enter", placeholder)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}
