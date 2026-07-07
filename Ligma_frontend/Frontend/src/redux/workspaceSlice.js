import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import workspaceService from "../services/workspace.service";

const initialState = {
  list: [],
  activeWorkspace: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchWorkspaces = createAsyncThunk("workspace/fetchAll", async (_, { rejectWithValue }) => {
  try {
    return await workspaceService.list();
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to load workspaces");
  }
});

export const createWorkspace = createAsyncThunk("workspace/create", async (payload, { rejectWithValue }) => {
  try {
    return await workspaceService.create(payload);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to create workspace");
  }
});

export const fetchWorkspaceById = createAsyncThunk("workspace/fetchById", async (workspaceId, { rejectWithValue }) => {
  try {
    return await workspaceService.getById(workspaceId);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to load workspace");
  }
});

export const updateWorkspace = createAsyncThunk("workspace/update", async ({ workspaceId, payload }, { rejectWithValue }) => {
  try {
    return await workspaceService.update(workspaceId, payload);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to update workspace");
  }
});

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    clearActiveWorkspace(state) {
      state.activeWorkspace = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data?.workspaces || [];
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load workspaces";
      })
      .addCase(createWorkspace.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.saving = false;
        const workspace = action.payload?.data?.workspace;
        if (workspace) {
          state.list = [workspace, ...state.list];
          state.activeWorkspace = workspace;
        }
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to create workspace";
      })
      .addCase(fetchWorkspaceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceById.fulfilled, (state, action) => {
        state.loading = false;
        state.activeWorkspace = action.payload?.data?.workspace || null;
      })
      .addCase(fetchWorkspaceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load workspace";
      })
      .addCase(updateWorkspace.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.saving = false;
        const workspace = action.payload?.data?.workspace;

        if (workspace) {
          state.activeWorkspace = workspace;
          state.list = state.list.map((item) => (item.id === workspace.id ? workspace : item));
        }
      })
      .addCase(updateWorkspace.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to update workspace";
      });
  },
});

export const { clearActiveWorkspace } = workspaceSlice.actions;

export default workspaceSlice.reducer;