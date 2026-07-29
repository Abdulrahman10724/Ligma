import { useEffect, useMemo, useRef } from "react";
import { groupMessages } from "@/lib/workspace-chat.utils";
import MessageBubble from "@/components/chat/MessageBubble";

export default function MessageList({
  messages = [],
  currentUserId,
  canWrite,
  onNodeClick,
  onEdit,
  onDelete,
}) {
  const containerRef = useRef(null);
  const groupedMessages = useMemo(() => groupMessages(messages), [messages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 160;
    if (nearBottom) {
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages.length]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-[color:var(--bg-primary)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-0 py-5">
        {groupedMessages.map((message) => (
          <div key={message.id}>
            {message.showDateSeparator ? (
              <div className="sticky top-0 z-10 my-4 flex justify-center px-6">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface)]/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)] shadow-sm backdrop-blur">
                  {message.dateLabel}
                </span>
              </div>
            ) : null}

            <MessageBubble
              message={message}
              showHeader={!message.isGrouped}
              isOwnMessage={message.user.id === currentUserId}
              canManage={canWrite && message.user.id === currentUserId}
              onNodeClick={onNodeClick}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
