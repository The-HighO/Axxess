import { useRef, useState } from "react";
import {
  Avatar, Combobox, DateInput, Reveal, DetailList, Divider, OptionCard, TextArea, formatDate, useActiveCard,
  type ComboboxOption,
} from "../../components";
import {
  CURRENT_USER_ID, applicationById, applications, beneficiaryOptions, personById,
} from "../../data/directory";
import { personValue } from "../../shared/personValue";
import { ReasonQuote } from "../../shared/ReasonQuote";
import { RadioRow } from "./RadioRow";
import { beneficiaryIdOf, currentAccessOf, type RequestDraft } from "./state";

export interface StepProps {
  draft: RequestDraft;
  update: (patch: Partial<RequestDraft>) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/* ---------- Initiate request: Beneficiary ---------- */
export function BeneficiaryStep({ draft, update }: StepProps) {
  const picked = draft.beneficiaryId ? personById(draft.beneficiaryId) : null;
  // The details reveal once someone is picked (after the list has started to fade, 100ms) and
  // fade in afresh when a different person is picked. The last person stays shown while it closes.
  const lastPicked = useRef(picked);
  if (picked) lastPicked.current = picked;
  const shownPerson = picked ?? lastPicked.current;
  const options: ComboboxOption[] = beneficiaryOptions.map((p) => ({
    value: p.id,
    label: p.name,
    description: p.email,
    leading: <Avatar size={30} name={p.name} color={p.color} />,
  }));
  const choose = (mode: string) => update({ beneficiaryMode: mode as RequestDraft["beneficiaryMode"] });
  return (
    <div className="ra-cards">
      <OptionCard
        kind="radio"
        name="beneficiary"
        value="self"
        checked={draft.beneficiaryMode === "self"}
        onSelect={choose}
        title="Myself"
        description="Requesting access for my own work."
      />
      <OptionCard
        kind="radio"
        name="beneficiary"
        value="other"
        checked={draft.beneficiaryMode === "other"}
        onSelect={choose}
        title="Someone else"
        description="Requesting access on behalf of another person."
        className="ra-card--loose"
      >
        <Combobox
          label="Who needs access?"
          options={options}
          value={draft.beneficiaryId}
          onChange={(id) => update({ beneficiaryId: id, applicationId: null, additionalAccess: false, accessLevelId: null })}
          searchPlaceholder="Search by name or email"
          groupByInitial
        />
        <Reveal open={!!picked} delay={100} className="ra-details-reveal">
          {shownPerson && (
            <div key={shownPerson.id} className="ra-details">
              <DetailList
                title="Beneficiary details"
                rows={[
                  { label: "Name", ...personValue(shownPerson) },
                  { label: "Role", value: shownPerson.role },
                  { label: "Team", value: shownPerson.team },
                  { label: "Manager", ...personValue(personById(shownPerson.managerId)) },
                ]}
              />
            </div>
          )}
        </Reveal>
      </OptionCard>
    </div>
  );
}

/* ---------- Initiate request: Application ---------- */
export function ApplicationStep({ draft, update }: StepProps) {
  const app = draft.applicationId ? applicationById(draft.applicationId) : null;
  // Same as Beneficiary details: reveal after the list starts fading, fade afresh on a change.
  const lastApp = useRef(app);
  if (app) lastApp.current = app;
  const shownApp = app ?? lastApp.current;
  return (
    <div className="ra-cards">
      <Combobox
        label="Select application"
        options={applications.map((a) => ({ value: a.id, label: a.name }))}
        value={draft.applicationId}
        onChange={(id) => update({ applicationId: id, additionalAccess: false, accessLevelId: null })}
        searchPlaceholder="Search by name"
      />
      <Reveal open={!!app} delay={100} className="ra-details-reveal">
        {shownApp && (
          <div key={shownApp.id} className="ra-details">
            <div className="ra-summary is-active">
              <DetailList
                title="Application details"
                rows={[
                  { label: "Type", value: shownApp.type },
                  { label: "Risk", value: shownApp.risk },
                  { label: "Provisioning", value: shownApp.provisioning },
                ]}
              />
            </div>
          </div>
        )}
      </Reveal>
    </div>
  );
}

/* ---------- Access needed: Select access level ---------- */
export function AccessLevelStep({ draft, update }: StepProps) {
  const app = applicationById(draft.applicationId!);
  const current = currentAccessOf(draft);
  const currentLevel = current ? app.levels.find((l) => l.id === current.levelId) : null;
  const [showCurrent, setShowCurrent] = useState(!draft.additionalAccess);
  // Same rule as Access duration: both cards can be open, only the one being worked on is active.
  // Current access is read-only, so it always counts as filled; Additional access once a level is picked.
  const { active, setActive, bind, opened } = useActiveCard<"current" | "additional">(
    draft.additionalAccess ? "additional" : "current",
  );
  const levels = app.levels.filter((l) => l.id !== current?.levelId);
  const levelList = (
    <div className="ra-radio-group" role="radiogroup" aria-label="Access level">
      {levels.map((level) => (
        <RadioRow
          key={level.id}
          name="access-level"
          value={level.id}
          checked={draft.accessLevelId === level.id}
          onSelect={(id) => update({ accessLevelId: id })}
          title={level.name}
          description={level.description}
        />
      ))}
    </div>
  );
  return (
    <div className="ra-cards">
      {current && (
        <div {...bind("current")}>
        <OptionCard
          kind="collapsible"
          open={showCurrent}
          active={active === "current"}
          filled
          onToggle={(isOpen) => {
            setShowCurrent(isOpen);
            opened("current", isOpen);
          }}
          title="Current access"
          description="If the user already has access"
        >
          <DetailList
            title="Access details"
            rows={[
              { label: "Level", value: currentLevel?.name ?? current.levelId },
              { label: "Source", value: current.source },
              { label: "Granted", value: current.granted },
              { label: "Expires", value: current.expires },
            ]}
          />
        </OptionCard>
        </div>
      )}
      {current ? (
        <div {...bind("additional")}>
        <OptionCard
          kind="toggle"
          checked={draft.additionalAccess}
          active={active === "additional"}
          filled={draft.additionalAccess && draft.accessLevelId != null}
          onChange={(on) => {
            update({ additionalAccess: on, accessLevelId: on ? draft.accessLevelId : null });
            // Turning it on makes it the card being worked on; Current access stays as it was.
            setActive(on ? "additional" : showCurrent ? "current" : null);
          }}
          title="Additional access"
          description="Select the access level required for their work."
        >
          {levelList}
        </OptionCard>
        </div>
      ) : (
        // No current access: nothing to toggle, so the levels are open from the start.
        <OptionCard kind="static" title="Access level" description="Select the access level required for their work.">
          {levelList}
        </OptionCard>
      )}
    </div>
  );
}

/* ---------- Request details: Business reason ---------- */
export function BusinessReasonStep({ draft, update }: StepProps) {
  const self = beneficiaryIdOf(draft) === CURRENT_USER_ID;
  return (
    <TextArea
      className="ra-reason"
      label={self ? "Describe what you need this access for" : "Describe what they need this access for"}
      value={draft.reason}
      onChange={(e) => update({ reason: e.target.value })}
      feedback="This will be shared with people reviewing the request."
    />
  );
}

/* ---------- Request details: Access duration ---------- */
type DurationCard = "start" | "end";

export function AccessDurationStep({ draft, update }: StepProps) {
  const startFilled = draft.startMode === "immediately" || (draft.startMode === "date" && draft.startDate !== "");
  const endFilled = draft.endMode === "none" || (draft.endMode === "date" && draft.endDate !== "");
  // Start and end are independent dropdowns: both can be open. Only the one being
  // worked on is "active" (dark outline); the other shows solid once filled, dashed until then.
  const [open, setOpen] = useState<Record<DurationCard, boolean>>({ start: true, end: startFilled });
  const { active, setActive, bind, opened } = useActiveCard<DurationCard>(!startFilled ? "start" : !endFilled ? "end" : null);
  const minEnd = draft.startMode === "date" && draft.startDate ? draft.startDate : today();

  const toggle = (card: DurationCard) => (isOpen: boolean) => {
    setOpen((o) => ({ ...o, [card]: isOpen }));
    opened(card, isOpen);
  };
  // Choosing "Immediately" answers the start date: open the end date and move on to it; start stays open.
  const startAnswered = () => {
    setOpen((o) => ({ ...o, end: true }));
    setActive("end");
  };

  return (
    <div className="ra-cards">
      <div {...bind("start")}>
        <OptionCard
          kind="collapsible"
          open={open.start}
          active={active === "start"}
          filled={startFilled}
          onToggle={toggle("start")}
          title="Start date"
          description="When should the access become active?"
        >
          <div className="ra-radio-group" role="radiogroup" aria-label="Start date">
            <RadioRow
              name="start"
              value="immediately"
              checked={draft.startMode === "immediately"}
              onSelect={() => {
                update({ startMode: "immediately", startDate: "" });
                startAnswered();
              }}
              title="Immediately"
            />
            <RadioRow name="start" value="date" checked={draft.startMode === "date"} onSelect={() => update({ startMode: "date" })} title="Specific date" />
            {draft.startMode === "date" && (
              <>
                <Divider />
                <DateInput
                  label="Select date"
                  value={draft.startDate}
                  min={today()}
                  // The wheel picker updates live while you scroll, so don't jump to End date here.
                  onChange={(v) => update({ startDate: v })}
                />
              </>
            )}
          </div>
        </OptionCard>
      </div>
      <div {...bind("end")}>
        <OptionCard
          kind="collapsible"
          open={open.end}
          active={active === "end"}
          filled={endFilled}
          onToggle={toggle("end")}
          title="End date"
          description="When should the access expire?"
        >
          <div className="ra-radio-group" role="radiogroup" aria-label="End date">
            <RadioRow name="end" value="none" checked={draft.endMode === "none"} onSelect={() => update({ endMode: "none", endDate: "" })} title="No expiration" />
            <RadioRow name="end" value="date" checked={draft.endMode === "date"} onSelect={() => update({ endMode: "date" })} title="Specific date" />
            {draft.endMode === "date" && (
              <>
                <Divider />
                <DateInput label="Select date" value={draft.endDate} min={minEnd} onChange={(v) => update({ endDate: v })} />
              </>
            )}
          </div>
        </OptionCard>
      </div>
    </div>
  );
}

/* ---------- Review: Review details ---------- */
export function ReviewStep({ draft }: StepProps) {
  const app = applicationById(draft.applicationId!);
  const beneficiary = personById(beneficiaryIdOf(draft)!);
  const current = currentAccessOf(draft);
  const levelName = (id: string | undefined | null) => app.levels.find((l) => l.id === id)?.name ?? "None";
  return (
    <div className="ra-summary">
      <DetailList
        title="Request summary"
        rows={[
          { label: "Requester", ...personValue(personById(CURRENT_USER_ID)) },
          { label: "Beneficiary", ...personValue(beneficiary) },
          { label: "Application", value: app.name },
          { label: "Current access", value: levelName(current?.levelId) },
          { label: "Access requested", value: levelName(draft.accessLevelId) },
        ]}
      />
      <Divider />
      <section className="ra-summary__section">
        <h3 className="axo-details__title">Reason</h3>
        <ReasonQuote reason={draft.reason} />
      </section>
      <Divider />
      <DetailList
        title="Access period"
        rows={[
          { label: "Start date", value: draft.startMode === "immediately" ? "Immediately" : formatDate(draft.startDate) },
          { label: "End date", value: draft.endMode === "none" ? "No expiration" : formatDate(draft.endDate) },
        ]}
      />
      <Divider />
      <DetailList
        title="Approval flow"
        rows={[
          { label: "Application Owner", ...personValue(personById(app.ownerId)) },
          { label: "Access Administrator", ...personValue(personById(app.administratorId)) },
          { label: "Provisioning", value: app.provisioning },
        ]}
      />
    </div>
  );
}
