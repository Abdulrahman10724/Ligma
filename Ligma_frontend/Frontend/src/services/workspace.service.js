import apiClient from "./api.service";

export const workspaceService = {
  list: () => apiClient.get("/workspaces"),
  listHidden: () => apiClient.get("/workspaces/hidden"),
  create: (payload) => apiClient.post("/workspaces", payload),
  getById: (workspaceId) => apiClient.get(`/workspaces/${workspaceId}`),
  update: (workspaceId, payload) => apiClient.patch(`/workspaces/${workspaceId}`, payload),
  remove: (workspaceId, confirmTitle) =>
    apiClient.delete(`/workspaces/${workspaceId}`, { data: { confirmTitle } }),
  hide: (workspaceId) => apiClient.patch(`/workspaces/${workspaceId}/hide`),
  unhide: (workspaceId) => apiClient.patch(`/workspaces/${workspaceId}/unhide`),
};

export default workspaceService;