import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LayoutGrid, Plus, Loader2, FolderOpen, EyeOff, Eye, ChevronDown } from "lucide-react";
import LogoutButton from "../components/layout/LogoutButton";
import { Button } from "../components/ui/button";
import WorkspaceCard from "../components/workspace/WorkspaceCard";
import WorkspaceEmptyState from "../components/workspace/WorkspaceEmptyState";
import WorkspaceLoadingState from "../components/workspace/WorkspaceLoadingState";
import CreateWorkspaceDialog from "../components/workspace/CreateWorkspaceDialog";
import { fetchWorkspaces, fetchHiddenWorkspaces, unhideWorkspace } from "../redux/workspaceSlice";
import AccountMenu from "../components/layout/AccountMenu";
import InvitationInboxMenu from "../components/layout/InvitationInboxMenu";
import ThemeToggle from "../components/ui/ThemeToggle";
import { BrandLockup } from "../components/ui/BrandMark";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [hiddenPanelOpen, setHiddenPanelOpen] = useState(false);
  const { list, hiddenList, loading, hiddenLoading, error } = useSelector((state) => state.workspace);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchWorkspaces());
    dispatch(fetchHiddenWorkspaces());
  }, [dispatch]);

  const openWorkspace = (workspaceId) => {
    navigate(`/workspace/${workspaceId}/settings`);
  };

  const handleUnhide = async (workspaceId) => {
    await dispatch(unhideWorkspace(workspaceId));
  };

  const sortedByDate = [...list].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const recentWorkspaces = sortedByDate.slice(0, 3);

  const filteredList = search.trim()
    ? list.filter((w) =>
        (w.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (w.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : list;

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <header className="sticky top-0 z-20 h-14 bg-[color:var(--surface)] border-b border-[color:var(--border)] flex items-center justify-between px-6 lg:px-8">
        <BrandLockup size="md" />
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          <InvitationInboxMenu />
          <AccountMenu />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8 py-10 flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">My Workspaces</h1>
            <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
              Create and manage your collaborative spaces.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              onClick={() => setHiddenPanelOpen((v) => !v)}
              className="gap-1.5"
            >
              <EyeOff className="w-4 h-4" />
              Hidden{hiddenList.length > 0 ? ` (${hiddenList.length})` : ""}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${hiddenPanelOpen ? "rotate-180" : ""}`} />
            </Button>
            <LogoutButton />
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              New workspace
            </Button>
          </div>
        </div>

        {/* Hidden workspaces panel */}
        <AnimatePresence initial={false}>
          {hiddenPanelOpen && (
            <motion.section
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]"
            >
              <div className="p-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-muted)] mb-3 flex items-center gap-2">
                  <EyeOff className="w-3.5 h-3.5" /> Hidden workspaces
                </h2>

                {hiddenLoading ? (
                  <p className="text-sm text-[color:var(--foreground-muted)]">Loading...</p>
                ) : hiddenList.length === 0 ? (
                  <p className="text-sm text-[color:var(--foreground-muted)]">Nothing hidden right now.</p>
                ) : (
                  <div className="grid gap-2">
                    <AnimatePresence initial={false}>
                      {hiddenList.map((workspace) => (
                        <motion.div
                          key={workspace.id}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2"
                        >
                          <span className="text-sm font-medium text-[color:var(--foreground)] truncate">{workspace.title}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => handleUnhide(workspace.id)}
                          >
                            <Eye className="w-3.5 h-3.5" /> Unhide
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {error && (
          <div className="rounded-lg border border-[color:var(--danger)]/20 bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger)]">
            {error}
          </div>
        )}

        {loading && <WorkspaceLoadingState />}

        {!loading && list.length === 0 && (
          <WorkspaceEmptyState onCreate={() => setCreateOpen(true)} />
        )}

        {!loading && list.length > 0 && (
          <>
            {recentWorkspaces.length > 0 && !search && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-muted)] mb-3 flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Recent
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence initial={false}>
                    {recentWorkspaces.map((ws) => (
                      <motion.div
                        key={ws.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.18 }}
                      >
                        <WorkspaceCard
                          workspace={ws}
                          onClick={() => openWorkspace(ws.id)}
                          canManage={ws.ownerId === currentUser?.id}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-3 gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-muted)] flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  All Workspaces
                  <span className="font-normal text-[color:var(--foreground-muted)] normal-case tracking-normal">
                    ({list.length})
                  </span>
                </h2>
                <input
                  type="search"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-48 px-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground-muted)] outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)] transition-all"
                />
              </div>

              {filteredList.length === 0 ? (
                <div className="py-10 text-center text-sm text-[color:var(--foreground-muted)]">
                  No workspaces match &quot;{search}&quot;
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence initial={false}>
                    {filteredList.map((workspace) => (
                      <motion.div
                        key={workspace.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.18 }}
                      >
                        <WorkspaceCard
                          workspace={workspace}
                          onClick={() => openWorkspace(workspace.id)}
                          canManage={workspace.ownerId === currentUser?.id}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}