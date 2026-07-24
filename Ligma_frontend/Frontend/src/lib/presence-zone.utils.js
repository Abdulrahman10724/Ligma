const DEFAULT_ZONE_COLOR = "#7C3AED";

export const ZONE_COLOR_PRESETS = [
  "#7C3AED",
  "#2563EB",
  "#0EA5E9",
  "#059669",
  "#D97706",
  "#DC2626",
  "#DB2777",
  "#52525B",
];

export function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(124, 58, 237, ${alpha})`;
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((part) => part + part).join("")
    : normalized;

  const bigint = Number.parseInt(value, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function normalizeZone(zone = {}, index = 0) {
  return {
    id: String(zone.id || zone._id || `zone-${index}`),
    name: zone.name || zone.title || `Zone ${index + 1}`,
    description: zone.description || "",
    color: zone.color || DEFAULT_ZONE_COLOR,
    x: Number(zone.x ?? zone.position?.x ?? 120 + index * 32),
    y: Number(zone.y ?? zone.position?.y ?? 96 + index * 24),
    width: Number(zone.width ?? zone.size?.width ?? 320),
    height: Number(zone.height ?? zone.size?.height ?? 220),
    collapsed: Boolean(zone.collapsed),
    locked: Boolean(zone.locked),
    createdBy: zone.createdBy || zone.userId || null,
    updatedAt: zone.updatedAt || zone.modifiedAt || zone.createdAt || null,
  };
}

export function clampZoneSize(value, min, max = Number.POSITIVE_INFINITY) {
  return Math.max(min, Math.min(max, value));
}

export function getViewportZoneStyle(zone, viewport) {
  return {
    left: zone.x * viewport.scale + viewport.x,
    top: zone.y * viewport.scale + viewport.y,
    width: zone.width * viewport.scale,
    height: zone.height * viewport.scale,
  };
}

export function isPointInsideZone(point, zone) {
  if (!point || !zone) return false;
  return (
    point.x >= zone.x &&
    point.x <= zone.x + zone.width &&
    point.y >= zone.y &&
    point.y <= zone.y + zone.height
  );
}

export function getInitials(name = "") {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "?";
}

export function buildZonePayload(zone) {
  return {
    name: zone.name,
    description: zone.description || "",
    color: zone.color || DEFAULT_ZONE_COLOR,
    x: Math.round(zone.x),
    y: Math.round(zone.y),
    width: Math.round(zone.width),
    height: Math.round(zone.height),
    collapsed: Boolean(zone.collapsed),
  };
}

export const DEFAULT_ZONE_DRAFT = {
  name: "Focus Zone",
  description: "",
  color: DEFAULT_ZONE_COLOR,
};

export default {
  ZONE_COLOR_PRESETS,
  normalizeZone,
  clampZoneSize,
  getViewportZoneStyle,
  isPointInsideZone,
  getInitials,
  buildZonePayload,
  DEFAULT_ZONE_DRAFT,
  hexToRgba,
};
