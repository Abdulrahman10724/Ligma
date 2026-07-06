import React from "react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] text-[color:var(--text-primary)] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[color:var(--accent)]">My Workspaces</h1>
            <p className="text-[color:var(--text-secondary)] text-sm">Create and manage your collaborative spaces</p>
          </div>
          <button className="px-4 py-2 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white rounded-md font-medium transition-colors">
            + New Workspace
          </button>
        </header>
        
        {/* Placeholder dashboard card list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg shadow-sm flex flex-col justify-between h-48 hover:border-[color:var(--accent)] transition-colors cursor-pointer">
            <div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[color:var(--accent)] text-white w-max">Lead</span>
              <h3 className="text-lg font-bold mt-2">Example Sprint Plan</h3>
              <p className="text-sm text-[color:var(--text-secondary)] mt-1">Sprint planning for product launch</p>
            </div>
            <div className="flex justify-between items-center text-xs text-[color:var(--text-secondary)]">
              <span>Last active: 2 hours ago</span>
              <span>4 members</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
