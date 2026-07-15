import { useEffect, useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare, GitBranch, Info, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchTasks,
  createTask,
  updateTask,
  patchTaskStatus,
  deleteTask,
  optimisticUpdate,
  optimisticRemove,
  socketTaskCreated,
  socketTaskUpdated,
  socketTaskDeleted,
  clearTasks,
} from "../redux/taskSlice";
import { fetchWorkspaceMembers } from "../redux/memberSlice";
import useSocket from "../hooks/useSocket";
import { TaskSection } from "../components/tasks/TaskSection";
import { DecisionItem } from "../components/tasks/DecisionItem";
import { InfoItem } from "../components/tasks/InfoItem";
import { ReferenceItem } from "../components/tasks/ReferenceItem";

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTIONS = [
  { status: "To Do",       defaultCollapsed: false },
  { status: "In Progress", defaultCollapsed: false },
  { status: "Completed",   defaultCollapsed: true  },
];

const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.priority && b.priority)
      return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (a.priority) return -1;
    if (b.priority) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  {
    id: "Action",
    label: "Action Items",
    icon: CheckSquare,
    description: "AI-detected tasks & manual items",
    accentColor: "text-red-400",
    accentBg: "bg-red-500/10",
    accentBorder: "border-red-500/30",
    indicatorColor: "bg-red-400",
  },
  {
    id: "Decision",
    label: "Decisions",
    icon: GitBranch,
    description: "Key decisions captured from canvas",
    accentColor: "text-green-400",
    accentBg: "bg-green-500/10",
    accentBorder: "border-green-500/30",
    indicatorColor: "bg-green-400",
  },
  {
    id: "Information",
    label: "Information",
    icon: Info,
    description: "Context & notes extracted by AI",
    accentColor: "text-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/30",
    indicatorColor: "bg-amber-400",
  },
  {
    id: "Reference",
    label: "References",
    icon: Link2,
    description: "URLs & references detected by Regex",
    accentColor: "text-violet-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/30",
    indicatorColor: "bg-violet-400",
  },
];

// ── FlatList (used for Decision / Information / Reference) ───────────────────
function FlatList({ tasks, members, EmptyIcon, emptyLabel }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-[color:var(--text-secondary)]">
        <EmptyIcon className="w-8 h-8 opacity-30" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="flex-1">
      <AnimatePresence>
        {tasks.map((task) => {
          if (task.type === "Decision")
            return <DecisionItem key={task.id} task={task} members={members} />;
          if (task.type === "Information")
            return <InfoItem key={task.id} task={task} members={members} />;
          if (task.type === "Reference")
            return <ReferenceItem key={task.id} task={task} />;
          return null;
        })}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TaskBoardPage() {
  const { id: workspaceId } = useParams();
  const dispatch   = useDispatch();
  const { list: allTasks, loading } = useSelector((s) => s.tasks);
  const members    = useSelector((s) => s.members.list);
  const { on, off } = useSocket({ workspaceId });

  const [activeTab, setActiveTab] = useState("Action");

  // ── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return;
    dispatch(fetchTasks(workspaceId));
    dispatch(fetchWorkspaceMembers(workspaceId));
    return () => { dispatch(clearTasks()); };
  }, [dispatch, workspaceId]);

  // ── Socket sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onCreated = (task) => dispatch(socketTaskCreated(task));
    const onUpdated = (task) => dispatch(socketTaskUpdated(task));
    const onDeleted = (payload) => dispatch(socketTaskDeleted(payload));
    on("tasks:created", onCreated);
    on("tasks:updated", onUpdated);
    on("tasks:deleted", onDeleted);
    return () => {
      off("tasks:created", onCreated);
      off("tasks:updated", onUpdated);
      off("tasks:deleted", onDeleted);
    };
  }, [on, off, dispatch]);

  // ── Derived data ──────────────────────────────────────────────────────────
  // Root tasks for action items board (status-sectioned)
  const sectionTasks = useMemo(() => {
    const roots = allTasks.filter(
      (t) => !t.parentTaskId && (t.type === "Action" || !t.type)
    );
    const byStatus = {};
    for (const s of SECTIONS) byStatus[s.status] = [];
    for (const t of roots) {
      const key = t.status || "To Do";
      if (byStatus[key]) byStatus[key].push(t);
    }
    for (const key of Object.keys(byStatus)) byStatus[key] = sortTasks(byStatus[key]);
    return byStatus;
  }, [allTasks]);

  // Flat lists per type
  const decisionTasks    = useMemo(() => allTasks.filter((t) => t.type === "Decision"),    [allTasks]);
  const informationTasks = useMemo(() => allTasks.filter((t) => t.type === "Information"), [allTasks]);
  // ponytail: include Reference-type tasks + synthetic entries from metadata.references of other tasks
  const referenceTasks = useMemo(() => {
    const explicit = allTasks.filter((t) => t.type === "Reference");
    const fromMeta = allTasks
      .filter((t) => t.type !== "Reference" && t.metadata?.references?.length)
      .map((t) => ({
        ...t,
        // synthetic id so keys don't clash
        id: `${t.id}__ref`,
        type: "Reference",
        title: t.title,
        description: t.description,
        metadata: t.metadata,
      }));
    return [...explicit, ...fromMeta];
  }, [allTasks]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAdd = useCallback(
    async (data) => { await dispatch(createTask({ workspaceId, data })); },
    [dispatch, workspaceId]
  );

  const handleUpdate = useCallback(
    (taskId, data) => {
      dispatch(optimisticUpdate({ id: taskId, ...data }));
      dispatch(updateTask({ workspaceId, taskId, data })).then((res) => {
        if (res.meta.requestStatus === "rejected")
          dispatch(fetchTasks(workspaceId));
      });
    },
    [dispatch, workspaceId]
  );

  const handleStatusChange = useCallback(
    (taskId, status) => {
      dispatch(optimisticUpdate({ id: taskId, status }));
      dispatch(patchTaskStatus({ workspaceId, taskId, status })).then((res) => {
        if (res.meta.requestStatus === "rejected")
          dispatch(fetchTasks(workspaceId));
      });
    },
    [dispatch, workspaceId]
  );

  const handleDelete = useCallback(
    (taskId) => {
      dispatch(optimisticRemove(taskId));
      dispatch(deleteTask({ workspaceId, taskId })).then((res) => {
        if (res.meta.requestStatus === "rejected") {
          dispatch(fetchTasks(workspaceId));
          toast.error("Failed to delete task");
        }
      });
    },
    [dispatch, workspaceId]
  );

  const handleAddSubtask = useCallback(
    async (parentTaskId, data) => {
      await dispatch(createTask({ workspaceId, data: { ...data, parentTaskId } }));
    },
    [dispatch, workspaceId]
  );

  // ponytail: optimistic reorder then persist each task's order field
  const handleReorder = useCallback(
    (reordered) => {
      reordered.forEach(({ id, order }) => {
        dispatch(optimisticUpdate({ id, order }));
        dispatch(updateTask({ workspaceId, taskId: id, data: { order } }));
      });
    },
    [dispatch, workspaceId]
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && allTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[color:var(--text-secondary)] text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[color:var(--accent)] border-t-transparent rounded-full animate-spin" />
          Loading tasks…
        </div>
      </div>
    );
  }

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];
  const TabIcon    = currentTab.icon;

  return (
    <div className="w-full h-full flex flex-col bg-[color:var(--bg-primary)] overflow-hidden">
      {/* ── Tab navigation header ── */}
      <div className="flex-shrink-0 border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]">
        {/* Page title */}
        <div className="px-6 pt-5 pb-0">
          <h2 className="text-base font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <TabIcon className={cn("w-4 h-4", currentTab.accentColor)} />
            {currentTab.label}
          </h2>
          <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">
            {currentTab.description}
          </p>
        </div>

        {/* Tabs row */}
        <div className="flex items-end gap-0 px-4 mt-3 relative">
          {TABS.map((tab) => {
            const TIcon   = tab.icon;
            const isActive = tab.id === activeTab;

            // Task count badge
            let count = 0;
            if (tab.id === "Action")      count = allTasks.filter((t) => t.type === "Action" || !t.type).length;
            if (tab.id === "Decision")    count = decisionTasks.length;
            if (tab.id === "Information") count = informationTasks.length;
            if (tab.id === "Reference")   count = referenceTasks.length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all duration-150 rounded-t-md outline-none",
                  isActive
                    ? [
                        "text-[color:var(--text-primary)]",
                        "bg-[color:var(--bg-primary)]",
                        "border border-b-0 border-[color:var(--border)]",
                      ]
                    : [
                        "text-[color:var(--text-secondary)]",
                        "hover:text-[color:var(--text-primary)]",
                        "hover:bg-[color:var(--bg-primary)]/50",
                        "border border-transparent",
                      ]
                )}
              >
                <TIcon className={cn("w-3.5 h-3.5", isActive ? tab.accentColor : "")} />
                {tab.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                      isActive
                        ? [tab.accentBg, tab.accentColor, "border", tab.accentBorder]
                        : "bg-[color:var(--bg-primary)] text-[color:var(--text-secondary)] border border-[color:var(--border)]"
                    )}
                  >
                    {count}
                  </span>
                )}
                {/* Active underline indicator */}
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    className={cn("absolute bottom-0 left-3 right-3 h-0.5 rounded-full", tab.indicatorColor)}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full"
          >
            {/* ── Action Items ── */}
            {activeTab === "Action" && (
              <div className="pb-8">
                {SECTIONS.map(({ status, defaultCollapsed }) => (
                  <TaskSection
                    key={status}
                    status={status}
                    tasks={sectionTasks[status] || []}
                    allTasks={allTasks}
                    members={members}
                    defaultCollapsed={defaultCollapsed}
                    onUpdate={handleUpdate}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onAddSubtask={handleAddSubtask}
                    onAdd={handleAdd}
                    onReorder={handleReorder}
                  />
                ))}
              </div>
            )}

            {/* ── Decisions ── */}
            {activeTab === "Decision" && (
              <FlatList
                tasks={decisionTasks}
                members={members}
                EmptyIcon={GitBranch}
                emptyLabel="No decisions captured yet"
              />
            )}

            {/* ── Information ── */}
            {activeTab === "Information" && (
              <FlatList
                tasks={informationTasks}
                members={members}
                EmptyIcon={Info}
                emptyLabel="No information nodes detected yet"
              />
            )}

            {/* ── References ── */}
            {activeTab === "Reference" && (
              <FlatList
                tasks={referenceTasks}
                members={members}
                EmptyIcon={Link2}
                emptyLabel="No references detected yet"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
