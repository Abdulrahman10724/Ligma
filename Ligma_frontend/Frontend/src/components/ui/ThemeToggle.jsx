import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

const OPTIONS = [
  { value: "light",  label: "Light",  Icon: Sun },
  { value: "dark",   label: "Dark",   Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/**
 * ThemeToggle — segmented Light / Dark / System selector.
 * Uses next-themes useTheme hook. Persists to localStorage automatically.
 * variant="segment" (default) renders a pill segmented control.
 * variant="icon" renders a single cycling icon button.
 */
export default function ThemeToggle({ variant = "segment", className = "" }) {
  const { theme, setTheme } = useTheme();

  if (variant === "icon") {
    const current = OPTIONS.find((o) => o.value === theme) || OPTIONS[0];
    const next    = OPTIONS[(OPTIONS.indexOf(current) + 1) % OPTIONS.length];
    const Icon    = current.Icon;
    return (
      <button
        type="button"
        onClick={() => setTheme(next.value)}
        title={`Switch to ${next.label} mode`}
        aria-label={`Switch to ${next.label} mode`}
        className={`inline-flex cursor-pointer items-center justify-center w-8 h-8 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground-secondary)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--foreground)] transition-colors duration-150 ${className}`}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={`inline-flex rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-0.5 gap-0.5 ${className}`}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            title={label}
            className={[
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
              "cursor-pointer",
              isActive
                ? "bg-[color:var(--surface-raised)] text-[color:var(--foreground)] shadow-[var(--shadow-sm)]"
                : "text-[color:var(--foreground-muted)] hover:text-[color:var(--foreground)]",
            ].join(" ")}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
