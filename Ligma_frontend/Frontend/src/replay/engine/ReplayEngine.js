// ReplayEngine.js
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Pure event-sourcing reducer that rebuilds `{ nodes, tasks }` from the
// immutable event log created in Phase 11. The engine is intentionally free of
// side effects: no Redux dispatches, no API calls, no Socket.IO, no DOM.
//
// The engine mirrors the exact payload shape used by the backend event log
// (see Ligma_backend/src/services/canvas-node.service.js and task.service.js):
//   • NODE_CREATED           → payload.snapshot
//   • NODE_UPDATED           → previousData / nextData (+ nextPosition)
//   • NODE_MOVED             → previousPosition / nextPosition
//   • NODE_RESIZED           → previousData / nextData + positions
//   • NODE_DELETED           → snapshot of the removed node
//   • NODE_LOCKED/UNLOCKED   → { locked, lockedBy, lockedAt }
//   • NODE_PERMISSION_CHANGED→ previousAllowedUserIds / nextAllowedUserIds
//   • TASK_CREATED           → payload.snapshot
//   • TASK_UPDATED           → previousFields / nextFields (incl. status)
//   • TASK_DELETED           → snapshot of the removed task
// -----------------------------------------------------------------------------

export const REPLAY_EVENT_TYPES = Object.freeze({
  NODE_CREATED: "NODE_CREATED",
  NODE_UPDATED: "NODE_UPDATED",
  NODE_MOVED: "NODE_MOVED",
  NODE_RESIZED: "NODE_RESIZED",
  NODE_DELETED: "NODE_DELETED",
  NODE_LOCKED: "NODE_LOCKED",
  NODE_UNLOCKED: "NODE_UNLOCKED",
  NODE_PERMISSION_CHANGED: "NODE_PERMISSION_CHANGED",
  TASK_CREATED: "TASK_CREATED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_DELETED: "TASK_DELETED",
});

/**
 * Empty virtual canvas + task state used as the seed of every replay run.
 * Nodes are keyed by id for O(1) lookup, mirroring canvasSlice.
 * Tasks are keyed by id for O(1) lookup (converted to array on read).
 */
export const createEmptyReplayState = () => ({
  nodes: {},
  tasks: {},
});

// ── Node reducers ────────────────────────────────────────────────────────────
const applyNodeCreated = (state, event) => {
  const snap = event.payload?.snapshot;
  if (!snap?.id) return state;

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [snap.id]: {
        id: snap.id,
        type: snap.type,
        x: snap.x,
        y: snap.y,
        data: snap.data || {},
        locked: Boolean(snap.locked),
        lockedBy: snap.lockedBy || null,
        lockedAt: snap.lockedAt || null,
        allowedUserIds: snap.allowedUserIds || [],
        createdById: snap.createdById || event.userId,
        workspaceId: event.workspaceId,
      },
    },
  };
};

const applyNodeUpdated = (state, event) => {
  const nodeId = event.nodeId;
  if (!nodeId || !state.nodes[nodeId]) return state;

  const nextData = event.payload?.nextData || {};
  const nextPosition = event.payload?.nextPosition;

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: {
        ...state.nodes[nodeId],
        ...(nextPosition ? { x: nextPosition.x, y: nextPosition.y } : {}),
        data: { ...(state.nodes[nodeId].data || {}), ...nextData },
      },
    },
  };
};

const applyNodeMoved = (state, event) => {
  const nodeId = event.nodeId;
  const next = event.payload?.nextPosition;
  if (!nodeId || !state.nodes[nodeId] || !next) return state;

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: { ...state.nodes[nodeId], x: next.x, y: next.y },
    },
  };
};

const applyNodeResized = (state, event) => {
  const nodeId = event.nodeId;
  if (!nodeId || !state.nodes[nodeId]) return state;

  const nextData = event.payload?.nextData || {};
  const nextPosition = event.payload?.nextPosition;

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: {
        ...state.nodes[nodeId],
        ...(nextPosition ? { x: nextPosition.x, y: nextPosition.y } : {}),
        data: { ...(state.nodes[nodeId].data || {}), ...nextData },
      },
    },
  };
};

const applyNodeDeleted = (state, event) => {
  const nodeId = event.nodeId || event.payload?.snapshot?.id;
  if (!nodeId || !state.nodes[nodeId]) return state;

  const nextNodes = { ...state.nodes };
  delete nextNodes[nodeId];
  return { ...state, nodes: nextNodes };
};

const applyNodeLocked = (state, event) => {
  const nodeId = event.nodeId;
  if (!nodeId || !state.nodes[nodeId]) return state;

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: {
        ...state.nodes[nodeId],
        locked: true,
        lockedBy: event.userId || event.payload?.lockedBy || null,
        lockedAt: event.createdAt || new Date().toISOString(),
      },
    },
  };
};

const applyNodeUnlocked = (state, event) => {
  const nodeId = event.nodeId;
  if (!nodeId || !state.nodes[nodeId]) return state;

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: {
        ...state.nodes[nodeId],
        locked: false,
        lockedBy: null,
        lockedAt: null,
      },
    },
  };
};

const applyNodePermissionChanged = (state, event) => {
  const nodeId = event.nodeId;
  if (!nodeId || !state.nodes[nodeId]) return state;

  const nextAllowed = event.payload?.nextAllowedUserIds || [];
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: { ...state.nodes[nodeId], allowedUserIds: nextAllowed },
    },
  };
};

// ── Task reducers ────────────────────────────────────────────────────────────
const applyTaskCreated = (state, event) => {
  const snap = event.payload?.snapshot;
  if (!snap?.id) return state;

  return {
    ...state,
    tasks: {
      ...state.tasks,
      [snap.id]: {
        id: snap.id,
        nodeId: snap.nodeId || null,
        parentTaskId: snap.parentTaskId || null,
        title: snap.title,
        description: snap.description || "",
        type: snap.type || "Action",
        status: snap.status || "To Do",
        assigneeId: snap.assigneeId || null,
        dueDate: snap.dueDate || null,
        priority: snap.priority || null,
        order: snap.order ?? 0,
        metadata: snap.metadata || {},
      },
    },
  };
};

const applyTaskUpdated = (state, event) => {
  const taskId = event.taskId;
  if (!taskId || !state.tasks[taskId]) return state;

  const nextFields = event.payload?.nextFields || {};
  return {
    ...state,
    tasks: {
      ...state.tasks,
      [taskId]: { ...state.tasks[taskId], ...nextFields },
    },
  };
};

const applyTaskDeleted = (state, event) => {
  const taskId = event.taskId || event.payload?.snapshot?.id;
  if (!taskId || !state.tasks[taskId]) return state;

  const nextTasks = { ...state.tasks };
  delete nextTasks[taskId];
  return { ...state, tasks: nextTasks };
};

// ── Dispatch table ───────────────────────────────────────────────────────────
const HANDLERS = Object.freeze({
  [REPLAY_EVENT_TYPES.NODE_CREATED]: applyNodeCreated,
  [REPLAY_EVENT_TYPES.NODE_UPDATED]: applyNodeUpdated,
  [REPLAY_EVENT_TYPES.NODE_MOVED]: applyNodeMoved,
  [REPLAY_EVENT_TYPES.NODE_RESIZED]: applyNodeResized,
  [REPLAY_EVENT_TYPES.NODE_DELETED]: applyNodeDeleted,
  [REPLAY_EVENT_TYPES.NODE_LOCKED]: applyNodeLocked,
  [REPLAY_EVENT_TYPES.NODE_UNLOCKED]: applyNodeUnlocked,
  [REPLAY_EVENT_TYPES.NODE_PERMISSION_CHANGED]: applyNodePermissionChanged,
  [REPLAY_EVENT_TYPES.TASK_CREATED]: applyTaskCreated,
  [REPLAY_EVENT_TYPES.TASK_UPDATED]: applyTaskUpdated,
  [REPLAY_EVENT_TYPES.TASK_DELETED]: applyTaskDeleted,
});

/**
 * Apply a single event to a state snapshot. Returns the same reference if the
 * event type is unknown or would be a no-op — this lets React memoization skip
 * work when nothing changed.
 */
export const applyEvent = (state, event) => {
  if (!event || !event.eventType) return state;
  const handler = HANDLERS[event.eventType];
  if (!handler) return state;
  return handler(state, event);
};

/**
 * Fast-forward the state by applying events sequentially from `startIndex`
 * (exclusive) to `targetIndex` (inclusive). Runs entirely in memory.
 */
export const applyRange = (state, events, startIndex, targetIndex) => {
  let cursor = state;
  for (let i = startIndex + 1; i <= targetIndex; i += 1) {
    cursor = applyEvent(cursor, events[i]);
  }
  return cursor;
};

/**
 * Rebuild the state from scratch up to and including `targetIndex`.
 * Used when the user jumps backwards on the scrubber (cheaper than
 * maintaining a reverse reducer for every event type).
 */
export const rebuildToIndex = (events, targetIndex) => {
  let state = createEmptyReplayState();
  if (!Array.isArray(events) || events.length === 0 || targetIndex < 0) {
    return state;
  }
  const cap = Math.min(targetIndex, events.length - 1);
  for (let i = 0; i <= cap; i += 1) {
    state = applyEvent(state, events[i]);
  }
  return state;
};

export default {
  REPLAY_EVENT_TYPES,
  createEmptyReplayState,
  applyEvent,
  applyRange,
  rebuildToIndex,
};
