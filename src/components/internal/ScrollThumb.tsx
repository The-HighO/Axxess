import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import "./ScrollThumb.css";

interface ScrollThumbProps {
  /** The element that scrolls. Hide its native scrollbar in CSS. */
  targetRef: RefObject<HTMLElement>;
  /** Longest the thumb may be, in px. */
  maxLength?: number;
  /** Shortest the thumb may be, in px. */
  minLength?: number;
  /** Space kept at each end of the track, in px. */
  inset?: number;
}

/**
 * A thin custom scrollbar thumb for one scrolling element, drawn in the
 * Outline - Secondary stroke. Native scrollbars can't be capped in length,
 * so this one is: never longer than `maxLength`. It can be dragged.
 * Place it in a `position: relative` wrapper around the scrolling element.
 */
export function ScrollThumb({ targetRef, maxLength = 75, minLength = 24, inset = 6 }: ScrollThumbProps) {
  const [geo, setGeo] = useState({ visible: false, top: 0, length: 0, offset: 0 });
  const drag = useRef<{ startY: number; startScroll: number } | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const measure = () => {
      const { scrollTop, scrollHeight, clientHeight, offsetTop } = el;
      const visible = scrollHeight > clientHeight + 1;
      const track = clientHeight - inset * 2;
      const length = Math.max(minLength, Math.min(maxLength, (clientHeight / scrollHeight) * track));
      const progress = scrollTop / Math.max(1, scrollHeight - clientHeight);
      setGeo({ visible, length, top: inset + progress * (track - length), offset: offsetTop });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
      mo.disconnect();
    };
  }, [targetRef, maxLength, minLength, inset]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const el = targetRef.current;
    if (!el) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startScroll: el.scrollTop };
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = targetRef.current;
    if (!el || !drag.current) return;
    const track = el.clientHeight - inset * 2 - geo.length;
    const ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, track);
    el.scrollTop = drag.current.startScroll + (e.clientY - drag.current.startY) * ratio;
  }
  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  if (!geo.visible) return null;
  return (
    <div
      className="axo-scroll-thumb"
      aria-hidden="true"
      style={{ top: geo.offset + geo.top, height: geo.length }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseDown={(e) => e.preventDefault()}
    />
  );
}

/** Nearest ancestor set up to scroll vertically (whether or not it overflows yet). */
export function scrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}
