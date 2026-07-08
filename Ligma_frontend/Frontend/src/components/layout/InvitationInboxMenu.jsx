import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, Check, X } from "lucide-react";

import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { acceptMyInvitationById, fetchMyPendingInvitations, rejectMyInvitationById } from "../../redux/invitationSlice";
import { fetchWorkspaces } from "../../redux/workspaceSlice";

export default function InvitationInboxMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inbox = useSelector((state) => state.invitations.inbox || []);
  const inboxLoading = useSelector((state) => state.invitations.inboxLoading);

  useEffect(() => {
    dispatch(fetchMyPendingInvitations());
    const timer = window.setInterval(() => dispatch(fetchMyPendingInvitations()), 30000);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  const handleAccept = async (invitation) => {
    const result = await dispatch(acceptMyInvitationById(invitation.id));
    if (acceptMyInvitationById.fulfilled.match(result)) {
      await dispatch(fetchWorkspaces());
      const workspaceId = result.payload?.data?.workspace?.id || invitation.workspaceId;
      if (workspaceId) {
        navigate(`/workspace/${workspaceId}/settings`, { replace: true });
      }
    }
  };

  const handleReject = async (invitation) => {
    await dispatch(rejectMyInvitationById(invitation.id));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-2.5 shadow-sm transition-colors hover:border-[color:var(--accent)] focus:outline-none">
        <Bell className="h-4 w-4 text-[color:var(--text-primary)]" />
        {inbox.length > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[color:var(--danger)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {inbox.length}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-96 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">Invitation inbox</p>
            <p className="text-xs text-[color:var(--text-secondary)]">Pending invitations across your workspaces</p>
          </div>
          <span className="text-xs text-[color:var(--text-secondary)]">{inbox.length} pending</span>
        </div>

        {inboxLoading ? (
          <p className="py-6 text-sm text-[color:var(--text-secondary)]">Loading invitations...</p>
        ) : inbox.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-primary)] p-5 text-sm text-[color:var(--text-secondary)]">
            No pending invitations.
          </div>
        ) : (
          <div className="grid gap-3">
            {inbox.map((invitation) => (
              <div key={invitation.id} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-3">
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">{invitation.workspaceTitle}</p>
                <p className="text-xs text-[color:var(--text-secondary)]">{invitation.email} · {invitation.role}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => handleAccept(invitation)}>
                    <Check className="mr-1.5 h-4 w-4" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleReject(invitation)}>
                    <X className="mr-1.5 h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}