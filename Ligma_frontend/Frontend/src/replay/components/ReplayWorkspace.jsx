// ReplayWorkspace.jsx
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Full-screen replay experience composed of:
//   • ReplayCanvas         — read-only Konva canvas rebuilt from event log
//   • ReplayOverlay        — read-only banner + glass ring
//   • ReplayTaskPanel      — replayed task list
//   • ReplayHistorySidebar — synchronized event list
//   • ReplayInfoBar        — current event metadata
//   • ReplayTimeline       — scrubber
//   • ReplayControls       — playback buttons
//
// Rendered as a fixed overlay on top of HistoryPage. Exit tears down the slice
// completely so the live workspace is untouched.
// -----------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, Loader2, PanelRight, ListTree } from "lucide-react";

import { closeReplay, selectReplay } from "../replaySlice";
import ReplayCanvas from "./ReplayCanvas";
import ReplayOverlay from "./ReplayOverlay";
import ReplayInfoBar from "./ReplayInfoBar";
import ReplayTimeline from "./ReplayTimeline";
import ReplayControls from "./ReplayControls";
import ReplayHistorySidebar from "./ReplayHistorySidebar";
import ReplayTaskPanel from "./ReplayTaskPanel";

export default function ReplayWorkspace({ onExit }) {
  const dispatch = useDispatch();
  const { status, error, events } = useSelector(selectReplay);
  const [sidebarTab, setSidebarTab] = useState("history"); // history | tasks

  // While replay is open we disable native keyboard shortcuts that could reach
  // the underlying (unmounted-but-not-yet-disposed) canvas via bubbling.
  useEffect(() => {
    const blockShortcuts = (event) => {
      const key = event.key?.toLowerCase();
      const isMeta = event.ctrlKey || event.metaKey;
      // Allow only navigation keys within the replay UI.
      const allowedKeys = new Set([
        "arrowleft", "arrowright", "arrowup", "arrowdown",
        "tab", "enter", " ", "escape", "home", "end",
      ]);
      if (
        isMeta &&
        ["c", "v", "x", "a", "z", "y", "s", "d"].includes(key)
      ) {
        event.stopPropagation();
        return;
      }
      if (key === "delete" || key === "backspace") {
        // Only block when not inside an input.
        const t = event.target;
        const inField =
          t instanceof HTMLInputElement ||
          t instanceof HTMLTextAreaElement ||
          t?.isContentEditable;
        if (!inField) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
      // ESC closes replay (professional UX affordance).
      if (key === "escape") {
        dispatch(closeReplay());
        onExit?.();
      }
      // Everything else is fine — including our own timeline arrow shortcuts.
      if (allowedKeys.has(key)) return;
    };
    window.addEventListener("keydown", blockShortcuts, true);
    return () => window.removeEventListener("keydown", blockShortcuts, true);
  }, [dispatch, onExit]);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col bg-[color:var(--bg-primary)] animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      {/* ── Body: canvas + right rail ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas region */}
        <div className="flex-1 relative min-w-0">
          <ReplayCanvas />
          <ReplayOverlay />

          {/* Loading / error overlays */}
          {status === "loading" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[color:var(--bg-primary)]/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[color:var(--accent)]" />
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                  Loading event history…
                </p>
                <p className="text-xs text-[color:var(--text-secondary)] max-w-xs text-center">
                  Fetching the immutable event log for this workspace.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[color:var(--bg-primary)]/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 max-w-sm text-center">
                <AlertCircle className="w-9 h-9 text-red-500" />
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                  Unable to load replay
                </p>
                <p className="text-xs text-[color:var(--text-secondary)]">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(closeReplay());
                    onExit?.();
                  }}
                  className="mt-1 px-3 py-1.5 rounded-lg border border-[color:var(--border)] text-xs font-semibold hover:bg-[color:var(--bg-surface)] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {status === "ready" && events.length === 0 && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[color:var(--bg-primary)]/60 backdrop-blur-sm pointer-events-none">
              <div className="flex flex-col items-center gap-2 max-w-sm text-center px-6 py-8 bg-[color:var(--bg-surface)]/90 border border-[color:var(--border)] rounded-2xl shadow-lg pointer-events-auto">
                <ListTree className="w-8 h-8 text-[color:var(--text-secondary)]" />
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                  Nothing to replay yet
                </p>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  This workspace hasn&apos;t recorded any events. Start collaborating and come back later.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right rail: History + Tasks (tabbed) */}
        <aside className="hidden md:flex w-80 flex-col border-l border-[color:var(--border)] bg-[color:var(--bg-surface)]/40 backdrop-blur-md">
          <div className="flex items-center gap-1 p-2 border-b border-[color:var(--border)]">
            <button
              type="button"
              onClick={() => setSidebarTab("history")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2 py-1.5 rounded-md transition-all cursor-pointer ${
                sidebarTab === "history"
                  ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)] border border-[color:var(--accent)]/30"
                  : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-primary)]"
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" /> History
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("tasks")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2 py-1.5 rounded-md transition-all cursor-pointer ${
                sidebarTab === "tasks"
                  ? "bg-[color:var(--accent)]/10 text-[color:var(--accent)] border border-[color:var(--accent)]/30"
                  : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-primary)]"
              }`}
            >
              <ListTree className="w-3.5 h-3.5" /> Tasks
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {sidebarTab === "history" ? <ReplayHistorySidebar /> : <ReplayTaskPanel />}
          </div>
        </aside>
      </div>

      {/* ── Footer: info bar + timeline + controls ─────────────────────────── */}
      <footer className="shrink-0 border-t border-[color:var(--border)] bg-[color:var(--bg-surface)]/90 backdrop-blur-lg shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]">
        <div className="max-w-[1600px] mx-auto p-3 md:p-4 space-y-3">
          <ReplayInfoBar />
          <ReplayTimeline />
          <ReplayControls onExit={onExit} />
        </div>
      </footer>
    </div>
  );
}
