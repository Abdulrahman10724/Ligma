// ReplayOverlay.jsx
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Read-only banner shown while replay is active. Blocks pointer events on the
// canvas from all four edges except through the explicit control surfaces, and
// makes the replay mode visually unmistakable so users cannot mistake it for
// the live canvas.
// -----------------------------------------------------------------------------

import { Eye, Lock } from "lucide-react";

export default function ReplayOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      {/* Glassmorphic border ring — signals a distinct replay context */}
      <div className="absolute inset-0 ring-2 ring-inset ring-[color:var(--accent)]/25 rounded-none" />

      {/* Top badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[color:var(--accent)]/50 bg-[color:var(--bg-surface)]/85 backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[color:var(--accent)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--accent)]" />
          </span>
          <Eye className="w-3.5 h-3.5 text-[color:var(--accent)]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-primary)]">
            Replay Mode
          </span>
          <span className="text-[10px] text-[color:var(--text-secondary)] flex items-center gap-1 border-l border-[color:var(--border)] pl-2 ml-1">
            <Lock className="w-3 h-3" /> Read Only
          </span>
        </div>
      </div>

      {/* Subtle corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-[color:var(--accent)]/40 rounded-tl-md" />
      <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-[color:var(--accent)]/40 rounded-tr-md" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-[color:var(--accent)]/40 rounded-bl-md" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-[color:var(--accent)]/40 rounded-br-md" />
    </div>
  );
}
