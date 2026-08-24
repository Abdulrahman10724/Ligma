import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { StickyNote, Cpu, ArrowRight, Clock } from "lucide-react";

/* ── One sticky-note lookalike for step illustrations ── */
function MiniNote({ color, text, tag, tagColor }) {
  return (
    <div
      style={{
        background: color,
        borderRadius: 10,
        padding: "12px 14px",
        width: 160,
        boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
        flexShrink: 0,
      }}
    >
      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.45, minHeight: 36 }}>{text}</div>
      {tag && (
        <div
          style={{
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: tagColor || "var(--primary)",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 99,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {tag}
        </div>
      )}
    </div>
  );
}

/* ── Mini task card ── */
function MiniTask({ title, priority, assignee, color }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: "10px 12px",
        width: 180,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.35 }}>
        {title}
      </div>
      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            padding: "1px 6px",
            borderRadius: 4,
            background: color + "22",
            color,
          }}
        >
          {priority}
        </span>
        <span style={{ fontSize: 9, color: "var(--foreground-muted)", fontWeight: 500 }}>{assignee}</span>
      </div>
    </div>
  );
}

/* ── Interactive mini timeline scrubber ── */
function MiniScrubber() {
  const trackRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const NODES = [
    { label: "Note added", type: "node", color: "var(--primary)" },
    { label: "AI tagged", type: "ai", color: "var(--highlight)" },
    { label: "Task created", type: "task", color: "var(--secondary)" },
    { label: "Node moved", type: "node", color: "var(--primary)" },
    { label: "Comment", type: "chat", color: "var(--foreground-muted)" },
  ];

  const handleTrackClick = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    void pct; // visual only — interactive version in TimeTravelSection
  };

  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      {/* Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        style={{
          position: "relative",
          height: 6,
          background: "var(--surface-muted)",
          borderRadius: 3,
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        <motion.div
          animate={prefersReduced ? {} : { width: ["0%", "75%"] }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            background: "var(--primary)",
            borderRadius: 3,
          }}
        />
        {/* Tick marks */}
        {NODES.map((n, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(i / (NODES.length - 1)) * 100}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: n.color,
              border: "2px solid var(--surface)",
              cursor: "pointer",
            }}
            title={n.label}
          />
        ))}
      </div>
      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {NODES.map((n, i) => (
          <div key={i} style={{ fontSize: 8.5, color: "var(--foreground-muted)", textAlign: "center", maxWidth: 48 }}>
            {n.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── One step panel ── */
function StepPanel({ number, icon: Icon, title, description, visual, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        padding: "48px 40px",
        background: "var(--surface)",
        borderRadius: 16,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        flex: "0 0 min(420px, 85vw)",
        scrollSnapAlign: "start",
      }}
    >
      {/* Step number + icon */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: color + "18",
            border: `1.5px solid ${color}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color,
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--foreground-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Step {number}
        </div>
      </div>

      {/* Text */}
      <div>
        <h3
          style={{
            margin: "0 0 10px",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--foreground)",
          }}
        >
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: 14.5, color: "var(--foreground-secondary)", lineHeight: 1.65 }}>
          {description}
        </p>
      </div>

      {/* Visual */}
      <div
        style={{
          background: "var(--surface-muted)",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 140,
        }}
      >
        {visual}
      </div>
    </motion.div>
  );
}

/* ── AI scan overlay animation ── */
function AIScanVisual() {
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <MiniNote
        color="var(--sticky-yellow)"
        text="Redesign the onboarding checklist"
        tag={null}
      />
      {/* Scan line */}
      <motion.div
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
          opacity: 0.7,
          borderRadius: 1,
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
      {/* Tag pop-in */}
      <motion.div
        animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }}
        transition={{ duration: 2.4, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
        style={{
          position: "absolute",
          bottom: -16,
          left: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "var(--primary)",
          color: "#fff",
          fontSize: 9,
          fontWeight: 700,
          padding: "3px 10px",
          borderRadius: 99,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
        }}
      >
        ✦ AI: Action Item detected
      </motion.div>
    </div>
  );
}

/* ── Canvas → Task arrow visual ── */
function CanvasToTaskVisual() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", justifyContent: "center" }}>
      <MiniNote color="var(--sticky-green)" text="Write API docs for auth endpoints" tag="Action Item" tagColor="var(--primary)" />
      <motion.div
        animate={{ x: [-4, 4, -4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ color: "var(--primary)", flexShrink: 0 }}
      >
        <ArrowRight size={22} />
      </motion.div>
      <MiniTask
        title="Write API docs for auth endpoints"
        priority="Medium"
        assignee="→ Zubair"
        color="var(--primary)"
      />
    </div>
  );
}

/* ═════════════════════════════════════ */
/*  MAIN HOW IT WORKS SECTION           */
/* ═════════════════════════════════════ */
export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const headerY = useTransform(scrollYProgress, [0, 0.3], [24, 0]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  const STEPS = [
    {
      number: 1,
      icon: StickyNote,
      color: "var(--primary)",
      title: "Brainstorm on an infinite canvas",
      description:
        "Drop sticky notes, draw shapes, write freely. Every object is synced live across your team — no lag, no conflict, no merge headaches.",
      visual: (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <MiniNote color="var(--sticky-yellow)" text="What if we skip the onboarding wizard?" />
          <MiniNote color="var(--sticky-blue)" text="Use progressive disclosure instead" />
        </div>
      ),
    },
    {
      number: 2,
      icon: Cpu,
      color: "var(--highlight)",
      title: "AI reads intent silently",
      description:
        "As your team types, LIGMA's AI classifies each note: Action Item, Decision, Open Question, or Reference — without interrupting your flow.",
      visual: <AIScanVisual />,
    },
    {
      number: 3,
      icon: ArrowRight,
      color: "var(--secondary)",
      title: "Action Items become tasks automatically",
      description:
        "Every node tagged as an Action Item instantly becomes a task on the board with status, priority, and assignee. Zero manual ticket creation.",
      visual: <CanvasToTaskVisual />,
    },
    {
      number: 4,
      icon: Clock,
      color: "var(--foreground-muted)",
      title: "Replay the whole session anytime",
      description:
        "Scrub back to any moment in your team's thinking. Watch every move, note, and decision rebuild itself in real-time. Nothing is ever lost.",
      visual: <MiniScrubber />,
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      style={{
        padding: "100px 0 80px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <motion.div
        style={{ y: headerY, opacity: headerOpacity }}
        className="section-header-motion"
      >
        <div style={{ textAlign: "center", padding: "0 24px", marginBottom: 56 }}>
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-heading">
            From chaos to clarity,{" "}
            <span style={{ color: "var(--primary)" }}>automatically</span>
          </h2>
          <p className="section-subheading">
            Four steps that replace your whiteboard, Jira, and three Slack channels.
          </p>
        </div>
      </motion.div>

      {/* Horizontal scroll strip */}
      <div
        style={{
          display: "flex",
          gap: 20,
          padding: "8px 24px 24px",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          maxWidth: 1400,
          margin: "0 auto",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {STEPS.map((step) => (
          <StepPanel key={step.number} {...step} />
        ))}
      </div>
    </section>
  );
}
