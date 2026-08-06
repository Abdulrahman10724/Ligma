/**
 * StatusBadge — compact pill for role labels, task status, priority,
 * connection state, presence, filter chips.
 *
 * variant: "role-lead" | "role-contributor" | "role-viewer"
 *          "status-todo" | "status-inprogress" | "status-done"
 *          "priority-urgent" | "priority-high" | "priority-medium" | "priority-low"
 *          "connection-connected" | "connection-reconnecting" | "connection-disconnected"
 *          "category-action" | "category-decision" | "category-info" | "category-reference"
 *          "pending" | "accepted" | "expired"
 *          "neutral" (default)
 */

const VARIANT_CLASSES = {
  /* Role */
  "role-lead":
    "bg-[color:var(--primary-soft)] text-[color:var(--primary)] border-[color:var(--primary)]/20",
  "role-contributor":
    "bg-[color:var(--highlight-soft)] text-[color:var(--warning)] border-[color:var(--highlight)]/20",
  "role-viewer":
    "bg-[color:var(--surface-muted)] text-[color:var(--foreground-muted)] border-[color:var(--border)]",

  /* Task status */
  "status-todo":
    "bg-[color:var(--surface-muted)] text-[color:var(--foreground-muted)] border-[color:var(--border)]",
  "status-inprogress":
    "bg-[color:var(--highlight-soft)] text-[color:var(--warning)] border-[color:var(--highlight)]/20",
  "status-done":
    "bg-[color:var(--success-soft)] text-[color:var(--success)] border-[color:var(--success)]/20",

  /* Priority */
  "priority-urgent":
    "bg-[color:var(--danger-soft)] text-[color:var(--danger)] border-[color:var(--danger)]/20",
  "priority-high":
    "bg-[color:var(--secondary-soft)] text-[color:var(--secondary)] border-[color:var(--secondary)]/20",
  "priority-medium":
    "bg-[color:var(--highlight-soft)] text-[color:var(--warning)] border-[color:var(--highlight)]/20",
  "priority-low":
    "bg-[color:var(--surface-muted)] text-[color:var(--foreground-muted)] border-[color:var(--border)]",

  /* Connection */
  "connection-connected":
    "bg-[color:var(--success-soft)] text-[color:var(--success)] border-[color:var(--success)]/20",
  "connection-reconnecting":
    "bg-[color:var(--highlight-soft)] text-[color:var(--warning)] border-[color:var(--highlight)]/20",
  "connection-disconnected":
    "bg-[color:var(--surface-muted)] text-[color:var(--foreground-muted)] border-[color:var(--border)]",

  /* AI categories */
  "category-action":
    "bg-[color:var(--primary-soft)] text-[color:var(--primary)] border-[color:var(--primary)]/20",
  "category-decision":
    "bg-[color:var(--secondary-soft)] text-[color:var(--secondary)] border-[color:var(--secondary)]/20",
  "category-info":
    "bg-[color:var(--highlight-soft)] text-[color:var(--warning)] border-[color:var(--highlight)]/20",
  "category-reference":
    "bg-[color:var(--surface-muted)] text-[color:var(--foreground-muted)] border-[color:var(--border)]",

  /* Invitation states */
  pending:
    "bg-[color:var(--highlight-soft)] text-[color:var(--warning)] border-[color:var(--highlight)]/20",
  accepted:
    "bg-[color:var(--success-soft)] text-[color:var(--success)] border-[color:var(--success)]/20",
  expired:
    "bg-[color:var(--surface-muted)] text-[color:var(--foreground-muted)] border-[color:var(--border)]",

  /* Default */
  neutral:
    "bg-[color:var(--surface-muted)] text-[color:var(--foreground-muted)] border-[color:var(--border)]",
};

export default function StatusBadge({ variant = "neutral", label, className = "" }) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold leading-none ${variantClass} ${className}`}
    >
      {label}
    </span>
  );
}
