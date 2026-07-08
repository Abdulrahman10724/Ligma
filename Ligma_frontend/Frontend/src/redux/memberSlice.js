import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import memberService from "../services/member.service";

const initialState = {
  list: [],
  pendingInvitations: [],
  loading: false,
  saving: false,
  error: null,
};

export const fetchWorkspaceMembers = createAsyncThunk(
  "members/fetchAll",
  async (workspaceId, { rejectWithValue }) => {
    try {
      return await memberService.listByWorkspace(workspaceId);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to load members");
    }
  }
);

export const changeMemberRole = createAsyncThunk(
  "members/changeRole",
  async ({ workspaceId, userId, role }, { rejectWithValue }) => {
    try {
      return await memberService.changeRole(workspaceId, userId, role);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to change role");
    }
  }
);

export const removeMember = createAsyncThunk(
  "members/remove",
  async ({ workspaceId, userId }, { rejectWithValue }) => {
    try {
      await memberService.remove(workspaceId, userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to remove member");
    }
  }
);

export const fetchPendingInvitations = createAsyncThunk(
  "members/fetchPendingInvitations",
  async (workspaceId, { rejectWithValue }) => {
    try {
      return await memberService.listPendingInvitations(workspaceId);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to load invitations");
    }
  }
);

const memberSlice = createSlice({
  name: "members",
  initialState,
  reducers: {
    clearMembers(state) {
      state.list = [];
      state.pendingInvitations = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaceMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data?.members || [];
      })
      .addCase(fetchWorkspaceMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load members";
      })
      .addCase(changeMemberRole.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(changeMemberRole.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload?.data?.member;
        if (updated) {
          state.list = state.list.map((m) => (m.userId === updated.userId ? { ...m, role: updated.role } : m));
        }
      })
      .addCase(changeMemberRole.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to change role";
      })
      .addCase(removeMember.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.saving = false;
        const removedUserId = action.payload;
        state.list = state.list.filter((m) => m.userId !== removedUserId);
      })
      .addCase(removeMember.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to remove member";
      })
      .addCase(fetchPendingInvitations.fulfilled, (state, action) => {
        state.pendingInvitations = action.payload?.data?.invitations || [];
      });
  },
});

export const { clearMembers } = memberSlice.actions;

export default memberSlice.reducer;
