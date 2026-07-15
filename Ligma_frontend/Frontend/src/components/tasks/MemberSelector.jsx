import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { UserCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function initials(member) {
  const name = member?.name || member?.email || "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function hueFromStr(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) % 360;
}

export function MemberAvatar({ member, size = "sm" }) {
  const sz = size === "sm" ? "w-6 h-6 text-[10px]" : "w-7 h-7 text-xs";
  if (!member) return <UserCircle className={cn(size === "sm" ? "w-5 h-5" : "w-6 h-6", "text-[color:var(--text-secondary)]")} />;
  const bg = `hsl(${hueFromStr(member.userId || member.id || member.name || member.email)} 60% 45%)`;
  return (
    <span style={{ background: bg }} className={cn("rounded-full text-white font-semibold flex items-center justify-center flex-shrink-0", sz)} title={member.name || member.email}>
      {initials(member)}
    </span>
  );
}

const DROPDOWN_WIDTH = 200;

export function MemberSelector({ value, members = [], onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const selected = members.find((m) => m.userId === value || m.id === value);

  // Compute fixed position from trigger bounds
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const itemH = 36;
    const dropH = Math.min((members.length + 1) * itemH + 16, 224); // cap at 56 * 4

    let top = rect.bottom + 4;
    let left = rect.left;

    // Clamp to viewport
    if (top + dropH > window.innerHeight - 8) top = rect.top - dropH - 4;
    if (left < 8) left = 8;
    if (left + DROPDOWN_WIDTH > window.innerWidth - 8) left = window.innerWidth - DROPDOWN_WIDTH - 8;

    setPos({ top, left });
  }, [open, members.length]);

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
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded transition-colors outline-none",
          !disabled && "hover:bg-[color:var(--bg-primary)] cursor-pointer",
          disabled && "cursor-default opacity-60"
        )}
        title={selected?.name || selected?.email || "Assign member"}
      >
        <MemberAvatar member={selected} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: DROPDOWN_WIDTH,
            maxHeight: 224,
            zIndex: 9999,
          }}
          className="bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg shadow-xl py-1 overflow-y-auto"
        >
          {/* Unassign */}
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-[color:var(--bg-primary)]", !value && "bg-[color:var(--bg-primary)]")}
          >
            <UserCircle className="w-5 h-5 flex-shrink-0 text-[color:var(--text-secondary)]" />
            <span className="flex-1 text-left text-[color:var(--text-secondary)]">Unassigned</span>
            {!value && <Check className="w-3 h-3 text-[color:var(--accent)]" />}
          </button>

          {members.length > 0 && <div className="h-px bg-[color:var(--border)] my-1" />}

          {members.map((m) => {
            const id = m.userId || m.id;
            const isSel = id === value;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { onChange(id); setOpen(false); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-[color:var(--bg-primary)]", isSel && "bg-[color:var(--bg-primary)]")}
              >
                <MemberAvatar member={m} />
                <div className="flex flex-col flex-1 min-w-0 text-left">
                  <span className="truncate font-medium text-[color:var(--text-primary)]">{m.name || m.email}</span>
                  {m.name && m.email && <span className="truncate text-[10px] text-[color:var(--text-secondary)]">{m.email}</span>}
                </div>
                {isSel && <Check className="w-3 h-3 flex-shrink-0 text-[color:var(--accent)]" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export default MemberSelector;
