import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, TrendingUp, Minus, TrendingDown, Flag, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PRIORITY_OPTIONS = [
  { value: "Urgent", label: "Urgent", color: "text-red-400",    dotColor: "bg-red-500",    Icon: AlertTriangle },
  { value: "High",   label: "High",   color: "text-orange-400", dotColor: "bg-orange-500", Icon: TrendingUp   },
  { value: "Medium", label: "Medium", color: "text-yellow-400", dotColor: "bg-yellow-500", Icon: Minus        },
  { value: "Low",    label: "Low",    color: "text-blue-400",   dotColor: "bg-blue-500",   Icon: TrendingDown },
  { value: null,     label: "None",   color: "text-[color:var(--text-secondary)]", dotColor: "bg-[color:var(--border)]", Icon: Flag },
];

export function getPriorityConfig(value) {
  return PRIORITY_OPTIONS.find((p) => p.value === value) || PRIORITY_OPTIONS[4];
}

const DROPDOWN_WIDTH = 160;

export function PrioritySelector({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const config = getPriorityConfig(value);
  const Icon = config.Icon;

  // Compute fixed position from trigger bounds
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropH = 180; // approx height with 4 options + divider + clear

    let top = rect.bottom + 4;
    let left = rect.left;

    // Clamp to viewport
    if (top + dropH > window.innerHeight - 8) top = rect.top - dropH - 4;
    if (left < 8) left = 8;
    if (left + DROPDOWN_WIDTH > window.innerWidth - 8) left = window.innerWidth - DROPDOWN_WIDTH - 8;

    setPos({ top, left });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        title={config.label}
        className={cn(
          "flex items-center gap-1.5 h-7 px-2 rounded text-xs font-medium transition-colors outline-none",
          "hover:bg-[color:var(--bg-primary)] cursor-pointer",
          disabled && "cursor-default opacity-60"
        )}
      >
        <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
        {value && <span className={config.color}>{config.label}</span>}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: DROPDOWN_WIDTH,
            zIndex: 9999,
          }}
          className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg shadow-xl py-1"
        >
          {PRIORITY_OPTIONS.filter((o) => o.value !== null).map((opt) => {
            const OIcon = opt.Icon;
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-[color:var(--bg-primary)]", isSel && "bg-[color:var(--bg-primary)]")}
              >
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", opt.dotColor)} />
                <OIcon className={cn("w-3.5 h-3.5 flex-shrink-0", opt.color)} />
                <span className={cn("flex-1 text-left", opt.color)}>{opt.label}</span>
                {isSel && <Check className="w-3 h-3 text-[color:var(--accent)]" />}
              </button>
            );
          })}
          <div className="h-px bg-[color:var(--border)] my-1" />
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-primary)]", !value && "bg-[color:var(--bg-primary)]")}
          >
            <Flag className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">Clear priority</span>
            {!value && <Check className="w-3 h-3 text-[color:var(--accent)]" />}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export default PrioritySelector;
