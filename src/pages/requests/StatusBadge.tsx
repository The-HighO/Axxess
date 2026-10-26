import { Badge, type BadgeStatus } from "../../components";
import type { RequestStatus } from "../../data/requests";

const TONE: Record<RequestStatus, BadgeStatus> = { pending: "yellow", approved: "green", rejected: "red" };

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge status={TONE[status]}>{status}</Badge>;
}
