import { useState, useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

const STATS = [
  { value: 10000, suffix: "+", label: "Nodes replayed", description: "Across all sessions" },
  { value: 3,     suffix: "×",  label: "Faster standups", description: "vs. traditional boards" },
  { value: 98,    suffix: "%",  label: "Zero-ticket rate", description: "Tasks from AI, not clicks" },
  { value: 0,     suffix: "",   label: "Manual Jira imports", description: "Ever needed" },
];

function CountUp({ target, suffix, duration = 1400, startOnView = true }) {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const started = useRef(false);

  useEffect(() => {
    if ((!startOnView || inView) && !started.current) {
      started.current = true;
      if (prefersReducedMotion || target === 0) {
        setCount(target);
        return;
      }
      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [inView, startOnView, target, duration, prefersReducedMotion]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      style={{
        padding: "80px 24px",
        background: "var(--surface-muted)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <div className="section-eyebrow">By the numbers</div>
          <h2
            style={{
              margin: "10px 0 0",
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
            }}
          >
            Built for teams that move fast
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 20,
          }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              style={{
                background: "var(--surface)",
                borderRadius: 14,
                border: "1px solid var(--border)",
                padding: "28px 24px",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(32px, 4vw, 44px)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: "var(--primary)",
                  lineHeight: 1,
                  marginBottom: 10,
                }}
              >
                <CountUp target={stat.value} suffix={stat.suffix} duration={1600} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--foreground-muted)" }}>
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
