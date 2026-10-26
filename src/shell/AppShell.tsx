import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar, Icon, Navigation, ScrollThumb, type NavigationSection } from "../components";
import paidhrLogo from "../assets/images/paidhr-logo.png";
import profilePhoto from "../assets/images/profile.jpg";
import { CURRENT_USER_ID, personById } from "../data/directory";
import { useMediaQuery } from "../shared/useMediaQuery";
import "./AppShell.css";

export const NAV_SECTIONS: NavigationSection[] = [
  { items: [{ id: "overview", icon: "home", label: "Overview" }] },
  {
    title: "Access",
    items: [
      { id: "requests", icon: "inbox", label: "Requests", href: "#/requests" },
      { id: "access", icon: "key", label: "Access" },
      { id: "reviews", icon: "clipboard", label: "Reviews" },
    ],
  },
  {
    title: "Governance",
    items: [
      { id: "applications", icon: "browser", label: "Applications" },
      { id: "entitlements", icon: "badge-verified", label: "Entitlements" },
      { id: "policies", icon: "law", label: "Policies" },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: "people", icon: "people", label: "People" },
      { id: "integrations", icon: "fork", label: "Integrations" },
      { id: "audit", icon: "map", label: "Audit" },
      { id: "settings", icon: "settings", label: "Settings" },
    ],
  },
];

interface AppShellProps {
  /** id of the current sidebar item. */
  active: string;
  /** Left side of the 72px top bar, usually a search field. */
  topBar?: ReactNode;
  children: ReactNode;
}

/** Sidebar, 72px top bar with help and notifications, and the page content. Only the content scrolls. */
const COLLAPSED_KEY = "axo-nav-collapsed";

export function AppShell({ active, topBar, children }: AppShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  // Remembered per browser, so the sidebar stays as you left it between pages.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  function setNavCollapsed(value: boolean) {
    setCollapsed(value);
    try {
      localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
    } catch {
      /* storage unavailable: it just won't be remembered */
    }
  }
  const me = personById(CURRENT_USER_ID);

  // Up to 1000px wide there's no room for the sidebar: a toggle in the top bar opens it
  // as a drawer over the page instead (always full width, never collapsed).
  const narrow = useMediaQuery("(max-width: 1000px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navWrapRef = useRef<HTMLDivElement>(null);
  const drawer = narrow && drawerOpen;
  function closeDrawer(refocus = true) {
    setDrawerOpen(false);
    if (refocus) toggleRef.current?.focus();
  }
  useEffect(() => {
    if (!narrow) setDrawerOpen(false);
  }, [narrow]);
  useEffect(() => {
    if (!drawer) return;
    navWrapRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="shell-app">
      <div
        ref={navWrapRef}
        id="app-nav"
        className={drawer ? "shell-app__nav-wrap is-open" : "shell-app__nav-wrap"}
        // Choosing a page closes the drawer.
        onClick={(e) => drawer && (e.target as Element).closest(".axo-nav-item") && closeDrawer(false)}
      >
      <Navigation
        className="shell-app__nav"
        organization={{
          name: "PaidHR",
          // The company image: the round check mark at the left of the PaidHR wordmark, as cropped in Figma.
          logo: (
            <span className="shell-app__org-logo">
              <img src={paidhrLogo} alt="" />
            </span>
          ),
        }}
        sections={NAV_SECTIONS}
        activeId={active}
        collapsed={!narrow && collapsed}
        onCollapse={narrow ? () => closeDrawer() : () => setNavCollapsed(true)}
        collapseLabel={narrow ? "Close navigation" : undefined}
        onExpand={() => setNavCollapsed(false)}
      />
      </div>
      {drawer && <div className="shell-app__scrim" aria-hidden="true" onClick={() => closeDrawer()} />}
      <div className="shell-app__main">
        <header className="shell-app__top">
          <div className="shell-app__top-left">
            {narrow && (
              <button
                ref={toggleRef}
                type="button"
                className="shell-app__icon-btn shell-app__nav-toggle"
                aria-label="Open navigation"
                aria-expanded={drawerOpen}
                aria-controls="app-nav"
                onClick={() => setDrawerOpen(true)}
              >
                <Icon name="layout-right" size={20} />
              </button>
            )}
            {topBar}
          </div>
          {/* Help and notifications have no screens in the designs yet. */}
          <div className="shell-app__top-right">
            <button type="button" className="shell-app__icon-btn" aria-label="Help">
              <Icon name="help" size={24} />
            </button>
            <button type="button" className="shell-app__icon-btn" aria-label="Notifications">
              <Icon name="bell" size={24} />
            </button>
            {/* Profile: no menu designed yet. */}
            <button type="button" className="shell-app__profile" aria-label={`Profile: ${me.name}`}>
              <Avatar size={30} type="image" src={profilePhoto} name={me.name} alt="" className="shell-app__profile-photo" />
            </button>
          </div>
        </header>
        {/* The only scrolling region: sidebar and top bar stay put. */}
        <div className="shell-app__content-wrap">
          <div className="shell-app__content" ref={contentRef}>{children}</div>
          <ScrollThumb targetRef={contentRef} />
        </div>
      </div>
    </div>
  );
}
