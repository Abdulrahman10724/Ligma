import React from "react";
import { Clock } from "lucide-react";

// ponytail: centered layout for empty workspace activity feed
export default function HistoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-2xl shadow-sm">
      <div className="flex items-center justify-center p-4 bg-zinc-500/10 border border-zinc-500/20 text-[color:var(--text-secondary)] rounded-full mb-4">
        <Clock className="w-10 h-10 animate-pulse" />
      </div>
      <h3 className="text-lg font-bold text-[color:var(--text-primary)] mb-2">No activity yet</h3>
      <p className="text-sm text-[color:var(--text-secondary)] max-w-sm">
        Workspace events will appear here in real-time as team members edit nodes, create tasks, or change permissions.
      </p>
    </div>
  );
}
