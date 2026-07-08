import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import WorkspaceCard from "../components/workspace/WorkspaceCard";
import WorkspaceEmptyState from "../components/workspace/WorkspaceEmptyState";
import WorkspaceLoadingState from "../components/workspace/WorkspaceLoadingState";
import CreateWorkspaceDialog from "../components/workspace/CreateWorkspaceDialog";
import { fetchWorkspaces } from "../redux/workspaceSlice";
import AccountMenu from "../components/layout/AccountMenu";
import LogoutButton from "../components/layout/LogoutButton";
import InvitationInboxMenu from "../components/layout/InvitationInboxMenu";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const { list, loading, error } = useSelector((state) => state.workspace);
 
  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const openWorkspace = (workspaceId) => {
    navigate(`/workspace/${workspaceId}/settings`);
  };

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] px-4 py-8 text-[color:var(--text-primary)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[color:var(--accent)] sm:text-4xl">My workspaces</h1>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Create and manage collaborative spaces.</p>
          </div>
          <div className="flex items-center gap-3">
            <InvitationInboxMenu />
            <LogoutButton />
            <Button onClick={() => setCreateOpen(true)}>New workspace</Button>
            <AccountMenu />
          </div>
        </header>

        {error ? <div className="rounded-xl border border-[color:var(--danger)]/20 bg-[color:var(--danger)]/10 px-4 py-3 text-sm text-[color:var(--danger)]">{error}</div> : null}

        {loading ? <WorkspaceLoadingState /> : null}

        {!loading && list.length === 0 ? <WorkspaceEmptyState onCreate={() => setCreateOpen(true)} /> : null}

        {!loading && list.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} onClick={() => openWorkspace(workspace.id)} />
            ))}
          </div>
        ) : null}
      </div>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
