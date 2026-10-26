import type { MouseEventHandler, ReactNode } from "react";
import { cx } from "../internal/cx";
import { Icon, renderIcon, type IconName } from "../Icon";
import "./NavItem.css";

export interface NavItemProps {
  /** 20px icon: a name or any element. */
  icon?: IconName | ReactNode;
  label: ReactNode;
  /** The current page: grey fill, dark label and icon. */
  active?: boolean;
  /** Shows the chevron for a group with sub-pages. */
  dropdown?: boolean;
  /** Open state of a dropdown item. */
  expanded?: boolean;
  /** Renders a link instead of a button. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Tooltip, e.g. the label when only the icon shows. */
  title?: string;
  className?: string;
}

/** 32px sidebar row. */
export function NavItem({ icon, label, active, dropdown, expanded, href, onClick, title, className }: NavItemProps) {
  const content = (
    <>
      <span className="axo-nav-item__main">
        {icon != null && renderIcon(icon)}
        <span className="axo-nav-item__label">{label}</span>
      </span>
      {dropdown && (
        <span className="axo-nav-item__chev">
          <Icon name="chevron-down-small" />
        </span>
      )}
    </>
  );
  const common = {
    className: cx("axo-nav-item", active && "is-active", className),
    "aria-current": active ? ("page" as const) : undefined,
    "aria-expanded": dropdown ? Boolean(expanded) : undefined,
    onClick,
    title,
  };
  return href ? (
    <a href={href} {...common}>{content}</a>
  ) : (
    <button type="button" {...common}>{content}</button>
  );
}
