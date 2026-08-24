import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   FAKE EVENT SEQUENCE — 10 events that rebuild the canvas
──────────────────────────────────────────────────────────────── */
const FAKE_EVENTS = [
  { id: 0, type: "create", label: "Note created", actor: "Ayesha", actorColor: "#0D9488",
    node: { id: "n1", x: 40, y: 30, w: 160, h: 72, color: "#FDF6DC", text: "Redesign checkout flow", tag: null } },
  { id: 1, type: "create", label: "Note created", actor: "Zubair", actorColor: "#EA580C",
    node: { id: "n2", x: 240, y: 20, w: 150, h: 72, color: "#E2EEF5", text: "Which payment provider?", tag: null } },
  { id: 2, type: "ai_tag", label: "AI classified", actor: "AI", actorColor: "#D97706",
    node: { id: "n1", x: 40, y: 30, w: 160, h: 72, color: "#FDF6DC", text: "Redesign checkout flow", tag: "Action Item" } },
  { id: 3, type: "ai_tag", label: "AI classified", actor: "AI", actorColor: "#D97706",
    node: { id: "n2", x: 240, y: 20, w: 150, h: 72, color: "#E2EEF5", text: "Which payment provider?", tag: "Open Question" } },
  { id: 4, type: "create", label: "Task created", actor: "System", actorColor: "#0D9488",
    node: { id: "t1", x: 40, y: 140, w: 170, h: 60, color: "#CCFBF1", text: "Task → Redesign checkout flow", tag: "→ Board" } },
  { id: 5, type: "create", label: "Note created", actor: "Ayesha", actorColor: "#0D9488",
    node: { id: "n3", x: 240, y: 140, w: 160, h: 72, color: "#F7E8E2", text: "Use Stripe — we already have keys", tag: null } },
  { id: 6, type: "ai_tag", label: "AI classified", actor: "AI", actorColor: "#D97706",
    node: { id: "n3", x: 240, y: 140, w: 160, h: 72, color: "#F7E8E2", text: "Use Stripe — we already have keys", tag: "Decision" } },
  { id: 7, type: "move", label: "Node moved", actor: "Zubair", actorColor: "#EA580C",
    node: { id: "n2", x: 250, y: 30, w: 150, h: 72, color: "#E2EEF5", text: "Which payment provider?", tag: "Open Question" } },
  { id: 8, type: "create", label: "Note created", actor: "Zubair", actorColor: "#EA580C",
    node: { id: "n4", x: 140, y: 215, w: 150, h: 66, color: "#DDF0E6", text: "Confirm with finance by Friday", tag: null } },
  { id: 9, type: "ai_tag", label: "AI classified", actor: "AI", actorColor: "#D97706",
    node: { id: "n4", x: 140, y: 215, w: 150, h: 66, color: "#DDF0E6", text: "Confirm with finance by Friday", tag: "Action Item" } },
];

const TAG_COLORS = {
  "Action Item": "var(--primary)",
  "Open Question": "var(--highlight)",
  Decision: "var(--secondary)",
  Reference: "var(--foreground-muted)",
  "→ Board": "var(--primary)",
};

const SPEED_OPTIONS = [0.5, 1, 2, 4];

/* ── Build canvas state at a given event index ── */
function buildCanvasAt(eventIndex) {
  const nodes = {};
  for (let i = 0; i <= eventIndex; i++) {
    const ev = FAKE_EVENTS[i];
    if (ev.type === "delete") {
      delete nodes[ev.node.id];
    } else {
      nodes[ev.node.id] = { ...ev.node };
    }
  }
  return Object.values(nodes);
}

/* ── Canvas Node card ── */
function CanvasNode({ node }) {
  const tagColor = TAG_COLORS[node.tag] || "var(--primary)";
  return (
    <motion.div
      key={node.id}
      layout
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.w,
        background: node.color,
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        border: node.tag ? `1.5px solid ${tagColor}55` : "1.5px solid transparent",
      }}
    >
      <div style={{ fontSize: 11.5, color: "#374151", lineHeight: 1.45, marginBottom: node.tag ? 7 : 0 }}>
        {node.text}
      </div>
      {node.tag && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: tagColor,
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 99,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          <Zap size={7} />
          {node.tag}
        </div>
      )}
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════
   MAIN TIME TRAVEL SECTION
═══════════════════════════════════════════════════════════════ */
export default function TimeTravelSection() {
  const prefersReducedMotion = useReducedMotion();
  const [eventIdx, setEventIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const canvasNodes = buildCanvasAt(eventIdx);
  const trackRef = useRef(null);
  const intervalRef = useRef(null);
  const isDragging = useRef(false);

  const MAX = FAKE_EVENTS.length - 1;

  /* ── Playback ── */
  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      return;
    }
    const ms = 900 / speed;
    intervalRef.current = setInterval(() => {
      setEventIdx((i) => {
        if (i >= MAX) {
          setPlaying(false);
          return MAX;
        }
        return i + 1;
      });
    }, ms);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, MAX]);

  const handlePlayPause = () => {
    if (eventIdx >= MAX) setEventIdx(0);
    setPlaying((p) => !p);
  };

  const handleReset = () => {
    setPlaying(false);
    setEventIdx(0);
  };

  /* ── Scrubber drag ── */
  const setFromPointer = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setEventIdx(Math.round(pct * MAX));
  }, [MAX]);

  const onTrackMouseDown = (e) => {
    isDragging.current = true;
    setPlaying(false);
    setFromPointer(e.clientX);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setFromPointer(clientX);
    };
    const onUp = () => { isDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [setFromPointer]);

  const pct = (eventIdx / MAX) * 100;
  const currentEvent = FAKE_EVENTS[eventIdx];

  return (
    <section
      id="time-travel"
      style={{
        padding: "100px 24px 80px",
        background: "var(--surface-muted)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <div className="section-eyebrow">Time Travel Replay</div>
          <h2 className="section-heading">
            Nothing is ever{" "}
            <span style={{ color: "var(--primary)" }}>lost</span>
          </h2>
          <p className="section-subheading" style={{ maxWidth: 520, margin: "0 auto" }}>
            Scrub back to any moment and watch your team's thinking unfold again, exactly as it happened.
          </p>
        </motion.div>

        {/* Replay UI */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            background: "var(--surface)",
            borderRadius: 16,
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
          }}
        >
          {/* Top toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderBottom: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={handleReset}
                title="Reset"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "var(--surface-muted)",
                  color: "var(--foreground-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={13} />
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={handlePlayPause}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: "none",
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(13,148,136,0.3)",
                }}
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
              </motion.button>
            </div>

            {/* Speed selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    border: "1px solid",
                    borderColor: speed === s ? "var(--primary)" : "var(--border)",
                    background: speed === s ? "var(--primary-soft)" : "transparent",
                    color: speed === s ? "var(--primary)" : "var(--foreground-muted)",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                >
                  {s}×
                </button>
              ))}
            </div>

            {/* Event counter */}
            <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--foreground-muted)", fontWeight: 500 }}>
              Event {eventIdx + 1} / {FAKE_EVENTS.length}
            </div>

            {/* Current event badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentEvent.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: currentEvent.actorColor + "18",
                  fontSize: 11,
                  fontWeight: 600,
                  color: currentEvent.actorColor,
                  border: `1px solid ${currentEvent.actorColor}30`,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: currentEvent.actorColor }} />
                {currentEvent.actor} · {currentEvent.label}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Timeline track */}
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--border)" }}>
            <div
              ref={trackRef}
              onMouseDown={onTrackMouseDown}
              onTouchStart={(e) => { isDragging.current = true; setPlaying(false); setFromPointer(e.touches[0].clientX); }}
              style={{
                position: "relative",
                height: 8,
                background: "var(--surface-muted)",
                borderRadius: 4,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              {/* Fill */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${pct}%`,
                  background: "var(--primary)",
                  borderRadius: 4,
                  transition: isDragging.current ? "none" : "width 250ms ease",
                }}
              />

              {/* Tick marks */}
              {FAKE_EVENTS.map((ev, i) => {
                const tickPct = (i / MAX) * 100;
                const color =
                  ev.type === "ai_tag"
                    ? "var(--highlight)"
                    : ev.type === "create" && ev.node.id.startsWith("t")
                    ? "var(--secondary)"
                    : "var(--primary)";
                return (
                  <div
                    key={i}
                    onClick={() => { setPlaying(false); setEventIdx(i); }}
                    title={ev.label}
                    style={{
                      position: "absolute",
                      left: `${tickPct}%`,
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: i === eventIdx ? 14 : 10,
                      height: i === eventIdx ? 14 : 10,
                      borderRadius: "50%",
                      background: color,
                      border: "2px solid var(--surface)",
                      cursor: "pointer",
                      transition: "width 150ms ease, height 150ms ease",
                      zIndex: 2,
                    }}
                  />
                );
              })}

              {/* Scrubber thumb */}
              <motion.div
                animate={{ left: `${pct}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  position: "absolute",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  border: "3px solid var(--surface)",
                  boxShadow: "0 2px 8px rgba(13,148,136,0.4)",
                  cursor: "grab",
                  zIndex: 3,
                }}
              />
            </div>

            {/* Tick labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {FAKE_EVENTS.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 8.5,
                    color: i <= eventIdx ? "var(--foreground-secondary)" : "var(--foreground-muted)",
                    textAlign: "center",
                    maxWidth: 56,
                    lineHeight: 1.2,
                    transition: "color 200ms ease",
                  }}
                >
                  {ev.label}
                </div>
              ))}
            </div>
          </div>

          {/* Mini canvas reconstruction */}
          <div
            style={{
              position: "relative",
              height: 310,
              overflow: "hidden",
              backgroundImage:
                "radial-gradient(circle, rgba(0,0,0,0.035) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
              background: "var(--canvas-background)",
            }}
          >
            {/* grid overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle, rgba(100,100,100,0.06) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                pointerEvents: "none",
              }}
            />

            <AnimatePresence>
              {canvasNodes.map((node) => (
                <CanvasNode key={node.id} node={node} />
              ))}
            </AnimatePresence>

            {/* Overlay: empty state */}
            {canvasNodes.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--foreground-muted)",
                  fontSize: 13,
                }}
              >
                Press Play or drag the scrubber to begin replay
              </div>
            )}
          </div>
        </motion.div>

        {/* Caption */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: 13,
            color: "var(--foreground-muted)",
          }}
        >
          Every create, move, tag, and delete is recorded immutably. Scrub to any moment.
        </motion.p>
      </div>
    </section>
  );
}
