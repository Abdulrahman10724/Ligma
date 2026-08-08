import React from "react";
import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { HexColorPicker } from "react-colorful";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_ZONE_DRAFT, ZONE_COLOR_PRESETS } from "@/lib/presence-zone.utils";

const zoneSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
  description: z.string().trim().max(180, "Description is too long").optional(),
  color: z.string().trim().min(4).max(9),
});

function PresenceZoneEditor({ open, onOpenChange, initialValue, onSubmit, saving }) {
  const form = useForm({
    resolver: zodResolver(zoneSchema),
    defaultValues: initialValue || DEFAULT_ZONE_DRAFT,
  });

  useEffect(() => {
    form.reset(initialValue || DEFAULT_ZONE_DRAFT);
  }, [form, initialValue, open]);

  const currentColor = form.watch("color") || DEFAULT_ZONE_DRAFT.color;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-[min(100vw-1rem,34rem)] flex-col overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-0 shadow-2xl sm:w-[min(100vw-2rem,36rem)]">
        <DialogHeader className="border-b border-[color:var(--border)] px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-[color:var(--text-primary)]">
            {initialValue?.id ? "Edit presence zone" : "Create presence zone"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[color:var(--text-secondary)]">
            Group collaboration areas with a reusable label, color, and optional description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                Name
              </label>
              <Input {...form.register("name")} placeholder="Sprint planning" className="h-11 rounded-2xl" />
              {form.formState.errors.name ? (
                <p className="text-xs text-[color:var(--danger)]">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                Description
              </label>
              <Textarea
                {...form.register("description")}
                placeholder="Optional context for collaborators working inside this zone"
                className="min-h-20 rounded-2xl"
              />
              {form.formState.errors.description ? (
                <p className="text-xs text-[color:var(--danger)]">{form.formState.errors.description.message}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                Color presets
              </label>
              <div className="flex flex-wrap gap-2">
                {ZONE_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => form.setValue("color", color, { shouldDirty: true, shouldValidate: true })}
                    className={`h-9 w-9 cursor-pointer rounded-2xl border transition-transform hover:-translate-y-0.5 ${currentColor === color ? "border-[color:var(--text-primary)] shadow-md" : "border-[color:var(--border)]"}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                Custom color
              </label>
              <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-3 shadow-inner">
                <div className="w-full [&>.react-colorful]:!w-full [&>.react-colorful]:!h-40">
                  <HexColorPicker color={currentColor} onChange={(color) => form.setValue("color", color, { shouldDirty: true, shouldValidate: true })} />
                </div>
              </div>
              <Input {...form.register("color")} className="h-10 rounded-2xl font-mono text-xs" />
            </div>

            <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-4 shadow-inner">
              <div className="rounded-2xl border bg-[color:var(--bg-surface)] px-4 py-3 shadow-sm" style={{ borderColor: currentColor }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: currentColor }} />
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">{form.watch("name") || "Zone name"}</p>
                </div>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  {form.watch("description") || "Presence avatars and live collaboration details will appear here."}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-[color:var(--border)] px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-2xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-fuchsia-500 text-white">
              {saving ? "Saving..." : initialValue?.id ? "Save changes" : "Create zone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export default React.memo(PresenceZoneEditor);