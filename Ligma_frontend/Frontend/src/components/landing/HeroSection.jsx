import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown, ArrowRight, Zap } from "lucide-react";

/* ── Word-stagger headline ── */
const HEADLINE_WORDS = [
  { text: "Brainstorm.", color: "var(--foreground)" },
  { text: "Collaborate.", color: "var(--foreground)" },
  { text: "Ship.", color: "var(--primary)" },
];

/* ── Sticky note data for canvas mockup ── */
const STICKY_NOTES = [
  {
    id: "s1",
    x: 32,
    y: 30,
    color: "#FDF6DC",
    darkColor: "#3A3520",
    text: "Set up API authentication flow",
    author: "Ayesha",
    authorColor: "#0D9488",
    width: 180,
  },
  {
    id: "s2",
    x: 240,
    y: 20,
    color: "#E2EEF5",
    darkColor: "#1C2C3A",
    text: "Which DB for sessions?",
    author: "Zubair",
    authorColor: "#EA580C",
    width: 170,
  },
  {
    id: "s3",
    x: 136,
    y: 155,
    color: "#F7E8E2",
    darkColor: "#3A2520",
    text: "Use Redis for token store",
    author: "Ayesha",
    authorColor: "#0D9488",
    width: 160,
  },
];

/* ── Arrow SVG between notes ── */
function CanvasArrow({ x1, y1, x2, y2 }) {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      overflow="visible"
    >
      <defs>
        <marker id="arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--foreground-muted)" />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="var(--foreground-muted)"
        strokeWidth="1.5"
        strokeDasharray="5,4"
        markerEnd="url(#arrow-head)"
        opacity={0.5}
      />
    </svg>
  );
}

/* ── Fake cursor ── */
function FakeCursor({ name, color, x, y }) {
  return (
    <motion.div
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 60, damping: 18 }}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 20 }}
    >
      {/* SVG cursor */}
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
        <path d="M0 0L0 14L4 10L7 17L9 16L6 9L11 9Z" fill={color} stroke="white" strokeWidth="0.5" />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 6,
          background: color,
          color: "#fff",
          fontSize: 10,
          fontWeight: 600,
          padding: "2px 6px",
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>
    </motion.div>
  );
}

/* ── Single sticky note ── */
function StickyNote({ note, isDark, highlighted, aiTag, children }) {
  const bg = isDark ? note.darkColor : note.color;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: "absolute",
        left: note.x,
        top: note.y,
        width: note.width,
        background: bg,
        borderRadius: 10,
        padding: "10px 12px",
        boxShadow: highlighted
          ? `0 0 0 2px ${note.authorColor}, 0 4px 16px rgba(0,0,0,0.12)`
          : "0 2px 8px rgba(0,0,0,0.08)",
        transition: "box-shadow 300ms ease",
        cursor: "default",
        zIndex: highlighted ? 10 : 5,
      }}
    >
      <div style={{ fontSize: 11.5, color: "#374151", lineHeight: 1.45, minHeight: 36 }}>
        {children || note.text}
      </div>
      {aiTag && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "var(--primary)",
            color: "#fff",
            fontSize: 9.5,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 99,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          <Zap size={8} />
          {aiTag}
        </motion.div>
      )}
      <div
        style={{
          marginTop: 6,
          fontSize: 9,
          color: note.authorColor,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: note.authorColor,
          }}
        />
        {note.author}
      </div>
    </motion.div>
  );
}

/* ── AI → Task chip animation ── */
function TaskChip({ visible, onDone }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 3500);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -20, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85, x: 20 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "var(--surface)",
            border: "1.5px solid var(--primary)",
            borderRadius: 10,
            padding: "10px 14px",
            minWidth: 130,
            boxShadow: "0 4px 20px rgba(13,148,136,0.2)",
            zIndex: 30,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 5,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Zap size={8} />
            Task Created
          </div>
          <div style={{ fontSize: 11, color: "var(--foreground)", fontWeight: 600, lineHeight: 1.3 }}>
            Set up API auth flow
          </div>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--primary-soft)",
                color: "var(--primary)",
              }}
            >
              Action Item
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--highlight-soft)",
                color: "var(--highlight)",
              }}
            >
              High
            </span>
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 9.5,
              color: "var(--foreground-muted)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Assigned → Ayesha
            <ArrowRight size={9} style={{ color: "var(--primary)" }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Magnetic button hook ── */
function useMagneticButton(strength = 0.35) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const isMobile = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  const onMouseMove = useCallback(
    (e) => {
      if (isMobile || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setPos({
        x: (e.clientX - cx) * strength,
        y: (e.clientY - cy) * strength,
      });
    },
    [isMobile, strength]
  );

  const onMouseLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);

  return { ref, pos, onMouseMove, onMouseLeave };
}

/* ── Typing text component ── */
function TypingText({ texts, speed = 60, pause = 1800 }) {
  const [phase, setPhase] = useState(0); // which text
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[phase];
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), speed);
      return () => clearTimeout(t);
    } else if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    } else if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx((c) => c - 1), speed / 2);
      return () => clearTimeout(t);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhase((p) => (p + 1) % texts.length);
    }
  }, [charIdx, deleting, phase, texts, speed, pause]);

  return (
    <span>
      {texts[phase].slice(0, charIdx)}
      <span
        style={{
          display: "inline-block",
          width: 1.5,
          height: "1em",
          background: "var(--primary)",
          marginLeft: 1,
          borderRadius: 1,
          verticalAlign: "middle",
          animation: "cursor-blink 1s step-end infinite",
        }}
      />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN HERO SECTION                                          */
/* ═══════════════════════════════════════════════════════════ */
export default function HeroSection() {
  const prefersReducedMotion = useReducedMotion();
  const [isDark, setIsDark] = useState(false);
  const [showAiTag, setShowAiTag] = useState(false);
  const [showTaskChip, setShowTaskChip] = useState(false);
  const primaryBtn = useMagneticButton(0.3);

  // Detect dark mode
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Cycle: show AI tag → show task chip → repeat
  useEffect(() => {
    if (prefersReducedMotion) return;
    const cycle = () => {
      const t1 = setTimeout(() => setShowAiTag(true), 2000);
      const t2 = setTimeout(() => {
        setShowAiTag(false);
        setShowTaskChip(true);
      }, 4000);
      return [t1, t2];
    };
    const timers = cycle();
    return () => timers.forEach(clearTimeout);
  }, [prefersReducedMotion]);

  const onTaskChipDone = useCallback(() => {
    setShowTaskChip(false);
    // restart cycle
    const t1 = setTimeout(() => setShowAiTag(true), 2500);
    const t2 = setTimeout(() => {
      setShowAiTag(false);
      setShowTaskChip(true);
    }, 4500);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);

  const scrollDown = () => {
    const el = document.querySelector("#how-it-works");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  /* Cursor motion paths */
  const [ayeshaPos, setAyeshaPos] = useState({ x: 50, y: 55 });
  const [zubairPos, setZubairPos] = useState({ x: 255, y: 45 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const AYESHA_WAYPOINTS = [
      { x: 50, y: 55 },
      { x: 80, y: 90 },
      { x: 60, y: 60 },
      { x: 50, y: 55 },
    ];
    const ZUBAIR_WAYPOINTS = [
      { x: 255, y: 45 },
      { x: 290, y: 30 },
      { x: 260, y: 60 },
      { x: 255, y: 45 },
    ];
    let ai = 0;
    let zi = 0;
    const interval = setInterval(() => {
      ai = (ai + 1) % AYESHA_WAYPOINTS.length;
      zi = (zi + 1) % ZUBAIR_WAYPOINTS.length;
      setAyeshaPos(AYESHA_WAYPOINTS[ai]);
      setZubairPos(ZUBAIR_WAYPOINTS[zi]);
    }, 2200);
    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "100px 24px 80px",
        overflow: "hidden",
      }}
    >
      {/* ── Background blobs ── */}
      {!prefersReducedMotion && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
          <div className="hero-blob hero-blob-3" />
          {/* grid pattern */}
          <div className="hero-grid-overlay" />
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 800, width: "100%" }}>

        {/* Badge */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--primary-soft)",
            border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            borderRadius: 99,
            padding: "5px 14px",
            marginBottom: 28,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--primary)",
            letterSpacing: "0.01em",
          }}
        >
          <Zap size={11} style={{ flexShrink: 0 }} />
          AI-powered infinite canvas • Now in early access
        </motion.div>

        {/* Headline */}
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(40px, 6vw, 76px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            color: "var(--foreground)",
          }}
        >
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              key={word.text}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.3 + i * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                display: "inline-block",
                color: word.color,
                marginRight: "0.22em",
              }}
            >
              {word.text}
            </motion.span>
          ))}
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          style={{
            margin: "20px auto 0",
            fontSize: "clamp(16px, 2vw, 20px)",
            fontWeight: 400,
            color: "var(--foreground-secondary)",
            lineHeight: 1.6,
            maxWidth: 600,
          }}
        >
          An infinite canvas where your team brainstorms freely — and AI silently converts
          every idea into structured tasks. No manual Jira tickets. Ever.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {/* Magnetic primary CTA */}
          <motion.a
            ref={primaryBtn.ref}
            href="/register"
            onMouseMove={primaryBtn.onMouseMove}
            onMouseLeave={primaryBtn.onMouseLeave}
            animate={{ x: primaryBtn.pos.x, y: primaryBtn.pos.y }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "14px 28px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              background: "var(--primary)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 4px 24px rgba(13,148,136,0.35)",
              letterSpacing: "-0.01em",
              transition: "background 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--primary-hover)";
              e.currentTarget.style.boxShadow = "0 6px 32px rgba(13,148,136,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(13,148,136,0.35)";
            }}
          >
            Start Brainstorming Free
            <ArrowRight size={15} />
          </motion.a>

          {/* Ghost secondary CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              document.querySelector("#time-travel")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 24px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              background: "transparent",
              color: "var(--foreground)",
              border: "1.5px solid var(--border-strong)",
              cursor: "pointer",
              letterSpacing: "-0.01em",
              transition: "border-color 150ms ease, background 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.background = "var(--primary-soft)";
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-strong)";
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--foreground)";
            }}
          >
            Watch Time Travel Demo
          </motion.button>
        </motion.div>

        {/* Proof line */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "var(--foreground-muted)",
          }}
        >
          Free forever for solo use · No credit card required
        </motion.p>
      </div>

      {/* ── Interactive Canvas Mockup ── */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 56,
          width: "100%",
          maxWidth: 780,
          background: isDark ? "#0D1117" : "#F0F0EB",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Window chrome */}
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: isDark ? "#161B22" : "#FFFFFF",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
          <div
            style={{
              flex: 1,
              marginLeft: 8,
              height: 22,
              borderRadius: 6,
              background: "var(--surface-muted)",
              display: "flex",
              alignItems: "center",
              paddingLeft: 10,
              fontSize: 11,
              color: "var(--foreground-muted)",
              maxWidth: 260,
            }}
          >
            ligma.app/canvas/sprint-planning
          </div>
          {/* Presence indicators */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: -4 }}>
            {["#0D9488", "#EA580C"].map((c, i) => (
              <div
                key={c}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: c,
                  border: "2px solid var(--surface)",
                  marginLeft: i > 0 ? -6 : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {i === 0 ? "A" : "Z"}
              </div>
            ))}
            <div style={{ marginLeft: 6, fontSize: 10, color: "var(--foreground-muted)" }}>2 online</div>
          </div>
        </div>

        {/* Canvas area */}
        <div
          style={{
            position: "relative",
            height: 260,
            overflow: "hidden",
            backgroundImage: `radial-gradient(circle, ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        >
          {/* Arrow between sticky notes */}
          <CanvasArrow x1={122} y1={75} x2={250} y2={55} />
          <CanvasArrow x1={150} y1={100} x2={178} y2={166} />

          {/* Sticky notes */}
          {STICKY_NOTES.map((note, i) => (
            <StickyNote
              key={note.id}
              note={note}
              isDark={isDark}
              highlighted={i === 0 && showAiTag}
              aiTag={i === 0 && showAiTag ? "Action Item" : null}
            />
          ))}

          {/* Task chip */}
          <TaskChip visible={showTaskChip} onDone={onTaskChipDone} />

          {/* Fake cursors */}
          {!prefersReducedMotion && (
            <>
              <FakeCursor name="Ayesha" color="#0D9488" x={ayeshaPos.x} y={ayeshaPos.y} />
              <FakeCursor name="Zubair" color="#EA580C" x={zubairPos.x} y={zubairPos.y} />
            </>
          )}

          {/* Typing indicator on note s2 */}
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{
              position: "absolute",
              left: 244,
              top: 73,
              fontSize: 9.5,
              color: "#EA580C",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: "#EA580C" }} />
            <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: "#EA580C", animationDelay: "0.15s" }} />
            <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", background: "#EA580C", animationDelay: "0.3s" }} />
          </motion.div>
        </div>

        {/* Bottom status bar */}
        <div
          style={{
            padding: "6px 16px",
            borderTop: "1px solid var(--border)",
            background: isDark ? "#161B22" : "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 10,
            color: "var(--foreground-muted)",
          }}
        >
          <span>3 nodes · 1 AI classification · 2 tasks generated</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Live · Sprint Planning
          </span>
        </div>
      </motion.div>

      {/* ── Scroll chevron ── */}
      <motion.button
        onClick={scrollDown}
        animate={prefersReducedMotion ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          background: "transparent",
          border: "none",
          color: "var(--foreground-muted)",
          cursor: "pointer",
          padding: 8,
          zIndex: 2,
        }}
        aria-label="Scroll down"
      >
        <ChevronDown size={24} />
      </motion.button>
    </section>
  );
}
