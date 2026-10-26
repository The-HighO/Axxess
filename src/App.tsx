import { useEffect, useState, type ReactNode } from "react";
import {
  Avatar, Badge, Button, Checkbox, DateFilter, DateInput, DatePicker, DateRangePicker, Filter, Icon, iconNames, Navigation, NavItem,
  Radio, Tab, TextArea, TextInput, Toast, ToastProvider, Toggle, useToast, type AvatarSize, type DateFilterValue, type BadgeStatus,
  type ButtonProps, type NavigationSection, type ToastType,
} from "./components";
import { applicationById, personById } from "./data/directory";
import { RequestsProvider, useRequests, type NewRequest } from "./data/RequestsContext";
import { RequestAccessFlow } from "./flows/request-access/RequestAccessFlow";
import { RequestsPage } from "./pages/requests/RequestsPage";
import "./App.css";

const SECTIONS: NavigationSection[] = [
  { items: [{ id: "overview", icon: "home", label: "Overview" }] },
  {
    title: "Access",
    items: [
      { id: "requests", icon: "inbox", label: "Requests" },
      { id: "access", icon: "key", label: "Access" },
      { id: "reviews", icon: "clipboard", label: "Reviews" },
    ],
  },
  {
    title: "Governance",
    items: [
      { id: "applications", icon: "browser", label: "Applications" },
      { id: "entitlements", icon: "badge-verified", label: "Entitlements" },
      { id: "policies", icon: "law", label: "Policies" },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: "people", icon: "people", label: "People" },
      { id: "integrations", icon: "fork", label: "Integrations" },
      { id: "audit", icon: "map", label: "Audit" },
      { id: "settings", icon: "settings", label: "Settings" },
    ],
  },
];

const BUTTON_VARIANTS: Array<[string, ButtonProps["variant"]]> = [
  ["Primary", "primary"],
  ["Neutral", "neutral"],
  ["Text", "text"],
  ["Destructive", "destructive"],
  ["Destructive outline", "destructive-outline"],
];

const BADGES: Array<[BadgeStatus, string]> = [
  ["black", "default"], ["green", "successful"], ["red", "failed"], ["yellow", "processing"],
  ["blue", "refunded"], ["pink", "pink"], ["purple", "purple"], ["brown", "brown"],
  ["primary", "primary"], ["coral", "coral"],
];

const AVATAR_SIZES: AvatarSize[] = [20, 25, 30, 40, 50];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="gallery__section" id={id}>
      <h2 className="gallery__title">{title}</h2>
      {children}
    </section>
  );
}

const FLOW_HASH = "#/request-access";
const REQUESTS_HASH = "#/requests";
const GALLERY_HASH = "#/components";

function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export function App() {
  return (
    <ToastProvider>
      <RequestsProvider>
        <Routes />
      </RequestsProvider>
    </ToastProvider>
  );
}

function Routes() {
  const hash = useHash();
  const { add } = useRequests();
  const toast = useToast();
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  if (hash === FLOW_HASH) {
    return (
      <RequestAccessFlow
        onClose={() => { window.location.hash = REQUESTS_HASH; }}
        onSubmit={(d) => {
          setLastSubmitted(add(d));
          toast.show({ type: "success", title: "Request sent", body: sentMessage(d) });
          window.location.hash = REQUESTS_HASH;
        }}
      />
    );
  }
  if (hash === GALLERY_HASH) return <Gallery />;
  return <RequestsPage key={lastSubmitted ?? "list"} initialOpenId={lastSubmitted} />;
}

/** The success toast's body: who the new request went to. */
function sentMessage(request: NewRequest) {
  const app = applicationById(request.applicationId);
  const approvers = [...new Set([app.ownerId, app.administratorId])].map((id) => personById(id).name);
  return `Your request for ${app.name} access is with ${approvers.join(" and ")} for approval.`;
}

function Gallery() {
  const [page, setPage] = useState("requests");
  const [tab, setTab] = useState("Pending");
  const [toFilter, setToFilter] = useState("Transfer");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("2026-12-30");
  const [inlineDate, setInlineDate] = useState("2026-12-30");
  const [range, setRange] = useState({ start: "2026-11-02", end: "2026-11-08" });
  const [dateFilter, setDateFilter] = useState<DateFilterValue | null>(null);

  return (
    <div className="shell">
      <Navigation
        organization={{ name: "Axxess", logo: <Avatar name="Axxess" type="initial" size={25} /> }}
        sections={SECTIONS}
        activeId={page}
        onSelect={setPage}
      />

      <main className="gallery">
        <header className="gallery__head">
          <h1 className="gallery__h1">Axxess OS components</h1>
          <p className="gallery__lede">Every component from the Software Design file, in its variants and states.</p>
          <div className="row">
            <Button size="medium" icon="arrow-right" iconPosition="trailing" onClick={() => { window.location.hash = FLOW_HASH; }}>
              Open the Request access flow
            </Button>
          </div>
        </header>

        <Section id="button" title="Button">
          <div className="stack">
            {BUTTON_VARIANTS.map(([label, variant]) => (
              <div className="row" key={variant}>
                <span className="caption">{label}</span>
                <Button variant={variant}>Continue</Button>
                <Button variant={variant} size="medium" icon="arrow-right">Continue</Button>
                <Button variant={variant} size="small" icon="arrow-right" iconPosition="trailing">Continue</Button>
                <Button variant={variant} size="medium" icon="arrow-right" iconPosition="only" aria-label="Continue" />
                <Button variant={variant} size="medium" disabled>Continue</Button>
              </div>
            ))}
          </div>
        </Section>

        <Section id="controls" title="Checkbox, radio and toggle">
          <div className="row row--wide">
            <Checkbox label="Off" />
            <Checkbox label="On" defaultChecked />
            <Checkbox label="Disabled" disabled />
          </div>
          <div className="row row--wide" role="radiogroup" aria-label="Access duration">
            <Radio name="duration" label="7 days" />
            <Radio name="duration" label="30 days" defaultChecked />
            <Radio name="duration" label="Permanent" disabled />
          </div>
          <div className="row row--wide">
            <Toggle label="Off" />
            <Toggle label="On" defaultChecked />
          </div>
        </Section>

        <Section id="input" title="Text input and text area">
          <div className="grid">
            <TextInput label="Application" info="The app you need access to" placeholder="Select an application" trailingIcon />
            <TextInput label="Role" info defaultValue="Finance admin" trailingIcon feedback="This is a feedback message" />
            <TextInput label="Manager email" placeholder="name@company.com" invalid feedback="Enter a work email address" />
            <TextInput label="Requester" placeholder="Mary Parker" disabled />
            <TextArea
              label="Reason for access"
              placeholder="Tell the approver why you need this"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              feedback="This is a feedback message"
            />
            <TextArea label="Comment" defaultValue="Too short" invalid feedback="Add at least 20 characters" />
          </div>
        </Section>

        <Section id="date" title="Date picker">
          <div className="grid">
            <DateInput label="End date" value={date} onChange={setDate} min="2026-10-25" />
            <div className="gallery__picker">
              <DatePicker value={inlineDate} onChange={setInlineDate} min="2026-10-25" />
            </div>
            <div className="gallery__picker">
              <DateRangePicker value={range} onChange={setRange} />
            </div>
          </div>
        </Section>

        <Section id="toast" title="Toast">
          <ToastGallery />
        </Section>

        <Section id="badge" title="Badge">
          <div className="row">{BADGES.map(([s, w]) => <Badge key={s} status={s}>{w}</Badge>)}</div>
          <div className="row">{BADGES.map(([s, w]) => <Badge key={s} status={s} icon>{w}</Badge>)}</div>
        </Section>

        <Section id="filter" title="Filter">
          <div className="row">
            <Filter label="Status" />
            <Filter label="To" value={toFilter} onClear={() => setToFilter("")} />
            {!toFilter && <Button variant="text" size="small" onClick={() => setToFilter("Transfer")}>Reset</Button>}
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </Section>

        <Section id="tabs" title="Tabs">
          <div className="row row--tabs" role="tablist" aria-label="Requests">
            {["Pending", "Approved", "Rejected", "All"].map((t) => (
              <Tab key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Tab>
            ))}
          </div>
        </Section>

        <Section id="nav-item" title="Nav item">
          <div className="nav-grid">
            <NavItem icon="home" label="Overview" />
            <NavItem icon="home" label="Overview" dropdown />
            <NavItem icon="inbox" label="Requests" active />
            <NavItem icon="inbox" label="Requests" dropdown active />
          </div>
        </Section>

        <Section id="avatar" title="Avatar">
          <div className="stack">
            <div className="row"><span className="caption">Icon</span>{AVATAR_SIZES.map((s) => <Avatar key={s} size={s} />)}</div>
            <div className="row"><span className="caption">Initials</span>{AVATAR_SIZES.map((s) => <Avatar key={s} size={s} name="Mary Parker" />)}</div>
            <div className="row"><span className="caption">Initial</span>{AVATAR_SIZES.map((s) => <Avatar key={s} size={s} name="Mary" type="initial" />)}</div>
            <div className="row"><span className="caption">Image</span>{AVATAR_SIZES.map((s) => <Avatar key={s} size={s} src="/avatar-sample.jpg" name="Sample person" />)}</div>
          </div>
        </Section>

        <Section id="icons" title="Icons">
          <div className="icons">
            {iconNames.map((n) => (
              <figure className="icons__item" key={n}>
                <Icon name={n} size={20} />
                <figcaption>{n}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}

const TOAST_TYPES: ToastType[] = ["default", "success", "warning", "error"];
const TOAST_TITLE = "You have received new feedback, this has impacted your CSAT and NPS";
const TOAST_BODY = "Review the latest responses to understand what's changed, and get insight into how they can be improved.";

/** Every variant from the Toasts page, plus buttons that show live toasts. */
function ToastGallery() {
  const toast = useToast();
  const noop = () => {};
  return (
    <div className="stack">
      <div className="row">
        {TOAST_TYPES.map((type) => (
          <Button
            key={type}
            variant="neutral"
            size="small"
            onClick={() => toast.show({ type, title: `${type[0].toUpperCase()}${type.slice(1)} toast: ${TOAST_TITLE}` })}
          >
            Show {type}
          </Button>
        ))}
        <Button
          variant="neutral"
          size="small"
          onClick={() => toast.show({ type: "success", title: TOAST_TITLE, body: TOAST_BODY, action: { label: "Okay" } })}
        >
          Show with body and action
        </Button>
      </div>
      <div className="toast-grid">
        {TOAST_TYPES.map((type) => (
          <div className="toast-grid__row" key={type}>
            <Toast type={type} title={TOAST_TITLE} />
            <Toast type={type} title={TOAST_TITLE} action={{ label: "Okay", onClick: noop }} />
          </div>
        ))}
        {TOAST_TYPES.map((type) => (
          <div className="toast-grid__row" key={`${type}-body`}>
            <Toast type={type} title={TOAST_TITLE} body={TOAST_BODY} />
            <Toast type={type} title={TOAST_TITLE} body={TOAST_BODY} action={{ label: "Okay", onClick: noop }} />
          </div>
        ))}
      </div>
    </div>
  );
}
