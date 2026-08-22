import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { hideWorkspace, unhideWorkspace } from "../../redux/workspaceSlice";

export default function HideWorkspaceDialog({ workspace, open, onOpenChange, mode = "hide" }) {
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const isHide = mode === "hide";

  const handleConfirm = async () => {
    if (!workspace) return;
    setSaving(true);
    const thunk = isHide ? hideWorkspace : unhideWorkspace;
    const result = await dispatch(thunk(workspace.id));
    setSaving(false);
    if (thunk.fulfilled.match(result)) {
      toast.success(isHide ? "Workspace hidden" : "Workspace unhidden");
      onOpenChange(false);
    } else {
      toast.error(result.payload || `Failed to ${mode} workspace`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isHide ? "Hide workspace?" : "Unhide workspace?"}</DialogTitle>
          <DialogDescription>
            {isHide ? (
              <>This will hide <span className="font-semibold text-[color:var(--text-primary)]">{workspace?.title}</span> from your dashboard. Nothing is deleted — you can unhide it anytime.</>
            ) : (
              <>This will bring <span className="font-semibold text-[color:var(--text-primary)]">{workspace?.title}</span> back to your main dashboard.</>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? "Saving..." : "Yes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}