import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "sonner";
import chatService from "@/services/chat.service";
import { normalizeChannel, normalizeMessage } from "@/lib/workspace-chat.utils";

const initialState = {
  channels: [],
  activeChannelId: null,
  messagesByChannel: {},
  unreadByChannel: {},
  nextCursorByChannel: {},
  loadingChannels: false,
  loadingMessages: false,
  sending: false,
  errorChannels: null,
  errorMessages: null,
  typingByChannel: {},
};

const upsertChannel = (channels, channel) => {
  const normalized = normalizeChannel(channel);
  const next = [...channels];
  const index = next.findIndex((item) => item.id === normalized.id);

  if (index === -1) {
    next.push(normalized);
  } else {
    next[index] = {
      ...next[index],
      ...normalized,
    };
  }

  return next.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

const upsertMessage = (messages = [], message) => {
  const normalized = normalizeMessage(message);
  const next = [...messages];
  const index = next.findIndex((item) => item.id === normalized.id);

  if (index === -1) {
    next.push(normalized);
  } else {
    next[index] = {
      ...next[index],
      ...normalized,
    };
  }

  return next.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export const fetchChatChannels = createAsyncThunk(
  "chat/fetchChannels",
  async (workspaceId, { rejectWithValue }) => {
    try {
      return await chatService.listChannels(workspaceId);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to load channels");
    }
  }
);

export const createChatChannel = createAsyncThunk(
  "chat/createChannel",
  async ({ workspaceId, payload }, { rejectWithValue }) => {
    try {
      return await chatService.createChannel(workspaceId, payload);
    } catch (error) {
      return rejectWithValue(error?.message || "Unable to create channel");
    }
  }
);

export const fetchChannelMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ workspaceId, channelId, params }, { rejectWithValue }) => {
    try {
      const response = await chatService.listMessages(workspaceId, channelId, params);
      return { channelId, ...response };
    } catch (error) {
      return rejectWithValue({
        channelId,
        message: error?.message || "Unable to load messages",
      });
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ workspaceId, channelId, payload }, { rejectWithValue }) => {
    try {
      return await chatService.sendMessage(workspaceId, channelId, payload);
    } catch (error) {
      return rejectWithValue({
        channelId,
        message: error?.message || "Unable to send message",
      });
    }
  }
);

export const updateChatMessage = createAsyncThunk(
  "chat/updateMessage",
  async ({ workspaceId, channelId, messageId, payload }, { rejectWithValue }) => {
    try {
      return await chatService.updateMessage(workspaceId, channelId, messageId, payload);
    } catch (error) {
      return rejectWithValue({
        channelId,
        message: error?.message || "Unable to update message",
      });
    }
  }
);

export const deleteChatMessage = createAsyncThunk(
  "chat/deleteMessage",
  async ({ workspaceId, channelId, messageId }, { rejectWithValue }) => {
    try {
      return await chatService.deleteMessage(workspaceId, channelId, messageId);
    } catch (error) {
      return rejectWithValue({
        channelId,
        message: error?.message || "Unable to delete message",
      });
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveChatChannel(state, action) {
      state.activeChannelId = action.payload;
      state.unreadByChannel[action.payload] = 0;
    },
    setChannelUnread(state, action) {
      const { channelId, count } = action.payload;
      state.unreadByChannel[channelId] = count;
    },
    receiveChatChannel(state, action) {
      state.channels = upsertChannel(state.channels, action.payload);
    },
    removeChatChannel(state, action) {
      const channelId = action.payload;
      state.channels = state.channels.filter((channel) => channel.id !== channelId);
      delete state.messagesByChannel[channelId];
      delete state.unreadByChannel[channelId];
      if (state.activeChannelId === channelId) {
        state.activeChannelId = state.channels[0]?.id || null;
      }
    },
    receiveChatMessage(state, action) {
      const message = normalizeMessage(action.payload);
      const channelId = message.channelId;
      state.messagesByChannel[channelId] = upsertMessage(state.messagesByChannel[channelId], message);
      state.channels = upsertChannel(state.channels, {
        id: channelId,
        updatedAt: message.createdAt,
      });
      if (state.activeChannelId !== channelId) {
        state.unreadByChannel[channelId] = (state.unreadByChannel[channelId] || 0) + 1;
      }
    },
    removeChatMessageLocally(state, action) {
      const { channelId, messageId } = action.payload;
      state.messagesByChannel[channelId] = (state.messagesByChannel[channelId] || []).filter(
        (message) => message.id !== messageId
      );
    },
    setChannelTypingState(state, action) {
      const { channelId, user, isTyping } = action.payload;
      const current = state.typingByChannel[channelId] || [];
      const next = current.filter((entry) => entry.id !== user.id);
      state.typingByChannel[channelId] = isTyping ? [...next, user] : next;
    },
    clearWorkspaceChat(state) {
      state.channels = [];
      state.activeChannelId = null;
      state.messagesByChannel = {};
      state.unreadByChannel = {};
      state.nextCursorByChannel = {};
      state.loadingChannels = false;
      state.loadingMessages = false;
      state.sending = false;
      state.errorChannels = null;
      state.errorMessages = null;
      state.typingByChannel = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatChannels.pending, (state) => {
        state.loadingChannels = true;
        state.errorChannels = null;
      })
      .addCase(fetchChatChannels.fulfilled, (state, action) => {
        state.loadingChannels = false;
        state.channels = action.payload;
        if (!state.activeChannelId) {
          state.activeChannelId = action.payload[0]?.id || null;
        }
        for (const channel of action.payload) {
          state.unreadByChannel[channel.id] = channel.unreadCount || state.unreadByChannel[channel.id] || 0;
        }
      })
      .addCase(fetchChatChannels.rejected, (state, action) => {
        state.loadingChannels = false;
        state.errorChannels = action.payload || "Unable to load channels";
      })
      .addCase(createChatChannel.fulfilled, (state, action) => {
        state.channels = upsertChannel(state.channels, action.payload);
        state.activeChannelId = action.payload.id;
      })
      .addCase(createChatChannel.rejected, (_, action) => {
        toast.error(action.payload || "Unable to create channel");
      })
      .addCase(fetchChannelMessages.pending, (state) => {
        state.loadingMessages = true;
        state.errorMessages = null;
      })
      .addCase(fetchChannelMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        state.messagesByChannel[action.payload.channelId] = action.payload.messages;
        state.nextCursorByChannel[action.payload.channelId] = action.payload.nextCursor;
      })
      .addCase(fetchChannelMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.errorMessages = action.payload?.message || "Unable to load messages";
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sending = false;
        const message = normalizeMessage(action.payload);
        state.messagesByChannel[message.channelId] = upsertMessage(state.messagesByChannel[message.channelId], message);
        state.channels = upsertChannel(state.channels, {
          id: message.channelId,
          updatedAt: message.createdAt,
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sending = false;
        toast.error(action.payload?.message || "Unable to send message");
      })
      .addCase(updateChatMessage.fulfilled, (state, action) => {
        const message = normalizeMessage(action.payload);
        state.messagesByChannel[message.channelId] = upsertMessage(state.messagesByChannel[message.channelId], message);
      })
      .addCase(updateChatMessage.rejected, (_, action) => {
        toast.error(action.payload?.message || "Unable to update message");
      })
      .addCase(deleteChatMessage.fulfilled, (state, action) => {
        const { channelId, messageId } = action.payload;
        state.messagesByChannel[channelId] = (state.messagesByChannel[channelId] || []).filter(
          (message) => message.id !== messageId
        );
      })
      .addCase(deleteChatMessage.rejected, (_, action) => {
        toast.error(action.payload?.message || "Unable to delete message");
      });
  },
});

export const {
  setActiveChatChannel,
  setChannelUnread,
  receiveChatChannel,
  removeChatChannel,
  receiveChatMessage,
  removeChatMessageLocally,
  setChannelTypingState,
  clearWorkspaceChat,
} = chatSlice.actions;

export default chatSlice.reducer;
