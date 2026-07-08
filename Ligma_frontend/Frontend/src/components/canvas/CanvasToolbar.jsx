import { StickyNote, Type, Square, Circle, Minus, MousePointer2 } from "lucide-react";

const TOOLS = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "sticky", label: "Sticky", icon: StickyNote },
  { id: "text", label: "Text", icon: Type },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "arrow", label: "Arrow", icon: Minus },
];

const COLORS = [
  "#FDE68A",
  "#BFDBFE",
  "#FDBA74",
  "#BBF7D0",
  "#F9A8D4",
  "#D8B4FE",
];

export default function CanvasToolbar({ activeTool, onToolChange, activeColor, onColorChange }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 flex items-end gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-3 py-2 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-1">
        {TOOLS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTool === id;
          return (
            <button
              key={id}
              onClick={() => onToolChange(id)}
              title={label}
              className={`flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-[color:var(--accent)] text-white shadow-sm"
                  : "text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-primary)] hover:text-[color:var(--text-primary)]"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] leading-none">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 border-l border-[color:var(--border)] pl-2">
        {COLORS.map((color) => {
          const isActive = activeColor === color;
          return (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              title={color}
              className={`h-7 w-7 rounded-full border transition-all ${isActive ? "scale-110 border-[color:var(--text-primary)] shadow-sm" : "border-white/60"}`}
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>
    </div>
  );
}
