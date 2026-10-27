import { useState } from "react";
import { Button, Icon, PanelSheet, TextArea } from "../../components";

interface Props {
  open: boolean;
  /** Who would have got access, and to what: for the explanation under the question. */
  beneficiaryName: string;
  levelName: string;
  applicationName: string;
  onCancel: () => void;
  onReject: (reason: string) => void;
}

/** Confirms a rejection over the request panel. Yes, reject stays off until a reason is entered. */
export function RejectSheet({ open, beneficiaryName, levelName, applicationName, onCancel, onReject }: Props) {
  const [reason, setReason] = useState("");
  // Each time it opens, start from an empty reason
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason("");
    }
  }
  const missing = reason.trim() === "";


  return (
    <PanelSheet open={open} onClose={onCancel} label="Reject this request">
      <div className="rq-reject">
        <span className="rq-reject__icon" aria-hidden="true">
          <Icon name="remove-column" size={40} />
        </span>
        <div className="rq-reject__text">
          <h3>Are you sure you want to reject this request?</h3>
          <p>
            {beneficiaryName} won’t get {levelName} access to {applicationName}, and the request will close. Your
            reason will be shared with them.
          </p>
        </div>
        <TextArea
          label="Reason for rejecting"
          placeholder="Explain why this access isn’t needed or what to request instead"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="rq-reject__actions">
          <Button variant="neutral" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" disabled={missing} onClick={() => onReject(reason.trim())}>Yes, reject</Button>
        </div>
      </div>
    </PanelSheet>
  );
}
