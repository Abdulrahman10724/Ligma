import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Check, LogIn, UserPlus, XCircle } from "lucide-react";

import { Button } from "../components/ui/button";
import { fetchWorkspaces } from "../redux/workspaceSlice";
import { fetchInvitationByToken, acceptInvitationByToken, rejectInvitationByToken, clearCurrentInvitation } from "../redux/invitationSlice";

export default function AcceptInvitationPage() {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentInvitation, publicLoading, error } = useSelector((state) => state.invitations);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchInvitationByToken(token));
    }

    return () => {
      dispatch(clearCurrentInvitation());
    };
  }, [dispatch, token]);

  const handleAccept = async () => {
    const result = await dispatch(acceptInvitationByToken(token));
    if (acceptInvitationByToken.fulfilled.match(result)) {
      dispatch(fetchWorkspaces());
      const workspaceId = result.payload?.data?.workspace?.id;
      if (workspaceId) {
        navigate(`/workspace/${workspaceId}/settings`, { replace: true });
      }
    }
  };

  const handleReject = async () => {
    const result = await dispatch(rejectInvitationByToken(token));
    if (rejectInvitationByToken.fulfilled.match(result)) {
      navigate("/dashboard", { replace: true });
    }
  };

  const invitation = currentInvitation;
  const invitationEmail = invitation?.email || "";
  const canRespond = isAuthenticated && user?.email?.toLowerCase() === invitationEmail.toLowerCase() && invitation?.status === "Pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] px-4 text-[color:var(--text-primary)]">
      <div className="w-full max-w-lg rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-8 shadow-sm text-left">
        <h2 className="text-3xl font-bold text-[color:var(--accent)]">Workspace invitation</h2>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Review the invitation before joining the workspace.</p>

        {publicLoading ? <p className="mt-6 text-sm text-[color:var(--text-secondary)]">Loading invitation...</p> : null}
        {error ? <div className="mt-6 rounded-lg border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm text-[color:var(--danger)]">{error}</div> : null}

        {invitation ? (
          <div className="mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Workspace</p>
            <h3 className="mt-1 text-xl font-semibold text-[color:var(--text-primary)]">{invitation.workspaceTitle}</h3>
            <div className="mt-4 grid gap-2 text-sm text-[color:var(--text-secondary)]">
              <p><span className="font-medium text-[color:var(--text-primary)]">Invitee:</span> {invitation.email}</p>
              <p><span className="font-medium text-[color:var(--text-primary)]">Role:</span> {invitation.role}</p>
              <p><span className="font-medium text-[color:var(--text-primary)]">Status:</span> {invitation.status}</p>
            </div>

            {canRespond ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1" onClick={handleAccept}>
                  <Check className="mr-2 h-4 w-4" /> Accept invitation
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleReject}>
                  <XCircle className="mr-2 h-4 w-4" /> Decline
                </Button>
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-4 text-sm text-[color:var(--text-secondary)]">
                {isAuthenticated ? (
                  <p>This invitation is assigned to <span className="font-medium text-[color:var(--text-primary)]">{invitationEmail}</span>. Sign in with that account to continue.</p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link to="/login" className="inline-flex flex-1 items-center justify-center rounded-md bg-[color:var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[color:var(--accent-hover)]">
                      <LogIn className="mr-2 h-4 w-4" /> Sign in
                    </Link>
                    <Link to="/register" className="inline-flex flex-1 items-center justify-center rounded-md border border-[color:var(--border)] px-4 py-2.5 text-sm font-medium text-[color:var(--text-primary)] hover:border-[color:var(--accent)]">
                      <UserPlus className="mr-2 h-4 w-4" /> Create account
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <p className="mt-6 text-xs text-[color:var(--text-secondary)]">Token: {token}</p>
      </div>
    </div>
  );
}
