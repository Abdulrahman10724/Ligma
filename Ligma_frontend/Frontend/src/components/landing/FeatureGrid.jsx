import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Cpu,
  Users,
  Lock,
  ScrollText,
  MapPin,
  MessageSquare,
  Zap,
} from "lucide-react";

/* ── Hover tilt card wrapper ── */
function TiltCard({ children, style, glowColor = "var(--primary)", ...props }) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    ref.current.style.boxShadow = `0 12px 40px rgba(0,0,0,0.12), 0 0 0 1.5px ${glowColor}55`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "perspective(600px) rotateY(0) rotateX(0) scale(1)";
    ref.current.style.boxShadow = "var(--shadow-sm)";
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        boxShadow: "var(--shadow-sm)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        overflow: "hidden",
        willChange: "transform",
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── AI Classification large card ── */
function AIClassificationCard() {
  const ITEMS = [
    { text: "Redesign the onboarding checklist", tag: "Action Item", color: "var(--primary)", delay: 0 },
    { text: "Which auth provider do we use?", tag: "Open Question", color: "var(--highlight)", delay: 0.15 },
    { text: "We'll go with Stripe for payments", tag: "Decision", color: "var(--secondary)", delay: 0.3 },
    { text: "See Notion doc for context", tag: "Reference", color: "var(--foreground-muted)", delay: 0.45 },
  ];

  return (
    <TiltCard glowColor="var(--primary)" style={{ padding: 28, gridColumn: "span 2" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: "var(--primary-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--primary)",
          }}
        >
          <Cpu size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
            AI Intent Classification
          </div>
          <div style={{ fontSize: 12, color: "var(--foreground-muted)" }}>Runs silently as your team types</div>
        </div>
      </div>

      {/* Animated classification rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ITEMS.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: item.delay + 0.2, duration: 0.4 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 9,
              background: "var(--surface-muted)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ flex: 1, fontSize: 12.5, color: "var(--foreground-secondary)", lineHeight: 1.35 }}>
              {item.text}
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: item.delay + 0.55, duration: 0.3 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: item.color,
                color: "#fff",
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 99,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              <Zap size={7} />
              {item.tag}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </TiltCard>
  );
}

/* ── Real-time cursors large card ── */
function CursorsCard() {
  const CURSORS = [
    { name: "Ayesha", color: "#0D9488", x: 52, y: 38, status: "Editing" },
    { name: "Zubair", color: "#EA580C", x: 72, y: 62, status: "Viewing" },
    { name: "Sara", color: "#7C3AED", x: 28, y: 72, status: "Moving node" },
  ];

  return (
    <TiltCard glowColor="var(--secondary)" style={{ padding: 28, gridColumn: "span 2" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 9,
            background: "color-mix(in srgb, var(--secondary) 15%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--secondary)",
          }}
        >
          <Users size={16} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)" }}>
            Real-time Multiplayer
          </div>
          <div style={{ fontSize: 12, color: "var(--foreground-muted)" }}>Live cursors · instant sync · Socket.IO</div>
        </div>
      </div>

      {/* Mini canvas with orbiting cursors */}
      <div
        style={{
          position: "relative",
          height: 120,
          borderRadius: 10,
          background: "var(--canvas-background)",
          backgroundImage: "radial-gradient(circle, rgba(100,100,100,0.06) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        {CURSORS.map((c, i) => (
          <motion.div
            key={c.name}
            animate={{
              x: [`${c.x}%`, `${c.x + 12}%`, `${c.x - 8}%`, `${c.x}%`],
              y: [`${c.y}%`, `${c.y - 10}%`, `${c.y + 14}%`, `${c.y}%`],
            }}
            transition={{
              duration: 5 + i * 1.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 10 }}
          >
            <svg width="14" height="18" viewBox="0 0 16 20" fill="none">
              <path d="M0 0L0 14L4 10L7 17L9 16L6 9L11 9Z" fill={c.color} stroke="white" strokeWidth="0.5" />
            </svg>
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 5,
                background: c.color,
                color: "#fff",
                fontSize: 9,
                fontWeight: 600,
                padding: "1px 5px",
                borderRadius: 4,
                whiteSpace: "nowrap",
              }}
            >
              {c.name}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Presence list */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 7 }}>
        {CURSORS.map((c) => (
          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{c.name}</span>
            <span style={{ fontSize: 11, color: "var(--foreground-muted)", flex: 1 }}>{c.status}</span>
          </div>
        ))}
      </div>
    </TiltCard>
  );
}

/* ── Small feature card ── */
function SmallCard({ icon: Icon, title, description, color, visual }) {
  return (
    <TiltCard glowColor={color} style={{ padding: 22 }}>
      <div
        style={{
          width: 34, height: 34, borderRadius: 8,
          background: color + "18",
          display: "flex", alignItems: "center", justifyContent: "center",
          color, marginBottom: 14,
        }}
      >
        <Icon size={15} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", marginBottom: 7 }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5, color: "var(--foreground-secondary)", lineHeight: 1.55, marginBottom: visual ? 14 : 0 }}>
        {description}
      </div>
      {visual}
    </TiltCard>
  );
}

/* ─────────────────────────────────── */
/*  MAIN FEATURE GRID                 */
/* ─────────────────────────────────── */
export default function FeatureGrid() {
  return (
    <section
      id="features"
      style={{ padding: "100px 24px 80px", background: "var(--background)" }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <div className="section-eyebrow">Features</div>
          <h2 className="section-heading">
            Every tool your team needs,{" "}
            <span style={{ color: "var(--primary)" }}>fused into one</span>
          </h2>
          <p className="section-subheading">
            Not another integration. A single surface where canvas, tasks, and AI exist natively.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
          className="feature-bento-grid"
        >
          <AIClassificationCard />
          <CursorsCard />

          <SmallCard
            icon={Lock}
            color="var(--highlight)"
            title="Node-level RBAC"
            description="Set permissions per node, not just per workspace. An Architecture Diagram can be Lead-only while Meeting Notes are open to all."
            visual={
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Lead", "Contributor", "Viewer"].map((role, i) => (
                  <span
                    key={role}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 99,
                      background: i === 0 ? "var(--highlight)" : "var(--surface-muted)",
                      color: i === 0 ? "#fff" : "var(--foreground-secondary)",
                      border: "1px solid",
                      borderColor: i === 0 ? "var(--highlight)" : "var(--border)",
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>
            }
          />

          <SmallCard
            icon={ScrollText}
            color="var(--foreground-muted)"
            title="Append-only Event Log"
            description="Every create, move, resize, edit, and delete is recorded immutably. Full audit trail — always."
            visual={
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
                {[
                  { label: "Node created", time: "09:14", color: "var(--primary)" },
                  { label: "Node moved", time: "09:16", color: "var(--foreground-muted)" },
                  { label: "AI tagged", time: "09:16", color: "var(--highlight)" },
                ].map((ev) => (
                  <div key={ev.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "var(--foreground-secondary)", flex: 1 }}>{ev.label}</span>
                    <span style={{ fontSize: 10, color: "var(--foreground-muted)" }}>{ev.time}</span>
                  </div>
                ))}
              </div>
            }
          />

          <SmallCard
            icon={MapPin}
            color="var(--secondary)"
            title="Presence Zones"
            description="Divide the canvas into named zones — Frontend, Backend, Design — and see who's actively working where right now."
            visual={
              <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                {[
                  { zone: "Frontend", count: 2, color: "var(--primary)" },
                  { zone: "Backend", count: 1, color: "var(--secondary)" },
                  { zone: "Design", count: 1, color: "var(--highlight)" },
                ].map((z) => (
                  <div
                    key={z.zone}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "3px 9px",
                      borderRadius: 6,
                      background: z.color + "18",
                      border: `1px solid ${z.color}40`,
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: z.color }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--foreground-secondary)" }}>
                      {z.zone}
                    </span>
                    <span style={{ fontSize: 10, color: z.color, fontWeight: 700 }}>{z.count}</span>
                  </div>
                ))}
              </div>
            }
          />

          <SmallCard
            icon={MessageSquare}
            color="var(--primary)"
            title="Team Chat + @mentions"
            description="Chat with @mentions and embed canvas-node references inline. Every conversation stays anchored to your canvas."
            visual={
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {[
                  { name: "Ayesha", text: "Linked → [checkout flow node]", color: "#0D9488" },
                  { name: "Zubair", text: "@Sara can you review this?", color: "#EA580C" },
                ].map((m) => (
                  <div key={m.name} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: m.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff" }}>
                      {m.name[0]}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--foreground-secondary)", lineHeight: 1.4 }}>{m.text}</div>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
