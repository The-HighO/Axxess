import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar, Button, Checkbox, DateFilter, FilterMenu, inRange, Icon, Pagination, SearchField, Tab, TabList, useToast,
  type DateFilterValue,
} from "../../components";
import { CURRENT_USER_ID, applicationById, applications, people, personById } from "../../data/directory";
import { approvedCount, formatLongDate, statusOf, type AccessRequest, type RequestStatus } from "../../data/requests";
import { useRequests } from "../../data/RequestsContext";
import { AppShell } from "../../shell/AppShell";
import { RequestDetailPanel } from "./RequestDetailPanel";
import { RequestId } from "./RequestId";
import { StatusBadge } from "./StatusBadge";
import "./RequestsPage.css";

type TabId = "all" | "mine" | "awaiting";
/** Matches the slide-out in RequestsPage.css. */
const PANEL_LEAVE_MS = 260;

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "All requests" },
  { id: "mine", label: "My requests" },
  { id: "awaiting", label: "Awaiting approval" },
];

interface Filters {
  beneficiary: string | null;
  application: string | null;
  approver: string | null;
  status: string | null;
  date: DateFilterValue | null;
}
const NO_FILTERS: Filters = { beneficiary: null, application: null, approver: null, status: null, date: null };


function ApproversCell({ request }: { request: AccessRequest }) {
  const done = approvedCount(request);
  const total = request.approvals.length;
  const icon = done === 0 ? "circle-placeholder" : done === total ? "check-circle" : "contrast";
  return (
    <span className="rq-approvers">
      <Icon name={icon} size={20} className="rq-approvers__icon" />
      {done} of {total}
    </span>
  );
}

interface Props {
  /** id of a request to open, such as one just submitted. */
  initialOpenId?: string | null;
}

/** Requests list with tabs, filters and the request details panel (the Approve Request flow). */
export function RequestsPage({ initialOpenId = null }: Props) {
  const { requests, decide } = useRequests();
  const toast = useToast();
  const [tab, setTab] = useState<TabId>("awaiting");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  // The request the panel shows; it outlives `openId` by the slide-out so the panel can leave with its content.
  const [shownId, setShownId] = useState<string | null>(initialOpenId);
  const dockRef = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      const status = statusOf(r);
      if (tab === "mine" && r.requesterId !== CURRENT_USER_ID && r.beneficiaryId !== CURRENT_USER_ID) return false;
      if (tab === "awaiting" && status !== "pending") return false;
      if (filters.beneficiary && r.beneficiaryId !== filters.beneficiary) return false;
      if (filters.application && r.applicationId !== filters.application) return false;
      if (filters.approver && !r.approvals.some((a) => a.personId === filters.approver)) return false;
      if (filters.status && status !== filters.status) return false;
      if (filters.date && !inRange(r.requestedAt, filters.date)) return false;
      if (q) {
        const hay = [r.id, personById(r.beneficiaryId).name, applicationById(r.applicationId).name].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [requests, tab, query, filters]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [tab, query, filters, pageSize]);

  useEffect(() => {
    if (openId) {
      setShownId(openId);
      return;
    }
    const timer = window.setTimeout(() => setShownId(null), PANEL_LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [openId]);

  // A press anywhere outside the panel closes it. Rows are left out (they switch the panel
  // to their request), and so are toasts, which float over everything.
  useEffect(() => {
    if (!openId) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Element;
      if (dockRef.current?.contains(target) || target.closest?.(".rq-table tbody tr, .axo-toaster")) return;
      setOpenId(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openId]);

  const open = requests.find((r) => r.id === shownId) ?? null;
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const someOnPage = pageRows.some((r) => selected.has(r.id));

  const setFilter = (key: Exclude<keyof Filters, "date">) => (value: string | null) => setFilters((f) => ({ ...f, [key]: value }));
  function toggleRow(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((s) => {
      const next = new Set(s);
      pageRows.forEach((r) => (allOnPage ? next.delete(r.id) : next.add(r.id)));
      return next;
    });
  }
  function closePanel() {
    const id = openId;
    setOpenId(null);
    // Return focus to the row that opened the panel.
    window.requestAnimationFrame(() => document.getElementById(`open-${id}`)?.focus());
  }

  function decideRequest(r: AccessRequest, decision: "approved" | "rejected", reason?: string) {
    decide(r.id, decision, reason);
    const verb = decision === "approved" ? "approved" : "rejected";
    setAnnouncement(`${r.id} ${verb}.`);
    // An approval with approvers still to go hands the request on rather than finishing it.
    const subject = `${personById(r.beneficiaryId).name}’s ${applicationById(r.applicationId).name} request ${r.id}`;
    const mine = r.approvals.findIndex((a) => a.status === "pending");
    const next = decision === "approved" ? r.approvals.slice(mine + 1).find((a) => a.status === "pending") : undefined;
    // A rejection, or the last approval, finishes the request and it leaves "Awaiting approval":
    // follow it to "All requests" so it stays in view
    if (!next && tab === "awaiting") setTab("all");
    toast.show({
      type: "success",
      title: `Request ${verb}`,
      body: next
        ? `${subject} now goes to ${personById(next.personId).name} for approval.`
        : `${subject} has been ${verb}.`,
    });
  }

  const approverIds = [...new Set(requests.flatMap((r) => r.approvals.map((a) => a.personId)))];

  return (
    <AppShell
      active="requests"
      topBar={<SearchField placeholder="Search request" value={query} onChange={(e) => setQuery(e.target.value)} />}
    >
      <main className="rq">
        <div className="rq__head">
          <div className="rq__title-row">
            <h1 className="rq__title">Requests</h1>
            <Button size="medium" icon="plus" onClick={() => { window.location.hash = "#/request-access"; }}>
              Request access
            </Button>
          </div>
          <TabList className="rq__tabs" aria-label="Request lists">
            {TABS.map((t) => (
              <Tab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Tab>
            ))}
          </TabList>
        </div>

        <div className="rq__body">
          <div className="rq__filters" role="group" aria-label="Filters">
            <FilterMenu
              label="Approvers"
              value={filters.approver}
              onChange={setFilter("approver")}
              options={approverIds.map((id) => ({ value: id, label: personById(id).name + (id === CURRENT_USER_ID ? " (You)" : "") }))}
            />
            <FilterMenu
              label="Beneficiary"
              value={filters.beneficiary}
              onChange={setFilter("beneficiary")}
              options={people.filter((p) => requests.some((r) => r.beneficiaryId === p.id)).map((p) => ({ value: p.id, label: p.name }))}
            />
            <FilterMenu
              label="Application"
              value={filters.application}
              onChange={setFilter("application")}
              options={applications.map((a) => ({ value: a.id, label: a.name }))}
            />
            <FilterMenu
              label="Status"
              value={filters.status}
              onChange={setFilter("status")}
              options={(["pending", "approved", "rejected"] as RequestStatus[]).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
            />
            <DateFilter value={filters.date} onChange={(date) => setFilters((f) => ({ ...f, date }))} />
          </div>

          <div className="rq__table-wrap">
            <table className="rq-table">
              <colgroup>
                <col style={{ width: 41 }} />
                <col style={{ width: 180 }} />
                <col />
                <col style={{ width: 180 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 190 }} />
                <col style={{ width: 36 }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="rq-table__check">
                    <Checkbox
                      variant="table"
                      aria-label="Select all requests on this page"
                      checked={allOnPage}
                      indeterminate={!allOnPage && someOnPage}
                      onChange={toggleAll}
                    />
                  </th>
                  <th><span className="rq-th"><Icon name="hashtag" size={16} />Requested ID</span></th>
                  <th><span className="rq-th"><Icon name="person" size={16} />Beneficiary</span></th>
                  <th><span className="rq-th"><Icon name="browser" size={16} />Application</span></th>
                  <th><span className="rq-th"><Icon name="people-group" size={16} />Approvers</span></th>
                  <th><span className="rq-th"><Icon name="flag" size={16} />Status</span></th>
                  <th><span className="rq-th"><Icon name="calendar-rounded" size={16} />Date</span></th>
                  <th><span className="axo-visually-hidden">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => {
                  const beneficiary = personById(r.beneficiaryId);
                  return (
                    <tr key={r.id} className={r.id === openId ? "is-open" : undefined} onClick={() => setOpenId(r.id)}>
                      <td className="rq-table__check" onClick={(e) => e.stopPropagation()}>
                        <Checkbox variant="table" aria-label={`Select ${r.id}`} checked={selected.has(r.id)} onChange={() => toggleRow(r.id)} />
                      </td>
                      <td className="rq-table__id"><RequestId id={r.id} onCopied={(id) => setAnnouncement(`${id} copied.`)} /></td>
                      <td>
                        <span className="rq-person rq-person--lg">
                          <Avatar size={30} name={beneficiary.name} color={beneficiary.color} />
                          <span className="rq-person__name">{beneficiary.name}</span>
                        </span>
                      </td>
                      <td>{applicationById(r.applicationId).name}</td>
                      <td><ApproversCell request={r} /></td>
                      <td><StatusBadge status={statusOf(r)} /></td>
                      <td>{formatLongDate(r.requestedAt)}</td>
                      <td className="rq-table__open">
                        <button
                          id={`open-${r.id}`}
                          type="button"
                          aria-label={`Open ${r.id} for ${beneficiary.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenId(r.id);
                          }}
                        >
                          <Icon name="chevron-right-small" size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr className="rq-table__empty">
                    <td colSpan={8}>No requests match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
      </main>

      <div className="axo-visually-hidden" role="status">{announcement}</div>

      {open && (
        <div className={openId ? "rq__panel-dock" : "rq__panel-dock is-leaving"} ref={dockRef}>
          <RequestDetailPanel
            key={open.id}
            request={open}
            onClose={closePanel}
            onDecide={(decision, reason) => decideRequest(open, decision, reason)}
          />
        </div>
      )}
    </AppShell>
  );
}
