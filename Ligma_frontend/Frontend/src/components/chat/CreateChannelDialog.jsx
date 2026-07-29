import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Channel name must be at least 2 characters")
    .max(40, "Channel name is too long")
    .regex(/^[a-zA-Z0-9-_ ]+$/, "Use letters, numbers, spaces, hyphens, or underscores only"),
  description: z.string().trim().max(140, "Description is too long").optional(),
});

export default function CreateChannelDialog({ open, onOpenChange, onSubmit, saving }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: "", description: "" });
    }
  }, [form, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-0 shadow-2xl">
        <DialogHeader className="border-b border-[color:var(--border)] px-6 py-5">
          <DialogTitle>Create workspace channel</DialogTitle>
          <DialogDescription>
            Spin up a focused discussion space for a stream of work, handoff, or decision trail.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5 px-6 py-5"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              name: values.name.trim().toLowerCase().replace(/\s+/g, "-"),
              description: values.description?.trim() || "",
            });
          })}
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">Channel name</label>
            <Input {...form.register("name")} placeholder="engineering-sync" className="h-11 rounded-2xl" />
            {form.formState.errors.name ? <p className="text-xs text-[color:var(--danger)]">{form.formState.errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">Description</label>
            <Textarea {...form.register("description")} placeholder="Optional channel context" className="min-h-24 rounded-2xl" />
            {form.formState.errors.description ? <p className="text-xs text-[color:var(--danger)]">{form.formState.errors.description.message}</p> : null}
          </div>

          <DialogFooter className="border-t border-[color:var(--border)] px-0 pt-5">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-fuchsia-500 text-white">
              {saving ? "Creating..." : "Create channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
