import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Circle, Loader, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  {
    value: "To Do",
    label: "TO DO",
    Icon: Circle,
    iconColor: "text-[color:var(--text-secondary)]",
    bg: "bg-[color:var(--bg-primary)]",
    border: "border border-[color:var(--border)]",
    badgeBg: "bg-[color:var(--bg-primary)]",
    badgeText: "text-[color:var(--text-secondary)]",
    badgeBorder: "border border-[color:var(--border)]",
  },
  {
    value: "In Progress",
    label: "IN PROGRESS",
    Icon: Loader,
    iconColor: "text-blue-400",
    bg: "bg-blue-500",
    border: "border-0",
    badgeBg: "bg-blue-500/20",
    badgeText: "text-blue-400",
    badgeBorder: "border border-blue-500/30",
  },
  {
    value: "Completed",
    label: "COMPLETE",
    Icon: CheckCircle2,
    iconColor: "text-green-400",
    bg: "bg-green-500",
    border: "border-0",
    badgeBg: "bg-green-500/20",
    badgeText: "text-green-400",
    badgeBorder: "border border-green-500/30",
  },
];

export function getStatusConfig(status) {
  return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
}

const DROPDOWN_WIDTH = 180;

export function StatusSelector({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const config = getStatusConfig(value);
  const TriggerIcon = config.Icon;

  // Compute fixed position from trigger bounds
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropH = 130; // approx height of 3 options

    let top = rect.bottom + 4;
    let left = rect.right - DROPDOWN_WIDTH;

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
          "w-5 h-5 rounded-full flex items-center justify-center transition-all outline-none flex-shrink-0",
          config.bg, config.border,
          !disabled && "hover:opacity-80 cursor-pointer",
          disabled && "cursor-default opacity-60"
        )}
      >
        <TriggerIcon className={cn("w-3 h-3", config.iconColor)} strokeWidth={2} />
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
          {STATUS_OPTIONS.map((opt) => {
            const OptIcon = opt.Icon;
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-[color:var(--bg-primary)]", isSel && "bg-[color:var(--bg-primary)]")}
              >
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0", opt.bg, opt.border)}>
                  <OptIcon className={cn("w-2.5 h-2.5", opt.iconColor)} strokeWidth={2} />
                </span>
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide", opt.badgeBg, opt.badgeText, opt.badgeBorder)}>
                  {opt.label}
                </span>
                {isSel && <Check className="w-3 h-3 ml-auto text-[color:var(--accent)]" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  const BadgeIcon = config.Icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide", config.badgeBg, config.badgeText, config.badgeBorder)}>
      <span className={cn("w-3.5 h-3.5 rounded-full flex items-center justify-center", config.bg, config.border)}>
        <BadgeIcon className={cn("w-2 h-2 scale-75", config.iconColor)} strokeWidth={2} />
      </span>
      {config.label}
    </span>
  );
}

export default StatusSelector;
