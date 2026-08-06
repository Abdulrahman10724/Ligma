/**
 * EmptyState — consistent empty/zero-data pattern used across all pages.
 * Renders: small icon + title + optional description + optional action button.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,       // { label, onClick }
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center gap-3 ${className}`}
    >
      {Icon && (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[color:var(--surface-muted)] text-[color:var(--foreground-muted)]">
          <Icon className="w-5 h-5" />
        </span>
      )}

      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-[color:var(--foreground)]">{title}</p>
        {description && (
          <p className="text-xs text-[color:var(--foreground-muted)] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[color:var(--primary)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
