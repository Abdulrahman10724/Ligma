import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import canvasNodeService from "../services/canvas-node.service";

const initialState = {
  // nodes stored as { [nodeId]: nodeObject } for O(1) lookup
  nodes: {},
  loading: false,
  saving: false,
  error: null,
};

export const fetchCanvasNodes = createAsyncThunk(
  "canvas/fetchNodes",
  async (workspaceId, { rejectWithValue }) => {
    try {
      return await canvasNodeService.list(workspaceId);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to load canvas nodes");
    }
  }
);

export const createCanvasNode = createAsyncThunk(
  "canvas/createNode",
  async ({ workspaceId, payload }, { rejectWithValue }) => {
    try {
      return await canvasNodeService.create(workspaceId, payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to create node");
    }
  }
);

export const updateCanvasNode = createAsyncThunk(
  "canvas/updateNode",
  async ({ workspaceId, nodeId, payload }, { rejectWithValue }) => {
    try {
      return await canvasNodeService.update(workspaceId, nodeId, payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to update node");
    }
  }
);

export const deleteCanvasNode = createAsyncThunk(
  "canvas/deleteNode",
  async ({ workspaceId, nodeId }, { rejectWithValue }) => {
    try {
      await canvasNodeService.remove(workspaceId, nodeId);
      return nodeId;
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to delete node");
    }
  }
);

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    // Optimistic local-only position update while dragging (no API call)
    updateNodePositionLocally(state, action) {
      const { nodeId, x, y } = action.payload;
      if (state.nodes[nodeId]) {
        state.nodes[nodeId] = { ...state.nodes[nodeId], x, y };
      }
    },
    updateNodeDataLocally(state, action) {
      const { nodeId, patch } = action.payload;
      if (state.nodes[nodeId]) {
        state.nodes[nodeId] = {
          ...state.nodes[nodeId],
          data: {
            ...(state.nodes[nodeId].data || {}),
            ...patch,
          },
        };
      }
    },
    clearCanvas(state) {
      state.nodes = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCanvasNodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCanvasNodes.fulfilled, (state, action) => {
        state.loading = false;
        const nodes = action.payload?.data?.nodes || [];
        state.nodes = nodes.reduce((acc, node) => {
          acc[node.id] = node;
          return acc;
        }, {});
      })
      .addCase(fetchCanvasNodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load canvas nodes";
      })
      .addCase(createCanvasNode.pending, (state) => {
        state.saving = true;
      })
      .addCase(createCanvasNode.fulfilled, (state, action) => {
        state.saving = false;
        const node = action.payload?.data?.node;
        if (node) {
          state.nodes[node.id] = node;
        }
      })
      .addCase(createCanvasNode.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to create node";
      })
      .addCase(updateCanvasNode.fulfilled, (state, action) => {
        const node = action.payload?.data?.node;
        if (node) {
          state.nodes[node.id] = node;
        }
      })
      .addCase(deleteCanvasNode.fulfilled, (state, action) => {
        const nodeId = action.payload;
        if (nodeId) {
          delete state.nodes[nodeId];
        }
      });
  },
});

export const { updateNodePositionLocally, updateNodeDataLocally, clearCanvas } = canvasSlice.actions;

export default canvasSlice.reducer;
