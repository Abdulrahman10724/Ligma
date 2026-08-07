import { ArrowRight, Circle, Diamond, Lock, MousePointer2, Minus, Settings2, Square, StickyNote, Triangle, Type, Unlock } from "lucide-react";

const TOOLS = [
  { id: "select",    label: "Select",    icon: MousePointer2 },
  { id: "sticky",    label: "Sticky",    icon: StickyNote },
  { id: "text",      label: "Text",      icon: Type },
  { id: "rectangle", label: "Rect",      icon: Square },
  { id: "circle",    label: "Circle",    icon: Circle },
  { id: "arrow",     label: "Arrow",     icon: ArrowRight },
  { id: "diamond",   label: "Diamond",   icon: Diamond },
  { id: "triangle",  label: "Triangle",  icon: Triangle },
  { id: "line",      label: "Line",      icon: Minus },
];

const COLORS = [
  "#FDE68A", "#BFDBFE", "#FDBA74", "#BBF7D0", "#F9A8D4", "#D8B4FE",
];

export default function CanvasToolbar({
  activeTool,
  onToolChange,
  activeColor,
  onColorChange,
  canEdit,
  selectedNode,
  isLead,
  onToggleLock,
  onOpenPermissions,
}) {
  const tools = canEdit ? TOOLS : TOOLS.filter((tool) => tool.id === "select");

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-4 z-20 flex items-center gap-1.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1.5 shadow-[var(--shadow-md)] backdrop-blur-sm">
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5">
        {tools.map(({ id, label, icon: Icon }) => {
          const isActive = activeTool === id;
          return (
            <button
              key={id}
              onClick={() => onToolChange(id)}
              title={label}
              aria-label={label}
              aria-pressed={isActive}
              className={[
                "relative flex cursor-pointer flex-col items-center justify-center gap-0.5 w-11 h-11 rounded-lg text-[10px] font-medium transition-all duration-150",
                isActive
                  ? "bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                  : "text-[color:var(--foreground-muted)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)]",
              ].join(" ")}
            >
              <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.2]" : "stroke-[1.8]"}`} />
              <span className="text-[9px] leading-none opacity-80">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Color swatches */}
      {canEdit && (
        <div className="flex items-center gap-1 border-l border-[color:var(--border)] pl-2">
          {COLORS.map((color) => {
            const isActive = activeColor === color;
            return (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                title={color}
                aria-label={`Color ${color}`}
                className={[
                  "h-6 w-6 cursor-pointer rounded-full transition-all duration-150",
                  isActive
                    ? "scale-125 ring-2 ring-[color:var(--foreground)] ring-offset-1 ring-offset-[color:var(--surface)]"
                    : "hover:scale-110 ring-1 ring-[color:var(--border)]",
                ].join(" ")}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      )}

      {/* Lock + Permissions (Lead + selected node) */}
      {selectedNode && isLead && (
        <div className="flex items-center gap-1 border-l border-[color:var(--border)] pl-2">
          <button
            onClick={onToggleLock}
            title={selectedNode.locked ? "Unlock node" : "Lock node"}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[color:var(--foreground-secondary)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)] transition-colors"
          >
            {selectedNode.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {selectedNode.locked ? "Unlock" : "Lock"}
          </button>
          <button
            onClick={onOpenPermissions}
            title="Edit permissions"
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-[11px] font-medium text-[color:var(--foreground-secondary)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)] transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Perms
          </button>
        </div>
      )}
    </div>
  );
}
