
import apiClient from "./api.service";

let inboxRequestInFlight = null;

export const invitationService = {
  listByWorkspace: (workspaceId) => apiClient.get(`/workspaces/${workspaceId}/invitations`),
  createForWorkspace: (workspaceId, payload) => apiClient.post(`/workspaces/${workspaceId}/invitations`, payload),
  getByToken: (token) => apiClient.get(`/invitations/${token}`),
  acceptByToken: (token) => apiClient.post(`/invitations/${token}/accept`),
  rejectByToken: (token) => apiClient.patch(`/invitations/${token}/reject`),
  revokeById: (workspaceId, invitationId) => apiClient.patch(`/workspaces/${workspaceId}/invitations/${invitationId}/revoke`),
  listInbox: () => {
    if (inboxRequestInFlight) {
      return inboxRequestInFlight;
    }

    inboxRequestInFlight = apiClient
      .get("/invitations/inbox")
      .finally(() => {
        inboxRequestInFlight = null;
      });

    return inboxRequestInFlight;
  },
  acceptById: (invitationId) => apiClient.post(`/invitations/by-id/${invitationId}/accept`),
  rejectById: (invitationId) => apiClient.patch(`/invitations/by-id/${invitationId}/reject`),
};

export default invitationService;