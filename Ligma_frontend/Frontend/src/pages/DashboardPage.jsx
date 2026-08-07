import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Plus, Loader2, FolderOpen } from "lucide-react";
import LogoutButton from "../components/layout/LogoutButton";
import { Button } from "../components/ui/button";
import WorkspaceCard from "../components/workspace/WorkspaceCard";
import WorkspaceEmptyState from "../components/workspace/WorkspaceEmptyState";
import WorkspaceLoadingState from "../components/workspace/WorkspaceLoadingState";
import CreateWorkspaceDialog from "../components/workspace/CreateWorkspaceDialog";
import { fetchWorkspaces } from "../redux/workspaceSlice";
import AccountMenu from "../components/layout/AccountMenu";
import InvitationInboxMenu from "../components/layout/InvitationInboxMenu";
import ThemeToggle from "../components/ui/ThemeToggle";
import { BrandLockup } from "../components/ui/BrandMark";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const { list, loading, error } = useSelector((state) => state.workspace);

  // Local presentational search — filters already-loaded data, no new API calls
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const openWorkspace = (workspaceId) => {
    navigate(`/workspace/${workspaceId}/settings`);
  };

  // Derive recent workspaces from available metadata — no additional API calls
  const sortedByDate = [...list].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const recentWorkspaces = sortedByDate.slice(0, 3);

  // Filter by search (local presentational state only)
  const filteredList = search.trim()
    ? list.filter((w) =>
        (w.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (w.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : list;

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* ── Top Navigation Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 h-14 bg-[color:var(--surface)] border-b border-[color:var(--border)] flex items-center justify-between px-6 lg:px-8">
        <BrandLockup size="md" />
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
          <InvitationInboxMenu />
          <AccountMenu />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-6 lg:px-8 py-10 flex flex-col gap-10">
        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)]">My Workspaces</h1>
            <p className="mt-1 text-sm text-[color:var(--foreground-muted)]">
              Create and manage your collaborative spaces.
            </p>
          </div>
         <div className="flex items-center gap-2 self-start sm:self-auto">
            <LogoutButton />
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              New workspace
            </Button>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg border border-[color:var(--danger)]/20 bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger)]">
            {error}
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && <WorkspaceLoadingState />}

        {/* ── Empty ─────────────────────────────────────────────────────── */}
        {!loading && list.length === 0 && (
          <WorkspaceEmptyState onCreate={() => setCreateOpen(true)} />
        )}

        {/* ── Content ───────────────────────────────────────────────────── */}
        {!loading && list.length > 0 && (
          <>
            {/* Recent section — derived from loaded data, most recently updated first */}
            {recentWorkspaces.length > 0 && !search && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-muted)] mb-3 flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Recent
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentWorkspaces.map((ws) => (
                    <WorkspaceCard key={ws.id} workspace={ws} onClick={() => openWorkspace(ws.id)} />
                  ))}
                </div>
              </section>
            )}

            {/* All workspaces section with local search */}
            <section>
              <div className="flex items-center justify-between mb-3 gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--foreground-muted)] flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  All Workspaces
                  <span className="font-normal text-[color:var(--foreground-muted)] normal-case tracking-normal">
                    ({list.length})
                  </span>
                </h2>
                {/* Presentational search — works on already-loaded data */}
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
                  {filteredList.map((workspace) => (
                    <WorkspaceCard key={workspace.id} workspace={workspace} onClick={() => openWorkspace(workspace.id)} />
                  ))}
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
