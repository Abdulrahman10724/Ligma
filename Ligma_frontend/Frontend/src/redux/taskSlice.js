import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import taskService from "../services/task.service";

// ─── Thunks ─────────────────────────────────────────────────────────────────

export const fetchTasks = createAsyncThunk(
  "tasks/fetch",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const res = await taskService.list(workspaceId);
      // response: { success, message, data: [...tasks] }
      return Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to load tasks");
    }
  }
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async ({ workspaceId, data }, { rejectWithValue }) => {
    try {
      const res = await taskService.create(workspaceId, data);
      return res?.data;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to create task");
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async ({ workspaceId, taskId, data }, { rejectWithValue }) => {
    try {
      const res = await taskService.update(workspaceId, taskId, data);
      return res?.data;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update task");
    }
  }
);

export const patchTaskStatus = createAsyncThunk(
  "tasks/patchStatus",
  async ({ workspaceId, taskId, status }, { rejectWithValue }) => {
    try {
      const res = await taskService.patchStatus(workspaceId, taskId, status);
      return res?.data;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to update status");
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async ({ workspaceId, taskId }, { rejectWithValue }) => {
    try {
      await taskService.remove(workspaceId, taskId);
      return taskId;
    } catch (err) {
      return rejectWithValue(err?.message || "Failed to delete task");
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  list: [],
  loading: false,
  error: null,
};

const upsert = (list, task) => {
  const idx = list.findIndex((t) => t.id === task.id);
  if (idx === -1) return [...list, task];
  const next = [...list];
  next[idx] = task;
  return next;
};

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    // Socket sync
    socketTaskCreated(state, { payload }) {
      state.list = upsert(state.list, payload);
    },
    socketTaskUpdated(state, { payload }) {
      if (!payload) return;
      state.list = upsert(state.list, payload);
    },
    socketTaskDeleted(state, { payload }) {
      // payload: { id, nodeId }
      const id = payload?.id || payload;
      state.list = state.list.filter((t) => t.id !== id);
    },
    // Optimistic helpers
    optimisticAdd(state, { payload }) {
      state.list = [...state.list, payload];
    },
    optimisticUpdate(state, { payload }) {
      state.list = state.list.map((t) => (t.id === payload.id ? { ...t, ...payload } : t));
    },
    optimisticRemove(state, { payload: id }) {
      state.list = state.list.filter((t) => t.id !== id);
    },
    clearTasks(state) {
      state.list = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload;
      })
      .addCase(fetchTasks.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
        toast.error(payload || "Failed to load tasks");
      })
      // create
      .addCase(createTask.fulfilled, (state, { payload }) => {
        if (payload) state.list = upsert(state.list, payload);
      })
      .addCase(createTask.rejected, (_, { payload }) => {
        toast.error(payload || "Failed to create task");
      })
      // update
      .addCase(updateTask.fulfilled, (state, { payload }) => {
        if (payload) state.list = upsert(state.list, payload);
      })
      .addCase(updateTask.rejected, (_, { payload }) => {
        toast.error(payload || "Failed to update task");
      })
      // patch status
      .addCase(patchTaskStatus.fulfilled, (state, { payload }) => {
        if (payload) state.list = upsert(state.list, payload);
      })
      .addCase(patchTaskStatus.rejected, (_, { payload }) => {
        toast.error(payload || "Failed to update status");
      })
      // delete
      .addCase(deleteTask.fulfilled, (state, { payload: id }) => {
        state.list = state.list.filter((t) => t.id !== id);
      })
      .addCase(deleteTask.rejected, (_, { payload }) => {
        toast.error(payload || "Failed to delete task");
      });
  },
});

export const {
  socketTaskCreated,
  socketTaskUpdated,
  socketTaskDeleted,
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
  clearTasks,
} = taskSlice.actions;

export default taskSlice.reducer;
