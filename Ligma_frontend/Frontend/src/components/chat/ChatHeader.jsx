import { Hash, Info, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import PresenceAvatarStack from "@/components/presence/PresenceAvatarStack";

export default function ChatHeader({ channel, membersCount, onlineUsers, onOpenSidebar }) {
  return (
    <header className="border-b border-[color:var(--border)] bg-[color:var(--bg-surface)]/92 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-10 w-10 rounded-2xl lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open channel list"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 text-[color:var(--accent)] shadow-sm">
            <Hash className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-tight text-[color:var(--text-primary)]">#{channel?.name || "channel"}</h1>
              <span className="hidden rounded-full border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--text-secondary)] sm:inline-flex">
                {membersCount} members
              </span>
            </div>
            <p className="truncate text-sm text-[color:var(--text-secondary)]">
              {channel?.description || "Collaborate in real time, share updates, and link discussions to canvas work."}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-4 xl:flex">
          <PresenceAvatarStack users={onlineUsers} size="sm" emptyLabel="Nobody online" />
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3 py-2 text-xs text-[color:var(--text-secondary)] shadow-sm">
            <div className="flex items-center gap-1.5 font-semibold text-[color:var(--text-primary)]">
              <Info className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              {onlineUsers.length} online
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
