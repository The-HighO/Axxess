import type { ReactNode } from "react";
import { cx } from "../internal/cx";
import { Icon, type IconName } from "../Icon";
import { NavItem } from "../NavItem";
import "./Navigation.css";

export interface NavigationItem {
  id: string;
  label: string;
  icon?: IconName | ReactNode;
  href?: string;
  dropdown?: boolean;
}

export interface NavigationSection {
  /** Uppercase heading. Leave off for an untitled first section. */
  title?: string;
  items: NavigationItem[];
}

export interface NavigationProps {
  /** Workspace switcher at the top. `logo` is any ~28px element. */
  organization: { name: string; logo?: ReactNode; onClick?: () => void };
  sections: NavigationSection[];
  /** id of the current item. */
  activeId?: string;
  onSelect?: (id: string) => void;
  /** Handles the layout button at the top right. */
  onCollapse?: () => void;
  /** Accessible name of that button. Default "Collapse sidebar". */
  collapseLabel?: string;
  /** Icons only, 72px wide. The top shows the logo, which turns into the expand button on hover. */
  collapsed?: boolean;
  onExpand?: () => void;
  className?: string;
  "aria-label"?: string;
}

/** The 238px app sidebar. */
export function Navigation({
  organization, sections, activeId, onSelect, onCollapse, collapseLabel = "Collapse sidebar", collapsed = false, onExpand, className, "aria-label": ariaLabel = "Main",
}: NavigationProps) {
  return (
    <nav className={cx("axo-nav", collapsed && "is-collapsed", className)} aria-label={ariaLabel}>
      {collapsed ? (
        <div className="axo-nav__head">
          {/* Logo at rest; on hover or focus it becomes the expand button. */}
          <button type="button" className="axo-nav__expand" onClick={onExpand} aria-label="Expand sidebar" title="Expand sidebar">
            <span className="axo-nav__expand-logo">{organization.logo}</span>
            <Icon name="layout-right" className="axo-nav__expand-icon" />
          </button>
        </div>
      ) : (
      <div className="axo-nav__head">
        <button type="button" className="axo-nav__org" onClick={organization.onClick}>
          <span className="axo-nav__org-id">
            {organization.logo}
            <span className="axo-nav__org-name">{organization.name}</span>
          </span>
          <Icon name="chevron-bottom" size={16} />
        </button>
        <button type="button" className="axo-nav__collapse" onClick={onCollapse} aria-label={collapseLabel} title={collapseLabel}>
          <Icon name="layout-right" />
        </button>
      </div>
      )}
      <div className="axo-nav__body">
        {sections.map((section, i) => (
          <div className="axo-nav__section" key={section.title ?? i}>
            {section.title && <p className="axo-nav__section-title">{section.title}</p>}
            <ul className="axo-nav__items">
              {section.items.map((item) => (
                <li key={item.id}>
                  <NavItem
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    dropdown={item.dropdown}
                    active={item.id === activeId}
                    onClick={onSelect ? () => onSelect(item.id) : undefined}
                    title={collapsed ? item.label : undefined}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
