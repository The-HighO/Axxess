import { useRef, useState } from "react";
import {
  Avatar, Button, DetailList, Divider, Icon, PanelSection, SHEET_LEAVE_MS, SidePanel, Timeline,
  type TimelineItem,
} from "../../components";
import { CURRENT_USER_ID, applicationById, personById } from "../../data/directory";
import {
  formatLongDate, formatTimestamp, pendingApproval, statusOf, type AccessRequest, type Approval,
} from "../../data/requests";
import { personValue } from "../../shared/personValue";
import { ReasonQuote } from "../../shared/ReasonQuote";
import { RejectSheet } from "./RejectSheet";
import { RequestId } from "./RequestId";
import { StatusBadge } from "./StatusBadge";

interface Props {
  request: AccessRequest;
  onClose: () => void;
  /**
   * Records your decision. Approve and Reject show only while the request is waiting on you;
   * Reject asks you to confirm and give a reason first.
   */
  onDecide: (decision: "approved" | "rejected", reason?: string) => void;
}

function PersonLine({ id }: { id: string }) {
  const p = personById(id);
  return (
    <span className="rq-person">
      <Avatar size={20} name={p.name} color={p.color} />
      {p.name}
      {id === CURRENT_USER_ID && " (You)"}
    </span>
  );
}

/** The request details panel from the Approve Request flow. */
export function RequestDetailPanel({ request: r, onClose, onDecide }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const rejectRef = useRef<HTMLButtonElement>(null);
  const app = applicationById(r.applicationId);
  const beneficiary = personById(r.beneficiaryId);
  const status = statusOf(r);
  const canDecide = pendingApproval(r)?.personId === CURRENT_USER_ID;
  const levelName = (id: string | null) => app.levels.find((l) => l.id === id)?.name ?? "None";

  // Approval flow: one item per approver, then provisioning.
  let reached = false;
  const approvalItems: TimelineItem[] = r.approvals.map((a: Approval, i) => {
    const before = r.approvals[i - 1];
    const when = a.decidedAt ?? before?.decidedAt ?? r.requestedAt;
    let itemStatus: TimelineItem["status"];
    let note;
    if (a.status === "approved") {
      itemStatus = "done";
      note = a.auto
        ? `Approval requirement satisfied because the requester is the ${app.name} ${a.role}.`
        : `Approved as ${a.role}.`;
    } else if (a.status === "rejected") {
      itemStatus = "failed";
      note = <span className="rq-note--danger">Rejected as {a.role}.</span>;
      if (a.comment) {
        return {
          id: `${a.role}`,
          status: itemStatus,
          caption: formatTimestamp(when),
          children: (
            <>
              <PersonLine id={a.personId} />
              <p className="rq-note">{note}</p>
              <ReasonQuote reason={a.comment} />
            </>
          ),
        };
      }
    } else {
      itemStatus = !reached && status === "pending" ? "current" : "pending";
      reached = true;
      note = (
        <span className={itemStatus === "current" ? "rq-note--warning" : undefined}>
          {app.risk} risk {app.name} access requires <strong>{a.role}</strong> approval.
        </span>
      );
    }
    return {
      id: `${a.role}`,
      status: itemStatus,
      caption: formatTimestamp(when),
      children: (
        <>
          <PersonLine id={a.personId} />
          <p className="rq-note">{note}</p>
        </>
      ),
    };
  });
  const lastDecision = [...r.approvals].reverse().find((a) => a.decidedAt)?.decidedAt ?? r.requestedAt;
  approvalItems.push({
    id: "provisioning",
    status: status === "approved" ? (app.provisioning === "Automatic" ? "done" : "current") : "pending",
    caption: formatTimestamp(lastDecision),
    children: <p className="rq-note">{app.provisioning} provisioning</p>,
  });

  const stage = (a: Approval, i: number): TimelineItem => {
    const earlierPending = r.approvals.slice(0, i).some((x) => x.status !== "approved");
    if (a.status === "approved") return { id: a.role, status: "done", caption: a.role, children: "Approved" };
    if (a.status === "rejected") return { id: a.role, status: "failed", caption: a.role, children: <span className="rq-note--danger">Rejected</span> };
    if (status === "rejected" || earlierPending) return { id: a.role, status: "pending", caption: a.role, children: "Not started" };
    return { id: a.role, status: "current", caption: a.role, children: <span className="rq-note--warning">Pending</span> };
  };
  const provisioned = status === "approved" && app.provisioning === "Automatic";
  const lifecycle: TimelineItem[] = [
    { id: "submitted", status: "done", caption: "Access request", children: "Submitted" },
    ...r.approvals.map(stage),
    status === "approved"
      ? provisioned
        ? { id: "prov", status: "done", caption: "Provisioning", children: "Completed" }
        : { id: "prov", status: "current", caption: "Provisioning", children: <span className="rq-note--warning">Pending</span> }
      : { id: "prov", status: "pending", caption: "Provisioning", children: status === "rejected" ? "Cancelled" : "Not started" },
    provisioned
      ? { id: "access", status: "done", caption: "Access status", children: "Active" }
      : { id: "access", status: "pending", caption: "Access status", children: "Not active" },
  ];

  return (
    <SidePanel
      className="rq-panel"
      label={`Request ${r.id} for ${beneficiary.name}`}
      onClose={onClose}
      header={
        <>
          <Avatar size={50} name={beneficiary.name} color={beneficiary.color} />
          {/* No actions yet: the menu is still being designed, so this does nothing on click. */}
          <button type="button" className="rq-panel__more" aria-label="Request actions">
            <Icon name="dots-horizontal-20" size={20} />
          </button>
        </>
      }
      overlay={
        <RejectSheet
          open={rejecting}
          beneficiaryName={beneficiary.name}
          levelName={levelName(r.requestedLevelId)}
          applicationName={app.name}
          onCancel={() => {
            setRejecting(false);
            rejectRef.current?.focus();
          }}
          onReject={(reason) => {
            setRejecting(false);
            // Record it once the sheet has gone, so the approval flow's change plays in view
            window.setTimeout(() => onDecide("rejected", reason), SHEET_LEAVE_MS);
          }}
        />
      }
      footer={
        canDecide ? (
          <>
            <Button ref={rejectRef} variant="destructive-outline" onClick={() => setRejecting(true)}>Reject</Button>
            <Button onClick={() => onDecide("approved")}>Approve</Button>
          </>
        ) : (
          <Button onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="rq-panel__title">
        <h2>{beneficiary.name}</h2>
        <div className="rq-panel__meta">
          <RequestId id={r.id} />
          <StatusBadge status={status} />
        </div>
      </div>

      <PanelSection title="Request details">
        <DetailList
          rows={[
            { label: "Application", value: app.name },
            { label: "Current access", value: levelName(r.currentLevelId) },
            { label: "Access requested", value: levelName(r.requestedLevelId) },
            { label: "Beneficiary", ...personValue(beneficiary) },
            { label: "Requester", ...personValue(personById(r.requesterId)) },
          ]}
        />
        <Divider />
        <DetailList
          rows={[
            { label: "Request date", value: formatLongDate(r.requestedAt) },
            { label: "Start date", value: r.start === "immediately" ? "Immediately" : formatLongDate(r.start) },
            { label: "End date", value: r.end === "none" ? "No expiration" : formatLongDate(r.end) },
          ]}
        />
      </PanelSection>

      <PanelSection title="Business reason">
        <ReasonQuote reason={r.reason} />
      </PanelSection>

      <PanelSection title="Policy evaluation">
        <DetailList
          rows={[
            { label: "Access policy", value: `${app.name} ${app.risk === "High" ? "Elevated" : "Standard"} Access Policy` },
            { label: "Risk", value: app.risk },
            { label: "Conflict", value: "None detected" },
          ]}
        />
      </PanelSection>

      <PanelSection title="Approval flow">
        <Timeline items={approvalItems} />
      </PanelSection>

      <PanelSection title="Request lifecycle">
        <Timeline items={lifecycle} />
      </PanelSection>
    </SidePanel>
  );
}
