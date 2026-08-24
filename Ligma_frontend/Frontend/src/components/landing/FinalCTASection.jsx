import { useState, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

/* ── Mini confetti particle ── */
function ConfettiParticle({ x, y, color, angle, distance }) {
  return (
    <motion.div
      initial={{ x, y, opacity: 1, scale: 1 }}
      animate={{
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        opacity: 0,
        scale: 0.3,
      }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: "fixed",
        width: 8,
        height: 8,
        borderRadius: 2,
        background: color,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}

const CONFETTI_COLORS = [
  "var(--primary)",
  "var(--secondary)",
  "var(--highlight)",
  "#7C3AED",
  "#EC4899",
  "#0891B2",
];

export default function FinalCTASection() {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState([]);
  const primaryBtn = useRef(null);
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });
  const isMobile = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  const onMouseMove = useCallback(
    (e) => {
      if (isMobile || !primaryBtn.current) return;
      const rect = primaryBtn.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setBtnOffset({
        x: (e.clientX - cx) * 0.3,
        y: (e.clientY - cy) * 0.3,
      });
    },
    [isMobile]
  );

  const onMouseLeave = useCallback(() => setBtnOffset({ x: 0, y: 0 }), []);

  const handleCTAClick = (e) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const newParticles = Array.from({ length: 18 }, (_, i) => ({
      id: Date.now() + i,
      x: originX,
      y: originY,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      angle: (i / 18) * Math.PI * 2,
      distance: 80 + Math.random() * 60,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 900);
    // navigate after brief delay
    setTimeout(() => { window.location.href = "/register"; }, 300);
  };

  return (
    <section
      style={{
        padding: "120px 24px",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0D4D4A 0%, #134E4A 40%, #6B2212 100%)",
      }}
    >
      {/* Subtle noise / grid overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(13,148,136,0.25) 0%, transparent 55%), radial-gradient(circle at 80% 50%, rgba(234,88,12,0.18) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* Confetti particles */}
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} />
      ))}

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
        {/* Badge */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 99,
            padding: "5px 14px",
            marginBottom: 28,
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <Sparkles size={11} />
          Early access · Free forever for solo use
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.08 }}
          style={{
            margin: "0 0 18px",
            fontSize: "clamp(34px, 5vw, 58px)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.04em",
            color: "#FFFFFF",
          }}
        >
          Your best ideas deserve{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #2DD4BF, #5EEAD4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            a canvas that thinks
          </span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.16 }}
          style={{
            margin: "0 0 44px",
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.65,
          }}
        >
          Join the teams already turning brainstorms into shipped features — without a single
          manual Jira ticket.
        </motion.p>

        {/* Magnetic CTA */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.24 }}
          style={{ display: "inline-block" }}
        >
          <motion.button
            ref={primaryBtn}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            animate={{ x: btnOffset.x, y: btnOffset.y }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCTAClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 36px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              background: "linear-gradient(135deg, #0D9488, #0F766E)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(13,148,136,0.5), 0 2px 8px rgba(0,0,0,0.2)",
              letterSpacing: "-0.01em",
            }}
          >
            Start Brainstorming Free
            <ArrowRight size={17} />
          </motion.button>
        </motion.div>

        {/* Fine print */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.45)" }}
        >
          No credit card · Works with your existing team · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
