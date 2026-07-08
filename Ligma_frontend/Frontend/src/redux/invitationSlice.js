import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import invitationService from "../services/invitation.service";

const initialState = {
  list: [],
  inbox: [],
  currentInvitation: null,
  createResult: null,
  loading: false,
  saving: false,
  publicLoading: false,
  inboxLoading: false,
  error: null,
};

export const fetchWorkspaceInvitations = createAsyncThunk("invitations/fetchWorkspace", async (workspaceId, { rejectWithValue }) => {
  try {
    return await invitationService.listByWorkspace(workspaceId);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to load invitations");
  }
});

export const createWorkspaceInvitation = createAsyncThunk("invitations/create", async ({ workspaceId, payload }, { rejectWithValue }) => {
  try {
    return await invitationService.createForWorkspace(workspaceId, payload);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to create invitation");
  }
});

export const fetchInvitationByToken = createAsyncThunk("invitations/fetchByToken", async (token, { rejectWithValue }) => {
  try {
    return await invitationService.getByToken(token);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to load invitation");
  }
});

export const fetchMyPendingInvitations = createAsyncThunk("invitations/fetchInbox", async (_, { rejectWithValue }) => {
  try {
    return await invitationService.listInbox();
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to load invitations");
  }
});

export const acceptInvitationByToken = createAsyncThunk("invitations/accept", async (token, { rejectWithValue }) => {
  try {
    return await invitationService.acceptByToken(token);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to accept invitation");
  }
});

export const rejectInvitationByToken = createAsyncThunk("invitations/reject", async (token, { rejectWithValue }) => {
  try {
    return await invitationService.rejectByToken(token);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to reject invitation");
  }
});

export const acceptMyInvitationById = createAsyncThunk("invitations/acceptById", async (invitationId, { rejectWithValue }) => {
  try {
    return await invitationService.acceptById(invitationId);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to accept invitation");
  }
});

export const rejectMyInvitationById = createAsyncThunk("invitations/rejectById", async (invitationId, { rejectWithValue }) => {
  try {
    return await invitationService.rejectById(invitationId);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to reject invitation");
  }
});

export const revokeInvitationById = createAsyncThunk("invitations/revoke", async ({ workspaceId, invitationId }, { rejectWithValue }) => {
  try {
    return await invitationService.revokeById(workspaceId, invitationId);
  } catch (error) {
    return rejectWithValue(error?.message || "Unable to revoke invitation");
  }
});

const updateInvitationInList = (state, invitation) => {
  if (!invitation?.id) {
    return;
  }

  const existingIndex = state.list.findIndex((item) => item.id === invitation.id);

  if (existingIndex >= 0) {
    state.list[existingIndex] = invitation;
  } else {
    state.list = [invitation, ...state.list];
  }
};

const invitationSlice = createSlice({
  name: "invitations",
  initialState,
  reducers: {
    clearCurrentInvitation(state) {
      state.currentInvitation = null;
      state.error = null;
    },
    clearInvitationCreateResult(state) {
      state.createResult = null;
    },
    clearInvitationInbox(state) {
      state.inbox = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaceInvitations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkspaceInvitations.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data?.invitations || [];
      })
      .addCase(fetchWorkspaceInvitations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load invitations";
      })
      .addCase(createWorkspaceInvitation.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.createResult = null;
      })
      .addCase(createWorkspaceInvitation.fulfilled, (state, action) => {
        state.saving = false;
        const result = action.payload?.data;
        state.createResult = result || null;

        if (result?.invitation) {
          updateInvitationInList(state, result.invitation);
        }
      })
      .addCase(createWorkspaceInvitation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload || "Unable to create invitation";
      })
      .addCase(fetchInvitationByToken.pending, (state) => {
        state.publicLoading = true;
        state.error = null;
      })
      .addCase(fetchInvitationByToken.fulfilled, (state, action) => {
        state.publicLoading = false;
        state.currentInvitation = action.payload?.data?.invitation || null;
      })
      .addCase(fetchInvitationByToken.rejected, (state, action) => {
        state.publicLoading = false;
        state.error = action.payload || "Unable to load invitation";
      })
      .addCase(fetchMyPendingInvitations.pending, (state) => {
        state.inboxLoading = true;
      })
      .addCase(fetchMyPendingInvitations.fulfilled, (state, action) => {
        state.inboxLoading = false;
        state.inbox = action.payload?.data?.invitations || [];
      })
      .addCase(fetchMyPendingInvitations.rejected, (state, action) => {
        state.inboxLoading = false;
        state.error = action.payload || "Unable to load invitations";
      })
      .addCase(acceptInvitationByToken.fulfilled, (state, action) => {
        const invitation = action.payload?.data?.invitation;
        if (invitation) {
          state.currentInvitation = invitation;
          updateInvitationInList(state, invitation);
        }
      })
      .addCase(rejectInvitationByToken.fulfilled, (state, action) => {
        const invitation = action.payload?.data?.invitation;
        if (invitation) {
          state.currentInvitation = invitation;
          updateInvitationInList(state, invitation);
        }
      })
      .addCase(revokeInvitationById.fulfilled, (state, action) => {
        const invitation = action.payload?.data?.invitation;
        if (invitation) {
          updateInvitationInList(state, invitation);
        }
      })
      .addCase(acceptMyInvitationById.fulfilled, (state, action) => {
        const invitation = action.payload?.data?.invitation;
        if (invitation) {
          state.inbox = state.inbox.filter((item) => item.id !== invitation.id);
          updateInvitationInList(state, invitation);
        }
      })
      .addCase(rejectMyInvitationById.fulfilled, (state, action) => {
        const invitation = action.payload?.data?.invitation;
        if (invitation) {
          state.inbox = state.inbox.filter((item) => item.id !== invitation.id);
          updateInvitationInList(state, invitation);
        }
      })
      .addCase(acceptInvitationByToken.rejected, (state, action) => {
        state.error = action.payload || "Unable to accept invitation";
      })
      .addCase(rejectInvitationByToken.rejected, (state, action) => {
        state.error = action.payload || "Unable to reject invitation";
      })
      .addCase(acceptMyInvitationById.rejected, (state, action) => {
        state.error = action.payload || "Unable to accept invitation";
      })
      .addCase(rejectMyInvitationById.rejected, (state, action) => {
        state.error = action.payload || "Unable to reject invitation";
      })
      .addCase(revokeInvitationById.rejected, (state, action) => {
        state.error = action.payload || "Unable to revoke invitation";
      });
  },
});

export const { clearCurrentInvitation, clearInvitationCreateResult, clearInvitationInbox } = invitationSlice.actions;

export default invitationSlice.reducer;