import { useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { cx } from "../internal/cx";
import "./Tab.css";

export interface TabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The selected tab: dark label and underline. */
  active?: boolean;
}

/** One tab. Place tabs in a TabList (or any element with role="tablist"). */
export function Tab({ active = false, className, children, ...rest }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cx("axo-tab", active && "is-active", className)}
      {...rest}
    >
      <span className="axo-tab__label">{children}</span>
      <span className="axo-tab__bar" aria-hidden="true" />
    </button>
  );
}

/**
 * A row of Tabs with one underline that glides to the selected tab, stretching or shrinking
 * to its width, with the system's soft landing. It appears in place on first render and
 * follows the tab if the row reflows (fonts loading, resizing).
 */
export function TabList({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number; ready: boolean } | null>(null);

  // Set up once: measure now, then again only when a tab is selected (its class changes) or
  // the row or a tab changes size. Re-measuring on every render could feed back on itself.
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const place = () => {
      const tab = list.querySelector<HTMLElement>(".axo-tab.is-active");
      if (!tab) {
        setBar(null);
        return;
      }
      const left = tab.offsetLeft;
      const width = tab.offsetWidth;
      setBar((prev) => (prev && prev.left === left && prev.width === width ? prev : { left, width, ready: prev !== null }));
    };
    place();
    const resize = new ResizeObserver(place);
    const watchTabs = () => {
      resize.disconnect();
      resize.observe(list);
      list.querySelectorAll(".axo-tab").forEach((t) => resize.observe(t));
    };
    watchTabs();
    const changes = new MutationObserver((records) => {
      if (records.some((r) => r.type === "childList")) watchTabs();
      place();
    });
    changes.observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      resize.disconnect();
      changes.disconnect();
    };
  }, []);

  return (
    <div ref={ref} role="tablist" className={cx("axo-tablist", className)} {...rest}>
      {children}
      {bar && (
        <span
          className={cx("axo-tablist__bar", bar.ready && "is-ready")}
          style={{ transform: `translateX(${bar.left}px)`, width: bar.width }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
