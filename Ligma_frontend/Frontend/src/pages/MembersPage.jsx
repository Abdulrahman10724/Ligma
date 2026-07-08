import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Users, UserMinus, ChevronDown, MailOpen, Clock, Loader2 } from "lucide-react";

import { fetchWorkspaceMembers, changeMemberRole, removeMember, fetchPendingInvitations } from "../redux/memberSlice";
import { Button } from "../components/ui/button";
import InviteMemberDialog from "../components/invitations/InviteMemberDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";

const ROLE_OPTIONS = ["Contributor", "Viewer"];

const ROLE_STYLES = {
  Lead: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700",
  Contributor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  Viewer: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function AvatarFallback({ name }) {
  const initials = getInitials(name);
  return (
    <span className="w-9 h-9 rounded-full bg-[color:var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
      {initials || "?"}
    </span>
  );
}

function RoleSelect({ currentRole, isOwner, saving, onChangeRole }) {
  if (isOwner) {
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${ROLE_STYLES.Lead}`}>
        Lead <span className="ml-1 opacity-60 text-[10px]">(owner)</span>
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-opacity cursor-pointer ${ROLE_STYLES[currentRole] || ROLE_STYLES.Viewer} hover:opacity-80`}>
        {currentRole}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-36">
        {ROLE_OPTIONS.map((role) => (
          <DropdownMenuItem
            key={role}
            disabled={saving}
            onSelect={(event) => {
              event.preventDefault();
              onChangeRole(role);
            }}
            className={role === currentRole ? "font-semibold text-[color:var(--accent)]" : "text-[color:var(--text-primary)]"}
          >
            {role}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function MembersPage() {
  const { id: workspaceId } = useParams();
  const dispatch = useDispatch();
  const { list: members, pendingInvitations, loading, saving } = useSelector((state) => state.members);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { activeWorkspace } = useSelector((state) => state.workspace);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null); // { userId, name }

  const isCurrentUserOwner = activeWorkspace?.ownerId === currentUser?.id;
  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const isCurrentUserLead = isCurrentUserOwner || currentMember?.role === "Lead";

  useEffect(() => {
    if (!workspaceId) return;
    dispatch(fetchWorkspaceMembers(workspaceId));
    if (isCurrentUserLead) {
      dispatch(fetchPendingInvitations(workspaceId));
    }
  }, [dispatch, workspaceId, isCurrentUserLead]);

  const handleRoleChange = async (userId, role) => {
    const result = await dispatch(changeMemberRole({ workspaceId, userId, role }));
    if (changeMemberRole.fulfilled.match(result)) {
      toast.success("Role updated");
    } else {
      toast.error(result.payload || "Failed to update role");
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    const result = await dispatch(removeMember({ workspaceId, userId: confirmRemove.userId }));
    setConfirmRemove(null);
    if (removeMember.fulfilled.match(result)) {
      toast.success("Member removed");
    } else {
      toast.error(result.payload || "Failed to remove member");
    }
  };

  return (
    <div className="w-full h-full p-8 bg-[color:var(--bg-primary)] overflow-auto">
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <Users className="w-6 h-6 text-[color:var(--accent)]" />
            Members
          </h2>
          <p className="text-sm text-[color:var(--text-secondary)] mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
          </p>
        </div>
        {isCurrentUserLead && (
          <Button onClick={() => setInviteOpen(true)}>
            Invite Member
          </Button>
        )}
      </header>

      {/* Active Members */}
      <section className="mb-8">
        <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[color:var(--text-secondary)]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading members…</span>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-[color:var(--text-secondary)] mb-3 opacity-40" />
              <p className="text-sm font-medium text-[color:var(--text-secondary)]">No members found</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Member</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Email</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Role</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Joined</th>
                  {isCurrentUserLead && (
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isOwner = !!member.isOwner;
                  const isSelf = member.userId === currentUser?.id;
                  const joinedDate = member.joinedAt
                    ? new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—";

                  return (
                    <tr
                      key={member.id || member.userId}
                      className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--bg-primary)]/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <AvatarFallback name={member.name} />
                          <div>
                            <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                              {member.name}
                              {isSelf && <span className="ml-1.5 text-[10px] font-normal text-[color:var(--text-secondary)] border border-[color:var(--border)] px-1.5 py-0.5 rounded-full">you</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-[color:var(--text-secondary)]">{member.email}</td>
                      <td className="px-5 py-4">
                        {isCurrentUserLead && !isSelf ? (
                          <RoleSelect
                            currentRole={member.role}
                            isOwner={isOwner}
                            saving={saving}
                            onChangeRole={(role) => handleRoleChange(member.userId, role)}
                          />
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${ROLE_STYLES[member.role] || ROLE_STYLES.Viewer}${isOwner ? " opacity-70" : ""}`}>
                            {member.role}
                            {isOwner && <span className="ml-1 opacity-60 text-[10px]">(owner)</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-[color:var(--text-secondary)]">{joinedDate}</td>
                      {isCurrentUserLead && (
                        <td className="px-5 py-4">
                          {!isOwner && !isSelf && (
                            <button
                              onClick={() => setConfirmRemove({ userId: member.userId, name: member.name })}
                              className="inline-flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--danger)] transition-colors"
                            >
                              <UserMinus className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Pending Invitations (Lead only) */}
      {isCurrentUserLead && pendingInvitations.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Email</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Role</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-secondary)]">Expires</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--bg-primary)]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <MailOpen className="w-4 h-4 text-[color:var(--text-secondary)]" />
                        <span className="text-sm text-[color:var(--text-primary)]">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${ROLE_STYLES[inv.role] || ROLE_STYLES.Viewer}`}>
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[color:var(--text-secondary)]">
                      {inv.expiresAt
                        ? new Date(inv.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Invite Dialog */}
      <InviteMemberDialog
        workspaceId={workspaceId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onCreated={() => {
          dispatch(fetchPendingInvitations(workspaceId));
        }}
      />

      {/* Confirm Remove Dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-[color:var(--text-primary)] mb-2">Remove member?</h3>
            <p className="text-sm text-[color:var(--text-secondary)] mb-6">
              <span className="font-medium text-[color:var(--text-primary)]">{confirmRemove.name}</span> will lose access to this workspace immediately.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRemove} disabled={saving}>
                {saving ? "Removing…" : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
