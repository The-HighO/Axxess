import { Choice, type ChoiceProps } from "../internal/Choice";
import "./Radio.css";

export type RadioProps = ChoiceProps;

/** 25px radio. Group radios with the same `name` inside an element with role="radiogroup". */
export function Radio(props: RadioProps) {
  return <Choice kind="radio" {...props} />;
}
