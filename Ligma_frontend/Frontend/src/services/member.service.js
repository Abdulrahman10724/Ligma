import apiClient from "./api.service";

export const memberService = {
  listByWorkspace: (workspaceId) => apiClient.get(`/workspaces/${workspaceId}/members`),
  changeRole: (workspaceId, userId, role) =>
    apiClient.patch(`/workspaces/${workspaceId}/members/${userId}/role`, { role }),
  remove: (workspaceId, userId) =>
    apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`),
  listPendingInvitations: (workspaceId) =>
    apiClient.get(`/workspaces/${workspaceId}/members/invitations/pending`),
};

export default memberService;
