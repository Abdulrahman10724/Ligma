import React from "react";
import { ArrowRight, CalendarDays } from "lucide-react";

export default function WorkspaceCard({ workspace, onClick }) {
  const initials = (workspace.title || "W")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const formattedDate = workspace.createdAt
    ? new Date(workspace.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--primary)]/50 hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-[color:var(--primary)]"
    >
      {/* Top teal accent bar */}
      <div className="h-1 bg-[color:var(--primary)] opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[color:var(--primary-soft)] text-[color:var(--primary)] text-sm font-bold shrink-0">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[color:var(--foreground)] truncate leading-tight">
              {workspace.title}
            </p>
            {workspace.description ? (
              <p className="text-xs text-[color:var(--foreground-muted)] mt-0.5 line-clamp-2 leading-relaxed">
                {workspace.description}
              </p>
            ) : (
              <p className="text-xs text-[color:var(--foreground-muted)] mt-0.5 italic">No description</p>
            )}
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-[color:var(--foreground-muted)]">
            {formattedDate && (
              <>
                <CalendarDays className="w-3 h-3" />
                <span>{formattedDate}</span>
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--primary)] group-hover:gap-1.5 transition-all duration-150">
            Open
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}