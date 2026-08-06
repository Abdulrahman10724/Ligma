export default function WorkspaceLoadingState() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden skeleton-pulse"
        >
          {/* Accent bar */}
          <div className="h-1 bg-[color:var(--surface-muted)]" />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[color:var(--surface-muted)] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[color:var(--surface-muted)] rounded w-3/4" />
                <div className="h-3 bg-[color:var(--surface-muted)] rounded w-full" />
                <div className="h-3 bg-[color:var(--surface-muted)] rounded w-2/3" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-3 bg-[color:var(--surface-muted)] rounded w-24" />
              <div className="h-3 bg-[color:var(--surface-muted)] rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}