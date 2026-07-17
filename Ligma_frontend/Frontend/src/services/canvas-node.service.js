import apiClient from "./api.service";

export const canvasNodeService = {
  list: (workspaceId) => apiClient.get(`/workspaces/${workspaceId}/canvas/nodes`),
  create: (workspaceId, payload) => apiClient.post(`/workspaces/${workspaceId}/canvas/nodes`, payload),
  update: (workspaceId, nodeId, payload) =>
    apiClient.patch(`/workspaces/${workspaceId}/canvas/nodes/${nodeId}`, payload),
  lock: (workspaceId, nodeId) => apiClient.patch(`/workspaces/${workspaceId}/canvas/nodes/${nodeId}/lock`),
  unlock: (workspaceId, nodeId) => apiClient.patch(`/workspaces/${workspaceId}/canvas/nodes/${nodeId}/unlock`),
  updatePermissions: (workspaceId, nodeId, payload) =>
    apiClient.patch(`/workspaces/${workspaceId}/canvas/nodes/${nodeId}/permissions`, payload),
  remove: (workspaceId, nodeId) =>
    apiClient.delete(`/workspaces/${workspaceId}/canvas/nodes/${nodeId}`),
};

export default canvasNodeService;
