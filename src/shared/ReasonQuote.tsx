import { Icon } from "../components";
import "./ReasonQuote.css";

/** A business reason as a quote: notes icon over a thin rail, then the text. Used in the request drawer and on Review. */
export function ReasonQuote({ reason }: { reason: string }) {
  return (
    <div className="reason-quote">
      <span className="reason-quote__rail" aria-hidden="true">
        <Icon name="notes" size={20} />
        <span />
      </span>
      <blockquote>“{reason}”</blockquote>
    </div>
  );
}
