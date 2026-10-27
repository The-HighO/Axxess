import { useEffect, useState } from "react";
import { Badge, Icon } from "../../components";

/**
 * Request ID with a copy button that slides in on hover (or keyboard focus), on the Requests
 * table and in the request panel. Copying swaps the ID for "Copied" for a moment; both labels
 * share one grid cell so the tag never changes width.
 */
export function RequestId({ id, onCopied }: { id: string; onCopied?: (id: string) => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  return (
    <span className="rq-id">
      <Badge shape="tag">
        <span className="rq-id__labels">
          <span className={copied ? "is-hidden" : undefined}>{id}</span>
          <span className={copied ? undefined : "is-hidden"} aria-hidden={!copied}>Copied</span>
        </span>
      </Badge>
      <button
        type="button"
        className="rq-id__copy"
        aria-label={`Copy ${id}`}
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard?.writeText(id).then(
            () => {
              setCopied(true);
              onCopied?.(id);
            },
            () => setCopied(false),
          );
        }}
      >
        <Icon name="copy" size={16} />
      </button>
    </span>
  );
}
