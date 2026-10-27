import { useEffect, useState } from "react";

/** How long a floating panel takes to fade out (matches Popover.css). */
export const POPOVER_LEAVE_MS = 120;

/**
 * Keeps something in the page through its exit animation. `present` stays true while
 * `leaving` plays out, then drops. `leaving` starts in the same render that closes it:
 * setting it afterwards (in an effect) leaves one frame with the thing gone before it comes
 * back to fade, which reads as a double click.
 */
export function usePresence(open: boolean, leaveMs = POPOVER_LEAVE_MS) {
  const [leaving, setLeaving] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setLeaving(!open);
  }
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(false), leaveMs);
    return () => window.clearTimeout(timer);
  }, [leaving, leaveMs]);
  return { present: open || leaving, leaving };
}
