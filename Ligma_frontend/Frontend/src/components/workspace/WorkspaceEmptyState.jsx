import React from "react";
import { Button } from "../ui/button";
import { FolderPlus } from "lucide-react";

export default function WorkspaceEmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] px-8 py-20 text-center gap-5">
      <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-[color:var(--primary-soft)] text-[color:var(--primary)]">
        <FolderPlus className="w-6 h-6" />
      </span>
      <div className="space-y-1.5 max-w-xs">
        <h2 className="text-base font-semibold text-[color:var(--foreground)]">No workspaces yet</h2>
        <p className="text-sm text-[color:var(--foreground-muted)] leading-relaxed">
          Create your first workspace to start organizing work, inviting your team, and collaborating in real time.
        </p>
      </div>
      <Button onClick={onCreate}>
        <FolderPlus className="w-4 h-4 mr-1.5" />
        Create workspace
      </Button>
    </div>
  );
}