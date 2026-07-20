import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Play, RotateCcw, Sparkles, Clock, Rewind, Activity } from "lucide-react";

import {
  fetchWorkspaceEvents,
  incrementLimit,
  resetLimit,
  clearEvents,
} from "../redux/eventSlice";
import HistoryToolbar from "../components/history/HistoryToolbar";
import HistoryTimeline from "../components/history/HistoryTimeline";
import HistorySkeleton from "../components/history/HistorySkeleton";
import HistoryEmptyState from "../components/history/HistoryEmptyState";
import HistoryErrorState from "../components/history/HistoryErrorState";
import { Button } from "../components/ui/button";

// Phase 13 — Time Travel Replay
import { openReplay, closeReplay, selectReplayIsActive } from "../replay/replaySlice";
import ReplayWorkspace from "../replay/components/ReplayWorkspace";

// ponytail: single page view coordinating all sub-features (toolbar, timeline, replay, load-more)
export default function HistoryPage() {
  const { id: workspaceId } = useParams();
  const dispatch = useDispatch();

  // Redux Selectors
  const { events, loading, error, limit } = useSelector((state) => state.events);
  const { activeWorkspace } = useSelector((state) => state.workspace);
  const isReplayActive = useSelector(selectReplayIsActive);

  // Local Search & Category States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Reset page limit when changing workspaces
  useEffect(() => {
    if (workspaceId) {
      dispatch(resetLimit());
      dispatch(clearEvents());
    }
  }, [dispatch, workspaceId]);

  // Load events
  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchWorkspaceEvents({ workspaceId, limit }));
    }
  }, [dispatch, workspaceId, limit]);

  // Phase 13 — clean up any lingering replay state when leaving the page or
  // switching workspaces. Guarantees the live canvas is never affected.
  useEffect(() => () => {
    dispatch(closeReplay());
  }, [dispatch, workspaceId]);

  // Manual refresh handler
  const handleRefresh = () => {
    if (workspaceId) {
      dispatch(fetchWorkspaceEvents({ workspaceId, limit }));
    }
  };

  // Pagination handler
  const handleLoadMore = () => {
    dispatch(incrementLimit(20));
  };

  // Phase 13 — enter replay
  const handleStartReplay = () => {
    if (!workspaceId) return;
    dispatch(openReplay(workspaceId));
  };

  const handleExitReplay = () => {
    dispatch(closeReplay());
  };

  // ponytail: filter events in-memory on loaded data (search queries & category tabs)
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. Category Filter
      if (selectedCategory !== "all") {
        const type = event.eventType || "";
        if (selectedCategory === "nodes" && !type.startsWith("NODE_")) return false;
        if (selectedCategory === "tasks" && !type.startsWith("TASK_")) return false;
        if (selectedCategory === "permissions" && type !== "NODE_PERMISSION_CHANGED") return false;
        if (selectedCategory === "locks" && type !== "NODE_LOCKED" && type !== "NODE_UNLOCKED") return false;
        if (selectedCategory === "deletes" && !type.includes("DELETED")) return false;
      }

      // 2. Search query matching username, eventType, or text fields inside payload
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const username = (event.user?.name || "").toLowerCase();
        const eventType = (event.eventType || "").toLowerCase();
        const payloadText = JSON.stringify(event.payload || "").toLowerCase();

        return (
          username.includes(query) ||
          eventType.includes(query) ||
          payloadText.includes(query)
        );
      }

      return true;
    });
  }, [events, selectedCategory, searchQuery]);

  // Determine if there are more items to paginate
  const hasMore = events.length >= limit;

  // Quick stats for the replay hero card
  const stats = useMemo(() => {
    const nodeEvents = events.filter((e) => e.eventType?.startsWith("NODE_")).length;
    const taskEvents = events.filter((e) => e.eventType?.startsWith("TASK_")).length;
    const contributors = new Set(events.map((e) => e.user?.email).filter(Boolean)).size;
    return { total: events.length, nodeEvents, taskEvents, contributors };
  }, [events]);

  return (
    <>
      <div className="w-full h-full p-8 bg-[color:var(--bg-primary)] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[color:var(--border)] pb-6">
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--text-primary)] tracking-tight flex items-center gap-2">
              Workspace History
              <span className="text-xs font-semibold bg-[color:var(--accent)]/10 text-[color:var(--accent)] px-2 py-0.5 rounded-full border border-[color:var(--accent)]/20">
                Event Log
              </span>
            </h2>
            <p className="text-sm text-[color:var(--text-secondary)] mt-1">
              Chronological audit log of operations in {activeWorkspace?.title || "this workspace"}.
            </p>
          </div>

          {/* Prominent replay CTA in the header */}
          <Button
            onClick={handleStartReplay}
            disabled={loading || events.length === 0}
            className="cursor-pointer h-10 px-4 bg-gradient-to-r from-[color:var(--accent)] to-purple-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 rounded-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            Time Travel Replay
          </Button>
        </header>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: History Timeline Feed */}
          <div className="lg:col-span-2 space-y-6">
            <HistoryToolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onRefresh={handleRefresh}
              isRefreshing={loading && events.length > 0}
              totalEventsCount={filteredEvents.length}
            />

            {/* Activity Logs Feed State Management */}
            {loading && events.length === 0 ? (
              <HistorySkeleton />
            ) : error ? (
              <HistoryErrorState message={error} onRetry={handleRefresh} />
            ) : filteredEvents.length === 0 ? (
              <HistoryEmptyState />
            ) : (
              <div className="space-y-6">
                <HistoryTimeline events={filteredEvents} />

                {/* Pagination control */}
                {hasMore && (
                  <div className="flex justify-center pt-4 pl-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="cursor-pointer border-[color:var(--border)] text-xs h-8 px-6 hover:bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-all font-medium rounded-lg"
                    >
                      {loading ? "Loading more..." : "Load More Activities"}
                    </Button>
                  </div>
                )}

                {!hasMore && filteredEvents.length > 5 && (
                  <p className="text-center text-xs text-[color:var(--text-secondary)]/80 italic pt-4 pl-6 select-none">
                    All workspace activities loaded.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right 1 Column: Time Travel Replay hero card */}
          <div className="space-y-6">
            <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-xl p-6 shadow-xs h-fit relative overflow-hidden group">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[color:var(--accent)] to-purple-500"></div>
              {/* Decorative blur */}
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-[color:var(--accent)]/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative">
                <h3 className="text-base font-bold text-[color:var(--text-primary)] flex items-center gap-2">
                  <Rewind className="w-4 h-4 text-[color:var(--accent)]" />
                  Time Travel Replay
                </h3>
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              </div>

              <p className="text-xs text-[color:var(--text-secondary)] mb-5 leading-relaxed relative">
                Step backwards and forwards in time to reconstruct the entire
                collaborative session from the immutable event log. Your live
                canvas remains completely untouched.
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-5 relative">
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)] font-semibold">
                    <Activity className="w-3 h-3" /> Events
                  </div>
                  <div className="text-lg font-bold text-[color:var(--text-primary)] tabular-nums mt-0.5">
                    {stats.total}
                  </div>
                </div>
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-3">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--text-secondary)] font-semibold">
                    <Clock className="w-3 h-3" /> Contributors
                  </div>
                  <div className="text-lg font-bold text-[color:var(--text-primary)] tabular-nums mt-0.5">
                    {stats.contributors}
                  </div>
                </div>
                <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-3 col-span-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="uppercase tracking-wider text-[color:var(--text-secondary)] font-semibold">Coverage</span>
                    <span className="text-[color:var(--text-secondary)] tabular-nums">
                      {stats.nodeEvents} nodes · {stats.taskEvents} tasks
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden bg-[color:var(--border)]/60 flex">
                    {stats.total > 0 ? (
                      <>
                        <span
                          className="h-full bg-gradient-to-r from-[color:var(--accent)] to-indigo-500"
                          style={{ width: `${(stats.nodeEvents / stats.total) * 100}%` }}
                        />
                        <span
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${(stats.taskEvents / stats.total) * 100}%` }}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="w-full bg-[color:var(--bg-primary)] border border-[color:var(--border)] p-5 rounded-lg text-center space-y-4 relative">
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={loading}
                    title="Refresh event log"
                    className="p-2.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--accent)]/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleStartReplay}
                    disabled={loading || events.length === 0}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[color:var(--accent)] to-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:brightness-110 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Start Replay
                  </button>
                </div>
                <div className="text-[11px] font-semibold text-purple-400/90 tracking-wide uppercase">
                  {events.length === 0 ? "No events to replay yet" : "Ready · Read-only reconstruction"}
                </div>
              </div>

              {/* Feature bullets */}
              <ul className="mt-5 space-y-2 text-[11px] text-[color:var(--text-secondary)] relative">
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full bg-[color:var(--accent)] shrink-0" />
                  <span>Timeline scrubber with per-event precision</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full bg-[color:var(--accent)] shrink-0" />
                  <span>Playback speeds: 0.5×, 1×, 2×, 4×</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full bg-[color:var(--accent)] shrink-0" />
                  <span>Canvas &amp; tasks reconstructed side-by-side</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full bg-[color:var(--accent)] shrink-0" />
                  <span>Zero writes: DB, Redux &amp; sockets untouched</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 13 — Replay Overlay (fixed, above everything) */}
      {isReplayActive && <ReplayWorkspace onExit={handleExitReplay} />}
    </>
  );
}
