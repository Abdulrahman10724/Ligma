import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { CheckSquare, GitBranch, Info, Link2, Check, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const TYPE_OPTIONS = [
  { value: "Action", label: "Action", Icon: CheckSquare, color: "text-[color:var(--primary)]" },
  { value: "Decision", label: "Decision", Icon: GitBranch, color: "text-[color:var(--secondary)]" },
  { value: "Information", label: "Information", Icon: Info, color: "text-[color:var(--warning)]" },
  { value: "Reference", label: "Reference", Icon: Link2, color: "text-[color:var(--foreground-secondary)]" },
];

export function getTypeConfig(value) {
  return TYPE_OPTIONS.find((t) => t.value === value) || TYPE_OPTIONS[0];
}

const DROPDOWN_WIDTH = 180;

// Lets a task be manually reassigned to a different category
// (Action / Decision / Information / Reference) — e.g. correcting an
// AI misclassification. Purely changes `task.type` via onChange; the
// task then re-appears under whichever tab matches its new type.
export function TypeSelector({ value, onChange, disabled, compact = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const config = getTypeConfig(value);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropH = TYPE_OPTIONS.length * 36 + 16;

    let top = rect.bottom + 4;
    let left = rect.left;

    if (top + dropH > window.innerHeight - 8) top = rect.top - dropH - 4;
    if (left < 8) left = 8;
    if (left + DROPDOWN_WIDTH > window.innerWidth - 8) left = window.innerWidth - DROPDOWN_WIDTH - 8;

    setPos({ top, left });
  }, [open]);

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
        onClick={(e) => { e.stopPropagation(); !disabled && setOpen((v) => !v); }}
        title="Move to a different category"
        className={cn(
          "flex items-center gap-1 rounded transition-colors outline-none cursor-pointer",
          compact
            ? "w-6 h-6 justify-center text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-primary)]"
            : "h-7 px-2 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--surface-hover)]",
          disabled && "cursor-default opacity-50"
        )}
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
        {!compact && <span>Move</span>}
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
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
            Move to
          </div>
          {TYPE_OPTIONS.map((opt) => {
            const OptIcon = opt.Icon;
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSel) onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left cursor-pointer",
                  "hover:bg-[color:var(--bg-primary)]",
                  isSel && "bg-[color:var(--bg-primary)]"
                )}
              >
                <OptIcon className={cn("w-3.5 h-3.5 flex-shrink-0", opt.color)} />
                <span className="flex-1 text-[color:var(--text-primary)]">{opt.label}</span>
                {isSel && <Check className="w-3 h-3 text-[color:var(--accent)]" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export default TypeSelector;