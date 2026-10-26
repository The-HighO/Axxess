/* Access requests and their approvals. The seed rows are the ones on the
   Figma Requests screen, plus two finished ones (sample) for the other tabs. */
import { CURRENT_USER_ID, applicationById, currentAccess } from "./directory";

export type ApprovalRole = "Application Owner" | "Access Administrator";
export type ApprovalStatus = "approved" | "pending" | "rejected";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface Approval {
  role: ApprovalRole;
  personId: string;
  status: ApprovalStatus;
  /** ISO time the decision was made. */
  decidedAt?: string;
  /** Set when the requester is the approver, so the step was satisfied on submission. */
  auto?: boolean;
}

export interface AccessRequest {
  id: string;
  requesterId: string;
  beneficiaryId: string;
  applicationId: string;
  currentLevelId: string | null;
  requestedLevelId: string;
  reason: string;
  /** ISO time the request was submitted. */
  requestedAt: string;
  /** "immediately" or an ISO date. */
  start: string;
  /** "none" or an ISO date. */
  end: string;
  approvals: Approval[];
}

export function statusOf(r: AccessRequest): RequestStatus {
  if (r.approvals.some((a) => a.status === "rejected")) return "rejected";
  if (r.approvals.every((a) => a.status === "approved")) return "approved";
  return "pending";
}

export const approvedCount = (r: AccessRequest) => r.approvals.filter((a) => a.status === "approved").length;

/** The approval waiting on someone now (approvals run in order). */
export const pendingApproval = (r: AccessRequest) =>
  statusOf(r) === "pending" ? r.approvals.find((a) => a.status === "pending") ?? null : null;

/** Builds the approval chain for a new request: the app owner, then the access administrator. */
export function approvalsFor(applicationId: string, requesterId: string, at: string): Approval[] {
  const app = applicationById(applicationId);
  const chain: Approval[] = [
    { role: "Application Owner", personId: app.ownerId, status: "pending" },
    { role: "Access Administrator", personId: app.administratorId, status: "pending" },
  ];
  return chain.map((a) => (a.personId === requesterId ? { ...a, status: "approved", decidedAt: at, auto: true } : a));
}

function seed(
  id: string, requesterId: string, beneficiaryId: string, applicationId: string, requestedLevelId: string,
  requestedAt: string, reason: string, end: string, decisions: Array<Partial<Approval>> = [],
): AccessRequest {
  const approvals = approvalsFor(applicationId, requesterId, requestedAt).map((a, i) => ({ ...a, ...decisions[i] }));
  return {
    id, requesterId, beneficiaryId, applicationId, requestedLevelId, requestedAt, reason, start: "immediately", end, approvals,
    currentLevelId: currentAccess[`${beneficiaryId}:${applicationId}`]?.levelId ?? null,
  };
}

export const seedRequests: AccessRequest[] = [
  seed("REQ-0842", CURRENT_USER_ID, "amara", "salesforce", "editor", "2026-09-24T10:19:00",
    "I’m supporting the customer lifecycle redesign and need to update Salesforce records while validating the new workflow with the Customer Success team.",
    "2026-12-30"),
  // The rest are sample rows matching the Figma table.
  seed("REQ-0848", "bola", "bola", "figma", "editor", "2026-09-20T14:02:00",
    "I’m taking over the help centre illustrations and need to edit the support design files.", "none"),
  seed("REQ-0821", "aisha", "aisha", "aws", "read-only", "2026-09-20T09:45:00",
    "I need to check billing for the enterprise pilot before the renewal call.", "2026-10-31"),
  seed("REQ-0829", "brandon", "brandon", "jira", "member", "2026-09-19T16:30:00",
    "The sales team is moving deal handoffs into Jira and I need to create tickets.", "none",
    [{ status: "approved", decidedAt: "2026-09-20T11:12:00" }]),
  seed("REQ-0817", CURRENT_USER_ID, "bisi", "figma", "editor", "2026-09-16T08:55:00",
    "Bisi is building the finance dashboard mockups with the design team this quarter.", "2026-12-31"),
  seed("REQ-0809", "aisha", "aisha", "salesforce", "viewer", "2026-09-10T13:20:00",
    "I need to see account history for my new territory.", "none",
    [{ status: "approved", decidedAt: "2026-09-10T15:01:00" }, { status: "approved", decidedAt: "2026-09-11T09:30:00" }]),
  seed("REQ-0796", "brandon", "brandon", "datadog", "editor", "2026-09-04T10:05:00",
    "I want to build a dashboard for demo environment uptime.", "none",
    [{ status: "rejected", decidedAt: "2026-09-05T09:40:00" }]),
];

/* ---------- Formatting ---------- */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
}

/** "24th September, 2026" */
export function formatLongDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

/** "September 24th, 2026, 10:19 AM" for timeline captions. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours() % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}, ${d.getFullYear()}, ${h}:${m} ${d.getHours() < 12 ? "AM" : "PM"}`;
}
