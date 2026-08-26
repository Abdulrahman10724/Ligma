import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Time Travel", href: "#time-travel" },
  { label: "Pricing", href: "#pricing" },
];

/* Tiny connected-nodes brand mark */
function BrandMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <line x1="4" y1="4" x2="14" y2="14" className="brand-line" strokeWidth="1.5" />
      <line x1="24" y1="4" x2="14" y2="14" className="brand-line" strokeWidth="1.5" />
      <line x1="14" y1="14" x2="14" y2="24" className="brand-line" strokeWidth="1.5" />
      <line x1="4" y1="4" x2="24" y2="4" className="brand-line" strokeWidth="1.5" />
      <circle cx="4" cy="4" r="3" className="brand-node" />
      <circle cx="24" cy="4" r="3" className="brand-node" />
      <circle cx="14" cy="14" r="3.5" className="brand-node" />
      <circle cx="14" cy="24" r="2.5" className="brand-node" />
    </svg>
  );
}

export default function LandingNav() {
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  const scrollTo = (e, href) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: "background 250ms ease, box-shadow 250ms ease, border-color 250ms ease",
        background: scrolled
          ? "color-mix(in srgb, var(--background) 90%, transparent)"
          : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        boxShadow: scrolled ? "var(--shadow-sm)" : "none",
      }}
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <BrandMark size={28} />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.02em",
              color: "var(--foreground)",
            }}
          >
            Scrybe
          </span>
        </a>

        {/* Desktop nav links */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 4 }}
          className="landing-nav-links"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => scrollTo(e, link.href)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                color: "var(--foreground-secondary)",
                textDecoration: "none",
                transition: "color 150ms ease, background 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
                e.currentTarget.style.background = "var(--surface-muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--foreground-secondary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side: theme + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {mounted && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--foreground-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </motion.button>
          )}

          <motion.a
            href="/register"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="landing-nav-cta"
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              textDecoration: "none",
              transition: "background 150ms ease",
              letterSpacing: "-0.01em",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--primary)")}
          >
            Get Started Free
          </motion.a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="landing-mobile-toggle"
            style={{
              display: "none",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--foreground)",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              padding: "12px 24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "var(--foreground-secondary)",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/register"
              style={{
                marginTop: 8,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Get Started Free
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
