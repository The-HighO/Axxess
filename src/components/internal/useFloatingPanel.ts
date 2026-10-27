import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { scrollParent } from "./ScrollThumb";

interface FloatingPanelOptions {
  /** Placed and laid out while true (keep it true through a fade-out, see usePresence). */
  open: boolean;
  /** The panel is fading out: it stays where it is, and the page holds still until it's gone. */
  leaving?: boolean;
  /** The field the panel opens under. */
  anchorRef: RefObject<HTMLElement>;
  /** Everything that counts as "inside" (field + panel). A press outside it calls `onDismiss`. */
  rootRef: RefObject<HTMLElement>;
  onDismiss: () => void;
  /** Elements that may scroll while the panel is open (a list, a wheel). Nothing else will. */
  scrollAreas: () => Array<HTMLElement | null>;
  /** Fixed height of the panel around its flexible part, in px (search row, borders, footer). */
  chrome: number;
  /** Height the flexible part should get if the page can make room for it. */
  comfortable: number;
  /** Tallest the flexible part may grow. */
  maxFlex: number;
  minFlex?: number;
  /** Space kept between the panel and the bottom of the screen. */
  screenMargin?: number;
  /** Gap between the field and the panel. */
  gap?: number;
}

/**
 * Shared behaviour for panels that drop down from a field (Combobox, DateInput):
 *
 * - The panel floats above the page (position: fixed), lined up under the field, so it
 *   never changes the page's height.
 * - It ends `screenMargin` above the bottom edge. If the field sits too low, its scroll
 *   container is scrolled up first (and padded at the end while open, if too short),
 *   but never so far that the field slides under a fade or pinned title at the top of it.
 * - If there still isn't room below for even `minFlex`, it opens above the field instead.
 * - While open, only `scrollAreas` scroll; the page behind stays still and scroll
 *   doesn't chain from the panel to the page.
 * - A press outside `rootRef` dismisses it.
 * - Closing mirrors opening: the panel fades out where it is (`leaving`; the page holds still
 *   underneath it), then if the page glided up to make room it glides back to where it was.
 *   Padding added at the end is only removed once the page is back within its natural
 *   height, so nothing snaps.
 *
 * Returns the panel's position and the height its flexible part may take.
 */
export function useFloatingPanel({
  open, leaving = false, anchorRef, rootRef, onDismiss, scrollAreas, chrome, comfortable, maxFlex, minFlex = 80, screenMargin = 24, gap = 4,
}: FloatingPanelOptions) {
  // Room the page made for the panel, so closing can undo it gently.
  const madeRoom = useRef<{ scroller: HTMLElement; startTop: number; extra: number; restorePadding: string | null } | null>(null);
  // Finishes an unfinished glide back right away (e.g. the panel reopens before it's done).
  const settleRef = useRef<(() => void) | null>(null);
  const leavingRef = useRef(leaving);
  leavingRef.current = leaving;
  const [place, setPlace] = useState({ top: 0, left: 0, width: 0, flexMax: maxFlex, above: false });
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const areasRef = useRef(scrollAreas);
  areasRef.current = scrollAreas;

  useLayoutEffect(() => {
    if (!open) return;
    settleRef.current?.();
    const anchorRect = () => anchorRef.current?.getBoundingClientRect();
    const room = (rect: DOMRect) => window.innerHeight - rect.bottom - gap - screenMargin - chrome;

    const scroller = scrollParent(anchorRef.current);
    let restorePadding: string | null = null;
    // Where the page is gliding to make room, while it's on its way (see below).
    let target: number | null = null;
    const first = anchorRect();
    // Don't scroll the field (label included) up under a soft fade at the top of the scroll area
    // (`data-scroll-fade="28"` on the scroller) or a pinned title inside it (`data-scroll-cover="28"`).
    const cover = scroller?.querySelector<HTMLElement>("[data-scroll-cover]");
    const scrollerTop = scroller?.getBoundingClientRect().top ?? 0;
    const ceiling = cover
      ? cover.getBoundingClientRect().bottom + (Number(cover.dataset.scrollCover) || 0) + 8
      : scrollerTop + (Number(scroller?.dataset.scrollFade) || 0) + 8;
    const fieldTop = rootRef.current?.getBoundingClientRect().top ?? first?.top ?? 0;
    const short = first ? Math.min(comfortable - room(first), Math.max(0, fieldTop - ceiling)) : 0;
    let extraPadding = 0;
    const startTop = scroller?.scrollTop ?? 0;
    if (short > 0 && scroller) {
      target = scroller.scrollTop + short;
      const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;
      if (target > maxScroll()) {
        // Pad the end so it can scroll that far. Content shorter than the scroll area makes the
        // first estimate fall short, so measure again and top it up.
        restorePadding = scroller.style.paddingBottom;
        const base = parseFloat(getComputedStyle(scroller).paddingBottom) || 0;
        let extra = target - maxScroll();
        scroller.style.paddingBottom = `${base + extra}px`;
        if (target > maxScroll()) {
          extra += target - maxScroll();
          scroller.style.paddingBottom = `${base + extra}px`;
        }
        extraPadding = extra;
      }
      madeRoom.current = { scroller, startTop, extra: extraPadding, restorePadding };
      // Glide the page up rather than jumping, so it moves with the panel's own soft open.
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (smooth) scroller.scrollTo({ top: target, behavior: "smooth" });
      else scroller.scrollTop = target;
    }

    const fit = () => {
      const rect = anchorRect();
      if (!rect) return;
      // Closing: keep the side it opened on and just ride along with the field as the page glides back.
      if (leavingRef.current) {
        setPlace((p) => ({ ...p, top: p.above ? rect.top - gap - chrome - p.flexMax : rect.bottom + gap, left: rect.left }));
        return;
      }
      // While the page is still gliding, decide where the panel goes from where the field will
      // end up, so it doesn't open above and then flip below; its position follows the field.
      const pending = target != null && scroller ? target - scroller.scrollTop : 0;
      if (Math.abs(pending) < 1) target = null;
      const settled = new DOMRect(rect.x, rect.y - pending, rect.width, rect.height);
      const below = room(settled);
      const aboveRoom = settled.top - gap - screenMargin - chrome;
      // (1px of slack: after scrolling to fit exactly, sub-pixel rounding can leave `below` a hair short)
      if (below >= minFlex - 1) {
        setPlace({ top: rect.bottom + gap, left: rect.left, width: rect.width, flexMax: Math.min(maxFlex, below), above: false });
      } else if (aboveRoom >= minFlex) {
        const flexMax = Math.min(maxFlex, aboveRoom);
        setPlace({ top: rect.top - gap - chrome - flexMax, left: rect.left, width: rect.width, flexMax, above: true });
      } else {
        // Too short a screen either way: keep the whole panel on screen, `screenMargin` from the bottom.
        const flexMax = minFlex;
        const height = chrome + flexMax;
        setPlace({ top: Math.max(8, window.innerHeight - screenMargin - height), left: rect.left, width: rect.width, flexMax, above: false });
      }
    };
    fit();
    window.addEventListener("resize", fit);
    scroller?.addEventListener("scroll", fit);
    return () => {
      window.removeEventListener("resize", fit);
      scroller?.removeEventListener("scroll", fit);
      const room = madeRoom.current;
      madeRoom.current = null;
      if (!room) return;
      // The panel has finished fading in place: now glide the page back, and drop the padding
      // once the page no longer needs it to stay where it is.
      glideBack(room);
      if (room.restorePadding === null) return;
      const naturalMax = () => room.scroller.scrollHeight - room.extra - room.scroller.clientHeight;
      let done = false;
      const settle = () => {
        if (done) return;
        done = true;
        room.scroller.removeEventListener("scrollend", whenBack);
        window.clearTimeout(timer);
        settleRef.current = null;
        room.scroller.style.paddingBottom = room.restorePadding!;
      };
      const whenBack = () => {
        if (room.scroller.scrollTop <= naturalMax() + 1) settle();
      };
      room.scroller.addEventListener("scrollend", whenBack);
      const timer = window.setTimeout(settle, 900);
      settleRef.current = settle;
      whenBack();
    };
  }, [open, anchorRef, chrome, comfortable, maxFlex, minFlex, screenMargin, gap]);


  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) dismissRef.current();
    };
    // Only the panel's own scroll areas move; at their ends the scroll stops there.
    const block = (e: Event) => {
      const target = e.target as Node;
      const area = areasRef.current().find((el) => el?.contains(target));
      if (!area) {
        e.preventDefault();
        return;
      }
      if (e instanceof WheelEvent) {
        const atTop = area.scrollTop <= 0;
        const atBottom = area.scrollTop + area.clientHeight >= area.scrollHeight - 1;
        if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) e.preventDefault();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("wheel", block, { passive: false });
    document.addEventListener("touchmove", block, { passive: false });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("wheel", block);
      document.removeEventListener("touchmove", block);
    };
  }, [open, rootRef]);

  return place;
}

/** Scrolls back to where the page was before it made room for a panel (or as near as it can get). */
function glideBack(room: { scroller: HTMLElement; startTop: number; extra: number }) {
  const { scroller } = room;
  const naturalMax = scroller.scrollHeight - room.extra - scroller.clientHeight;
  const dest = Math.max(0, Math.min(room.startTop, naturalMax));
  if (Math.abs(scroller.scrollTop - dest) < 1) return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (smooth) scroller.scrollTo({ top: dest, behavior: "smooth" });
  else scroller.scrollTop = dest;
}
