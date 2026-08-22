import { useEffect, useState, useCallback } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { LayoutDashboard, Milestone, MessageSquare, Users, History, Settings } from "lucide-react";

import { fetchWorkspaceById, clearActiveWorkspace } from "../redux/workspaceSlice";
import { clearMembers, setMemberRoleLocally, removeMemberLocally } from "../redux/memberSlice";
import AccountMenu from "../components/layout/AccountMenu";
import InvitationInboxMenu from "../components/layout/InvitationInboxMenu";
import WorkspaceNavigationRail from "../components/layout/WorkspaceNavigationRail";
import WorkspaceNavigationPanel from "../components/layout/WorkspaceNavigationPanel";
import ThemeToggle from "../components/ui/ThemeToggle";
import useSocket from "../hooks/useSocket";

export default function WorkspacePage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeWorkspace } = useSelector((state) => state.workspace);
  const { user: currentUser } = useSelector((state) => state.auth);
  const { status, on, off } = useSocket({ workspaceId: id, autoJoin: true });
  const [presenceUsers, setPresenceUsers] = useState([]);

  /* Presentational-only: expansion state, local, not in Redux */
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const handleToggleNav = useCallback(() => setIsNavExpanded((v) => !v), []);
  const handleCloseNav = useCallback(() => setIsNavExpanded(false), []);

  /* ── Data + socket effects — unchanged from original ─────────────────── */
  useEffect(() => {
    if (id) {
      dispatch(fetchWorkspaceById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    const handlePresence = (payload) => {
      if (payload?.workspaceId !== id) return;
      setPresenceUsers(payload?.users || []);
    };

    on("workspace:presence", handlePresence);
    return () => {
      off("workspace:presence", handlePresence);
    };
  }, [id, on, off]);

  useEffect(() => {
    const handleRoleUpdated = (payload) => {
      if (payload?.workspaceId !== id || !payload?.member) return;
      dispatch(setMemberRoleLocally({ userId: payload.member.userId, role: payload.member.role }));
    };

    on("member:role-updated", handleRoleUpdated);
    return () => {
      off("member:role-updated", handleRoleUpdated);
    };
  }, [dispatch, id, on, off]);

  useEffect(() => {
    const handleMemberRemoved = (payload) => {
      if (payload?.workspaceId !== id || !payload?.userId) return;

      if (payload.userId === currentUser?.id) {
        toast.error("You have been removed from this workspace.");
        dispatch(clearActiveWorkspace());
        dispatch(clearMembers());
        navigate("/dashboard", { replace: true });
        return;
      }

      dispatch(removeMemberLocally(payload.userId));
    };

    on("member:removed", handleMemberRemoved);
    return () => {
      off("member:removed", handleMemberRemoved);
    };
  }, [currentUser?.id, dispatch, id, navigate, on, off]);

  /* ── Navigation definition — same routes, new icons preserved ─────────── */
  const navigation = [
    { name: "Canvas",   href: `/workspace/${id}/canvas`,   icon: LayoutDashboard },
    { name: "Tasks",    href: `/workspace/${id}/tasks`,    icon: Milestone },
    { name: "Chat",     href: `/workspace/${id}/chat`,     icon: MessageSquare },
    { name: "Members",  href: `/workspace/${id}/members`,  icon: Users },
    { name: "History",  href: `/workspace/${id}/history`,  icon: History },
    { name: "Settings", href: `/workspace/${id}/settings`, icon: Settings },
  ];

  /* ── Connection status dot ─────────────────────────────────────────────── */
  const statusDot =
    status === "connected"
      ? "bg-[color:var(--success)]"
      : status === "reconnecting" || status === "connecting"
      ? "bg-[color:var(--highlight)]"
      : "bg-[color:var(--foreground-muted)]";

  return (
    <div className="flex h-screen bg-[color:var(--background)] text-[color:var(--foreground)] overflow-hidden">

      {/* ── Navigation: single animated slot — rail OR panel, never both ─── */}
      <div
        className="relative hidden shrink-0 transition-[width] duration-200 ease-in-out lg:block"
        style={{ width: isNavExpanded ? "216px" : "60px" }}
      >
        {isNavExpanded ? (
          <WorkspaceNavigationPanel
            navigation={navigation}
            workspaceName={activeWorkspace?.title}
            onClose={handleCloseNav}
          />
        ) : (
          <WorkspaceNavigationRail
            navigation={navigation}
            isExpanded={isNavExpanded}
            onToggle={handleToggleNav}
          />
        )}
      </div>

      {/* ── Mobile/tablet: rail always visible, panel overlays on top ────── */}
      <div className="lg:hidden">
        <WorkspaceNavigationRail
          navigation={navigation}
          isExpanded={isNavExpanded}
          onToggle={handleToggleNav}
        />
      </div>
      {isNavExpanded && (
        <div className="lg:hidden">
          <WorkspaceNavigationPanel
            navigation={navigation}
            workspaceName={activeWorkspace?.title}
            onClose={handleCloseNav}
          />
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top Header — 56px */}
        <header className="h-14 bg-[color:var(--surface)] border-b border-[color:var(--border)] flex items-center justify-between px-5 z-10 shrink-0">

          {/* Left: workspace info + connection + presence */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-[color:var(--foreground)] truncate leading-tight">
                {activeWorkspace?.title || "Loading…"}
              </h1>
            </div>

            {/* Connection badge */}
            <div className="hidden items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2.5 py-1 md:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
              <span className="text-xs text-[color:var(--foreground-muted)] capitalize">{status}</span>
            </div>

            {/* Presence avatar stack */}
            {presenceUsers.length > 0 && (
              <div className="hidden items-center -space-x-2 md:flex">
                {presenceUsers.slice(0, 5).map((user) => (
                  <span
                    key={user.userId}
                    title={user.name || user.email}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[color:var(--surface)] bg-[color:var(--primary)] text-[10px] font-semibold text-[color:var(--primary-foreground)]"
                  >
                    {(user.name || user.email || "?")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "?"}
                  </span>
                ))}
                {presenceUsers.length > 5 && (
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-[color:var(--surface)] bg-[color:var(--surface-muted)] px-1 text-[10px] font-semibold text-[color:var(--foreground-secondary)]">
                    +{presenceUsers.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: theme + inbox + account */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle variant="icon" />
            <InvitationInboxMenu />
            <AccountMenu />
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
