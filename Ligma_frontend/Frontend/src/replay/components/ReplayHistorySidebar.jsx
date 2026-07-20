// ReplayHistorySidebar.jsx
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Right-hand rail that mirrors the History Panel but stays synchronized with
// the replay position. The currently-replayed event is highlighted and auto-
// scrolled into view. Clicking any item jumps the timeline to that event.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";

import { selectReplay, seekToIndex } from "../replaySlice";
import { getEventLabel } from "../replay.service";
import HistoryEventIcon from "../../components/history/HistoryEventIcon";

export default function ReplayHistorySidebar() {
  const dispatch = useDispatch();
  const { events, index } = useSelector(selectReplay);
  const listRef = useRef(null);
  const activeRef = useRef(null);

  // Auto-scroll the currently-replayed event into view whenever the index
  // changes. Uses `nearest` so we don't fight the user's own scrolling.
  useEffect(() => {
    if (!activeRef.current) return;
    activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [index]);

  const rows = useMemo(() => events, [events]);

  return (
    <aside className="h-full flex flex-col border-l border-[color:var(--border)] bg-[color:var(--bg-surface)]/60 backdrop-blur-md">
      <header className="px-4 py-3 border-b border-[color:var(--border)] flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
          Event Timeline
        </h3>
        <span className="text-[10px] font-semibold text-[color:var(--text-secondary)] bg-[color:var(--bg-primary)] border border-[color:var(--border)] rounded-full px-2 py-0.5">
          {rows.length}
        </span>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {rows.length === 0 ? (
          <div className="p-6 text-center text-xs text-[color:var(--text-secondary)]">
            No events recorded for this workspace yet.
          </div>
        ) : (
          <ul className="p-2 space-y-1">
            {rows.map((event, i) => {
              const isActive = i === index;
              const isPast = i < index;

              let relative = "";
              try {
                relative = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true });
              } catch {
                relative = "";
              }

              return (
                <li key={event.id || i}>
                  <button
                    ref={isActive ? activeRef : null}
                    type="button"
                    onClick={() => dispatch(seekToIndex(i))}
                    className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-[color:var(--accent)]/15 to-purple-500/10 border-[color:var(--accent)]/50 shadow-sm scale-[1.01]"
                        : isPast
                          ? "bg-transparent border-transparent hover:bg-[color:var(--bg-primary)] hover:border-[color:var(--border)]/60 opacity-70"
                          : "bg-transparent border-transparent hover:bg-[color:var(--bg-primary)] hover:border-[color:var(--border)]/60"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5 scale-90 origin-left">
                      <HistoryEventIcon eventType={event.eventType} className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-semibold truncate ${
                            isActive
                              ? "text-[color:var(--text-primary)]"
                              : "text-[color:var(--text-primary)]/90"
                          }`}
                        >
                          {getEventLabel(event.eventType)}
                        </span>
                        <span className="shrink-0 text-[9px] text-[color:var(--text-secondary)] tabular-nums">
                          #{i + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[color:var(--text-secondary)] mt-0.5">
                        <span className="truncate">{event.user?.name || "Unknown"}</span>
                        {relative ? (
                          <>
                            <span className="opacity-40">·</span>
                            <span className="truncate">{relative}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    {isActive && (
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-[color:var(--accent)] animate-pulse" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
