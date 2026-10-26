import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Toast, type ToastAction, type ToastProps } from "./Toast";

export interface ToastOptions extends Omit<ToastProps, "className" | "action"> {
  /** An action button. Clicking it runs `onClick` (if any) and dismisses the toast. */
  action?: { label: string; onClick?: () => void };
  /**
   * Milliseconds before it goes away by itself. Defaults to the time an average reader needs
   * for its text (see `readingTime`), or no limit when it has an action (the person dismisses
   * it). Hovering or focusing a toast pauses the countdown.
   */
  duration?: number | null;
}

interface ToastApi {
  /** Shows a toast and returns its id. */
  show: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

interface Entry extends ToastOptions { id: number; leaving: boolean }

const Ctx = createContext<ToastApi | null>(null);
const ENTER_MS = 320;
const LEAVE_MS = 240;
const MAX_VISIBLE = 3;

/** Average adult reading speed for on-screen text, in words per minute. */
const WORDS_PER_MINUTE = 200;
/** Time to notice the toast and take in its icon before reading starts. */
const NOTICE_MS = 1500;
const MIN_MS = 4000;
const MAX_MS = 15000;

/**
 * How long a toast stays up: time to notice it, plus its title and body read at 200 words a
 * minute, kept between 4 and 15 seconds. "Request sent" with a 14-word body gets 6.3s.
 */
export function readingTime(title: ReactNode, body?: ReactNode): number {
  const words = [title, body].map((t) => (typeof t === "string" ? t.trim().split(/\s+/).filter(Boolean).length : 0));
  const total = words.reduce((a, b) => a + b, 0);
  return Math.min(MAX_MS, Math.max(MIN_MS, Math.round(NOTICE_MS + (total / WORDS_PER_MINUTE) * 60_000)));
}

/** Shows toasts in a stack at the bottom centre of the screen. Wrap the app once. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, leaving: true } : e)));
    window.setTimeout(() => setEntries((list) => list.filter((e) => e.id !== id)), LEAVE_MS);
  }, []);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setEntries((list) => [...list, { ...options, id, leaving: false }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="axo-toaster" aria-live="off">
        {entries.map((e) => (
          <ToastItem key={e.id} entry={e} onDismiss={() => dismiss(e.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ entry, onDismiss }: { entry: Entry; onDismiss: () => void }) {
  const { type = "default", title, body, action, duration } = entry;
  const limit = duration === undefined ? (action ? null : readingTime(title, body)) : duration;
  const [paused, setPaused] = useState(false);
  // The countdown starts once it has finished sliding in.
  const remaining = useRef((limit ?? 0) + ENTER_MS);
  const started = useRef(Date.now());

  // Count down only while not hovered or focused; resume where it left off.
  useEffect(() => {
    if (limit == null || paused || entry.leaving) return;
    started.current = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - started.current;
    };
  }, [limit, paused, entry.leaving, onDismiss]);

  const toastAction: ToastAction | undefined = action && {
    label: action.label,
    onClick: () => {
      action.onClick?.();
      onDismiss();
    },
  };
  // Warnings and errors interrupt screen readers; the rest wait their turn.
  const urgent = type === "warning" || type === "error";
  return (
    <div
      className={entry.leaving ? "axo-toaster__item is-leaving" : "axo-toaster__item"}
      role={urgent ? "alert" : "status"}
      aria-live={urgent ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Toast type={type} title={title} body={body} action={toastAction} />
    </div>
  );
}

/** Shows toasts: `const toast = useToast(); toast.show({ type: "success", title: "Request sent" })`. */
export function useToast(): ToastApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}
