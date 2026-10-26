import { Choice, type ChoiceProps } from "../internal/Choice";
import "./Toggle.css";

export type ToggleProps = ChoiceProps;

/** 40 x 25px switch for settings that apply immediately. */
export function Toggle(props: ToggleProps) {
  return <Choice kind="toggle" {...props} />;
}
