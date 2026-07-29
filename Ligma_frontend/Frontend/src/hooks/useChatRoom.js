import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import useSocket from "./useSocket";
import {
  fetchChannelMessages,
  sendChatMessage,
  updateChatMessage,
  receiveChatChannel,
  removeChatChannel,
  receiveChatMessage,
  removeChatMessageLocally,
  setChannelTypingState,
} from "@/redux/chatSlice";

export function useChatRoom({ workspaceId, currentUser }) {
  const dispatch = useDispatch();
  const { on, off, emit } = useSocket({ workspaceId });
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    if (!workspaceId) return undefined;

    const onCreated = (payload) => {
      if (payload?.channel?.workspaceId !== workspaceId) return;
      dispatch(receiveChatChannel(payload.channel));
    };
    const onDeleted = (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      dispatch(removeChatChannel(payload.channelId));
    };
    const onNewMessage = (payload) => {
      if (!payload?.message) return;
      if (payload.message.workspaceId && payload.message.workspaceId !== workspaceId) return;
      dispatch(receiveChatMessage(payload.message));
    };
    const onMessageUpdated = (payload) => {
      if (!payload?.message) return;
      if (payload.message.workspaceId && payload.message.workspaceId !== workspaceId) return;
      dispatch(receiveChatMessage(payload.message)); // upsert reducer handles update too
    };
    const onMessageDeleted = (payload) => {
      if (payload?.workspaceId && payload.workspaceId !== workspaceId) return;
      dispatch(removeChatMessageLocally({ channelId: payload.channelId, messageId: payload.messageId }));
    };
    const onTyping = (payload) => {
      if (payload?.workspaceId && payload.workspaceId !== workspaceId) return;
      dispatch(setChannelTypingState({ channelId: payload.channelId, user: payload.user, isTyping: true }));
    };
    const onStopped = (payload) => {
      if (payload?.workspaceId && payload.workspaceId !== workspaceId) return;
      dispatch(setChannelTypingState({ channelId: payload.channelId, user: payload.user, isTyping: false }));
    };

    on("chat:message", onNewMessage);
    on("chat:message-updated", onMessageUpdated);
    on("chat:message-deleted", onMessageDeleted);
    on("chat:typing", onTyping);
    on("chat:stopped-typing", onStopped);
    on("chat:channel-created", onCreated);
    on("chat:channel-deleted", onDeleted);

    return () => {
      off("chat:message", onNewMessage);
      off("chat:message-updated", onMessageUpdated);
      off("chat:message-deleted", onMessageDeleted);
      off("chat:typing", onTyping);
      off("chat:stopped-typing", onStopped);
      off("chat:channel-created", onCreated);
      off("chat:channel-deleted", onDeleted);
    };
  }, [dispatch, off, on, workspaceId]);

  const activeChannelId = useSelector((s) => s.chat.activeChannelId);
  useEffect(() => {
    if (!workspaceId || !activeChannelId) return;
    dispatch(fetchChannelMessages({ workspaceId, channelId: activeChannelId }));
    emit("chat:join-channel", { workspaceId, channelId: activeChannelId });
    return () => emit("chat:leave-channel", { workspaceId, channelId: activeChannelId });
  }, [activeChannelId, dispatch, emit, workspaceId]);

  const emitTyping = useCallback(() => {
    if (!workspaceId || !activeChannelId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1100) return;
    lastTypingSentRef.current = now;
    emit("chat:typing", { workspaceId, channelId: activeChannelId });
  }, [activeChannelId, emit, workspaceId]);

  const emitStoppedTyping = useCallback(() => {
    if (!workspaceId || !activeChannelId) return;
    emit("chat:stopped-typing", { workspaceId, channelId: activeChannelId });
  }, [activeChannelId, emit, workspaceId]);

  const send = useCallback(
    async ({ content, mentions = [], nodeRefs = [] }) => {
      if (!workspaceId || !activeChannelId || !currentUser) return false;
      const optimistic = {
        id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        channelId: activeChannelId,
        senderId: currentUser.userId || currentUser.id,
        sender: {
          userId: currentUser.userId || currentUser.id,
          id: currentUser.userId || currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatarUrl: currentUser.avatarUrl || null,
          role: currentUser.role || null,
        },
        content,
        mentions,
        nodeRefs,
        pending: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch(receiveChatMessage(optimistic));
      const result = await dispatch(
        sendChatMessage({ workspaceId, channelId: activeChannelId, payload: { content, mentions, nodeRefs } })
      );
      if (sendChatMessage.rejected.match(result)) return false;
      return true;
    },
    [activeChannelId, currentUser, dispatch, workspaceId]
  );

  const edit = useCallback(
    (messageId, content) => {
      if (!workspaceId || !activeChannelId) return Promise.resolve();
      return dispatch(updateChatMessage({ workspaceId, channelId: activeChannelId, messageId, payload: { content } }));
    },
    [activeChannelId, dispatch, workspaceId]
  );

  return { activeChannelId, send, edit, emitTyping, emitStoppedTyping };
}

export default useChatRoom;