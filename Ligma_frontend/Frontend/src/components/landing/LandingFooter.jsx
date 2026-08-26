import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, ExternalLink } from "lucide-react";

function BrandMark({ size = 24 }) {
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

const LINKS = {
  Product: ["Features", "How It Works", "Time Travel", "Pricing"],
  Company:  ["About", "Blog", "Careers", "Press"],
  Resources: ["Docs", "Changelog", "Status", "Security"],
  Legal:    ["Privacy", "Terms", "Cookie Policy"],
};

const TECH_STACK = ["React", "Vite", "Socket.IO", "MongoDB", "OpenRouter AI"];

export default function LandingFooter() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <footer
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        padding: "56px 24px 32px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Top row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(4, auto)",
            gap: 40,
            marginBottom: 48,
            flexWrap: "wrap",
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div style={{ maxWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <BrandMark size={26} />
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  color: "var(--foreground)",
                }}
              >
                Scrybe
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--foreground-muted)", lineHeight: 1.65, margin: 0 }}>
              The infinite canvas where your team's best ideas become shipped features — automatically.
            </p>
            {/* Tech stack */}
            <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TECH_STACK.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "var(--surface-muted)",
                    color: "var(--foreground-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--foreground-muted)",
                  marginBottom: 14,
                }}
              >
                {category}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    style={{
                      fontSize: 13.5,
                      color: "var(--foreground-secondary)",
                      textDecoration: "none",
                      transition: "color 130ms ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--foreground-secondary)")}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }} />

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--foreground-muted)" }}>
            © {new Date().getFullYear()} Scrybe. Built with care.
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* GitHub link */}
            <a
              href="#"
              aria-label="GitHub"
              style={{
                width: 32,
                height: 32,
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "var(--surface-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--foreground-muted)",
                textDecoration: "none",
                transition: "color 130ms ease, border-color 130ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--foreground)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--foreground-muted)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <ExternalLink size={14} />
            </a>

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: "var(--surface-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--foreground-muted)",
                  cursor: "pointer",
                  transition: "color 130ms ease",
                }}
              >
                {resolvedTheme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
