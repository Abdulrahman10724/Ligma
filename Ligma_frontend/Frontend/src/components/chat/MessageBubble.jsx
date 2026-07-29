import { memo, useMemo, useState } from "react";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { Pencil, Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatMessageTime, splitMessageContent } from "@/lib/workspace-chat.utils";
import { getInitials } from "@/lib/presence-zone.utils";

const ROLE_STYLES = {
  Lead: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  Contributor: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Viewer: "border-zinc-500/25 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};

function MessageText({ content, onNodeClick }) {
  const parts = useMemo(() => splitMessageContent(content), [content]);

  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--text-primary)]">
      {parts.map((part, index) => {
        if (part.type === "node") {
          return (
            <button
              key={`${part.id}-${index}`}
              type="button"
              onClick={() => onNodeClick(part.id)}
              className="mx-1 inline-flex items-center rounded-full border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[color:var(--accent)]/15"
            >
              {part.label}
            </button>
          );
        }

        return part.value.split(/(@[\w.-]+)/g).map((token, tokenIndex) => (
          token.startsWith("@") ? (
            <span
              key={`${index}-${tokenIndex}`}
              className="rounded-full bg-[color:var(--accent)]/10 px-1.5 py-0.5 text-[13px] font-semibold text-[color:var(--accent)]"
            >
              {token}
            </span>
          ) : (
            <span key={`${index}-${tokenIndex}`}>{token}</span>
          )
        ));
      })}
    </div>
  );
}

function MessageBubble({
  message,
  showHeader,
  isOwnMessage,
  canManage,
  onNodeClick,
  onEdit,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);

  const editedLabel = message.edited ? `edited ${formatDistanceToNowStrict(parseISO(message.updatedAt), { addSuffix: true })}` : null;

  return (
    <div className={cn("group flex gap-3 px-4 sm:px-6", showHeader ? "mt-5" : "mt-1")}>
      <div className="w-10 shrink-0">
        {showHeader ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--accent)] to-fuchsia-500 text-xs font-semibold text-white shadow-md">
            {getInitials(message.user.name)}
          </div>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 rounded-[24px] border border-transparent p-0.5 transition-colors hover:border-[color:var(--border)]/80">
        {showHeader ? (
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-[color:var(--text-primary)]">{message.user.name}</span>
            {message.user.role ? (
              <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]", ROLE_STYLES[message.user.role] || ROLE_STYLES.Viewer)}>
                {message.user.role}
              </span>
            ) : null}
            <span className="text-xs text-[color:var(--text-secondary)]">{formatMessageTime(message.createdAt)}</span>
            {editedLabel ? <span className="text-[11px] text-[color:var(--text-secondary)]">({editedLabel})</span> : null}
          </div>
        ) : null}

        <div className={cn(
          "relative rounded-[24px] border px-4 py-3 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.45)]",
          isOwnMessage
            ? "border-[color:var(--accent)]/15 bg-[color:var(--accent)]/5"
            : "border-[color:var(--border)] bg-[color:var(--bg-surface)]"
        )}>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-24 rounded-2xl" />
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-2xl" onClick={() => { setDraft(message.content); setIsEditing(false); }}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-fuchsia-500 text-white"
                  onClick={async () => {
                    await onEdit(message, draft);
                    setIsEditing(false);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <MessageText content={message.content} onNodeClick={onNodeClick} />
          )}

          {!isEditing && canManage ? (
            <div className="absolute right-3 top-3 hidden items-center gap-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-1 shadow-lg group-hover:flex">
              <Button type="button" size="icon-sm" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => setIsEditing(true)} aria-label="Edit message">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => navigator.clipboard.writeText(message.content)} aria-label="Copy message">
                <Reply className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" className="h-8 w-8 rounded-xl text-red-500" onClick={() => onDelete(message)} aria-label="Delete message">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
