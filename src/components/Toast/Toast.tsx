import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import { Button } from "../Button";
import { Icon, type IconName } from "../Icon";
import "./Toast.css";

export type ToastType = "default" | "success" | "warning" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  /** Sets the icon: light bulb, check, info or warning triangle. Default "default". */
  type?: ToastType;
  /** The message, one line where it fits. */
  title: ReactNode;
  /** Optional supporting copy under the title. */
  body?: ReactNode;
  /** Optional button, such as "Okay". */
  action?: ToastAction;
  className?: string;
}

const ICON: Record<ToastType, IconName> = {
  default: "lightbulb",
  success: "check-circle-solid",
  warning: "info-circle-solid",
  error: "warning-triangle-solid",
};

/**
 * A toast from the Toasts page: a grayscale-950 card with a type icon and a message,
 * optionally with body copy and an action. Without body copy everything sits on one
 * row (action on the right); with it, the action moves under the text.
 */
export function Toast({ type = "default", title, body, action, className }: ToastProps) {
  const header = (
    <div className="axo-toast__header">
      <Icon name={ICON[type]} size={24} className={`axo-toast__icon is-${type}`} />
      <p className="axo-toast__title">{title}</p>
    </div>
  );
  const button = action && (
    <Button variant="black" size="small" className="axo-toast__action" onClick={action.onClick}>
      {action.label}
    </Button>
  );
  return (
    <div className={cx("axo-toast", body ? "axo-toast--stacked" : "axo-toast--inline", action && "has-action", className)}>
      {body ? (
        <>
          <div className="axo-toast__text">
            {header}
            <p className="axo-toast__body">{body}</p>
          </div>
          {button}
        </>
      ) : (
        <>
          {header}
          {button}
        </>
      )}
    </div>
  );
}
