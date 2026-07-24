import apiClient from "./api.service";
import { normalizeZone } from "@/lib/presence-zone.utils";

const extractZones = (response) => {
  const zones = response?.data?.zones || response?.data?.items || response?.data || [];
  return Array.isArray(zones) ? zones.map(normalizeZone) : [];
};

const extractZone = (response) => normalizeZone(response?.data?.zone || response?.data?.item || response?.data || {});

export const presenceZoneService = {
  list: async (workspaceId) => extractZones(await apiClient.get(`/workspaces/${workspaceId}/presence-zones`)),
  create: async (workspaceId, payload) => extractZone(await apiClient.post(`/workspaces/${workspaceId}/presence-zones`, payload)),
  update: async (workspaceId, zoneId, payload) => extractZone(await apiClient.patch(`/workspaces/${workspaceId}/presence-zones/${zoneId}`, payload)),
  remove: async (workspaceId, zoneId) => {
    await apiClient.delete(`/workspaces/${workspaceId}/presence-zones/${zoneId}`);
    return zoneId;
  },
};

export default presenceZoneService;
