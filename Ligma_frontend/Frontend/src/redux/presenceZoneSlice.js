import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import presenceZoneService from "@/services/presence-zone.service";

const initialState = {
  items: [],
  loading: false,
  saving: false,
  error: null,
};

const upsertZone = (items, zone) => {
  const next = [...items];
  const index = next.findIndex((item) => item.id === zone.id);
  if (index === -1) {
    next.push(zone);
  } else {
    next[index] = zone;
  }

  return next.sort((a, b) => a.y - b.y || a.x - b.x);
};

export const fetchPresenceZones = createAsyncThunk(
  "presenceZones/fetchAll",
  async (workspaceId, { rejectWithValue }) => {
    try {
      return await presenceZoneService.list(workspaceId);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to load presence zones");
    }
  }
);

export const createPresenceZone = createAsyncThunk(
  "presenceZones/create",
  async ({ workspaceId, payload }, { rejectWithValue }) => {
    try {
      return await presenceZoneService.create(workspaceId, payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to create presence zone");
    }
  }
);

export const updatePresenceZone = createAsyncThunk(
  "presenceZones/update",
  async ({ workspaceId, zoneId, payload }, { rejectWithValue }) => {
    try {
      return await presenceZoneService.update(workspaceId, zoneId, payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to update presence zone");
    }
  }
);

export const deletePresenceZone = createAsyncThunk(
  "presenceZones/delete",
  async ({ workspaceId, zoneId }, { rejectWithValue }) => {
    try {
      return await presenceZoneService.remove(workspaceId, zoneId);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to delete presence zone");
    }
  }
);

const presenceZoneSlice = createSlice({
  name: "presenceZones",
  initialState,
  reducers: {
    upsertPresenceZoneLocally(state, action) {
      state.items = upsertZone(state.items, action.payload);
    },
    removePresenceZoneLocally(state, action) {
      state.items = state.items.filter((zone) => zone.id !== action.payload);
    },
    clearPresenceZones(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPresenceZones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresenceZones.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPresenceZones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load presence zones";
      })
      .addCase(createPresenceZone.pending, (state) => {
        state.saving = true;
      })
      .addCase(createPresenceZone.fulfilled, (state, action) => {
        state.saving = false;
        state.items = upsertZone(state.items, action.payload);
      })
      .addCase(createPresenceZone.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to create presence zone";
        toast.error(state.error);
      })
      .addCase(updatePresenceZone.pending, (state) => {
        state.saving = true;
      })
      .addCase(updatePresenceZone.fulfilled, (state, action) => {
        state.saving = false;
        state.items = upsertZone(state.items, action.payload);
      })
      .addCase(updatePresenceZone.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to update presence zone";
        toast.error(state.error);
      })
      .addCase(deletePresenceZone.fulfilled, (state, action) => {
        state.items = state.items.filter((zone) => zone.id !== action.payload);
      })
      .addCase(deletePresenceZone.rejected, (state, action) => {
        state.error = action.payload || "Unable to delete presence zone";
        toast.error(state.error);
      });
  },
});

export const {
  upsertPresenceZoneLocally,
  removePresenceZoneLocally,
  clearPresenceZones,
} = presenceZoneSlice.actions;

export default presenceZoneSlice.reducer;
