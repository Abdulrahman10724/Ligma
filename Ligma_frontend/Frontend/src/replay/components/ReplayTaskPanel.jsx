// ReplayTaskPanel.jsx
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Read-only task board that reconstructs the task list from the replay
// virtual state at the current index. Grouped by status (matches TaskBoardPage).
// -----------------------------------------------------------------------------

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { CheckSquare, ChevronDown, GitBranch, Info, Link2 } from "lucide-react";

import { selectReplayTasks } from "../replaySlice";

const STATUS_ORDER = ["To Do", "In Progress", "Completed"];
const STATUS_ACCENTS = {
  "To Do": "text-amber-500 border-amber-500/40 bg-amber-500/5",
  "In Progress": "text-blue-500 border-blue-500/40 bg-blue-500/5",
  Completed: "text-emerald-500 border-emerald-500/40 bg-emerald-500/5",
};

const TYPE_ICON = {
  Action: CheckSquare,
  Decision: GitBranch,
  Info: Info,
  Reference: Link2,
};

const PRIORITY_ACCENT = {
  Urgent: "bg-red-500/15 text-red-500 border-red-500/30",
  High: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  Medium: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  Low: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

export default function ReplayTaskPanel() {
  const tasks = useSelector(selectReplayTasks);
  const [collapsed, setCollapsed] = useState({ Completed: true });

  const grouped = useMemo(() => {
    const map = { "To Do": [], "In Progress": [], Completed: [], Other: [] };
    for (const t of tasks) {
      const bucket = STATUS_ORDER.includes(t.status) ? t.status : "Other";
      map[bucket].push(t);
    }
    return map;
  }, [tasks]);

  const toggle = (status) =>
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));

  if (tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 text-[color:var(--text-secondary)]">
        <div className="w-12 h-12 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] flex items-center justify-center mb-3">
          <CheckSquare className="w-5 h-5 opacity-60" />
        </div>
        <p className="text-xs font-semibold text-[color:var(--text-primary)]">No tasks yet</p>
        <p className="text-[11px] mt-1 max-w-[220px]">
          Tasks will appear here as they are created during the replay.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-3 space-y-3">
      {STATUS_ORDER.map((status) => {
        const items = grouped[status];
        if (!items?.length) return null;
        const isCollapsed = collapsed[status];

        return (
          <section
            key={status}
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]/70 backdrop-blur-md overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(status)}
              className="w-full flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-[color:var(--bg-primary)]/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${STATUS_ACCENTS[status]}`}
                >
                  {status}
                </span>
                <span className="text-[10px] text-[color:var(--text-secondary)] tabular-nums">
                  {items.length}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[color:var(--text-secondary)] transition-transform ${
                  isCollapsed ? "-rotate-90" : ""
                }`}
              />
            </button>

            {!isCollapsed && (
              <ul className="px-2 pb-2 space-y-1.5">
                {items.map((task) => {
                  const Icon = TYPE_ICON[task.type] || CheckSquare;
                  const prioAccent = PRIORITY_ACCENT[task.priority] || "";

                  return (
                    <li
                      key={task.id}
                      className="group px-2.5 py-2 rounded-lg bg-[color:var(--bg-primary)] border border-[color:var(--border)]/70 hover:border-[color:var(--accent)]/40 transition-all animate-in fade-in slide-in-from-left-2 duration-300"
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="w-3.5 h-3.5 mt-0.5 text-[color:var(--text-secondary)] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[color:var(--text-primary)] leading-tight truncate">
                            {task.title || "Untitled task"}
                          </p>
                          {task.description ? (
                            <p className="text-[10px] text-[color:var(--text-secondary)] mt-1 line-clamp-2 leading-snug">
                              {task.description}
                            </p>
                          ) : null}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {task.priority ? (
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${prioAccent}`}
                              >
                                {task.priority}
                              </span>
                            ) : null}
                            {task.type ? (
                              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-[color:var(--border)] text-[color:var(--text-secondary)]">
                                {task.type}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
