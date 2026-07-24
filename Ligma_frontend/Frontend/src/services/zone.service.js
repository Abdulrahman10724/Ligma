import apiClient from "./api.service";

const base = (wid) => `/workspaces/${wid}/zones`;

export const zoneService = {
  list: (workspaceId) => apiClient.get(base(workspaceId)),
  create: (workspaceId, payload) => apiClient.post(base(workspaceId), payload),
  update: (workspaceId, zoneId, payload) => apiClient.patch(`${base(workspaceId)}/${zoneId}`, payload),
  remove: (workspaceId, zoneId) => apiClient.delete(`${base(workspaceId)}/${zoneId}`),
};

export default zoneService;
