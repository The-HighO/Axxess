import { cx } from "../internal/cx";
import "./Divider.css";

/** Dashed rule between sections of a card. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cx("axo-divider", className)} />;
}
