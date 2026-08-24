import { motion, useReducedMotion } from "motion/react";

const PRESENCE_USERS = [
  { name: "Ayesha K.", initials: "AK", color: "#0D9488", status: "is typing…" },
  { name: "Zubair A.", initials: "ZA", color: "#EA580C", status: "moved a node" },
  { name: "Sara M.",  initials: "SM", color: "#7C3AED", status: "is viewing" },
  { name: "Omar F.",  initials: "OF", color: "#0891B2", status: "added a note" },
  { name: "Lena T.",  initials: "LT", color: "#BE185D", status: "is typing…" },
  { name: "Dev P.",   initials: "DP", color: "#16A34A", status: "tagged a node" },
  { name: "Nadia R.", initials: "NR", color: "#B45309", status: "joined the canvas" },
  { name: "Finn O.",  initials: "FO", color: "#6D28D9", status: "moved a node" },
];

/* Duplicate for seamless loop */
const ITEMS = [...PRESENCE_USERS, ...PRESENCE_USERS];

function PresenceBubble({ user, index }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 99,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        flexShrink: 0,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Avatar with presence ring */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: user.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {user.initials}
        </div>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            border: `1.5px solid ${user.color}`,
            pointerEvents: "none",
          }}
        />
        {/* Online dot */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#22c55e",
            border: "2px solid var(--surface)",
          }}
        />
      </div>

      {/* Info */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>
          {user.name}
        </div>
        <div style={{ fontSize: 10.5, color: user.color, fontWeight: 500, whiteSpace: "nowrap" }}>
          {user.status}
        </div>
      </div>
    </motion.div>
  );
}

export default function PresenceStrip() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      style={{
        padding: "60px 0",
        background: "var(--surface-muted)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* Label */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--foreground-muted)",
          }}
        >
          Your team, always in the room
        </span>
      </div>

      {/* Marquee */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <motion.div
          animate={prefersReducedMotion ? {} : { x: [0, "-50%"] }}
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            display: "flex",
            gap: 12,
            width: "max-content",
          }}
        >
          {ITEMS.map((user, i) => (
            <PresenceBubble key={`${user.name}-${i}`} user={user} index={i % PRESENCE_USERS.length} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
