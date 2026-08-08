import React from "react";
import ColorSwatchPicker from "./ColorSwatchPicker";

export const STROKE_COLORS = ["#1e1e1e", "#e03131", "#2f9e44", "#1971c2", "#f08c00"];
export const BACKGROUND_COLORS = ["#ffc9c9", "#b2f2bb", "#a5d8ff", "#ffec99", "#eebefa"];

const STROKE_WIDTHS = [
  { value: 1, label: "Thin" },
  { value: 2, label: "Bold" },
  { value: 4, label: "Extra bold" },
];

const EDGE_OPTIONS = [
  { value: "sharp", label: "Sharp" },
  { value: "round", label: "Round" },
];

const HAS_BACKGROUND = new Set(["sticky", "rectangle", "circle"]);
const HAS_EDGES = new Set(["rectangle"]);

function ToolStylePanel({
  tool,
  strokeColor,
  onStrokeColorChange,
  fillColor,
  onFillColorChange,
  strokeWidth,
  onStrokeWidthChange,
  edges,
  onEdgesChange,
  opacity,
  onOpacityChange,
}) {
  if (!tool || tool === "select") return null;

  return (
    <div className="absolute right-4 top-20 z-20 w-56 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-3.5 shadow-2xl space-y-4">
      <ColorSwatchPicker label="Stroke" value={strokeColor} onChange={onStrokeColorChange} colors={STROKE_COLORS} />

      {HAS_BACKGROUND.has(tool) && (
        <ColorSwatchPicker
          label="Background"
          value={fillColor}
          onChange={onFillColorChange}
          colors={BACKGROUND_COLORS}
          allowTransparent
        />
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
          Stroke width
        </p>
        <div className="flex items-center gap-1.5">
          {STROKE_WIDTHS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              onClick={() => onStrokeWidthChange(opt.value)}
              className={`flex-1 h-7 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
                strokeWidth === opt.value
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10"
                  : "border-[color:var(--border)] hover:border-[color:var(--accent)]/60"
              }`}
            >
              <span className="w-4 rounded-full bg-[color:var(--text-primary)]" style={{ height: `${opt.value}px` }} />
            </button>
          ))}
        </div>
      </div>

      {HAS_EDGES.has(tool) && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
            Edges
          </p>
          <div className="flex items-center gap-1.5">
            {EDGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => onEdgesChange(opt.value)}
                className={`flex-1 h-7 rounded-md border text-[11px] font-medium cursor-pointer transition-colors ${
                  edges === opt.value
                    ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                    : "border-[color:var(--border)] text-[color:var(--text-secondary)] hover:border-[color:var(--accent)]/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
          Opacity
        </p>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.1}
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
          className="w-full accent-[color:var(--accent)]"
        />
      </div>
    </div>
  );
}
export default React.memo(ToolStylePanel);