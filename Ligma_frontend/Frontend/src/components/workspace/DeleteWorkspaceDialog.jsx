import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { deleteWorkspace } from "../../redux/workspaceSlice";

export default function DeleteWorkspaceDialog({ workspace, open, onOpenChange }) {
  const dispatch = useDispatch();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmText.trim() === workspace?.title;

  const handleDelete = async () => {
    if (!canDelete || !workspace) return;
    setDeleting(true);
    const result = await dispatch(deleteWorkspace({ workspaceId: workspace.id, confirmTitle: confirmText.trim() }));
    setDeleting(false);
    if (deleteWorkspace.fulfilled.match(result)) {
      toast.success("Workspace deleted");
      setConfirmText("");
      onOpenChange(false);
    } else {
      toast.error(result.payload || "Failed to delete workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setConfirmText(""); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[color:var(--danger)]">Delete workspace</DialogTitle>
          <DialogDescription>
            This action <span className="font-semibold text-[color:var(--danger)]">cannot be undone</span>. This will
            permanently delete <span className="font-semibold text-[color:var(--text-primary)]">{workspace?.title}</span>{" "}
            and all of its canvas nodes, tasks, and history from the database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-[color:var(--text-secondary)]">
            Please type <span className="font-semibold text-[color:var(--text-primary)]">{workspace?.title}</span> to confirm.
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={workspace?.title}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!canDelete || deleting} onClick={handleDelete}>
            {deleting ? "Deleting..." : "Delete this workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}