import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { fetchWorkspaceById, updateWorkspace } from "../redux/workspaceSlice";
import { fetchWorkspaceInvitations } from "../redux/invitationSlice";
import InviteMemberDialog from "../components/invitations/InviteMemberDialog";
import { PendingInvitationList, InvitationHistoryList } from "../components/invitations/InvitationList";

const schema = z.object({
  title: z.string().trim().min(2, "Workspace name must be at least 2 characters long"),
  description: z.string().trim().max(500, "Description must be 500 characters or less").optional(),
});

export default function SettingsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { activeWorkspace, saving, loading, error } = useSelector((state) => state.workspace);
  const { list: invitations, loading: invitationLoading, error: invitationError } = useSelector((state) => state.invitations);
  const { user } = useSelector((state) => state.auth);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchWorkspaceById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (activeWorkspace) {
      reset({ title: activeWorkspace.title || "", description: activeWorkspace.description || "" });
    }
  }, [activeWorkspace, reset]);

  useEffect(() => {
    if (id && activeWorkspace && user?.id && activeWorkspace.ownerId === user.id) {
      dispatch(fetchWorkspaceInvitations(id));
    }
  }, [dispatch, id, activeWorkspace, user?.id]);

  const canManageInvitations = activeWorkspace?.ownerId && user?.id === activeWorkspace.ownerId;

  const onSubmit = async (values) => {
    if (!id) return;
    dispatch(updateWorkspace({ workspaceId: id, payload: values }));
  };

  return (
    <div className="w-full h-full bg-[color:var(--bg-primary)] px-4 py-8 overflow-auto sm:px-6 lg:px-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Workspace settings</h2>
        <p className="text-sm text-[color:var(--text-secondary)]">Manage the basic information for this workspace.</p>
      </header>

      <div className="max-w-2xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] shadow-sm overflow-hidden">
        <div className="border-b border-[color:var(--border)] p-6">
          <h3 className="text-lg font-semibold">Workspace information</h3>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Only the owner can update these details.</p>

          {error ? <div className="mt-4 rounded-lg border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm text-[color:var(--danger)]">{error}</div> : null}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Workspace name</label>
              <Input {...register("title")} disabled={loading || saving} />
              {errors.title ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.title.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Description</label>
              <Textarea rows={4} {...register("description")} disabled={loading || saving} />
              {errors.description ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.description.message}</p> : null}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </div>
          </form>
        </div>

        <div className="border-b border-[color:var(--border)] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Pending invitations</h3>
              <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Create and manage workspace invitation links.</p>
            </div>
            {canManageInvitations ? (
              <Button type="button" onClick={() => setInviteOpen(true)}>Invite member</Button>
            ) : null}
          </div>

          {canManageInvitations ? (
            <div className="mt-5 grid gap-3">
              {invitationLoading ? <p className="text-sm text-[color:var(--text-secondary)]">Loading invitations...</p> : null}
              {invitationError ? <div className="rounded-lg border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm text-[color:var(--danger)]">{invitationError}</div> : null}
              {!invitationLoading ? <PendingInvitationList invitations={invitations} workspaceId={id} onRefresh={(workspaceId) => dispatch(fetchWorkspaceInvitations(workspaceId))} /> : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[color:var(--text-secondary)]">Only the workspace owner can create or manage invitations.</p>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold">Invitation history</h3>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Accepted, rejected, expired, and revoked invitations.</p>
          <div className="mt-5">
            <InvitationHistoryList invitations={invitations} />
          </div>
        </div>
      </div>

      {canManageInvitations ? (
        <InviteMemberDialog workspaceId={id} open={inviteOpen} onOpenChange={setInviteOpen} onCreated={() => dispatch(fetchWorkspaceInvitations(id))} />
      ) : null}
    </div>
  );
}
