import React from "react";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { MoreHorizontal } from "lucide-react";

const HEX_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

function ColorSwatchPicker({ label, value, onChange, colors, allowTransparent = false }) {
  const [showMore, setShowMore] = useState(false);
  const [hexInput, setHexInput] = useState(value && value !== "transparent" ? value : "");
  const [error, setError] = useState("");

  const swatches = allowTransparent ? ["transparent", ...colors] : colors;

  const handleHexChange = (raw) => {
    setHexInput(raw);
    if (!raw) {
      setError("");
      return;
    }
    if (HEX_REGEX.test(raw)) {
      setError("");
      onChange(raw);
    } else {
      setError("Invalid hex color");
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
        {label}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {swatches.map((color) => {
          const isActive = value === color;
          return (
            <button
              key={color}
              type="button"
              title={color === "transparent" ? "Transparent" : color}
              onClick={() => {
                onChange(color);
                setHexInput(color === "transparent" ? "" : color);
                setError("");
              }}
              className={`h-6 w-6 rounded-md border-2 transition-all cursor-pointer ${
                isActive ? "border-[color:var(--accent)] scale-110" : "border-[color:var(--border)]"
              }`}
              style={
                color === "transparent"
                  ? {
                      backgroundImage:
                        "linear-gradient(45deg, #999 25%, transparent 25%), linear-gradient(-45deg, #999 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #999 75%), linear-gradient(-45deg, transparent 75%, #999 75%)",
                      backgroundSize: "6px 6px",
                      backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
                    }
                  : { backgroundColor: color }
              }
            />
          );
        })}
        <button
          type="button"
          title="More colors"
          onClick={() => setShowMore((v) => !v)}
          className={`h-6 w-6 flex items-center justify-center rounded-md border cursor-pointer transition-colors ${
            showMore
              ? "border-[color:var(--accent)] text-[color:var(--accent)]"
              : "border-[color:var(--border)] text-[color:var(--text-secondary)]"
          } hover:border-[color:var(--accent)]`}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {showMore && (
        <div className="mt-2 space-y-2">
          <HexColorPicker
            color={value && value !== "transparent" ? value : "#ffffff"}
            onChange={(color) => {
              onChange(color);
              setHexInput(color);
              setError("");
            }}
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="#RRGGBB"
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--bg-primary)] px-2 py-1 text-xs text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]"
          />
          {error && <p className="text-[10px] text-[color:var(--danger)]">{error}</p>}
        </div>
      )}
    </div>
  );
}
export default React.memo(ColorSwatchPicker);