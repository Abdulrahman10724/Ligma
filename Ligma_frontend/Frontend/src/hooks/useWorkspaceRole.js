import { useMemo } from "react";
import { useSelector } from "react-redux";

export function useWorkspaceRole() {
  const workspaceRole = useSelector((state) => state.workspace.activeWorkspace?.currentUserRole || "Viewer");

  return useMemo(
    () => ({
      workspaceRole,
      isLead: workspaceRole === "Lead",
      isContributor: workspaceRole === "Contributor",
      isViewer: workspaceRole === "Viewer",
      canEditWorkspace: workspaceRole !== "Viewer",
    }),
    [workspaceRole]
  );
}

export default useWorkspaceRole;