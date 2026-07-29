import apiClient from "./api.service";
import { normalizeChannel, normalizeMessage } from "@/lib/workspace-chat.utils";

const normalizeChannelsResponse = (response) => {
  const channels = response?.data?.channels || response?.data?.items || response?.data || [];
  return Array.isArray(channels) ? channels.map(normalizeChannel) : [];
};

const normalizeMessagesResponse = (response) => {
  const messages = response?.data?.messages || response?.data?.items || response?.data || [];
  return {
    messages: Array.isArray(messages) ? messages.map(normalizeMessage) : [],
    nextCursor: response?.data?.nextCursor || response?.pagination?.nextCursor || null,
  };
};

export const chatService = {
  listChannels: async (workspaceId) => normalizeChannelsResponse(await apiClient.get(`/workspaces/${workspaceId}/chat/channels`)),

  createChannel: async (workspaceId, payload) =>
    normalizeChannel((await apiClient.post(`/workspaces/${workspaceId}/chat/channels`, payload))?.data?.channel),

  listMessages: async (workspaceId, channelId, params = {}) =>
    normalizeMessagesResponse(await apiClient.get(`/workspaces/${workspaceId}/chat/channels/${channelId}/messages`, { params })),

  sendMessage: async (workspaceId, channelId, payload) =>
    normalizeMessage((await apiClient.post(`/workspaces/${workspaceId}/chat/channels/${channelId}/messages`, payload))?.data?.message),

  updateMessage: async (workspaceId, channelId, messageId, payload) =>
    normalizeMessage((await apiClient.patch(`/workspaces/${workspaceId}/chat/channels/${channelId}/messages/${messageId}`, payload))?.data?.message),

  deleteMessage: async (workspaceId, channelId, messageId) => {
    await apiClient.delete(`/workspaces/${workspaceId}/chat/channels/${channelId}/messages/${messageId}`);
    return { channelId, messageId };
  },
};

export default chatService;
