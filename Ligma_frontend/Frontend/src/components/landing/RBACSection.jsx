import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Lock, Unlock, Shield, Eye, Edit3 } from "lucide-react";

const ROLES = [
  {
    id: "lead",
    label: "Lead",
    description: "Full read/write + permission management",
    icon: Shield,
    color: "var(--primary)",
  },
  {
    id: "contributor",
    label: "Contributor",
    description: "Read + write within allowed nodes",
    icon: Edit3,
    color: "var(--secondary)",
  },
  {
    id: "viewer",
    label: "Viewer",
    description: "Read-only access to permitted nodes",
    icon: Eye,
    color: "var(--foreground-muted)",
  },
];

const LOCK_STATES = [
  { locked: true,  label: "Lead only",          subLabel: "Contributors can't edit this node" },
  { locked: false, label: "Open to Contributors", subLabel: "All team members can edit" },
];

export default function RBACSection() {
  const prefersReducedMotion = useReducedMotion();
  const [lockState, setLockState] = useState(0);
  const [activeRole, setActiveRole] = useState("lead");

  /* Toggle lock every 3s */
  useEffect(() => {
    if (prefersReducedMotion) return;
    const t = setInterval(() => {
      setLockState((s) => (s + 1) % LOCK_STATES.length);
      setActiveRole((r) =>
        r === "lead" ? "contributor" : r === "contributor" ? "viewer" : "lead"
      );
    }, 3000);
    return () => clearInterval(t);
  }, [prefersReducedMotion]);

  const current = LOCK_STATES[lockState];

  return (
    <section
      style={{ padding: "100px 24px 80px", background: "var(--background)" }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          gap: 56,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          style={{ flex: "1 1 320px" }}
        >
          <div className="section-eyebrow">Node-level RBAC</div>
          <h2
            style={{
              margin: "10px 0 16px",
              fontSize: "clamp(26px, 3.5vw, 36px)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              color: "var(--foreground)",
              lineHeight: 1.15,
            }}
          >
            Permissions per node,{" "}
            <span style={{ color: "var(--highlight)" }}>not per workspace</span>
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "var(--foreground-secondary)",
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            Lock an Architecture Diagram to Leads only, while keeping Meeting Notes
            open to all Contributors — on the same canvas, at the same time.
          </p>

          {/* Role badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isActive = role.id === activeRole;
              return (
                <motion.div
                  key={role.id}
                  animate={{
                    borderColor: isActive ? role.color : "var(--border)",
                    background: isActive ? role.color + "10" : "var(--surface)",
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1.5px solid",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveRole(role.id)}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: role.color + "20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: role.color,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                      {role.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--foreground-muted)" }}>
                      {role.description}
                    </div>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="role-dot"
                      style={{
                        marginLeft: "auto",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: role.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right: animated lock node visual */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
          style={{ flex: "1 1 260px", display: "flex", justifyContent: "center" }}
        >
          <div
            style={{
              width: 280,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center",
            }}
          >
            {/* The node */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lockState}
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: "100%",
                  background: "var(--surface)",
                  border: `2px solid ${current.locked ? "var(--highlight)" : "var(--primary)"}`,
                  borderRadius: 14,
                  padding: "20px 20px 18px",
                  boxShadow: current.locked
                    ? "0 4px 20px rgba(217,119,6,0.18)"
                    : "0 4px 20px rgba(13,148,136,0.18)",
                  textAlign: "center",
                }}
              >
                {/* Lock icon */}
                <motion.div
                  animate={{ rotate: current.locked ? [0, -8, 8, 0] : [0, 0] }}
                  transition={{ duration: 0.4 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: current.locked ? "var(--highlight-soft)" : "var(--primary-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    color: current.locked ? "var(--highlight)" : "var(--primary)",
                  }}
                >
                  {current.locked ? <Lock size={22} /> : <Unlock size={22} />}
                </motion.div>

                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>
                  Architecture Diagram
                </div>
                <div style={{ fontSize: 12, color: "var(--foreground-muted)", marginBottom: 14, lineHeight: 1.4 }}>
                  System design for Auth microservice
                </div>

                {/* Permission badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 99,
                    background: current.locked ? "var(--highlight-soft)" : "var(--primary-soft)",
                    color: current.locked ? "var(--highlight)" : "var(--primary)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  {current.locked ? <Lock size={10} /> : <Unlock size={10} />}
                  {current.label}
                </div>
              </motion.div>
            </AnimatePresence>

            <p style={{ fontSize: 12, color: "var(--foreground-muted)", textAlign: "center", lineHeight: 1.5 }}>
              {current.subLabel}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
