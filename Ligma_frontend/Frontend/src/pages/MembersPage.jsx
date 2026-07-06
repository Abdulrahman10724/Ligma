import React from "react";

export default function MembersPage() {
  return (
    <div className="w-full h-full p-8 bg-[color:var(--bg-primary)] overflow-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Members</h2>
          <p className="text-sm text-[color:var(--text-secondary)]">Manage collaborators and roles in this workspace</p>
        </div>
        <button className="px-4 py-2 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white rounded-md font-medium text-sm transition-colors">
          Invite Member
        </button>
      </header>

      <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-xs text-[color:var(--text-secondary)] bg-[color:var(--bg-primary)]">
              <th className="p-4 font-bold">Name</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">Role</th>
              <th className="p-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr className="border-b border-[color:var(--border)] hover:bg-[color:var(--bg-primary)]/50">
              <td className="p-4 flex items-center gap-3 font-semibold">
                <span className="w-8 h-8 rounded-full bg-[color:var(--accent)] text-white flex items-center justify-center font-bold text-xs">
                  AR
                </span>
                Abdul Rahman
              </td>
              <td className="p-4 text-[color:var(--text-secondary)]">abdul@example.com</td>
              <td className="p-4 font-semibold text-[color:var(--accent)]">Lead</td>
              <td className="p-4">
                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 border border-green-200">Active</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
