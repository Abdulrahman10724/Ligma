import apiClient from "./api.service";

export const workspaceService = {
  list: () => apiClient.get("/workspaces"),
  create: (payload) => apiClient.post("/workspaces", payload),
  getById: (workspaceId) => apiClient.get(`/workspaces/${workspaceId}`),
  update: (workspaceId, payload) => apiClient.patch(`/workspaces/${workspaceId}`, payload),
};

export default workspaceService;