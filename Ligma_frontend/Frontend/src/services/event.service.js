import apiClient from "./api.service";

export const eventService = {
  getEvents: (workspaceId, limit = 100) =>
    apiClient.get(`/workspaces/${workspaceId}/events?limit=${limit}`),
};

export default eventService;
