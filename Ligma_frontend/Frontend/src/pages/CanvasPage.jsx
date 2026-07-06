import React from "react";

export default function CanvasPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[color:var(--bg-primary)] p-4 text-center">
      <div className="max-w-md p-6 bg-[color:var(--bg-surface)] border border-[color:var(--border)] rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-2 text-[color:var(--accent)]">Infinite Canvas</h2>
        <p className="text-sm text-[color:var(--text-secondary)] mb-4">
          Visual brainstorming canvas powered by React Konva and Socket.IO.
        </p>
        <div className="flex gap-2 justify-center">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-[color:var(--sticky-yellow)] text-amber-900 border border-amber-200">Sticky Note</span>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-[color:var(--sticky-pink)] text-pink-900 border border-pink-200">Text Block</span>
          <span className="text-xs font-semibold px-2 py-1 rounded bg-[color:var(--sticky-blue)] text-blue-900 border border-blue-200">Shape</span>
        </div>
        <p className="text-xs text-[color:var(--text-secondary)] mt-4">Canvas functionality will be implemented in Phase 5.</p>
      </div>
    </div>
  );
}
