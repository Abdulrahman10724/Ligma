import React from "react";
import { useParams, Link } from "react-router-dom";

export default function AcceptInvitationPage() {
  const { token } = useParams();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
      <div className="w-full max-w-md p-8 bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg shadow-sm text-center">
        <h2 className="text-2xl font-bold mb-4 text-[color:var(--accent)]">Workspace Invitation</h2>
        <p className="text-sm text-[color:var(--text-secondary)] mb-6">
          You have been invited to join the workspace. Please accept the invitation to begin collaborating.
        </p>
        <div className="flex flex-col gap-3">
          <button className="w-full py-3 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white font-medium rounded-md transition-colors duration-150">
            Accept Invitation (Phase 4)
          </button>
          <Link to="/dashboard" className="w-full py-3 bg-[color:var(--bg-primary)] hover:bg-[color:var(--border)] border border-[color:var(--border)] font-medium rounded-md text-sm transition-colors duration-150">
            Decline
          </Link>
        </div>
        <p className="text-xs text-[color:var(--text-secondary)] mt-4">Token: {token}</p>
      </div>
    </div>
  );
}
