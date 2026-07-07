import React from "react";
import { useDispatch } from "react-redux";
import { RefreshCcw, Trash2 } from "lucide-react";

import { Button } from "../ui/button";
import { revokeInvitationById } from "../../redux/invitationSlice";

const statusClasses = {
  Pending: "bg-amber-500/10 text-amber-700 border-amber-200",
  Accepted: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  Expired: "bg-slate-500/10 text-slate-700 border-slate-200",
  Revoked: "bg-rose-500/10 text-rose-700 border-rose-200",
  Rejected: "bg-zinc-500/10 text-zinc-700 border-zinc-200",
};

function InvitationStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[status] || statusClasses.Pending}`}>
      {status}
    </span>
  );
}

export default function InvitationList({ invitations, workspaceId, onRefresh }) {
  const dispatch = useDispatch();

  const handleRevoke = async (invitationId) => {
    await dispatch(revokeInvitationById({ workspaceId, invitationId }));
    onRefresh?.(workspaceId);
  };

  if (!invitations.length) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 text-sm text-[color:var(--text-secondary)]">
        No invitations yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">{invitation.email}</p>
                <InvitationStatusBadge status={invitation.status} />
              </div>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Role: {invitation.role}</p>
              <p className="text-xs text-[color:var(--text-secondary)]">Expires: {invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString() : "N/A"}</p>
            </div>

            {invitation.status === "Pending" ? (
              <Button variant="outline" size="sm" onClick={() => handleRevoke(invitation.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Revoke
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}