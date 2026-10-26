import type { StepperStep } from "../../components";
import { CURRENT_USER_ID, currentAccess } from "../../data/directory";
import type { NewRequest } from "../../data/RequestsContext";

export interface RequestDraft {
  beneficiaryMode: "self" | "other" | null;
  /** Picked person when beneficiaryMode is "other". */
  beneficiaryId: string | null;
  applicationId: string | null;
  additionalAccess: boolean;
  accessLevelId: string | null;
  reason: string;
  startMode: "immediately" | "date" | null;
  startDate: string;
  endMode: "none" | "date" | null;
  endDate: string;
}

export const initialDraft: RequestDraft = {
  beneficiaryMode: null,
  beneficiaryId: null,
  applicationId: null,
  additionalAccess: false,
  accessLevelId: null,
  reason: "",
  startMode: null,
  startDate: "",
  endMode: null,
  endDate: "",
};

export type ScreenId = "beneficiary" | "application" | "access-level" | "business-reason" | "access-duration" | "review";

/** Screens in order, each placed in the stepper under a step and sub-step. */
export const SCREENS: Array<{ id: ScreenId; step: string }> = [
  { id: "beneficiary", step: "initiate" },
  { id: "application", step: "initiate" },
  { id: "access-level", step: "access" },
  { id: "business-reason", step: "details" },
  { id: "access-duration", step: "details" },
  { id: "review", step: "review" },
];

export const STEPS: StepperStep[] = [
  { id: "initiate", label: "Initiate request", substeps: [{ id: "beneficiary", label: "Beneficiary" }, { id: "application", label: "Application" }] },
  { id: "access", label: "Access needed", substeps: [{ id: "access-level", label: "Select access level" }] },
  // Figma labels this sub-step both "Access duration" and "Access period"; the screen heading says duration.
  { id: "details", label: "Request details", substeps: [{ id: "business-reason", label: "Business reason" }, { id: "access-duration", label: "Access duration" }] },
  { id: "review", label: "Review", substeps: [{ id: "review", label: "Review details" }] },
];

export function beneficiaryIdOf(draft: RequestDraft): string | null {
  if (draft.beneficiaryMode === "self") return CURRENT_USER_ID;
  if (draft.beneficiaryMode === "other") return draft.beneficiaryId;
  return null;
}

export function currentAccessOf(draft: RequestDraft) {
  const who = beneficiaryIdOf(draft);
  return who && draft.applicationId ? currentAccess[`${who}:${draft.applicationId}`] ?? null : null;
}

/** Whether the screen's Continue button is enabled. */
export function canContinue(screen: ScreenId, d: RequestDraft): boolean {
  switch (screen) {
    case "beneficiary":
      return d.beneficiaryMode === "self" || (d.beneficiaryMode === "other" && d.beneficiaryId != null);
    case "application":
      return d.applicationId != null;
    case "access-level":
      // With no current access there's nothing to add to, so the level list is simply open.
      return d.accessLevelId != null && (d.additionalAccess || currentAccessOf(d) == null);
    case "business-reason":
      return d.reason.trim().length > 0;
    case "access-duration":
      return (
        (d.startMode === "immediately" || (d.startMode === "date" && d.startDate !== "")) &&
        (d.endMode === "none" || (d.endMode === "date" && d.endDate !== ""))
      );
    case "review":
      return true;
  }
}

/** The finished request, in the shape the requests store takes. */
export function toNewRequest(d: RequestDraft): NewRequest {
  return {
    beneficiaryId: beneficiaryIdOf(d)!,
    applicationId: d.applicationId!,
    currentLevelId: currentAccessOf(d)?.levelId ?? null,
    requestedLevelId: d.accessLevelId!,
    reason: d.reason.trim(),
    start: d.startMode === "immediately" ? "immediately" : d.startDate,
    end: d.endMode === "none" ? "none" : d.endDate,
  };
}
