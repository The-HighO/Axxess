import { useId, useRef, type ReactNode, type MouseEvent } from "react";
import { cx } from "../internal/cx";
import { Icon } from "../Icon";
import { Reveal } from "../internal/Reveal";
import "../Radio/Radio.css";
import "../Toggle/Toggle.css";
import "./OptionCard.css";

interface BaseProps {
  title: ReactNode;
  description?: ReactNode;
  /** Shown under the header while the card is selected or open. */
  children?: ReactNode;
  /**
   * The card being worked on: dark 2px outline. Defaults to being selected, on or open.
   * Pass it when several cards can be open at once (see `useActiveCard`).
   */
  active?: boolean;
  /** Has an answer: solid outline instead of dashed while not active. */
  filled?: boolean;
  /** Ease the content open and closed (default). Pass false to switch it instantly. */
  reveal?: boolean;
  className?: string;
}

export interface RadioCardProps extends BaseProps {
  /** A radio choice: the whole header is the hit area. */
  kind: "radio";
  name: string;
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
}

export interface ToggleCardProps extends BaseProps {
  /** An on/off section: its content shows while on. */
  kind: "toggle";
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface CollapsibleCardProps extends BaseProps {
  /** A dropdown section with a chevron. Several can be open at once. */
  kind: "collapsible";
  open: boolean;
  onToggle: (open: boolean) => void;
}

export interface StaticCardProps extends BaseProps {
  /** A section that's always open, with no control: for when there's nothing to choose. */
  kind: "static";
}

export type OptionCardProps = RadioCardProps | ToggleCardProps | CollapsibleCardProps | StaticCardProps;

/**
 * Card for a choice or a section of a form. Outline: a 2px dark border while
 * active (selected, on, or the section being worked on); otherwise solid once
 * it has an answer and dashed while it doesn't.
 */
export function OptionCard(props: OptionCardProps) {
  const id = useId();
  const reveal = props.reveal ?? true;
  const open = props.kind === "static" ? true : props.kind === "collapsible" ? props.open : props.checked;
  const active = props.active ?? open;
  const filled = props.filled;
  const rootRef = useRef<HTMLDivElement>(null);
  // A closed card opens from a click anywhere on it, not just its title and control. Once
  // open, only the header closes it, so clicks around the content can't close it by accident.
  const openable = props.kind !== "static" && !open;
  function openFromCard(e: MouseEvent<HTMLDivElement>) {
    if (!openable) return;
    const head = rootRef.current?.querySelector<HTMLElement>(":scope > .axo-option-card__head");
    const target = e.target as Element;
    if (!head || head.contains(target) || target.closest(".axo-option-card__body")) return;
    head.click();
  }
  const showDescription = Boolean(props.description);
  const text = (
    <span className="axo-option-card__text">
      <span className="axo-option-card__title">{props.title}</span>
      {showDescription && <span className="axo-option-card__desc">{props.description}</span>}
    </span>
  );

  let header: ReactNode;
  if (props.kind === "radio") {
    header = (
      <label className="axo-option-card__head">
        {text}
        <input
          className="axo-option-card__input"
          type="radio"
          name={props.name}
          value={props.value}
          checked={props.checked}
          onChange={() => props.onSelect(props.value)}
        />
        <span className="axo-radio" aria-hidden="true" />
      </label>
    );
  } else if (props.kind === "toggle") {
    header = (
      <label className="axo-option-card__head">
        {text}
        <input
          className="axo-option-card__input"
          type="checkbox"
          role="switch"
          checked={props.checked}
          onChange={(e) => props.onChange(e.target.checked)}
        />
        <span className="axo-toggle" aria-hidden="true" />
      </label>
    );
  } else if (props.kind === "static") {
    header = <div className="axo-option-card__head axo-option-card__head--static">{text}</div>;
  } else {
    header = (
      <button
        type="button"
        className="axo-option-card__head"
        aria-expanded={props.open}
        aria-controls={`${id}-body`}
        onClick={() => props.onToggle(!props.open)}
      >
        {text}
        <Icon name={props.open ? "chevron-top" : "chevron-down"} size={20} className="axo-option-card__chev" />
      </button>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cx("axo-option-card", active && "is-active", filled && "is-filled", reveal && "has-reveal", openable && "is-openable", props.className)}
      onClick={openFromCard}
    >
      {header}
      {reveal ? (
        <Reveal open={open && props.children != null}>
          <div className="axo-option-card__body" id={`${id}-body`}>
            {props.children}
          </div>
        </Reveal>
      ) : (
        open &&
        props.children != null && (
          <div className="axo-option-card__body" id={`${id}-body`}>
            {props.children}
          </div>
        )
      )}
    </div>
  );
}
