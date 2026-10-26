import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import "./Stepper.css";

export interface StepperStep {
  id: string;
  label: string;
  /** Sub-steps, shown under the current step only. */
  substeps?: Array<{ id: string; label: string }>;
}

export type StepStatus = "done" | "current" | "pending";

export interface StepperProps {
  steps: StepperStep[];
  /** id of the current step. */
  current: string;
  /** id of the current sub-step within it. */
  currentSubstep?: string;
  /**
   * Status of a step, or of a sub-step when `substepId` is given. Defaults to
   * position: before the current one is done, after it is pending.
   */
  statusOf?: (stepId: string, substepId?: string) => StepStatus;
  /** Whether a step (or sub-step) can be jumped to. Defaults to finished steps only. */
  canNavigate?: (stepId: string, substepId?: string) => boolean;
  /** Called when a navigable step or sub-step is clicked. */
  onStepClick?: (stepId: string, substepId?: string) => void;
  /**
   * "vertical" (default): every step with its name, sub-steps under the current one.
   * "compact": for narrow screens, a row of step icons where only the current step shows
   * its name, with the current step's sub-steps underneath.
   */
  layout?: "vertical" | "compact";
  className?: string;
}

const ICON: Record<StepStatus, "check-circle" | "contrast" | "loader"> = {
  done: "check-circle",
  current: "contrast",
  pending: "loader",
};

/** Vertical progress for multi-step forms: done, current (with its sub-steps) and upcoming steps. */
export function Stepper({ steps, current, currentSubstep, statusOf, canNavigate, onStepClick, layout = "vertical", className }: StepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === current);

  const stepStatus = (i: number): StepStatus =>
    statusOf ? statusOf(steps[i].id) : i < currentIndex ? "done" : i === currentIndex ? "current" : "pending";

  const subStatus = (stepId: string, subs: NonNullable<StepperStep["substeps"]>, j: number): StepStatus => {
    if (statusOf) return statusOf(stepId, subs[j].id);
    const at = Math.max(0, subs.findIndex((s) => s.id === currentSubstep));
    return j < at ? "done" : j === at ? "current" : "pending";
  };

  const subsBlock = (step: StepperStep) => {
    const subs = step.substeps ?? [];
    if (subs.length === 0) return null;
    return (
      <div className="axo-stepper__subs">
        <span className="axo-stepper__bar" aria-hidden="true">
          {subs.map((s, j) => (
            <span key={s.id} className={cx("axo-stepper__seg", subStatus(step.id, subs, j) !== "pending" && "is-filled")} />
          ))}
        </span>
        <ol className="axo-stepper__sublist">
          {subs.map((s, j) => {
            const here = s.id === currentSubstep;
            const navigable =
              !!onStepClick && !here && (canNavigate ? canNavigate(step.id, s.id) : subStatus(step.id, subs, j) === "done");
            return (
              <li key={s.id} className={cx("axo-stepper__sub", here && "is-current")} aria-current={here ? "step" : undefined}>
                {navigable ? (
                  <button type="button" onClick={() => onStepClick!(step.id, s.id)}>{s.label}</button>
                ) : (
                  s.label
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  };

  // A step's own row navigates unless you're already on its first screen.
  const headNavigable = (step: StepperStep, i: number) => {
    const isCurrent = step.id === current;
    const onFirstScreen = isCurrent && (!step.substeps?.length || step.substeps[0].id === currentSubstep);
    return !!onStepClick && !onFirstScreen && (canNavigate ? canNavigate(step.id) : stepStatus(i) === "done");
  };

  if (layout === "compact") {
    // Steps in a row; names of the other steps stay available to screen readers and as tooltips.
    return (
      <nav className={cx("axo-stepper", "axo-stepper--compact", className)} aria-label="Progress">
        <ol className="axo-stepper__list">
          {steps.map((step, i) => {
            const status = stepStatus(i);
            const isCurrent = step.id === current;
            const head = (
              <>
                <Icon name={ICON[status]} size={20} className={`axo-stepper__icon is-${status}`} />
                <span className={isCurrent ? undefined : "axo-visually-hidden"}>{step.label}</span>
              </>
            );
            return (
              <li
                key={step.id}
                className={cx("axo-stepper__step", `is-${status}`, isCurrent && "is-here")}
                aria-current={isCurrent ? "step" : undefined}
                title={isCurrent ? undefined : step.label}
              >
                {headNavigable(step, i) ? (
                  <button type="button" className="axo-stepper__head" onClick={() => onStepClick!(step.id)}>{head}</button>
                ) : (
                  <div className="axo-stepper__head">{head}</div>
                )}
              </li>
            );
          })}
        </ol>
        {currentIndex >= 0 && subsBlock(steps[currentIndex])}
      </nav>
    );
  }

  return (
    <nav className={cx("axo-stepper", className)} aria-label="Progress">
      <ol className="axo-stepper__list">
        {steps.map((step, i) => {
          const status = stepStatus(i);
          const isCurrent = step.id === current;
          const head = (
            <>
              <Icon name={ICON[status]} size={20} className={`axo-stepper__icon is-${status}`} />
              <span>{step.label}</span>
            </>
          );
          return (
            <li
              key={step.id}
              className={cx("axo-stepper__step", `is-${status}`, isCurrent && "is-here")}
              aria-current={isCurrent ? "step" : undefined}
            >
              {headNavigable(step, i) ? (
                <button type="button" className="axo-stepper__head" onClick={() => onStepClick!(step.id)}>{head}</button>
              ) : (
                <div className="axo-stepper__head">{head}</div>
              )}
              {isCurrent && subsBlock(step)}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
