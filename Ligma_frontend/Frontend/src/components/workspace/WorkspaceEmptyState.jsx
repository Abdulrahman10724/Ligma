import React from "react";
import { Button } from "../ui/button";

export default function WorkspaceEmptyState({ onCreate }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--bg-surface)] px-6 py-14 text-center">
      <h3 className="text-xl font-semibold text-[color:var(--text-primary)]">No workspaces yet</h3>
      <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Create your first workspace to start organizing work.</p>
      <Button className="mt-6" onClick={onCreate}>Create workspace</Button>
    </div>
  );
}