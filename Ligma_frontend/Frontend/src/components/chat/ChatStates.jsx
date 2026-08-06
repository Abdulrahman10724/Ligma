import { AlertTriangle, Hash, MessagesSquare, RefreshCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatSidebarSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-primary)]/60 p-3">
          <div className="mb-2 h-3 w-24 rounded-full bg-[color:var(--border)]" />
          <div className="h-2.5 w-36 rounded-full bg-[color:var(--border)]/70" />
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-5 px-6 py-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex animate-pulse gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[color:var(--border)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded-full bg-[color:var(--border)]" />
            <div className="h-3 w-4/5 rounded-full bg-[color:var(--border)]/70" />
            <div className="h-3 w-2/3 rounded-full bg-[color:var(--border)]/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatErrorState({ title = "Unable to load chat", description, onRetry, onRefresh }) {
  return (
    <div className="flex h-full min-h-80 items-center justify-center p-6">
      <div className="max-w-md rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-8 text-center shadow-[0_30px_80px_-44px_rgba(15,23,42,0.55)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          {description || "Try again in a moment. If this continues, refresh the workspace connection and re-open the channel."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onRetry} className="rounded-2xl bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-[color:var(--primary-foreground)] transition-colors">
            <RefreshCcw className="mr-2 h-4 w-4" /> Retry
          </Button>
          <Button onClick={onRefresh} variant="outline" className="rounded-2xl">
            <WifiOff className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EmptyChatState({ channelName }) {
  return (
    <div className="flex h-full min-h-80 items-center justify-center p-6">
      <div className="max-w-lg rounded-[32px] border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-8 py-10 text-center shadow-[0_30px_90px_-50px_rgba(15,23,42,0.58)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[color:var(--primary-soft)] text-[color:var(--primary)]">
          <MessagesSquare className="h-8 w-8" />
        </div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">
          <Hash className="h-3.5 w-3.5" /> #{channelName}
        </div>
        <h3 className="text-xl font-semibold text-[color:var(--text-primary)]">Start the conversation</h3>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
          This channel is ready for updates, decisions, and node-linked discussion. Send the first message to kick things off.
        </p>
      </div>
    </div>
  );
}
