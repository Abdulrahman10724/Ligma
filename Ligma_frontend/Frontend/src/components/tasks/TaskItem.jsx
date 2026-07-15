import { useState, useCallback, memo, useEffect } from "react";
import { GripVertical, ChevronRight, Pencil, Plus, AlignLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { StatusSelector } from "./StatusSelector";
import { PrioritySelector } from "./PrioritySelector";
import { MemberSelector } from "./MemberSelector";
import { TaskDatePicker } from "./TaskDatePicker";
import { InlineTitleEditor } from "./InlineTitleEditor";
import { DescriptionViewer } from "./DescriptionViewer";

const INDENT = 20;

// ── Inline subtask add form ───────────────────────────────────────────────────
function SubtaskAddForm({ depth, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try { await onSave(title.trim()); } finally { setLoading(false); }
  };

  return (
    <div
      className="flex items-center h-9 gap-2 border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]/60"
      style={{ paddingLeft: `${depth * INDENT + 52}px`, paddingRight: 16 }}
    >
      <div className="w-4 h-4 rounded border-2 border-[color:var(--accent)] flex-shrink-0" />
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        onBlur={() => { if (title.trim()) submit(); else onCancel(); }}
        placeholder="Subtask name…"
        className="flex-1 bg-transparent outline-none text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)]"
      />
      {loading && <span className="text-xs text-[color:var(--text-secondary)]">Saving…</span>}
    </div>
  );
}

// ── Selection checkbox ────────────────────────────────────────────────────────
function SelectionCheckbox({ selected, onToggle }) {
  return (
    <button
      type="button"
      title={selected ? "Deselect" : "Select task"}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="flex-shrink-0 w-5 h-5 flex items-center justify-center ml-1 mt-0.5 group/check"
    >
      {selected ? (
        <svg className="w-4 h-4 text-[color:var(--accent)]" viewBox="0 0 16 16" fill="none">
          <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <div className="w-4 h-4 rounded-[3px] border-2 border-[color:var(--border)] group-hover/check:border-[color:var(--accent)] transition-colors duration-100" />
      )}
    </button>
  );
}

// ── TaskItem ──────────────────────────────────────────────────────────────────
export const TaskItem = memo(function TaskItem({
  task,
  depth = 0,
  members,
  allTasks,
  selectedIds,
  onToggleSelect,
  onUpdate,
  onStatusChange,
  onDelete,
  onAddSubtask,
  dragHandleProps, // null = locked (has priority), object = useSortable listeners
  isDragging = false, // true while this item is being dragged (suppresses layout animation)
}) {
  const [hovered, setHovered]               = useState(false);
  const [isRenaming, setIsRenaming]         = useState(false);
  const [showDescEditor, setShowDescEditor] = useState(false);
  const [addingSubtask, setAddingSubtask]   = useState(false);

  // Children: direct children of this task from the full flat list
  const children   = allTasks.filter((t) => String(t.parentTaskId) === String(task.id));
  const hasChildren = children.length > 0 || addingSubtask;

  // Auto-expand when children exist
  const [isExpanded, setIsExpanded] = useState(children.length > 0);
  useEffect(() => {
    if (children.length > 0) setIsExpanded(true);
  }, [children.length]);

  const indent     = depth * INDENT;
  const isSelected = selectedIds?.has(task.id) ?? false;
  // dragHandleProps === null means locked (has priority); undefined/object = draggable
  const isDraggable = dragHandleProps !== null;

  const handleSaveTitle = useCallback((title) => {
    if (title && title !== task.title) onUpdate(task.id, { title });
    setIsRenaming(false);
  }, [task.id, task.title, onUpdate]);

  const handleSaveSubtask = useCallback(async (title) => {
    await onAddSubtask(task.id, { title, type: task.type || "Action", status: "To Do" });
    setAddingSubtask(false);
    setIsExpanded(true);
  }, [task.id, task.type, onAddSubtask]);

  return (
    <motion.div
      layout={!isDragging}  // disable layout animation during drag — framer-motion fights dnd-kit's CSS transform
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ duration: 0.15 }}
    >
      {/* ── Main row ── */}
      <div
        className={cn(
          "flex items-center min-h-[36px] border-b border-[color:var(--border)] transition-colors duration-100 relative group",
          hovered && "bg-[color:var(--bg-surface)]",
          isSelected && "bg-[color:var(--accent)]/5 border-l-2 border-l-[color:var(--accent)]"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Name cell */}
        <div className="flex items-start flex-1 min-w-0 py-1.5" style={{ paddingLeft: `${indent + 8}px` }}>
          {/* Drag handle — hidden when locked (priority set) or at depth>0 */}
          <span
            {...(isDraggable && depth === 0 ? dragHandleProps : {})}
            className={cn(
              "flex-shrink-0 w-4 flex items-center justify-center mt-0.5 transition-opacity duration-100",
              isDraggable && depth === 0 ? "cursor-grab" : "cursor-default",
              hovered && isDraggable && depth === 0 ? "opacity-50" : "opacity-0"
            )}
          >
            <GripVertical className="w-3.5 h-3.5 text-[color:var(--text-secondary)]" />
          </span>

          {/* Selection checkbox */}
          <SelectionCheckbox selected={isSelected} onToggle={() => onToggleSelect?.(task.id)} />

          {/* Expand/collapse arrow — VS Code style, only when has children */}
          <button
            type="button"
            className={cn(
              "flex-shrink-0 w-4 h-4 flex items-center justify-center ml-1 mt-0.5 transition-transform duration-150",
              isExpanded && "rotate-90",
              !hasChildren && "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsExpanded((v) => !v)}
          >
            <ChevronRight className="w-3.5 h-3.5 text-[color:var(--text-secondary)]" />
          </button>

          {/* Title + description */}
          <div className="flex-1 min-w-0 ml-2 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 min-w-0">
              {isRenaming ? (
                <InlineTitleEditor value={task.title} onSave={handleSaveTitle} onCancel={() => setIsRenaming(false)} />
              ) : (
                <>
                  <span
                    className={cn(
                      "text-sm leading-5 truncate select-none",
                      task.status === "Completed"
                        ? "line-through text-[color:var(--text-secondary)]"
                        : "text-[color:var(--text-primary)]"
                    )}
                    onDoubleClick={() => setIsRenaming(true)}
                  >
                    {task.title}
                  </span>

                  {/* Hover action icons */}
                  <div className={cn("flex items-center gap-0 flex-shrink-0 transition-opacity duration-100", hovered ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    {[
                      { icon: Pencil,    title: "Rename",          action: () => setIsRenaming(true) },
                      { icon: Plus,      title: "Add Subtask",     action: () => { setAddingSubtask(true); setIsExpanded(true); } },
                      { icon: AlignLeft, title: "Add Description", action: () => setShowDescEditor((v) => !v) },
                    ].map(({ icon: Icon, title, action }) => (
                      <button
                        key={title}
                        type="button"
                        title={title}
                        onClick={(e) => { e.stopPropagation(); action(); }}
                        className="p-1 rounded transition-colors duration-100 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-primary)]"
                      >
                        <Icon className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Inline description preview */}
            {!showDescEditor && (
              <DescriptionViewer
                description={task.description}
                onSave={(desc) => onUpdate(task.id, { description: desc })}
              />
            )}
          </div>
        </div>

        {/* Right fixed columns */}
        <div className="flex items-center flex-shrink-0 self-stretch">
          <div className="w-[96px] h-full flex items-center justify-center border-l border-[color:var(--border)]/30">
            <MemberSelector value={task.assigneeId} members={members} onChange={(id) => onUpdate(task.id, { assigneeId: id })} />
          </div>
          <div className="w-[110px] h-full flex items-center justify-center border-l border-[color:var(--border)]/30">
            <TaskDatePicker value={task.dueDate} onChange={(date) => onUpdate(task.id, { dueDate: date })} />
          </div>
          <div className="w-[110px] h-full flex items-center justify-center border-l border-[color:var(--border)]/30">
            <PrioritySelector value={task.priority} onChange={(p) => onUpdate(task.id, { priority: p })} />
          </div>
          <div className="w-[160px] h-full flex items-center justify-center border-l border-[color:var(--border)]/30 pr-2">
            <StatusSelector value={task.status} onChange={(status) => onStatusChange(task.id, status)} />
          </div>
        </div>
      </div>

      {/* Description editor (expanded row) */}
      <AnimatePresence>
        {showDescEditor && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }} className="overflow-hidden"
          >
            <div className="py-2 border-b border-[color:var(--border)] pr-4" style={{ paddingLeft: `${indent + 52}px` }}>
              <DescriptionViewer
                description={task.description}
                onSave={(desc) => { onUpdate(task.id, { description: desc }); setShowDescEditor(false); }}
                editMode
                onEditClose={() => setShowDescEditor(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtree — smooth expand/collapse */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden"
          >
            <AnimatePresence>
              {children.map((child) => (
                <TaskItem
                  key={child.id}
                  task={child}
                  depth={depth + 1}
                  members={members}
                  allTasks={allTasks}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  onUpdate={onUpdate}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                  onAddSubtask={onAddSubtask}
                  dragHandleProps={null} // subtasks are never manually sortable
                />
              ))}
            </AnimatePresence>

            {addingSubtask && (
              <SubtaskAddForm
                depth={depth + 1}
                onSave={handleSaveSubtask}
                onCancel={() => setAddingSubtask(false)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default TaskItem;
