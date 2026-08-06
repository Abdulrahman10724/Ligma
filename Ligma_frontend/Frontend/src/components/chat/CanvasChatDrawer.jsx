import { useMemo } from "react";
import { useSelector } from "react-redux";
import { X, MessageSquare } from "lucide-react";
import useWorkspaceChat from "@/hooks/useWorkspaceChat";
import useWorkspaceRole from "@/hooks/useWorkspaceRole";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageComposer from "@/components/chat/MessageComposer";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { EmptyChatState, MessageListSkeleton } from "@/components/chat/ChatStates";

/**
 * CanvasChatDrawer — collapsible team-chat panel on the canvas.
 *
 * Reuses all existing chat components and useWorkspaceChat hook.
 * No duplicate Redux state or local message state introduced.
 * Opens from the right edge of the canvas container.
 *
 * Props:
 *   workspaceId   string
 *   open          boolean (controlled by CanvasPage presentational state)
 *   onClose       () => void
 *   currentUser   auth user object
 */
export default function CanvasChatDrawer({ workspaceId, open, onClose, currentUser }) {
  const { canEditWorkspace } = useWorkspaceRole();
  const members = useSelector((state) => state.members.list);

  const {
    channels,
    activeChannelId,
    messagesByChannel,
    typingByChannel,
    loadingMessages,
    sending,
    errorMessages,
    selectChannel,
    sendMessage,
    editMessage,
    removeMessage,
    emitTyping,
    refreshMessages,
  } = useWorkspaceChat(workspaceId);

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0] || null;
  const messages = messagesByChannel[activeChannel?.id] || [];
  const typingUsers = (typingByChannel[activeChannel?.id] || []).filter(
    (u) => u.id !== currentUser?.id
  );

  const channelsSorted = useMemo(() => [...channels].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  ), [channels]);

  if (!open) return null;

  return (
    <div className="canvas-chat-drawer drawer-slide-in">
      {/* Drawer header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[color:var(--border)] shrink-0 bg-[color:var(--surface)]">
        <div className="flex items-center gap-2 text-[color:var(--foreground)]">
          <MessageSquare className="w-4 h-4 text-[color:var(--primary)]" />
          <span className="text-sm font-semibold">Team Chat</span>
          {activeChannel && (
            <span className="text-xs text-[color:var(--foreground-muted)] truncate max-w-[120px]">
              #{activeChannel.name}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat drawer"
          title="Close chat drawer"
          className="w-7 h-7 flex items-center justify-center rounded-md text-[color:var(--foreground-muted)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Channel selector (compact horizontal tabs) */}
      {channelsSorted.length > 1 && (
        <div className="flex gap-1 px-3 py-2 border-b border-[color:var(--border)] overflow-x-auto shrink-0">
          {channelsSorted.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => selectChannel(ch.id)}
              className={[
                "shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-150",
                activeChannel?.id === ch.id
                  ? "bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                  : "text-[color:var(--foreground-muted)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)]",
              ].join(" ")}
            >
              #{ch.name}
            </button>
          ))}
        </div>
      )}

      {/* Message area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!activeChannel ? (
          <div className="flex-1 flex items-center justify-center p-4 text-sm text-[color:var(--foreground-muted)] text-center">
            No channels yet. Create one in the Chat page.
          </div>
        ) : errorMessages ? (
          <div className="flex-1 flex items-center justify-center p-4 text-xs text-[color:var(--danger)]">
            Failed to load messages.{" "}
            <button
              type="button"
              className="ml-1 underline"
              onClick={() => refreshMessages(activeChannel.id)}
            >
              Retry
            </button>
          </div>
        ) : loadingMessages && !messages.length ? (
          <MessageListSkeleton />
        ) : !messages.length ? (
          <div className="flex-1 flex flex-col">
            <EmptyChatState channelName={activeChannel.name} />
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUser?.id}
            canWrite={canEditWorkspace}
            onNodeClick={() => {}}
            onEdit={async (message, content) =>
              editMessage(message.channelId, message.id, { content })
            }
            onDelete={async (message) => {
              if (!window.confirm("Delete this message?")) return;
              removeMessage(message.channelId, message.id);
            }}
          />
        )}
        <TypingIndicator users={typingUsers} />
      </div>

      {/* Composer */}
      {activeChannel && (
        <MessageComposer
          disabled={!canEditWorkspace || sending}
          members={members}
          nodes={[]}
          onSend={async (payload) => sendMessage(activeChannel.id, payload)}
          onTyping={(isTyping) =>
            emitTyping(activeChannel.id, {
              id: currentUser?.id,
              name: currentUser?.name,
              role: canEditWorkspace ? "Contributor" : "Viewer",
            }, isTyping)
          }
        />
      )}
    </div>
  );
}
