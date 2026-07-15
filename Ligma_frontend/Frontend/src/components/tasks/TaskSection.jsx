import { useState, memo, useCallback } from "react";
import { ChevronDown, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge } from "./StatusSelector";
import { TaskItem } from "./TaskItem";
import { AddTaskInline } from "./AddTaskInline";

// ── Column headers ─────────────────────────────────────────────────────────────
function ColumnHeaders() {
  return (
    <div className="flex items-center h-8 border-b border-[color:var(--border)] bg-[color:var(--bg-primary)]/60 sticky top-0 z-10">
      <div className="flex-1 min-w-0 px-4 text-[11px] font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide select-none">Name</div>
      <div className="flex items-center flex-shrink-0 text-[11px] font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide select-none">
        <div className="w-[96px] text-center border-l border-[color:var(--border)]/30">Assignee</div>
        <div className="w-[110px] text-center border-l border-[color:var(--border)]/30">Due date</div>
        <div className="w-[110px] text-center border-l border-[color:var(--border)]/30">Priority</div>
        <div className="w-[160px] text-center border-l border-[color:var(--border)]/30 pr-2">Status</div>
      </div>
    </div>
  );
}

// ── Bulk-action toolbar ────────────────────────────────────────────────────────
function BulkActionBar({ count, onDeleteSelected, onClear }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          key="bulk-bar"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-3 px-4 h-9 bg-[color:var(--accent)]/10 border-b border-[color:var(--accent)]/20"
        >
          <span className="text-xs font-medium text-[color:var(--accent)]">{count} selected</span>
          <button type="button" onClick={onDeleteSelected}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-md transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete selected
          </button>
          <button type="button" onClick={onClear}
            className="ml-auto p-1 rounded text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-primary)] transition-colors" title="Clear selection">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Sortable wrapper for draggable (priority-less) tasks ──────────────────────
function SortableTaskItem({ task, ...rest }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskItem task={task} dragHandleProps={{ ...attributes, ...listeners }} isDragging={isDragging} {...rest} />
    </div>
  );
}

// ── TaskSection ───────────────────────────────────────────────────────────────
export const TaskSection = memo(function TaskSection({
  status,
  tasks,
  allTasks,
  members,
  onUpdate,
  onStatusChange,
  onDelete,
  onAddSubtask,
  onAdd,
  onReorder,
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed]     = useState(defaultCollapsed);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect  = useCallback((id) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const handleDeleteSelected = useCallback(() => {
    selectedIds.forEach((id) => onDelete(id));
    setSelectedIds(new Set());
  }, [selectedIds, onDelete]);

  // Split: priority tasks are auto-sorted (locked), priority-less are draggable
  const priorityTasks = tasks.filter((t) => t.priority);
  const freeTasks     = tasks.filter((t) => !t.priority);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIdx = freeTasks.findIndex((t) => t.id === active.id);
    const newIdx = freeTasks.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(freeTasks, oldIdx, newIdx).map((t, i) => ({ ...t, order: i }));
    onReorder?.(reordered);
  }, [freeTasks, onReorder]);

  // Render order: priority-locked first, then draggable free tasks
  const orderedTasks = [...priorityTasks, ...freeTasks];

  return (
    <div className="mb-1">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 h-10 cursor-pointer select-none hover:bg-[color:var(--bg-surface)] transition-colors"
        onClick={() => setCollapsed((v) => !v)}>
        <motion.span animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.15 }} className="text-[color:var(--text-secondary)]">
          <ChevronDown className="w-4 h-4" />
        </motion.span>
        <StatusBadge status={status} />
        <span className="text-sm font-semibold text-[color:var(--text-secondary)]">{tasks.length}</span>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <BulkActionBar count={selectedIds.size} onDeleteSelected={handleDeleteSelected} onClear={clearSelection} />
            <ColumnHeaders />

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={freeTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <AnimatePresence>
                  {orderedTasks.map((task) => {
                    const isDraggable = !task.priority;
                    return isDraggable ? (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        depth={0}
                        members={members}
                        allTasks={allTasks}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onUpdate={onUpdate}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                        onAddSubtask={onAddSubtask}
                      />
                    ) : (
                      <TaskItem
                        key={task.id}
                        task={task}
                        depth={0}
                        members={members}
                        allTasks={allTasks}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onUpdate={onUpdate}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                        onAddSubtask={onAddSubtask}
                        dragHandleProps={null} // locked — no drag
                      />
                    );
                  })}
                </AnimatePresence>
              </SortableContext>
            </DndContext>

            {tasks.length === 0 && (
              <div className="border-b border-[color:var(--border)] h-9 flex items-center px-10 text-xs text-[color:var(--text-secondary)]/50 italic">No tasks</div>
            )}

            {/* Add Task is read-only for Completed tasks */}
            {status !== "Completed" && (
              <AddTaskInline sectionStatus={status} onAdd={onAdd} members={members} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TaskSection;
