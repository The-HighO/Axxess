import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import { Button, PageHeader, ScrollThumb, Stepper } from "../../components";
import { cx } from "../../components/internal/cx";
import type { NewRequest } from "../../data/RequestsContext";
import { useMediaQuery } from "../../shared/useMediaQuery";
import { SCREENS, STEPS, canContinue, initialDraft, toNewRequest, type RequestDraft, type ScreenId } from "./state";
import {
  AccessDurationStep, AccessLevelStep, ApplicationStep, BeneficiaryStep, BusinessReasonStep, ReviewStep,
  type StepProps,
} from "./steps";
import "./RequestAccess.css";

const SCREEN_VIEW: Record<ScreenId, { heading: string; Body: (p: StepProps) => ReactElement }> = {
  beneficiary: { heading: "Beneficiary", Body: BeneficiaryStep },
  application: { heading: "Application", Body: ApplicationStep },
  "access-level": { heading: "Select access level", Body: AccessLevelStep },
  "business-reason": { heading: "Business reason", Body: BusinessReasonStep },
  "access-duration": { heading: "Access duration", Body: AccessDurationStep },
  review: { heading: "Review details", Body: ReviewStep },
};

export interface RequestAccessFlowProps {
  /** Called by the header's close button. */
  onClose: () => void;
  /** Receives the finished request; the host confirms it (a success toast) and leaves the flow. */
  onSubmit?: (request: NewRequest) => void;
}

/** How long the outgoing screen takes to leave (matches .ra__stage.is-leaving). */
const STAGE_LEAVE_MS = 140;
const STAGE_ENTER_MS = 360;

/** The Request Access flow from the Figma file: six screens under a four-step stepper. */
export function RequestAccessFlow({ onClose, onSubmit }: RequestAccessFlowProps) {
  const [draft, setDraft] = useState<RequestDraft>(initialDraft);
  const [index, setIndex] = useState(0);
  // Furthest screen reached with Continue; later screens up to it can be revisited.
  const [furthest, setFurthest] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const screen = SCREENS[index];
  const isReview = screen.id === "review";
  // The screen on stage. It trails `index` through the stage transition: the old screen leaves,
  // then the new one enters. The stepper follows `index` straight away.
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const [direction, setDirection] = useState<1 | -1>(1);
  const stage = SCREENS[shown];
  const view = SCREEN_VIEW[stage.id];

  useEffect(() => {
    if (index === shown) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(index);
      setPhase("idle");
      return;
    }
    setDirection(index > shown ? 1 : -1);
    setPhase("leaving");
    const timer = window.setTimeout(() => {
      setShown(index);
      setPhase("entering");
    }, STAGE_LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [index, shown]);

  useEffect(() => {
    if (phase !== "entering") return;
    const timer = window.setTimeout(() => setPhase("idle"), STAGE_ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Title and form move together; --stage-dir sets which way (1 forward, -1 back).
  const stageClass = cx("ra__stage", phase === "leaving" && "is-leaving", phase === "entering" && "is-entering");
  const stageStyle = { "--stage-dir": direction } as CSSProperties;
  // Phones: a compact stepper, and the title scrolls with the content so the screen goes to the form.
  // Only the page header and stepper stay fixed.
  const phone = useMediaQuery("(max-width: 600px)");
  const heading = (
    <h2 key={`heading-${shown}`} className={cx("ra__heading", stageClass)} style={stageStyle} ref={headingRef} tabIndex={-1}>{view.heading}</h2>
  );

  // Move focus to the new heading so screen readers announce each screen.
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [shown]);

  const update = (patch: Partial<RequestDraft>) => setDraft((d) => ({ ...d, ...patch }));

  function next() {
    if (!canContinue(screen.id, draft)) return;
    if (isReview) {
      onSubmit?.(toNewRequest(draft));
    } else {
      setIndex(index + 1);
      setFurthest((f) => Math.max(f, index + 1));
    }
  }

  /* Stepper navigation. Going back always works. Going forward works only to
     screens you reached before, and only while every screen before the target
     is still filled in: changing an earlier answer that clears a later one
     (say, a new application clears the access level) closes the way forward. */
  const validUpTo = (j: number) => SCREENS.slice(0, j).every((s) => canContinue(s.id, draft));
  const reachable = (j: number) => j < index || (j <= furthest && validUpTo(j));
  const screenDone = (j: number) => j < furthest && validUpTo(j + 1);
  const targetOf = (stepId: string, substepId?: string) =>
    SCREENS.findIndex((s) => (substepId ? s.id === substepId : s.step === stepId));

  function statusOf(stepId: string, substepId?: string) {
    const screens = SCREENS.map((s, j) => ({ ...s, j })).filter((s) => (substepId ? s.id === substepId : s.step === stepId));
    // A filled step keeps its check even when you go back to it; only a step still being filled shows as current.
    if (screens.every((s) => screenDone(s.j))) return "done" as const;
    return screens.some((s) => s.j === index) ? ("current" as const) : ("pending" as const);
  }

  function canNavigate(stepId: string, substepId?: string) {
    const target = targetOf(stepId, substepId);
    return target >= 0 && target !== index && reachable(target);
  }

  function goTo(stepId: string, substepId?: string) {
    const target = targetOf(stepId, substepId);
    if (target >= 0 && target !== index && reachable(target)) setIndex(target);
  }

  return (
    <div className="ra">
      <PageHeader title="Request access" onClose={onClose} closeLabel="Close request" />
      <div className="ra__body">
        <Stepper
          className="ra__stepper"
          steps={STEPS}
          current={screen.step}
          currentSubstep={screen.id}
          layout={phone ? "compact" : "vertical"}
          statusOf={statusOf}
          canNavigate={canNavigate}
          onStepClick={goTo}
        />
        {/* Wider screens: the title sits outside the scroll area, so scrolling (and overscroll) can never move it. */}
        {!phone && <div className="ra__titlebar">{heading}</div>}
        {/* The only scrolling region, with the dropdowns' custom scrollbar. Content slips under a soft fade at its top. */}
        <div className="ra__scroll-wrap">
          <div className="ra__scroll" ref={scrollRef} data-scroll-fade="28">
            <main className="ra__main">
              {phone && heading}
              <form
                // Distinct from the heading's key: on phones they're siblings in <main>
                key={`form-${shown}`}
                className={cx("ra__form", stageClass)}
                style={stageStyle}
                onSubmit={(e) => {
                  e.preventDefault();
                  next();
                }}
              >
                <view.Body draft={draft} update={update} />
                <Button type="submit" className="ra__continue" disabled={!canContinue(stage.id, draft)}>
                  {isReview ? "Request access" : "Continue"}
                </Button>
              </form>
            </main>
          </div>
          <span className="ra__fade" aria-hidden="true" />
          <ScrollThumb targetRef={scrollRef} />
        </div>
      </div>
    </div>
  );
}

