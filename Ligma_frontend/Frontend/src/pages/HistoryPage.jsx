import React from "react";

export default function HistoryPage() {
  return (
    <div className="w-full h-full p-8 bg-[color:var(--bg-primary)] overflow-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Workspace History</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">Append-only event log and time travel replay</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Activity Timeline */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Activity Log</h3>
            <div className="relative border-l border-[color:var(--border)] ml-3 pl-6 space-y-6 text-sm">
              <div className="relative">
                <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-[color:var(--accent)] border-2 border-[color:var(--bg-surface)]"></span>
                <span className="text-xs text-[color:var(--text-secondary)]">Just now</span>
                <p className="mt-1"><strong className="font-semibold">Abdul Rahman</strong> created a new sticky note: "Complete Login API"</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-[color:var(--text-secondary)] border-2 border-[color:var(--bg-surface)]"></span>
                <span className="text-xs text-[color:var(--text-secondary)]">10 minutes ago</span>
                <p className="mt-1"><strong className="font-semibold">System</strong> initialized workspace</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Replay Controls */}
        <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg p-6 shadow-sm h-fit">
          <h3 className="text-lg font-bold mb-2">Time Travel Replay</h3>
          <p className="text-xs text-[color:var(--text-secondary)] mb-6">Replay the entire brainstorming session from the beginning.</p>
          <div className="w-full bg-[color:var(--bg-primary)] border border-[color:var(--border)] p-4 rounded-md text-center text-xs font-semibold text-[color:var(--text-secondary)]">
            Replay functionality will be implemented in Phase 13.
          </div>
        </div>
      </div>
    </div>
  );
}
