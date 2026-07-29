import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useSocket from "@/hooks/useSocket";
import {
  clearWorkspaceChat,
  createChatChannel,
  deleteChatMessage,
  fetchChannelMessages,
  fetchChatChannels,
  receiveChatChannel,
  receiveChatMessage,
  removeChatChannel,
  removeChatMessageLocally,
  setActiveChatChannel,
  setChannelTypingState,
  sendChatMessage,
  updateChatMessage,
} from "@/redux/chatSlice";

export function useWorkspaceChat(workspaceId) {
  const dispatch = useDispatch();
  const chat = useSelector((state) => state.chat);
  const { on, off, emit } = useSocket({ workspaceId, autoJoin: true });

  useEffect(() => {
    if (!workspaceId) return;
    dispatch(fetchChatChannels(workspaceId));
    return () => {
      dispatch(clearWorkspaceChat());
    };
  }, [dispatch, workspaceId]);

  useEffect(() => {
    const handleChannelCreated = (payload) => dispatch(receiveChatChannel(payload?.channel || payload));
    const handleChannelDeleted = (payload) => dispatch(removeChatChannel(payload?.channelId || payload?.id || payload));
    const handleMessageCreated = (payload) => dispatch(receiveChatMessage(payload?.message || payload));
    const handleMessageUpdated = (payload) => dispatch(receiveChatMessage(payload?.message || payload));
    const handleMessageDeleted = (payload) => dispatch(removeChatMessageLocally({
      channelId: payload?.channelId,
      messageId: payload?.messageId || payload?.id,
    }));
    const handleTyping = (payload) => {
      if (!payload?.channelId || !payload?.user?.id) return;
      dispatch(setChannelTypingState(payload));
    };

    on("chat:channel-created", handleChannelCreated);
    on("chat:channel-deleted", handleChannelDeleted);
    on("chat:message", handleMessageCreated);
    on("chat:message-updated", handleMessageUpdated);
    on("chat:message-deleted", handleMessageDeleted);
    on("chat:typing", handleTyping);

    return () => {
      return () => {
        off("chat:channel-created", handleChannelCreated);
        off("chat:channel-deleted", handleChannelDeleted);
        off("chat:message", handleMessageCreated);
        off("chat:message-updated", handleMessageUpdated);
        off("chat:message-deleted", handleMessageDeleted);
        off("chat:typing", handleTyping);
      };
    };
  }, [dispatch, off, on]);

  useEffect(() => {
    if (!workspaceId || !chat.activeChannelId) return;
    dispatch(fetchChannelMessages({ workspaceId, channelId: chat.activeChannelId, params: { limit: 100 } }));
  }, [chat.activeChannelId, dispatch, workspaceId]);

  const selectChannel = useCallback(
    (channelId) => dispatch(setActiveChatChannel(channelId)),
    [dispatch]
  );

  const createChannel = useCallback(
    (payload) => dispatch(createChatChannel({ workspaceId, payload })),
    [dispatch, workspaceId]
  );

  const refreshMessages = useCallback(
    (channelId) => dispatch(fetchChannelMessages({ workspaceId, channelId, params: { limit: 100 } })),
    [dispatch, workspaceId]
  );

  const sendMessage = useCallback(
    (channelId, payload) => dispatch(sendChatMessage({ workspaceId, channelId, payload })),
    [dispatch, workspaceId]
  );

  const editMessage = useCallback(
    (channelId, messageId, payload) => dispatch(updateChatMessage({ workspaceId, channelId, messageId, payload })),
    [dispatch, workspaceId]
  );

  const removeMessage = useCallback(
    (channelId, messageId) => dispatch(deleteChatMessage({ workspaceId, channelId, messageId })),
    [dispatch, workspaceId]
  );

  const emitTyping = useCallback(
    (channelId, user, isTyping) => {
      emit("chat:typing", {
        workspaceId,
        channelId,
        user,
        isTyping,
      });
    },
    [emit, workspaceId]
  );

  return {
    ...chat,
    selectChannel,
    createChannel,
    refreshMessages,
    sendMessage,
    editMessage,
    removeMessage,
    emitTyping,
  };
}

export default useWorkspaceChat;
