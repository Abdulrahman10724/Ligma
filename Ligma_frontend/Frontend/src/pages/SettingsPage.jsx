import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router-dom";
import { EyeOff, Trash2 } from "lucide-react";
import DeleteWorkspaceDialog from "../components/workspace/DeleteWorkspaceDialog";
import HideWorkspaceDialog from "../components/workspace/HideWorkspaceDialog";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { fetchWorkspaceById, updateWorkspace } from "../redux/workspaceSlice";
import { fetchWorkspaceInvitations } from "../redux/invitationSlice";
import InviteMemberDialog from "../components/invitations/InviteMemberDialog";
import { PendingInvitationList, InvitationHistoryList } from "../components/invitations/InvitationList";
import ThemeToggle from "../components/ui/ThemeToggle";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().trim().min(2, "Workspace name must be at least 2 characters long"),
  description: z.string().trim().max(500, "Description must be 500 characters or less").optional(),
});

export default function SettingsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeWorkspace, saving, loading, error } = useSelector((state) => state.workspace);
  const { list: invitations, loading: invitationLoading, error: invitationError } = useSelector((state) => state.invitations);
  const { user } = useSelector((state) => state.auth);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    const result = await dispatch(updateWorkspace({ workspaceId: id, payload: values }));

    if (updateWorkspace.fulfilled.match(result)) {
      toast.success("Workspace updated successfully.");
      return;
    }

    const refresh = await dispatch(fetchWorkspaceById(id));
    const refreshedWorkspace = refresh?.payload?.data?.workspace;
    const normalizedTitle = values.title.trim();
    const normalizedDescription = (values.description || "").trim();

    if (fetchWorkspaceById.fulfilled.match(refresh) && refreshedWorkspace?.title === normalizedTitle && (refreshedWorkspace?.description || "") === normalizedDescription) {
      toast.success("Workspace updated successfully.");
      return;
    }

    toast.error(result.payload || refresh.payload?.message || "Unable to update workspace");
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

          {error && !activeWorkspace ? <div className="mt-4 rounded-lg border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm text-[color:var(--danger)]">{error}</div> : null}

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

        <div className="border-b border-[color:var(--border)] p-6">
          <h3 className="text-lg font-semibold">Appearance</h3>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)] mb-5">Customize your workspace appearance.</p>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-sm text-[color:var(--text-primary)]">Theme preference</div>
              <div className="text-xs text-[color:var(--text-secondary)]">Light, dark, or system preference</div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold">Invitation history</h3>
          <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Accepted, rejected, expired, and revoked invitations.</p>
          <div className="mt-5">
            <InvitationHistoryList invitations={invitations} />
          </div>
        </div>
      </div>

      {canManageInvitations && activeWorkspace ? (
        <div className="max-w-2xl mt-6 rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--bg-surface)] overflow-hidden">
          <div className="p-6 border-b border-[color:var(--danger)]/20">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[color:var(--danger)]">Danger zone</h3>
          </div>

          <div className="flex items-center justify-between gap-4 p-5 border-b border-[color:var(--border)]">
            <div>
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">Hide this workspace</p>
              <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">
                Removes it from your dashboard. Nothing is deleted — unhide anytime.
              </p>
            </div>
            <Button variant="outline" onClick={() => setHideOpen(true)} className="gap-1.5 shrink-0">
              <EyeOff className="w-3.5 h-3.5" /> Hide
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">Delete this workspace</p>
              <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">
                Permanently deletes the workspace and everything in it. Cannot be undone.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-1.5 shrink-0">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </div>
        </div>
      ) : null}

      {canManageInvitations ? (
        <InviteMemberDialog workspaceId={id} open={inviteOpen} onOpenChange={setInviteOpen} onCreated={() => dispatch(fetchWorkspaceInvitations(id))} />
      ) : null}

      {activeWorkspace ? (
        <>
          <HideWorkspaceDialog
            workspace={activeWorkspace}
            open={hideOpen}
            onOpenChange={(v) => {
              setHideOpen(v);
              if (!v) navigate("/dashboard");
            }}
            mode="hide"
          />
          <DeleteWorkspaceDialog
            workspace={activeWorkspace}
            open={deleteOpen}
            onOpenChange={(v) => {
              setDeleteOpen(v);
              if (!v) navigate("/dashboard");
            }}
          />
        </>
      ) : null}
    </div>
  );
}
