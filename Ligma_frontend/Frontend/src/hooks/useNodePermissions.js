import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useWorkspaceRole } from "./useWorkspaceRole";

// const DEFAULT_ALLOWED_ROLES = ["Lead", "Contributor", "Viewer"];
export function computeNodePermissions(node, workspaceRole, userId) {
  // Empty/undefined allowedUserIds = unrestricted: every Contributor can edit.
  const allowedUserIds = Array.isArray(node?.allowedUserIds) ? node.allowedUserIds : [];
  const isLead = workspaceRole === "Lead";
  const isLocked = Boolean(node?.locked);
  const canView = Boolean(node);

  const isExplicitlyAllowed = !allowedUserIds.length || allowedUserIds.includes(String(userId));

  const canEdit =
    Boolean(node) &&
    (isLead || (!isLocked && workspaceRole !== "Viewer" && isExplicitlyAllowed));

  return {
    canView,
    canEdit,
    canMove: canEdit,
    canResize: canEdit,
    canDelete: isLead || canEdit,
    canLock: isLead,
    isLocked,
    allowedUserIds,
  };
}
export function useNodePermissions(node) {
  const { workspaceRole, isLead, isContributor, isViewer } = useWorkspaceRole();
  const { user: currentUser } = useSelector((state) => state.auth);
  const currentUserId = useSelector((state) => state.auth.user?.id || null);

  return useMemo(() => {
    const permissions = computeNodePermissions(node, workspaceRole, currentUser?.id);
    return {
      ...permissions,
      workspaceRole,
      isLead,
      isContributor,
      isViewer,
      currentUserId,
    };
  }, [currentUserId, isContributor, isLead, isViewer, node, workspaceRole]);
}

export default useNodePermissions;