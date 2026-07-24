import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/presence-zone.utils";

const ROLE_STYLES = {
  Lead: "bg-amber-500/12 text-amber-600 dark:text-amber-300 border-amber-500/20",
  Contributor: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
  Viewer: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
};

export default function PresenceAvatarStack({ users = [], emptyLabel = "No active collaborators", max = 4, size = "md" }) {
  const visibleUsers = users.slice(0, max);
  const avatarSize = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";

  if (!users.length) {
    return <p className="text-xs font-medium text-[color:var(--text-secondary)]">{emptyLabel}</p>;
  }

  return (
    <TooltipProvider delay={100}>
      <div className="flex items-center gap-2">
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.userId || user.id}>
              <TooltipTrigger>
                <span
                  className={cn(
                    "relative inline-flex items-center justify-center rounded-full border-2 border-[color:var(--bg-surface)] bg-gradient-to-br from-[color:var(--accent)] to-fuchsia-500 font-semibold text-white shadow-sm transition-transform duration-150 hover:-translate-y-0.5",
                    avatarSize
                  )}
                >
                  {getInitials(user.name || user.email || "?")}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[color:var(--bg-surface)] bg-emerald-500" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 text-[color:var(--text-primary)] shadow-xl">
                <div className="space-y-1">
                  <p className="text-xs font-semibold">{user.name || user.email}</p>
                  <div className="flex items-center gap-2 text-[11px] text-[color:var(--text-secondary)]">
                    <span className={cn("rounded-full border px-1.5 py-0.5 font-semibold", ROLE_STYLES[user.role] || ROLE_STYLES.Viewer)}>
                      {user.role || "Member"}
                    </span>
                    <span>Active now</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {users.length > max ? (
          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-2 py-1 text-[11px] font-semibold text-[color:var(--text-secondary)] shadow-sm">
            +{users.length - max}
          </span>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
