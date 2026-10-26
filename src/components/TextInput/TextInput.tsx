import type { InputHTMLAttributes, ReactNode } from "react";
import { FieldShell, hasValue, type FieldOwnProps } from "../internal/Field";
import { Icon, renderIcon, type IconName } from "../Icon";
import { placeholderFor } from "../internal/placeholder";

export interface TextInputProps extends FieldOwnProps, InputHTMLAttributes<HTMLInputElement> {
  /** true, or tooltip text, to show the info icon after the label. */
  info?: boolean | string;
  /** true for the picker chevron, or an icon name or element. */
  trailingIcon?: boolean | IconName | ReactNode;
}

/**
 * Labelled 44px text field (Input/text in Figma). Without a `placeholder` it builds one from the
 * label: "Enter manager email", or "Select role" when it has the picker chevron. Pass "" for none.
 */
export function TextInput({
  id, label, info, feedback, invalid, trailingIcon, placeholder, className, style, ...rest
}: TextInputProps) {
  const trailing =
    trailingIcon === true ? <Icon name="chevron-bottom" size={16} /> : trailingIcon ? renderIcon(trailingIcon) : null;
  return (
    <FieldShell
      id={id}
      label={label}
      info={info}
      feedback={feedback}
      invalid={invalid}
      disabled={rest.disabled}
      filled={hasValue(rest.value, rest.defaultValue)}
      trailing={trailing}
      className={className}
      style={style}
    >
      {({ id: inputId, describedBy }) => (
        <input
          id={inputId}
          className="axo-field__control"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          placeholder={placeholderFor(label, trailingIcon ? "Select" : "Enter", placeholder)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}
