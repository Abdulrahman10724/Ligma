import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import zoneService from "../services/zone.service";

const initialState = {
  byId: {},
  allIds: [],
  presence: {},
  loading: false,
  saving: false,
  error: null,
};

export const fetchZones = createAsyncThunk(
  "zones/fetch",
  async (workspaceId, { rejectWithValue }) => {
    try {
      return await zoneService.list(workspaceId);
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load zones");
    }
  }
);

export const createZone = createAsyncThunk(
  "zones/create",
  async ({ workspaceId, payload }, { rejectWithValue }) => {
    try {
      return await zoneService.create(workspaceId, payload);
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to create zone");
    }
  }
);

export const updateZone = createAsyncThunk(
  "zones/update",
  async ({ workspaceId, zoneId, payload }, { rejectWithValue }) => {
    try {
      return await zoneService.update(workspaceId, zoneId, payload);
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update zone");
    }
  }
);

export const deleteZone = createAsyncThunk(
  "zones/delete",
  async ({ workspaceId, zoneId }, { rejectWithValue }) => {
    try {
      await zoneService.remove(workspaceId, zoneId);
      return zoneId;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to delete zone");
    }
  }
);

const upsert = (state, zone) => {
  if (!zone) return;
  const isExisting = !!state.byId[zone.id];
  state.byId[zone.id] = { ...state.byId[zone.id], ...zone };
  if (!isExisting) state.allIds.push(zone.id);
};

const remove = (state, zoneId) => {
  delete state.byId[zoneId];
  state.allIds = state.allIds.filter((id) => id !== zoneId);
  delete state.presence[zoneId];
};

const zoneSlice = createSlice({
  name: "zones",
  initialState,
  reducers: {
    clearZones(state) {
      state.byId = {};
      state.allIds = [];
      state.presence = {};
      state.error = null;
    },
    moveZoneLocally(state, { payload }) {
      const { zoneId, x, y, width, height } = payload || {};
      if (!zoneId || !state.byId[zoneId]) return;
      state.byId[zoneId] = {
        ...state.byId[zoneId],
        x: x !== undefined ? x : state.byId[zoneId].x,
        y: y !== undefined ? y : state.byId[zoneId].y,
        width: width !== undefined ? width : state.byId[zoneId].width,
        height: height !== undefined ? height : state.byId[zoneId].height,
        pending: true,
      };
    },
    socketZoneCreated(state, { payload }) {
      if (!payload?.zone) return;
      upsert(state, payload.zone);
    },
    socketZoneUpdated(state, { payload }) {
      if (!payload?.zone) return;
      upsert(state, { ...payload.zone, pending: false });
    },
    socketZoneDeleted(state, { payload }) {
      const zoneId = payload?.zoneId || payload;
      remove(state, zoneId);
    },
    socketZonePresence(state, { payload }) {
      const presence = (payload && payload.presence) || {};
      state.presence = presence;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchZones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchZones.fulfilled, (state, { payload }) => {
        state.loading = false;
        const zones = payload?.data?.zones || [];
        state.byId = {};
        state.allIds = [];
        for (const zone of zones) upsert(state, zone);
      })
      .addCase(fetchZones.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        toast.error(payload || "Failed to load zones");
      })
      .addCase(createZone.pending, (state) => {
        state.saving = true;
      })
      .addCase(createZone.fulfilled, (state, { payload }) => {
        state.saving = false;
        const zone = payload?.data?.zone;
        if (zone) upsert(state, zone);
      })
      .addCase(createZone.rejected, (_, { payload }) => {
        toast.error(payload || "Failed to create zone");
      })
      .addCase(updateZone.fulfilled, (state, { payload }) => {
        const zone = payload?.data?.zone;
        if (zone) upsert(state, { ...zone, pending: false });
      })
      .addCase(updateZone.rejected, (_, { payload }) => {
        toast.error(payload || "Failed to update zone");
      })
      .addCase(deleteZone.fulfilled, (state, { payload: zoneId }) => {
        remove(state, zoneId);
      })
      .addCase(deleteZone.rejected, (_, { payload }) => {
        toast.error(payload || "Failed to delete zone");
      });
  },
});

export const {
  clearZones,
  moveZoneLocally,
  socketZoneCreated,
  socketZoneUpdated,
  socketZoneDeleted,
  socketZonePresence,
} = zoneSlice.actions;

export default zoneSlice.reducer;
