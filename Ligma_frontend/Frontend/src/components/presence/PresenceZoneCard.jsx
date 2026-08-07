import { useState, memo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import PresenceAvatarStack from "@/components/presence/PresenceAvatarStack";
import { cn } from "@/lib/utils";
import { hexToRgba, ZONE_COLOR_PRESETS } from "@/lib/presence-zone.utils";
import { ChevronDown, ChevronUp, Lock, MoreHorizontal, PencilLine, Trash2, Palette } from "lucide-react";

const HANDLE_CONFIG = [
  { key: "nw", className: "-left-1.5 -top-1.5 cursor-nwse-resize" },
  { key: "ne", className: "-right-1.5 -top-1.5 cursor-nesw-resize" },
  { key: "sw", className: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  { key: "se", className: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
];

function PresenceZoneCard({
  zone,
  screenStyle,
  isSelected,
  activeUsers,
  canManage,
  onSelect,
  onDragStart,
  onResizeStart,
  onToggleCollapse,
  onEdit,
  onDelete,
  onColorChange,
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const headerLabel = zone.collapsed ? `${activeUsers.length} active` : `${activeUsers.length} collaborator${activeUsers.length === 1 ? "" : "s"}`;
  const borderColor = zone.color;
  const glowColor = hexToRgba(zone.color, 0.26);
  const fillColor = hexToRgba(zone.color, zone.collapsed ? 0.09 : 0.12);

  return (

    <div
      className="absolute z-20 cursor-pointer transition-all duration-200 ease-out"
      style={{
        left: screenStyle.left,
        top: screenStyle.top,
        width: Math.max(screenStyle.width, 180),
        height: Math.max(screenStyle.height, zone.collapsed ? 56 : 160),
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        onSelect(zone.id);
      }}
    >
      <div
        className={cn(
          "relative h-full rounded-[28px] border shadow-[0_24px_64px_-38px_rgba(15,23,42,0.65)] transition-all duration-200",
          isSelected ? "scale-[1.01]" : "hover:scale-[1.005]"
        )}
        style={{
          borderColor,
          background: `linear-gradient(180deg, ${hexToRgba(zone.color, 0.18)} 0%, ${fillColor} 100%)`,
          boxShadow: isSelected ? `0 0 0 1px ${borderColor}, 0 24px 64px -36px ${glowColor}` : `0 18px 48px -34px ${glowColor}`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/20 opacity-70" />
        <div className="pointer-events-none absolute inset-[10px] rounded-[20px] border border-dashed animate-pulse opacity-60" style={{ borderColor: hexToRgba(zone.color, 0.55) }} />

        <div className="relative flex h-full flex-col overflow-hidden rounded-[28px]">
          <div
            className="pointer-events-auto flex cursor-grab items-start justify-between gap-3 px-5 py-4 active:cursor-grabbing"
            onMouseDown={(event) => canManage && onDragStart(event, zone)}
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: zone.color }} />
                <h3 className="truncate text-sm font-semibold tracking-tight text-[color:var(--text-primary)]">{zone.name}</h3>
                <span className="rounded-full border border-white/40 bg-white/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)] backdrop-blur-sm">
                  {headerLabel}
                </span>
              </div>
              {zone.description ? (
                <p className="line-clamp-2 text-xs leading-5 text-[color:var(--text-secondary)]">{zone.description}</p>
              ) : null}
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="h-8 w-8 rounded-2xl border border-white/40 bg-white/45 text-[color:var(--text-secondary)] shadow-sm backdrop-blur-sm hover:bg-white/70"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleCollapse(zone);
                }}
                aria-label={zone.collapsed ? "Expand zone" : "Collapse zone"}
              >
                {zone.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button type="button" size="icon-sm" variant="ghost" className="h-8 w-8 rounded-2xl border border-white/40 bg-white/45 text-[color:var(--text-secondary)] shadow-sm backdrop-blur-sm hover:bg-white/70" />}>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-1.5 shadow-2xl">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Zone actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(zone)} disabled={!canManage}>
                      <PencilLine className="h-4 w-4" /> Rename & edit
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Palette className="h-4 w-4" /> Change color
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-2 shadow-2xl">
                        <div className="grid grid-cols-4 gap-2 p-1">
                          {ZONE_COLOR_PRESETS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              aria-label={`Select ${color}`}
                              className="h-8 w-8 rounded-xl border border-[color:var(--border)] shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                              style={{ backgroundColor: color }}
                              onClick={() => onColorChange(zone, color)}
                              disabled={!canManage}
                            />
                          ))}
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={() => onToggleCollapse(zone)}>
                      {zone.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {zone.collapsed ? "Expand" : "Collapse"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Lock className="h-4 w-4" /> Future-ready lock
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setConfirmDeleteOpen(true)}
                      disabled={!canManage}
                    >
                      <Trash2 className="h-4 w-4" /> Delete zone
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!zone.collapsed ? (
            <div className="pointer-events-none flex flex-1 flex-col justify-between px-5 pb-5">
              <div className="rounded-[22px] border border-white/35 bg-white/30 p-4 shadow-inner backdrop-blur-md">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">
                  Live presence
                </p>
                <PresenceAvatarStack users={activeUsers} />
              </div>
              <div className="mt-4 flex items-center justify-between text-[11px] text-[color:var(--text-secondary)]">
                <span className="rounded-full border border-white/30 bg-white/30 px-2.5 py-1 font-medium backdrop-blur-sm">
                  Transparent overlay · canvas friendly
                </span>
                <span>{canManage ? "Drag header or resize corners" : "Read only"}</span>
              </div>
            </div>
          ) : (
            <div className="pointer-events-none flex flex-1 items-center px-5 pb-4">
              <PresenceAvatarStack users={activeUsers} size="sm" emptyLabel="No active collaborators" />
            </div>
          )}
        </div>

        {canManage && !zone.collapsed ? (
          <>
            {HANDLE_CONFIG.map((handle) => (
              <button
                key={handle.key}
                type="button"
                className={cn(
                  "pointer-events-auto absolute h-4 w-4 rounded-full border-2 border-white bg-[color:var(--bg-surface)] shadow-sm",
                  handle.className
                )}
                onMouseDown={(event) => onResizeStart(event, zone, handle.key)}
                aria-label={`Resize ${zone.name}`}
              />
            ))}
          </>
        ) : null}
      </div>

    <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Delete "{zone.name}"?</DialogTitle>
            <DialogDescription>
              This will permanently remove this presence zone. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmDeleteOpen(false)} className="rounded-2xl">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirmDeleteOpen(false);
                onDelete(zone);
              }}
              className="rounded-2xl bg-[color:var(--danger)] text-white hover:brightness-110"
            >
              Delete zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default memo(PresenceZoneCard);