import apiClient from "./api.service";

export const canvasNodeService = {
  list: (workspaceId) => apiClient.get(`/workspaces/${workspaceId}/canvas/nodes`),
  create: (workspaceId, payload) => apiClient.post(`/workspaces/${workspaceId}/canvas/nodes`, payload),
  update: (workspaceId, nodeId, payload) =>
    apiClient.patch(`/workspaces/${workspaceId}/canvas/nodes/${nodeId}`, payload),
  remove: (workspaceId, nodeId) =>
    apiClient.delete(`/workspaces/${workspaceId}/canvas/nodes/${nodeId}`),
};

export default canvasNodeService;
