import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Play, RotateCcw, Sparkles } from "lucide-react";

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

// ponytail: single page view coordinating all sub-features (toolbar, timeline, replay, load-more)
export default function HistoryPage() {
  const { id: workspaceId } = useParams();
  const dispatch = useDispatch();

  // Redux Selectors
  const { events, loading, error, limit } = useSelector((state) => state.events);
  const { activeWorkspace } = useSelector((state) => state.workspace);

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

  return (
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

        {/* Right 1 Column: Future Replay Controls Panel */}
        <div className="space-y-6">
          <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-xl p-6 shadow-xs h-fit relative overflow-hidden group">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[color:var(--accent)] to-purple-500"></div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[color:var(--text-primary)]">Time Travel Replay</h3>
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            
            <p className="text-xs text-[color:var(--text-secondary)] mb-6 leading-relaxed">
              Step backwards and forwards in time to replay the entire collaborative brainstorming session from the beginning.
            </p>

            <div className="w-full bg-[color:var(--bg-primary)] border border-[color:var(--border)] p-5 rounded-lg text-center space-y-4">
              <div className="flex justify-center gap-3">
                <button
                  disabled
                  className="p-2.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] text-zinc-500 opacity-40 cursor-not-allowed"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  disabled
                  className="px-4 py-2 rounded-lg bg-[color:var(--accent)] text-white font-semibold text-xs flex items-center gap-1.5 opacity-40 cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start Replay
                </button>
              </div>
              <div className="text-[11px] font-semibold text-purple-400/90 tracking-wide uppercase">
                Phase 13 Feature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
