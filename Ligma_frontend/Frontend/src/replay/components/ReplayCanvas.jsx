// ReplayCanvas.jsx
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Read-only canvas renderer for the replay virtual state. Reuses the existing
// Konva node components (StickyNode, TextNode, ShapeNode, ArrowNode) so the
// visual output is 1:1 identical to the live canvas — but zero interaction is
// wired: no drag, no click, no context menu, no keyboard shortcuts.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Layer, Line, Stage } from "react-konva";

import { selectReplayNodes } from "../replaySlice";
import StickyNode from "../../components/canvas/nodes/StickyNode";
import TextNode from "../../components/canvas/nodes/TextNode";
import ShapeNode from "../../components/canvas/nodes/ShapeNode";
import ArrowNode from "../../components/canvas/nodes/ArrowNode";

const GRID_SIZE = 40;
const GRID_COLOR_LIGHT = "#E4E4E7";
const GRID_COLOR_DARK = "#2A2A31";

// Frozen "no-op" callbacks — the node components require these props but the
// replay canvas is strictly read-only. Every callback is a silent stub.
const noop = () => {};
const READ_ONLY_HANDLERS = Object.freeze({
  onDragEnd: noop,
  onDragMove: noop,
  onClick: noop,
  onDoubleClick: noop,
  onTransform: noop,
  onTransformEnd: noop,
  onMouseEnter: noop,
  onMouseLeave: noop,
  onEndpointDragMove: noop,
  onEndpointDragEnd: noop,
});

const READ_ONLY_PERMISSIONS = Object.freeze({
  canView: true,
  canEdit: false,
  canMove: false,
  canResize: false,
  canDelete: false,
  canLock: false,
  isLocked: false,
});

function buildGridLines(width, height, scale, offsetX, offsetY) {
  const lines = [];
  const startX = Math.floor(-offsetX / scale / GRID_SIZE) * GRID_SIZE;
  const startY = Math.floor(-offsetY / scale / GRID_SIZE) * GRID_SIZE;
  const endX = startX + width / scale + GRID_SIZE * 2;
  const endY = startY + height / scale + GRID_SIZE * 2;

  for (let x = startX; x < endX; x += GRID_SIZE) {
    lines.push({ points: [x, startY, x, endY], key: `vl-${x}` });
  }
  for (let y = startY; y < endY; y += GRID_SIZE) {
    lines.push({ points: [startX, y, endX, y], key: `hl-${y}` });
  }
  return lines;
}

function renderReplayNode(node) {
  // Every node type flows through its live component but with locked-down
  // permissions and no-op callbacks. This guarantees pixel-parity with the
  // real canvas while denying interaction.
  const lockedPermissions = {
    ...READ_ONLY_PERMISSIONS,
    isLocked: Boolean(node.locked),
  };

  const commonProps = {
    key: node.id,
    node,
    isSelected: false,
    permissions: lockedPermissions,
    ...READ_ONLY_HANDLERS,
  };

  switch (node.type) {
    case "sticky":
      return <StickyNode {...commonProps} />;
    case "text":
      return <TextNode {...commonProps} />;
    case "rectangle":
    case "circle":
      return <ShapeNode {...commonProps} />;
    case "arrow":
      return <ArrowNode {...commonProps} canEdit={false} />;
    default:
      return null;
  }
}

export default function ReplayCanvas() {
  const nodes = useSelector(selectReplayNodes);

  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });

  // ── Dark mode sync (mirrors CanvasPage) ────────────────────────────────────
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mql.matches || document.documentElement.classList.contains("dark"));
    const handler = (e) => setIsDarkMode(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // ── Fit stage to container ────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setDimensions({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ── Auto-fit: center the content on first render / node-set change ────────
  useEffect(() => {
    if (nodes.length === 0) {
      setViewport({ x: dimensions.width / 2, y: dimensions.height / 2, scale: 1 });
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const w = n.data?.width || n.data?.radius * 2 || 160;
      const h = n.data?.height || n.data?.radius * 2 || 120;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + w);
      maxY = Math.max(maxY, n.y + h);
    }
    const contentW = Math.max(1, maxX - minX);
    const contentH = Math.max(1, maxY - minY);
    const scale = Math.min(
      1,
      (dimensions.width * 0.85) / contentW,
      (dimensions.height * 0.85) / contentH
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setViewport({
      x: dimensions.width / 2 - cx * scale,
      y: dimensions.height / 2 - cy * scale,
      scale,
    });
    // We deliberately depend on node count only — recomputing on every
    // sub-property tick would fight against the animated transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, dimensions.width, dimensions.height]);

  const gridLines = useMemo(
    () => buildGridLines(dimensions.width, dimensions.height, viewport.scale, viewport.x, viewport.y),
    [dimensions.width, dimensions.height, viewport.scale, viewport.x, viewport.y]
  );

  const gridColor = isDarkMode ? GRID_COLOR_DARK : GRID_COLOR_LIGHT;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[color:var(--bg-primary)] select-none replay-canvas-root"
      // Belt & suspenders: block all pointer interactions so nothing can leak
      // through to the underlying Konva stage. Any click also gets swallowed.
      style={{ cursor: "not-allowed" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        listening={false}
      >
        <Layer listening={false}>
          {gridLines.map((line) => (
            <Line
              key={line.key}
              points={line.points}
              stroke={gridColor}
              strokeWidth={1 / viewport.scale}
              opacity={0.4}
            />
          ))}
        </Layer>
        <Layer listening={false}>{nodes.map(renderReplayNode)}</Layer>
      </Stage>

      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-[color:var(--bg-surface)]/60 border border-[color:var(--border)] backdrop-blur flex items-center justify-center shadow-xs">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[color:var(--text-secondary)]">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M9 9h6M9 13h6M9 17h4" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[color:var(--text-primary)]">Empty Canvas</p>
          <p className="text-xs text-[color:var(--text-secondary)] max-w-xs">
            You are before the first event. Press <span className="font-semibold">Play</span> or drag the timeline to begin the reconstruction.
          </p>
        </div>
      )}
    </div>
  );
}
