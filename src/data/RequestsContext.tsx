import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { CURRENT_USER_ID } from "./directory";
import { approvalsFor, seedRequests, type AccessRequest } from "./requests";

export interface NewRequest {
  beneficiaryId: string;
  applicationId: string;
  currentLevelId: string | null;
  requestedLevelId: string;
  reason: string;
  start: string;
  end: string;
}

interface RequestsStore {
  requests: AccessRequest[];
  /** Submits a request as the current user and returns its id. */
  add: (input: NewRequest) => string;
  /** Records the current user's decision on their pending approval. */
  decide: (id: string, decision: "approved" | "rejected") => void;
}

const Ctx = createContext<RequestsStore | null>(null);

/** In-memory store shared by the Request Access flow and the Requests page. Swap for API calls. */
export function RequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<AccessRequest[]>(seedRequests);
  const store = useMemo<RequestsStore>(
    () => ({
      requests,
      add(input) {
        const now = new Date().toISOString();
        const highest = Math.max(...requests.map((r) => Number(r.id.slice(4))));
        const id = `REQ-${String(highest + 1).padStart(4, "0")}`;
        const request: AccessRequest = {
          id,
          requesterId: CURRENT_USER_ID,
          requestedAt: now,
          approvals: approvalsFor(input.applicationId, CURRENT_USER_ID, now),
          ...input,
        };
        setRequests((list) => [request, ...list]);
        return id;
      },
      decide(id, decision) {
        const now = new Date().toISOString();
        setRequests((list) =>
          list.map((r) => {
            if (r.id !== id) return r;
            const i = r.approvals.findIndex((a) => a.status === "pending");
            if (i < 0 || r.approvals[i].personId !== CURRENT_USER_ID) return r;
            const approvals = r.approvals.map((a, j) => (j === i ? { ...a, status: decision, decidedAt: now } : a));
            return { ...r, approvals };
          }),
        );
      },
    }),
    [requests],
  );
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useRequests(): RequestsStore {
  const store = useContext(Ctx);
  if (!store) throw new Error("useRequests must be used inside <RequestsProvider>");
  return store;
}
