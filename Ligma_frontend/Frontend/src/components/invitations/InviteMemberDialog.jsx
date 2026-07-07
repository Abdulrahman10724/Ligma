import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Link2 } from "lucide-react";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { clearInvitationCreateResult, createWorkspaceInvitation } from "../../redux/invitationSlice";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  role: z.enum(["Contributor", "Viewer"]),
});

export default function InviteMemberDialog({ workspaceId, open, onOpenChange, onCreated }) {
  const dispatch = useDispatch();
  const { saving, createResult, error } = useSelector((state) => state.invitations);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "Contributor" },
  });

  const inviteLink = createResult?.inviteLink || "";

  useEffect(() => {
    if (!open) {
      reset({ email: "", role: "Contributor" });
      dispatch(clearInvitationCreateResult());
    }
  }, [dispatch, open, reset]);

  const role = watch("role");

  const roleOptions = useMemo(() => [
    { value: "Contributor", label: "Contributor" },
    { value: "Viewer", label: "Viewer" },
  ], []);

  const onSubmit = async (values) => {
    if (!workspaceId) {
      return;
    }

    const result = await dispatch(createWorkspaceInvitation({ workspaceId, payload: values }));
    if (createWorkspaceInvitation.fulfilled.match(result)) {
      onCreated?.();
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>Create a secure invitation link for this workspace.</DialogDescription>
        </DialogHeader>

        {error ? <div className="rounded-lg border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm text-[color:var(--danger)]">{error}</div> : null}

        {createResult?.inviteLink ? (
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-4">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">Invitation link created</p>
            <p className="mt-2 break-all rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-sm text-[color:var(--text-secondary)]">{createResult.inviteLink}</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" onClick={copyInviteLink}>
                <Copy className="mr-2 h-4 w-4" /> Copy link
              </Button>
              <Button type="button" variant="ghost" onClick={() => dispatch(clearInvitationCreateResult())}>
                Create another
              </Button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Invitee email</label>
            <Input placeholder="name@company.com" {...register("email")} disabled={saving} />
            {errors.email ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.email.message}</p> : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => reset({ email: watch("email"), role: option.value })}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${role === option.value ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]" : "border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-primary)] hover:border-[color:var(--accent)]"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register("role")} />
            {errors.role ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.role.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create invitation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}