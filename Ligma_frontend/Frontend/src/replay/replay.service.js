// replay.service.js
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Thin wrapper on top of the existing event.service.js. Provides replay-only
// helpers: fetching the full event history in chronological order, formatting
// event metadata for the info bar, and mapping event types to human labels.
// -----------------------------------------------------------------------------

import eventService from "../services/event.service";

// Backend returns events newest-first with a hard cap of 5000 (see Phase 13
// validation bump). 5000 comfortably covers any real workspace history while
// staying protective on payload size.
export const REPLAY_FETCH_LIMIT = 5000;

/**
 * Fetch the entire immutable event log for a workspace, sorted oldest-first.
 * The replay engine assumes chronological order.
 */
export const fetchReplayEvents = async (workspaceId) => {
  const response = await eventService.getEvents(workspaceId, REPLAY_FETCH_LIMIT);
  const raw = response?.data?.events || [];

  // Backend sends `createdAt: -1`. Sort ascending on ISO/Date, tie-break on id.
  return [...raw].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    return (a.id || "").localeCompare(b.id || "");
  });
};

// Human labels for the info bar. Kept in sync with HistoryEventIcon groupings.
const EVENT_LABELS = Object.freeze({
  NODE_CREATED: "Node Created",
  NODE_UPDATED: "Node Updated",
  NODE_MOVED: "Node Moved",
  NODE_RESIZED: "Node Resized",
  NODE_DELETED: "Node Deleted",
  NODE_LOCKED: "Node Locked",
  NODE_UNLOCKED: "Node Unlocked",
  NODE_PERMISSION_CHANGED: "Permissions Changed",
  TASK_CREATED: "Task Created",
  TASK_UPDATED: "Task Updated",
  TASK_DELETED: "Task Deleted",
});

export const getEventLabel = (eventType) =>
  EVENT_LABELS[eventType] || eventType || "Unknown Event";

// Semantic color for the info bar chip. Matches HistoryEventIcon palette so the
// replay chip visually harmonizes with the existing history feed.
const EVENT_ACCENTS = Object.freeze({
  NODE_CREATED: "emerald",
  NODE_UPDATED: "blue",
  NODE_MOVED: "purple",
  NODE_RESIZED: "orange",
  NODE_DELETED: "red",
  NODE_LOCKED: "amber",
  NODE_UNLOCKED: "amber",
  NODE_PERMISSION_CHANGED: "cyan",
  TASK_CREATED: "emerald",
  TASK_UPDATED: "blue",
  TASK_DELETED: "red",
});

export const getEventAccent = (eventType) => EVENT_ACCENTS[eventType] || "zinc";

/**
 * Convert scrubber percentage (0..100) to a valid event index.
 * -1 means "before the first event" — used to render the empty canvas seed.
 */
export const percentToIndex = (percent, total) => {
  if (!total) return -1;
  const clamped = Math.min(100, Math.max(0, Number(percent) || 0));
  if (clamped === 0) return -1;
  // Fractional mapping so the very last pixel of the slider always reaches
  // the last event; guards against off-by-one at 100%.
  const idx = Math.floor((clamped / 100) * total) - (clamped === 100 ? 1 : 0);
  return Math.min(total - 1, Math.max(-1, idx));
};

export const indexToPercent = (index, total) => {
  if (!total || index < 0) return 0;
  return Math.min(100, ((index + 1) / total) * 100);
};

/** Format the timestamp for the info bar. Silent about locale-inconsistent formats. */
export const formatReplayTimestamp = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

export default {
  REPLAY_FETCH_LIMIT,
  fetchReplayEvents,
  getEventLabel,
  getEventAccent,
  percentToIndex,
  indexToPercent,
  formatReplayTimestamp,
};
