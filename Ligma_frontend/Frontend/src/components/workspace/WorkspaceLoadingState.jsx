export default function WorkspaceLoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-48 animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]" />
      ))}
    </div>
  );
}