import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, Link2, Paperclip, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { serializeNodeReference } from "@/lib/workspace-chat.utils";
import { getInitials } from "@/lib/presence-zone.utils";

function SuggestionList({ title, items, onSelect, emptyLabel }) {
  return (
    <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-2 shadow-2xl">
      <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">{title}</p>
      <ScrollArea className="max-h-56">
        <div className="space-y-1">
          {items.length ? items.map((item) => (
            <button
              key={item.id || item.userId}
              type="button"
              onClick={() => onSelect(item)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-[color:var(--bg-primary)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[color:var(--primary)] text-xs font-semibold text-[color:var(--primary-foreground)] shadow-sm">
                {getInitials(item.name || item.email || item.data?.text || item.type || "?")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">{item.name || item.data?.text || item.data?.label || item.type || item.email}</p>
                <p className="truncate text-xs text-[color:var(--text-secondary)]">{item.email || item.description || item.type || "Reference"}</p>
              </div>
            </button>
          )) : (
            <p className="px-3 py-6 text-center text-sm text-[color:var(--text-secondary)]">{emptyLabel}</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function MessageComposer({
  disabled,
  members = [],
  nodes = [],
  onSend,
  onTyping,
}) {
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [value, setValue] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [showNodes, setShowNodes] = useState(false);
  const [nodeQuery, setNodeQuery] = useState("");

  const mentionResults = useMemo(() => {
    const query = mentionQuery.trim().toLowerCase();
    return members
      .filter((member) => query ? `${member.name} ${member.email}`.toLowerCase().includes(query) : true)
      .slice(0, 8);
  }, [members, mentionQuery]);

  const nodeResults = useMemo(() => {
    const query = nodeQuery.trim().toLowerCase();
    return nodes
      .filter((node) => {
        const label = node.data?.text || node.data?.label || node.type || "node";
        return query ? label.toLowerCase().includes(query) : true;
      })
      .slice(0, 8);
  }, [nodeQuery, nodes]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [value]);

  const emitTypingState = (isTyping) => {
    onTyping?.(isTyping);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(false);
      }, 1200);
    }
  };

  const handleChange = (nextValue) => {
    setValue(nextValue);
    emitTypingState(nextValue.trim().length > 0);

    const mentionMatch = nextValue.slice(0, textareaRef.current?.selectionStart || nextValue.length).match(/@([\w.-]*)$/);
    setShowMentions(Boolean(mentionMatch));
    setMentionQuery(mentionMatch?.[1] || "");
  };

  const insertMention = (member) => {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor).replace(/@([\w.-]*)$/, `@${member.name} `);
    const after = value.slice(cursor);
    const next = `${before}${after}`;
    setValue(next);
    setShowMentions(false);
    setMentionQuery("");
    textareaRef.current?.focus();
  };

  const insertNodeReference = (node) => {
    const token = `${serializeNodeReference(node)} `;
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const next = `${value.slice(0, cursor)}${token}${value.slice(cursor)}`;
    setValue(next);
    setShowNodes(false);
    setNodeQuery("");
    textareaRef.current?.focus();
  };

  const sendMessage = async () => {
    const content = value.trim();
    if (!content || disabled) return;
    await onSend({ content });
    setValue("");
    emitTypingState(false);
    setShowMentions(false);
    setShowNodes(false);
  };

  return (
    <div className="border-t border-[color:var(--border)] bg-[color:var(--bg-surface)] px-4 py-4 sm:px-6">
      <div className="relative mx-auto max-w-5xl">
        {showMentions ? (
          <div className="absolute bottom-full left-0 mb-3 w-full max-w-sm">
            <SuggestionList title="Mention collaborators" items={mentionResults} onSelect={insertMention} emptyLabel="No members found" />
          </div>
        ) : null}

        {showNodes ? (
          <div className="absolute bottom-full right-0 mb-3 w-full max-w-sm">
            <SuggestionList title="Reference canvas nodes" items={nodeResults} onSelect={insertNodeReference} emptyLabel="No nodes found" />
          </div>
        ) : null}

        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-3 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.58)]">
          <Textarea
            ref={textareaRef}
            value={value}
            disabled={disabled}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={async (event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                await sendMessage();
              }
            }}
            placeholder={disabled ? "Viewers can read but cannot send messages" : "Message channel… Use @ to mention teammates or link a canvas node."}
            className="min-h-16 max-h-56 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setShowMentions((current) => !current)} disabled={disabled}>
                <AtSign className="mr-2 h-4 w-4" /> Mentions
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setShowNodes((current) => !current)} disabled={disabled}>
                <Link2 className="mr-2 h-4 w-4" /> Node reference
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl opacity-70" disabled>
                <Paperclip className="mr-2 h-4 w-4" /> Attachments soon
              </Button>
            </div>

            <Button type="button" onClick={sendMessage} disabled={disabled || !value.trim()} className="rounded-2xl bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] px-5 text-[color:var(--primary-foreground)] shadow-lg transition-colors">
              <SendHorizonal className="mr-2 h-4 w-4" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
