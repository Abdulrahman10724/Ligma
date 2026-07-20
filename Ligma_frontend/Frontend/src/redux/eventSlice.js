import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import eventService from "../services/event.service";

const initialState = {
  events: [],
  loading: false,
  error: null,
  limit: 20, // default limit for pagination
};

export const fetchWorkspaceEvents = createAsyncThunk(
  "event/fetchEvents",
  async ({ workspaceId, limit }, { rejectWithValue }) => {
    try {
      const response = await eventService.getEvents(workspaceId, limit);
      return response;
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to load history");
    }
  }
);

const eventSlice = createSlice({
  name: "event",
  initialState,
  reducers: {
    incrementLimit(state, action) {
      state.limit += action.payload || 20;
    },
    resetLimit(state) {
      state.limit = 20;
    },
    clearEvents(state) {
      state.events = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaceEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload?.data?.events || [];
      })
      .addCase(fetchWorkspaceEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load history";
      });
  },
});

export const { incrementLimit, resetLimit, clearEvents } = eventSlice.actions;

export default eventSlice.reducer;
