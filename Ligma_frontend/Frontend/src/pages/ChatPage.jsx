import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Hash, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageComposer from "@/components/chat/MessageComposer";
import CreateChannelDialog from "@/components/chat/CreateChannelDialog";
import TypingIndicator from "@/components/chat/TypingIndicator";
import {
  ChatErrorState,
  ChatSidebarSkeleton,
  EmptyChatState,
  MessageListSkeleton,
} from "@/components/chat/ChatStates";
import useSocket from "@/hooks/useSocket";
import useWorkspaceRole from "@/hooks/useWorkspaceRole";
import useWorkspaceChat from "@/hooks/useWorkspaceChat";
import { fetchWorkspaceMembers } from "@/redux/memberSlice";
import { fetchCanvasNodes } from "@/redux/canvasSlice";

export default function ChatPage() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { canEditWorkspace } = useWorkspaceRole();
  const { user: currentUser } = useSelector((state) => state.auth);
  const members = useSelector((state) => state.members.list);
  const nodes = useSelector((state) => Object.values(state.canvas.nodes));
  const [presenceUsers, setPresenceUsers] = useState([]);
  const [channelQuery, setChannelQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { on, off } = useSocket({ workspaceId, autoJoin: false });

  const {
    channels,
    activeChannelId,
    messagesByChannel,
    unreadByChannel,
    typingByChannel,
    loadingChannels,
    loadingMessages,
    sending,
    errorChannels,
    errorMessages,
    createChannel,
    selectChannel,
    refreshMessages,
    sendMessage,
    editMessage,
    removeMessage,
    emitTyping,
  } = useWorkspaceChat(workspaceId);

  useEffect(() => {
    if (!workspaceId) return;
    dispatch(fetchWorkspaceMembers(workspaceId));
    if (!nodes.length) {
      dispatch(fetchCanvasNodes(workspaceId));
    }
  }, [dispatch, nodes.length, workspaceId]);

  useEffect(() => {
    const handlePresence = (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      setPresenceUsers(payload.users || []);
    };

    on("workspace:presence", handlePresence);
    return () => {
      off("workspace:presence", handlePresence);
    };
  }, [off, on, workspaceId]);

  const decoratedChannels = useMemo(() => (
    channels.map((channel) => ({
      ...channel,
      unreadCount: unreadByChannel[channel.id] || 0,
    }))
  ), [channels, unreadByChannel]);

  const activeChannel = decoratedChannels.find((channel) => channel.id === activeChannelId) || decoratedChannels[0] || null;
  const messages = messagesByChannel[activeChannel?.id] || [];
  const typingUsers = (typingByChannel[activeChannel?.id] || []).filter((user) => user.id !== currentUser?.id);

  const sidebar = (
    <ChatSidebar
      channels={decoratedChannels}
      activeChannelId={activeChannel?.id}
      query={channelQuery}
      onQueryChange={setChannelQuery}
      onSelect={(channelId) => {
        selectChannel(channelId);
        setIsSidebarOpen(false);
      }}
      onCreate={() => setIsCreateOpen(true)}
      canCreate={canEditWorkspace}
    />
  );

  if (loadingChannels && !decoratedChannels.length) {
    return (
      <div className="flex h-full min-h-0 bg-[color:var(--bg-primary)]">
        <div className="hidden w-[320px] border-r border-[color:var(--border)] lg:block"><ChatSidebarSkeleton /></div>
        <div className="flex-1"><MessageListSkeleton /></div>
      </div>
    );
  }

  if (errorChannels && !decoratedChannels.length) {
    return (
      <ChatErrorState
        title="Channels unavailable"
        description={errorChannels}
        onRetry={() => window.location.reload()}
        onRefresh={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-[color:var(--bg-primary)]">
      <aside className="hidden w-[320px] shrink-0 border-r border-[color:var(--border)] lg:block">
        {sidebar}
      </aside>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-[92vw] max-w-[320px] border-r border-[color:var(--border)] bg-[color:var(--bg-surface)] p-0">
          {sidebar}
        </SheetContent>
      </Sheet>

      <section className="flex min-w-0 flex-1 flex-col">
        {activeChannel ? (
          <>
            <ChatHeader
              channel={activeChannel}
              membersCount={members.length}
              onlineUsers={presenceUsers.map((user) => {
                const member = members.find((entry) => entry.userId === user.userId);
                return {
                  ...user,
                  role: member?.role || (member?.isOwner ? "Lead" : null),
                };
              })}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />

            {errorMessages ? (
              <ChatErrorState
                title={`Unable to open #${activeChannel.name}`}
                description={errorMessages}
                onRetry={() => refreshMessages(activeChannel.id)}
                onRefresh={() => window.location.reload()}
              />
            ) : loadingMessages && !messages.length ? (
              <MessageListSkeleton />
            ) : !messages.length ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <EmptyChatState channelName={activeChannel.name} />
                <TypingIndicator users={typingUsers} />
              </div>
            ) : (
              <>
                <MessageList
                  messages={messages}
                  currentUserId={currentUser?.id}
                  canWrite={canEditWorkspace}
                  onNodeClick={(nodeId) => navigate(`/workspace/${workspaceId}/canvas?node=${nodeId}`)}
                  onEdit={async (message, content) => {
                    await editMessage(message.channelId, message.id, { content });
                  }}
                  onDelete={async (message) => {
                    if (!window.confirm("Delete this message?")) return;
                    await removeMessage(message.channelId, message.id);
                  }}
                />
                <TypingIndicator users={typingUsers} />
              </>
            )}

            <MessageComposer
              disabled={!canEditWorkspace || sending}
              members={members}
              nodes={nodes}
              onSend={async (payload) => {
                await sendMessage(activeChannel.id, payload);
              }}
              onTyping={(isTyping) => emitTyping(activeChannel.id, {
                id: currentUser?.id,
                name: currentUser?.name,
                role: canEditWorkspace ? "Contributor" : "Viewer",
              }, isTyping)}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-lg rounded-[32px] border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-8 py-10 text-center shadow-[0_30px_90px_-50px_rgba(15,23,42,0.58)]">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[color:var(--accent)]/15 to-fuchsia-500/15 text-[color:var(--accent)]">
                <Hash className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-[color:var(--text-primary)]">No channels yet</h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                Create a first channel to organize workspace discussions, surface decisions, and connect conversation back to the canvas.
              </p>
              {canEditWorkspace ? (
                <Button onClick={() => setIsCreateOpen(true)} className="mt-6 rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-fuchsia-500 text-white">
                  <MessageSquarePlus className="mr-2 h-4 w-4" /> Create first channel
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <CreateChannelDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        saving={loadingChannels}
        onSubmit={async (payload) => {
          const result = await createChannel(payload);
          if (result?.meta?.requestStatus === "fulfilled") {
            setIsCreateOpen(false);
          }
        }}
      />
    </div>
  );
}
