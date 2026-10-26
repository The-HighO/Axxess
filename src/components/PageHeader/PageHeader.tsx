import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import { Button } from "../Button";
import "./PageHeader.css";

export interface PageHeaderProps {
  /** Page title, such as "Request access". */
  title: ReactNode;
  /** Called by the close button. Leave out to hide it. */
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
}

/** 76px top bar for focused, full-page tasks: close button, divider, title. */
export function PageHeader({ title, onClose, closeLabel = "Close", className }: PageHeaderProps) {
  return (
    <header className={cx("axo-page-header", className)}>
      {onClose && (
        <>
          <Button className="axo-page-header__close" variant="neutral" size="small" icon="crossed-small" iconPosition="only" aria-label={closeLabel} onClick={onClose} />
          <span className="axo-page-header__rule" aria-hidden="true" />
        </>
      )}
      <h1 className="axo-page-header__title">{title}</h1>
    </header>
  );
}
