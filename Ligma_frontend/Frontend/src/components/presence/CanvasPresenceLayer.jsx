import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PresenceZoneCard from "@/components/presence/PresenceZoneCard";
import PresenceZoneEditor from "@/components/presence/PresenceZoneEditor";
import {
  buildZonePayload,
  clampZoneSize,
  DEFAULT_ZONE_DRAFT,
  getViewportZoneStyle,
  isPointInsideZone,
} from "@/lib/presence-zone.utils";

const MIN_ZONE_WIDTH = 220;
const MIN_ZONE_HEIGHT = 140;

function buildResizePreview(zone, handle, deltaX, deltaY) {
  let nextX = zone.x;
  let nextY = zone.y;
  let nextWidth = zone.width;
  let nextHeight = zone.height;

  if (handle.includes("e")) {
    nextWidth = clampZoneSize(zone.width + deltaX, MIN_ZONE_WIDTH);
  }
  if (handle.includes("s")) {
    nextHeight = clampZoneSize(zone.height + deltaY, MIN_ZONE_HEIGHT);
  }
  if (handle.includes("w")) {
    nextWidth = clampZoneSize(zone.width - deltaX, MIN_ZONE_WIDTH);
    nextX = zone.x + (zone.width - nextWidth);
  }
  if (handle.includes("n")) {
    nextHeight = clampZoneSize(zone.height - deltaY, MIN_ZONE_HEIGHT);
    nextY = zone.y + (zone.height - nextHeight);
  }

  return {
    ...zone,
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
}

export default function CanvasPresenceLayer({
  viewport,
  dimensions,
  members = [],
  presenceUsers = [],
  remoteCursors = {},
  localCursor,
  currentUser,
  currentUserRole,
  canManage,
  zones = [],
  saving,
  createZone,
  updateZone,
  removeZone,
  onViewportChange,
}) {
  const interactionRef = useRef(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [previewZones, setPreviewZones] = useState({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState(DEFAULT_ZONE_DRAFT);
  const animationFrameRef = useRef(null);

  // Refs so the mousemove/mouseup listeners (attached once) always read
  // the latest viewport scale and preview state without re-subscribing.
  const viewportRef = useRef(viewport);
  const previewZonesRef = useRef(previewZones);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    previewZonesRef.current = previewZones;
  }, [previewZones]);

  const zoneList = useMemo(
    () => zones.map((zone) => (previewZones[zone.id] ? { ...zone, ...previewZones[zone.id] } : zone)),
    [previewZones, zones]
  );

  const zonePresenceMap = useMemo(() => {
    const membersByUserId = new Map(
      members.map((member) => [
        member.userId,
        {
          name: member.name,
          email: member.email,
          role: member.isOwner ? "Lead" : member.role,
        },
      ])
    );

    return zoneList.reduce((acc, zone) => {
      acc[zone.id] = presenceUsers
        .map((presence) => {
          const point = presence.userId === currentUser?.id ? localCursor : remoteCursors[presence.userId];
          if (!isPointInsideZone(point, zone)) return null;
          const meta = membersByUserId.get(presence.userId);
          return {
            ...presence,
            name: meta?.name || presence.name,
            email: meta?.email || presence.email,
            role: meta?.role || (presence.userId === currentUser?.id ? currentUserRole : null),
          };
        })
        .filter(Boolean);
      return acc;
    }, {});
  }, [currentUser?.id, currentUserRole, localCursor, members, presenceUsers, remoteCursors, zoneList]);

  const openCreateZone = useCallback(() => {
    const centerX = (-viewport.x + dimensions.width / 2) / viewport.scale - 160;
    const centerY = (-viewport.y + dimensions.height / 2) / viewport.scale - 110;
    setEditorDraft({
      ...DEFAULT_ZONE_DRAFT,
      x: centerX,
      y: centerY,
      width: 320,
      height: 220,
      collapsed: false,
    });
    setIsEditorOpen(true);
  }, [dimensions.height, dimensions.width, viewport.scale, viewport.x, viewport.y]);

  const openEditZone = useCallback((zone) => {
    setSelectedZoneId(zone.id);
    setEditorDraft(zone);
    setIsEditorOpen(true);
  }, []);

  const animateViewportTo = useCallback(
    (nextViewport) => {
      if (!onViewportChange) return;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const start = viewportRef.current;
      const startedAt = performance.now();
      const duration = 240;

      const step = (now) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);

        onViewportChange({
          x: start.x + (nextViewport.x - start.x) * eased,
          y: start.y + (nextViewport.y - start.y) * eased,
          scale: start.scale + (nextViewport.scale - start.scale) * eased,
        });

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(step);
        }
      };

      animationFrameRef.current = requestAnimationFrame(step);
    },
    [onViewportChange]
  );

  const focusZone = useCallback(
    (zone) => {
      if (!zone) {
        setSelectedZoneId(null);
        return;
      }

      setSelectedZoneId(zone.id);
      animateViewportTo({
        x: dimensions.width / 2 - (zone.x + zone.width / 2) * viewportRef.current.scale,
        y: dimensions.height / 2 - (zone.y + zone.height / 2) * viewportRef.current.scale,
        scale: viewportRef.current.scale,
      });
    },
    [animateViewportTo, dimensions.height, dimensions.width]
  );

  const persistZone = useCallback(
    async (zone) => {
      const payload = buildZonePayload(zone);

      // Guard against invalid numbers so a failed request never silently reverts the drag
      if (!Number.isFinite(payload.x) || !Number.isFinite(payload.y) || !Number.isFinite(payload.width) || !Number.isFinite(payload.height)) {
        console.warn("Skipping zone persist — invalid geometry", payload);
        return null;
      }

      if (zone.id) {
        const result = await updateZone(zone.id, payload);
        if (result?.meta?.requestStatus === "rejected") {
          toast.error(result.payload || "Unable to update zone");
        }
        return result;
      } else {
        const result = await createZone(payload);
        if (result?.meta?.requestStatus === "fulfilled") {
          const zoneId = result.payload?.data?.zone?.id;
          if (zoneId) setSelectedZoneId(zoneId);
        }
        return result;
      }
    },
    [createZone, updateZone]
  );

  // Attach drag/resize listeners ONCE on mount. Reading previewZones or
  // viewport.scale as a dependency here was causing this effect to tear
  // down and re-attach on every single mousemove frame, which could drop
  // the mouseup event mid-drag — the zone would then keep following the
  // cursor forever, or "snap back" because the drop was never committed.
  useEffect(() => {
    const handlePointerMove = (event) => {
      const interaction = interactionRef.current;
      if (!interaction) return;

      const scale = viewportRef.current.scale;
      const deltaX = (event.clientX - interaction.startClientX) / scale;
      const deltaY = (event.clientY - interaction.startClientY) / scale;

      if (interaction.type === "drag") {
        setPreviewZones((current) => ({
          ...current,
          [interaction.zone.id]: {
            ...interaction.zone,
            x: interaction.zone.x + deltaX,
            y: interaction.zone.y + deltaY,
          },
        }));
      }

      if (interaction.type === "resize") {
        setPreviewZones((current) => ({
          ...current,
          [interaction.zone.id]: buildResizePreview(interaction.zone, interaction.handle, deltaX, deltaY),
        }));
      }
    };

    const handlePointerUp = async () => {
      const interaction = interactionRef.current;
      if (!interaction) return;

      interactionRef.current = null;

      const preview = previewZonesRef.current[interaction.zone.id];
      if (!preview) return;

      // Persist FIRST — keep showing the dragged preview position while the
      // request is in flight, so nothing visually snaps back to the stale
      // pre-drag position before the confirmed value arrives.
      await persistZone(preview);

      setPreviewZones((current) => {
        const next = { ...current };
        delete next[interaction.zone.id];
        return next;
      });
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [persistZone]);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {zoneList.map((zone) => (
          <PresenceZoneCard
            key={zone.id}
            zone={zone}
            screenStyle={getViewportZoneStyle(zone, viewport)}
            isSelected={selectedZoneId === zone.id}
            activeUsers={zonePresenceMap[zone.id] || []}
            canManage={canManage}
            onSelect={focusZone}
            onDragStart={(event, currentZone) => {
              if (!canManage) return;
              event.preventDefault();
              event.stopPropagation();
              interactionRef.current = {
                type: "drag",
                zone: currentZone,
                startClientX: event.clientX,
                startClientY: event.clientY,
              };
            }}
            onResizeStart={(event, currentZone, handle) => {
              if (!canManage) return;
              event.preventDefault();
              event.stopPropagation();
              interactionRef.current = {
                type: "resize",
                zone: currentZone,
                handle,
                startClientX: event.clientX,
                startClientY: event.clientY,
              };
            }}
            onToggleCollapse={async (zoneToToggle) => {
              await persistZone({ ...zoneToToggle, collapsed: !zoneToToggle.collapsed });
            }}
            onEdit={openEditZone}
            onDelete={async (zoneToDelete) => {
              const result = await removeZone(zoneToDelete.id);
              if (result?.meta?.requestStatus === "fulfilled") {
                if (selectedZoneId === zoneToDelete.id) {
                  setSelectedZoneId(null);
                }
              }
            }}
            onColorChange={async (zoneToColor, color) => {
              await persistZone({ ...zoneToColor, color });
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute left-4 top-4 z-30 flex flex-col gap-3">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)]/92 px-4 py-3 shadow-xl backdrop-blur-xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">Presence zones</p>
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">{zoneList.length} active overlays</p>
          </div>
        </div>

        {canManage ? (
          <div className="pointer-events-auto flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl border-[color:var(--border)] bg-[color:var(--bg-surface)]/92 px-4 text-[color:var(--text-primary)] shadow-lg backdrop-blur-xl hover:bg-[color:var(--bg-surface)]"
                >
                  <span className="max-w-40 truncate">{selectedZoneId ? (zoneList.find((zone) => zone.id === selectedZoneId)?.name || "All Zones") : "All Zones"}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="w-56 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-1.5 shadow-2xl">
                <DropdownMenuItem onSelect={() => focusZone(null)} className="rounded-xl px-3 py-2 text-sm">
                  All Zones
                </DropdownMenuItem>
                {zoneList.map((zone) => (
                  <DropdownMenuItem
                    key={zone.id}
                    onSelect={() => focusZone(zone)}
                    className="rounded-xl px-3 py-2 text-sm"
                  >
                    {zone.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              onClick={openCreateZone}
              className="rounded-2xl bg-gradient-to-r from-[color:var(--accent)] to-fuchsia-500 px-4 text-white shadow-lg hover:brightness-110"
            >
              <Plus className="mr-2 h-4 w-4" /> New zone
            </Button>
          </div>
        ) : null}
      </div>

      <PresenceZoneEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialValue={editorDraft}
        saving={saving}
        onSubmit={async (values) => {
          await persistZone({ ...editorDraft, ...values });
          setIsEditorOpen(false);
        }}
      />
    </>
  );
}