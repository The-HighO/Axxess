import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";
import "./Reveal.css";

interface RevealProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

/** Longest each direction can take before it's treated as done anyway (no transitionend, reduced motion). */
const OPEN_FALLBACK_MS = 600;
const CLOSE_FALLBACK_MS = 400;

/**
 * Animates content open and closed: the height eases from 0 to its natural size while the
 * content fades and settles into place, then reverses on close. Content mounts when opening
 * and unmounts once closed. Height runs on `grid-template-rows` (0fr ↔ 1fr), so it works for
 * any content height without measuring.
 */
export function Reveal({ open, children, className }: RevealProps) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  // Fully open: clipping off, so focus rings and shadows inside aren't cut.
  const [settled, setSettled] = useState(open);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setSettled(false);
      const timer = window.setTimeout(() => setSettled(true), OPEN_FALLBACK_MS);
      return () => window.clearTimeout(timer);
    }
    setSettled(false);
    setShown(false);
    const timer = window.setTimeout(() => setMounted(false), CLOSE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Once it's in the page collapsed, force a layout so the browser has a start point, then
  // open it; the change to 1fr then transitions (before the first paint, so no flash).
  useLayoutEffect(() => {
    if (open && mounted && !shown && rootRef.current) {
      void rootRef.current.offsetHeight;
      setShown(true);
    }
  }, [open, mounted, shown]);

  if (!mounted) return null;
  return (
    <div
      ref={rootRef}
      className={cx("axo-reveal", shown && "is-shown", settled && "is-settled", className)}
      aria-hidden={!open || undefined}
      onTransitionEnd={(e) => {
        if (e.target !== rootRef.current || e.propertyName !== "grid-template-rows") return;
        if (shown) setSettled(true);
        else setMounted(false);
      }}
    >
      <div className="axo-reveal__inner">{children}</div>
    </div>
  );
}
