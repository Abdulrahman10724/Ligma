import { useMemo } from "react";
import { Hash, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function ChatSidebar({
  channels = [],
  activeChannelId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
  canCreate,
}) {
  const filteredChannels = useMemo(() => {
    if (!query.trim()) return channels;
    const value = query.toLowerCase();
    return channels.filter((channel) =>
      `${channel.name} ${channel.description || ""}`.toLowerCase().includes(value)
    );
  }, [channels, query]);

  return (
    <div className="flex h-full flex-col bg-[color:var(--bg-surface)]">
      <div className="border-b border-[color:var(--border)] px-5 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">Workspace chat</p>
            <h2 className="mt-1 text-lg font-semibold text-[color:var(--text-primary)]">Channels</h2>
          </div>
          <Button
            type="button"
            className="h-10 w-10 rounded-2xl bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white shadow-lg transition-colors"
            onClick={onCreate}
            disabled={!canCreate}
            aria-label="Create channel"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-secondary)]" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search channels"
            className="h-11 rounded-2xl border-[color:var(--border)] bg-[color:var(--bg-primary)] pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1.5">
          {filteredChannels.map((channel) => {
            const unreadCount = channel.unreadCount || 0;
            const isActive = activeChannelId === channel.id;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onSelect(channel.id)}
                className={cn(
                  "group flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-all duration-200",
                  isActive
                    ? "border-[color:var(--accent)]/35 bg-[color:var(--accent)]/8 shadow-[0_18px_36px_-28px_rgba(99,102,241,0.85)]"
                    : "border-transparent hover:border-[color:var(--border)] hover:bg-[color:var(--bg-primary)]"
                )}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl border text-[color:var(--text-secondary)] transition-colors",
                    isActive ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/12 text-[color:var(--accent)]" : "border-[color:var(--border)] bg-[color:var(--bg-surface)] group-hover:border-[color:var(--accent)]/20"
                  )}>
                    <Hash className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm font-semibold", isActive ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-primary)]/92")}>#{channel.name}</p>
                    <p className="truncate text-xs text-[color:var(--text-secondary)]">{channel.description || "Workspace conversation"}</p>
                  </div>
                </div>

                {unreadCount > 0 ? (
                  <span className="ml-3 rounded-full bg-[color:var(--accent)] px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}

          {!filteredChannels.length ? (
            <div className="rounded-[24px] border border-dashed border-[color:var(--border)] bg-[color:var(--bg-primary)] px-4 py-8 text-center text-sm text-[color:var(--text-secondary)]">
              No channels match your search.
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
