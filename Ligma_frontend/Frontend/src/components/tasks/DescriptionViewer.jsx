import { useState, useEffect } from "react";
import { AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function DescriptionViewer({ description, onSave, editMode = false, onEditClose }) {
  const [expanded, setExpanded] = useState(editMode);
  const [editing, setEditing] = useState(editMode);
  const [draft, setDraft] = useState(description || "");

  useEffect(() => {
    if (editMode) { setExpanded(true); setEditing(true); setDraft(description || ""); }
  }, [editMode]);

  const save = () => {
    onSave?.(draft);
    setEditing(false);
    if (draft) setExpanded(true);
    onEditClose?.();
  };

  const cancel = () => {
    setDraft(description || "");
    setEditing(false);
    onEditClose?.();
  };

  if (!description && !editMode) return null;

  return (
    <div className="mt-0.5">
      {description && !editing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex items-center gap-1 text-[10px] rounded px-0.5 py-0.5 transition-colors w-fit",
            expanded ? "text-[color:var(--accent)]" : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
          )}
        >
          <AlignLeft className="w-3 h-3" />
        </button>
      )}

      {expanded && description && !editing && (
        <p
          className="mt-1 text-xs text-[color:var(--text-secondary)] cursor-text hover:text-[color:var(--text-primary)] transition-colors leading-relaxed"
          onClick={() => setEditing(true)}
        >
          {description}
        </p>
      )}

      {editing && (
        <div className="mt-1 flex flex-col gap-1.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            rows={2}
            className="w-full bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded px-2 py-1.5 text-xs text-[color:var(--text-primary)] resize-none outline-none focus:border-[color:var(--accent)] transition-colors"
            placeholder="Add a description..."
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="px-2.5 py-1 text-xs bg-[color:var(--accent)] text-white rounded hover:bg-[color:var(--accent-hover)] transition-colors font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancel}
              className="px-2.5 py-1 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DescriptionViewer;
