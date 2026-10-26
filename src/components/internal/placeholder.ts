import type { ReactNode } from "react";

/** Labels already worded as an instruction are used as the placeholder unchanged. */
const INSTRUCTION = /^(select|choose|pick|enter|type|write|describe|add|search|find|provide|give|tell|set|upload)\b/i;

/**
 * Builds a placeholder from a field's label, so placeholders always match their labels:
 *
 * - "Manager email" + "Enter"            → "Enter manager email"
 * - "Application" + "Select"             → "Select application"
 * - "Who needs access?" + "Select"       → "Select who needs access"
 * - "Select date" / "Describe what…"     → used as is
 * - "AWS account" + "Select"             → "Select AWS account" (abbreviations keep their capitals)
 *
 * An explicit `placeholder` always wins; pass "" to show none. Non-text labels give no placeholder.
 */
export function placeholderFor(label: ReactNode, verb: "Enter" | "Select", explicit?: string): string | undefined {
  if (explicit !== undefined) return explicit || undefined;
  if (typeof label !== "string") return undefined;
  const text = label.trim().replace(/[?:.]+$/, "");
  if (!text) return undefined;
  if (INSTRUCTION.test(text)) return text;
  // Lower-case the first word unless it's an abbreviation (AWS, SSO).
  const [first, ...rest] = text.split(" ");
  const keepCase = first.length > 1 && first === first.toUpperCase();
  const head = keepCase ? first : first.charAt(0).toLowerCase() + first.slice(1);
  return `${verb} ${[head, ...rest].join(" ")}`;
}
