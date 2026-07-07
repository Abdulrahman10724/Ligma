import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { createWorkspace } from "../../redux/workspaceSlice";

const schema = z.object({
  title: z.string().trim().min(2, "Workspace name must be at least 2 characters long"),
  description: z.string().trim().max(500, "Description must be 500 characters or less").optional(),
});

export default function CreateWorkspaceDialog({ open, onOpenChange }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { saving, activeWorkspace } = useSelector((state) => state.workspace);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });

  useEffect(() => {
    if (activeWorkspace && !open) {
      reset({ title: "", description: "" });
    }
  }, [activeWorkspace, open, reset]);

  const onSubmit = async (values) => {
    const result = await dispatch(createWorkspace(values));
    if (createWorkspace.fulfilled.match(result)) {
      const workspace = result.payload?.data?.workspace;
      onOpenChange(false);
      if (workspace?.id) {
        navigate(`/workspace/${workspace.id}/settings`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>Set up a new collaborative space for your team.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <Input placeholder="Workspace name" {...register("title")} />
            {errors.title ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.title.message}</p> : null}
          </div>
          <div>
            <Textarea rows={4} placeholder="Description" {...register("description")} />
            {errors.description ? <p className="mt-1 text-xs text-[color:var(--danger)]">{errors.description.message}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create workspace"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}