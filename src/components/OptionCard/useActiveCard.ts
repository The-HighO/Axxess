import { useState } from "react";

/**
 * For a group of OptionCards where several can be open at once but only one is the
 * card being worked on (dark 2px outline). The others show a solid outline once
 * filled and a dashed one until then (pass `filled` to each card).
 *
 * - Opening a card from its header makes it active; closing the active one clears it.
 * - Pressing or focusing anything inside a card's body makes that card active, so
 *   collapsing one card from its header never takes "active" from another.
 *
 * Spread `bind(card)` onto an element wrapping each card.
 */
export function useActiveCard<K extends string>(initial: K | null) {
  const [active, setActive] = useState<K | null>(initial);

  const inBody = (target: EventTarget) => (target as Element).closest?.(".axo-option-card__body") != null;
  const bind = (card: K) => ({
    onPointerDownCapture: (e: { target: EventTarget }) => inBody(e.target) && setActive(card),
    onFocusCapture: (e: { target: EventTarget }) => inBody(e.target) && setActive(card),
  });
  /** Call when a card opens or closes from its header. */
  const opened = (card: K, isOpen: boolean) => setActive((a) => (isOpen ? card : a === card ? null : a));

  return { active, setActive, bind, opened };
}
