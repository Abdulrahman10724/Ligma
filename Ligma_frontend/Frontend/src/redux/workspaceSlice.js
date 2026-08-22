import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import workspaceService from "../services/workspace.service";

const initialState = {
  list: [],
  hiddenList: [],
  activeWorkspace: null,
  loading: false,
  hiddenLoading: false,
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

export const fetchHiddenWorkspaces = createAsyncThunk("workspace/fetchHidden", async (_, { rejectWithValue }) => {
  try {
    return await workspaceService.listHidden();
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to load hidden workspaces");
  }
});

export const deleteWorkspace = createAsyncThunk("workspace/delete", async ({ workspaceId, confirmTitle }, { rejectWithValue }) => {
  try {
    await workspaceService.remove(workspaceId, confirmTitle);
    return workspaceId;
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to delete workspace");
  }
});

export const hideWorkspace = createAsyncThunk("workspace/hide", async (workspaceId, { rejectWithValue }) => {
  try {
    const response = await workspaceService.hide(workspaceId);
    return { workspaceId, workspace: response?.data?.workspace };
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to hide workspace");
  }
});

export const unhideWorkspace = createAsyncThunk("workspace/unhide", async (workspaceId, { rejectWithValue }) => {
  try {
    const response = await workspaceService.unhide(workspaceId);
    return { workspaceId, workspace: response?.data?.workspace };
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to unhide workspace");
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
      })
      .addCase(fetchHiddenWorkspaces.pending, (state) => {
        state.hiddenLoading = true;
      })
      .addCase(fetchHiddenWorkspaces.fulfilled, (state, action) => {
        state.hiddenLoading = false;
        state.hiddenList = action.payload?.data?.workspaces || [];
      })
      .addCase(fetchHiddenWorkspaces.rejected, (state) => {
        state.hiddenLoading = false;
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        const workspaceId = action.payload;
        state.list = state.list.filter((item) => item.id !== workspaceId);
        state.hiddenList = state.hiddenList.filter((item) => item.id !== workspaceId);
        if (state.activeWorkspace?.id === workspaceId) {
          state.activeWorkspace = null;
        }
      })
      .addCase(deleteWorkspace.rejected, (state, action) => {
        state.error = action.payload || "Unable to delete workspace";
      })
      .addCase(hideWorkspace.fulfilled, (state, action) => {
        const { workspaceId, workspace } = action.payload;
        state.list = state.list.filter((item) => item.id !== workspaceId);
        if (workspace && !state.hiddenList.some((item) => item.id === workspace.id)) {
          state.hiddenList = [workspace, ...state.hiddenList];
        }
      })
      .addCase(hideWorkspace.rejected, (state, action) => {
        state.error = action.payload || "Unable to hide workspace";
      })
      .addCase(unhideWorkspace.fulfilled, (state, action) => {
        const { workspaceId, workspace } = action.payload;
        state.hiddenList = state.hiddenList.filter((item) => item.id !== workspaceId);
        if (workspace && !state.list.some((item) => item.id === workspace.id)) {
          state.list = [workspace, ...state.list];
        }
      })
      .addCase(unhideWorkspace.rejected, (state, action) => {
        state.error = action.payload || "Unable to unhide workspace";
      });
  },
});

export const { clearActiveWorkspace } = workspaceSlice.actions;

export default workspaceSlice.reducer;