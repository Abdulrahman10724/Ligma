import React from "react";

export default function SettingsPage() {
  return (
    <div className="w-full h-full p-8 bg-[color:var(--bg-primary)] overflow-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Settings</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">Manage your account and workspace configurations</p>
      </header>

      <div className="max-w-xl bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[color:var(--border)]">
          <h3 className="text-lg font-bold mb-4">Workspace Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[color:var(--text-secondary)] mb-1">WORKSPACE NAME</label>
              <input 
                type="text" 
                defaultValue="Example Sprint Plan" 
                className="w-full p-3 border border-[color:var(--border)] bg-[color:var(--bg-primary)] rounded-md focus:outline-none focus:border-[color:var(--accent)] text-sm"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[color:var(--text-secondary)] mb-1">DESCRIPTION</label>
              <textarea 
                defaultValue="Sprint planning for product launch" 
                rows="3"
                className="w-full p-3 border border-[color:var(--border)] bg-[color:var(--bg-primary)] rounded-md focus:outline-none focus:border-[color:var(--accent)] text-sm"
                disabled
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-red-50/50 dark:bg-red-950/20 border-t border-[color:var(--border)]">
          <h3 className="text-lg font-bold text-red-600 mb-1">Danger Zone</h3>
          <p className="text-xs text-[color:var(--text-secondary)] mb-4">Permanently delete this workspace and all associated canvas nodes, tasks, and events.</p>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-150">
            Delete Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
