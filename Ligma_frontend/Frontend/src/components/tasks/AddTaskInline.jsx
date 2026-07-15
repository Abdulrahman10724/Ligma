import { useState } from "react";
import { Plus } from "lucide-react";
import { MemberSelector } from "./MemberSelector";
import { TaskDatePicker } from "./TaskDatePicker";
import { PrioritySelector } from "./PrioritySelector";
import { cn } from "@/lib/utils";

function StatusPill({ status }) {
  const map = { "To Do": { label: "TO DO", cls: "border-[color:var(--border)] text-[color:var(--text-secondary)]" }, "In Progress": { label: "IN PROGRESS", cls: "border-blue-500/40 text-blue-400 bg-blue-500/10" }, "Completed": { label: "COMPLETE", cls: "border-green-500/40 text-green-400 bg-green-500/10" } };
  const cfg = map[status] || map["To Do"];
  return (
    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded border tracking-wide", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

export function AddTaskInline({
  sectionStatus = "To Do",
  onAdd,
  members = [],
  depth = 0,
  parentId = null,
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState(null);
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState(null);
  const [loading, setLoading] = useState(false);

  const indentPx = depth * 20 + 28;

  const reset = () => {
    setTitle(""); setDescription(""); setAssigneeId(null);
    setDueDate(null); setPriority(null); setOpen(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
        priority: priority || undefined,
        parentTaskId: parentId || undefined,
        status: sectionStatus,
        type: "Action",
      });
      reset();
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ paddingLeft: `${indentPx}px` }}
        className="w-full flex items-center gap-2 h-9 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--accent)] hover:bg-[color:var(--bg-surface)] transition-colors border-b border-[color:var(--border)]/60"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Task</span>
      </button>
    );
  }

  return (
    <div className="border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]/80 backdrop-blur-sm">
      {/* Title row */}
      <div
        className="flex items-center h-9 gap-2 pr-4"
        style={{ paddingLeft: `${indentPx}px` }}
      >
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") reset();
          }}
          placeholder="Task name or type '/' for commands"
          className="flex-1 bg-transparent outline-none text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)]"
        />
      </div>

      {/* Description row */}
      <div
        className="pb-1 pr-4"
        style={{ paddingLeft: `${indentPx}px` }}
      >
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description"
          className="w-full bg-transparent outline-none text-xs text-[color:var(--text-secondary)] placeholder:text-[color:var(--text-secondary)]/60"
        />
      </div>

      {/* Action bar */}
      <div
        className="flex items-center gap-2 pb-2 pr-4 flex-wrap"
        style={{ paddingLeft: `${indentPx}px` }}
      >
        <StatusPill status={sectionStatus} />
        <MemberSelector value={assigneeId} members={members} onChange={setAssigneeId} />
        <TaskDatePicker value={dueDate} onChange={setDueDate} />
        <PrioritySelector value={priority} onChange={setPriority} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleSave}
          disabled={!title.trim() || loading}
          className="px-3 py-1 text-xs font-medium bg-[color:var(--accent)] text-white rounded-md hover:bg-[color:var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-3 py-1 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AddTaskInline;
