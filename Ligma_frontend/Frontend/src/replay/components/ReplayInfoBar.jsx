// ReplayInfoBar.jsx
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Compact info strip that shows the current replay context:
//   • Event N / Total
//   • Timestamp (absolute + relative)
//   • Current user (name + initials avatar)
//   • Event type chip (color-matched to HistoryEventIcon palette)
// -----------------------------------------------------------------------------

import { useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";

import { selectReplay, selectReplayCurrentEvent } from "../replaySlice";
import {
  formatReplayTimestamp,
  getEventAccent,
  getEventLabel,
} from "../replay.service";
import HistoryEventIcon from "../../components/history/HistoryEventIcon";

const ACCENT_CLASSES = {
  emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  orange: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  red: "bg-red-500/10 text-red-500 border-red-500/30",
  amber: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  cyan: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  zinc: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
};

const initialsFor = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
};

export default function ReplayInfoBar() {
  const { events, index } = useSelector(selectReplay);
  const currentEvent = useSelector(selectReplayCurrentEvent);
  const total = events.length;

  const accent = getEventAccent(currentEvent?.eventType);
  const accentClass = ACCENT_CLASSES[accent] || ACCENT_CLASSES.zinc;

  let relative = "";
  if (currentEvent?.createdAt) {
    try {
      relative = formatDistanceToNow(new Date(currentEvent.createdAt), { addSuffix: true });
    } catch {
      relative = "";
    }
  }

  return (
    <div className="w-full flex flex-wrap items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]/70 backdrop-blur-md shadow-xs">
      {/* Event counter */}
      <div className="flex flex-col leading-tight px-3 border-r border-[color:var(--border)]/60">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)] font-semibold">
          Event
        </span>
        <span className="text-lg font-bold text-[color:var(--text-primary)] tabular-nums">
          {index >= 0 ? index + 1 : 0}
          <span className="text-[color:var(--text-secondary)] font-medium text-sm"> / {total}</span>
        </span>
      </div>

      {/* Event type icon + label */}
      <div className="flex items-center gap-3">
        {currentEvent ? (
          <HistoryEventIcon eventType={currentEvent.eventType} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[color:var(--bg-primary)] border border-[color:var(--border)]" />
        )}
        <div className="flex flex-col leading-tight">
          <span
            className={`inline-flex items-center self-start px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${accentClass}`}
          >
            {currentEvent ? getEventLabel(currentEvent.eventType) : "Empty Canvas"}
          </span>
          <span className="text-xs text-[color:var(--text-secondary)] mt-1">
            {currentEvent
              ? formatReplayTimestamp(currentEvent.createdAt)
              : "Before the first event"}
            {relative ? <span className="opacity-60"> · {relative}</span> : null}
          </span>
        </div>
      </div>

      {/* User info (right side, pushed via ml-auto) */}
      <div className="flex items-center gap-2 ml-auto pl-3 border-l border-[color:var(--border)]/60">
        {currentEvent?.user ? (
          <>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--accent)] to-purple-500 text-[10px] font-bold text-white shadow-xs">
              {initialsFor(currentEvent.user?.name)}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-[color:var(--text-primary)]">
                {currentEvent.user?.name || "Unknown User"}
              </span>
              <span className="text-[10px] text-[color:var(--text-secondary)] truncate max-w-[180px]">
                {currentEvent.user?.email || ""}
              </span>
            </div>
          </>
        ) : (
          <span className="text-[11px] text-[color:var(--text-secondary)] italic">
            Waiting to start
          </span>
        )}
      </div>
    </div>
  );
}
