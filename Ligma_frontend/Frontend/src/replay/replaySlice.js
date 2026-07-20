// replaySlice.js
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Fully isolated replay state. Never mutates canvasSlice / taskSlice / eventSlice.
// The live workspace continues receiving Socket.IO updates while replay is
// running — this slice is a parallel universe.
// -----------------------------------------------------------------------------

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchReplayEvents } from "./replay.service";
import { rebuildToIndex, createEmptyReplayState } from "./engine/ReplayEngine";

const initialState = {
  // Lifecycle
  isOpen: false,        // replay UI is mounted
  isPlaying: false,     // auto-play tick loop running
  status: "idle",       // idle | loading | ready | error
  error: null,

  // Immutable, chronologically-sorted event list (oldest → newest)
  events: [],

  // Current position on the timeline. -1 = "before first event" (empty seed).
  index: -1,

  // Playback speed multiplier (0.5x / 1x / 2x / 4x)
  speed: 1,

  // Rebuilt canvas + task state at the current index
  virtualState: createEmptyReplayState(),

  // Workspace this replay was hydrated for — guards against stale data on switch
  workspaceId: null,
};

// ── Thunks ───────────────────────────────────────────────────────────────────
export const openReplay = createAsyncThunk(
  "replay/open",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const events = await fetchReplayEvents(workspaceId);
      return { workspaceId, events };
    } catch (err) {
      return rejectWithValue(err?.message || "Unable to load replay history");
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────
const replaySlice = createSlice({
  name: "replay",
  initialState,
  reducers: {
    /**
     * Move to a specific index. Rebuilds virtualState from event 0 up to and
     * including `index`. Fast enough for thousands of events since the engine
     * is a pure O(n) reducer with structural sharing.
     */
    seekToIndex(state, action) {
      const target = Math.min(
        state.events.length - 1,
        Math.max(-1, Number(action.payload))
      );
      if (target === state.index) return;
      state.index = target;
      state.virtualState = rebuildToIndex(state.events, target);
    },

    play(state) {
      if (state.events.length === 0) return;
      // If we're at the very end, restart from the beginning on play.
      if (state.index >= state.events.length - 1) {
        state.index = -1;
        state.virtualState = createEmptyReplayState();
      }
      state.isPlaying = true;
    },

    pause(state) {
      state.isPlaying = false;
    },

    setSpeed(state, action) {
      const next = Number(action.payload);
      if ([0.5, 1, 2, 4].includes(next)) {
        state.speed = next;
      }
    },

    stepForward(state) {
      if (state.index >= state.events.length - 1) {
        state.isPlaying = false;
        return;
      }
      state.index += 1;
      state.virtualState = rebuildToIndex(state.events, state.index);
    },

    stepBackward(state) {
      if (state.index <= -1) return;
      state.index -= 1;
      state.virtualState = rebuildToIndex(state.events, state.index);
    },

    seekToStart(state) {
      state.index = -1;
      state.isPlaying = false;
      state.virtualState = createEmptyReplayState();
    },

    seekToEnd(state) {
      if (state.events.length === 0) return;
      state.index = state.events.length - 1;
      state.isPlaying = false;
      state.virtualState = rebuildToIndex(state.events, state.index);
    },

    /**
     * Tear the replay down and return to live canvas. Fully resets state so
     * nothing leaks between sessions.
     */
    closeReplay() {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(openReplay.pending, (state, action) => {
        state.isOpen = true;
        state.status = "loading";
        state.error = null;
        state.workspaceId = action.meta.arg;
      })
      .addCase(openReplay.fulfilled, (state, action) => {
        state.status = "ready";
        state.events = action.payload.events;
        state.workspaceId = action.payload.workspaceId;
        state.index = -1;
        state.virtualState = createEmptyReplayState();
        state.isPlaying = false;
        state.speed = 1;
      })
      .addCase(openReplay.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload || "Unable to load replay history";
      });
  },
});

export const {
  seekToIndex,
  play,
  pause,
  setSpeed,
  stepForward,
  stepBackward,
  seekToStart,
  seekToEnd,
  closeReplay,
} = replaySlice.actions;

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectReplay = (state) => state.replay;
export const selectReplayIsActive = (state) => state.replay.isOpen;
export const selectReplayEvents = (state) => state.replay.events;
export const selectReplayIndex = (state) => state.replay.index;
export const selectReplayCurrentEvent = (state) => {
  const { events, index } = state.replay;
  if (index < 0 || index >= events.length) return null;
  return events[index];
};
export const selectReplayNodes = (state) =>
  Object.values(state.replay.virtualState.nodes);
export const selectReplayTasks = (state) =>
  Object.values(state.replay.virtualState.tasks);

export default replaySlice.reducer;
