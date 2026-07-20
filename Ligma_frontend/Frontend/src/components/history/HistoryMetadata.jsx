import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

// ponytail: expandable metadata panel for custom details and raw payload display
export default function HistoryMetadata({ event }) {
  const [isOpen, setIsOpen] = useState(false);
  const payload = event?.payload;

  if (!payload || Object.keys(payload).length === 0) return null;

  // Check if we have standard keys to build friendly displays
  const hasPositionChange = payload.previousPosition || payload.nextPosition;
  const hasDataChange = payload.previousData || payload.nextData;
  const hasFieldsChange = payload.previousFields || payload.nextFields;
  const hasPermissionChange = payload.previousAllowedUserIds || payload.nextAllowedUserIds;

  const renderContent = () => {
    if (hasPositionChange) {
      const prev = payload.previousPosition || { x: 0, y: 0 };
      const next = payload.nextPosition || { x: 0, y: 0 };
      return (
        <div className="grid grid-cols-2 gap-4 text-xs font-mono text-[color:var(--text-secondary)]">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Previous Position</span>
            <div className="text-[color:var(--text-primary)] bg-[color:var(--bg-primary)] px-2 py-1.5 rounded border border-[color:var(--border)]">
              X: {Math.round(prev.x)}, Y: {Math.round(prev.y)}
            </div>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">New Position</span>
            <div className="text-[color:var(--text-primary)] bg-[color:var(--bg-primary)] px-2 py-1.5 rounded border border-[color:var(--border)] font-semibold">
              X: {Math.round(next.x)}, Y: {Math.round(next.y)}
            </div>
          </div>
        </div>
      );
    }

    if (hasPermissionChange) {
      const prevIds = payload.previousAllowedUserIds || [];
      const nextIds = payload.nextAllowedUserIds || [];
      return (
        <div className="space-y-3 text-xs">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Previous Allowed Users</span>
            <div className="flex flex-wrap gap-1.5">
              {prevIds.length > 0 ? (
                prevIds.map((id) => (
                  <span key={id} className="font-mono bg-[color:var(--bg-primary)] border border-[color:var(--border)] px-1.5 py-0.5 rounded text-[color:var(--text-secondary)]">
                    {id.slice(-6)}
                  </span>
                ))
              ) : (
                <span className="text-zinc-500 italic">Everyone (Public)</span>
              )}
            </div>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">New Allowed Users</span>
            <div className="flex flex-wrap gap-1.5">
              {nextIds.length > 0 ? (
                nextIds.map((id) => (
                  <span key={id} className="font-mono bg-[color:var(--bg-primary)] border border-[color:var(--border)] px-1.5 py-0.5 rounded text-[color:var(--accent)] font-semibold">
                    {id.slice(-6)}
                  </span>
                ))
              ) : (
                <span className="text-[color:var(--success)] font-semibold">Everyone (Public)</span>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (hasFieldsChange || hasDataChange) {
      const prevObj = payload.previousFields || payload.previousData || {};
      const nextObj = payload.nextFields || payload.nextData || {};
      const keys = [...new Set([...Object.keys(prevObj), ...Object.keys(nextObj)])];

      return (
        <div className="space-y-3 text-xs">
          {keys.map((key) => {
            const prevVal = prevObj[key];
            const nextVal = nextObj[key];

            const formatVal = (v) => {
              if (v === null || v === undefined) return "None";
              if (typeof v === "object") return JSON.stringify(v);
              return String(v);
            };

            return (
              <div key={key} className="border-b border-[color:var(--border)]/50 pb-2 last:border-0 last:pb-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-secondary)] mb-1">
                  Field: {key}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-[color:var(--bg-primary)]/50 p-2 rounded border border-[color:var(--border)]/40 text-red-500 dark:text-red-400 line-through truncate">
                    {formatVal(prevVal)}
                  </div>
                  <div className="bg-[color:var(--bg-primary)] p-2 rounded border border-[color:var(--border)] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                    {formatVal(nextVal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Default fallback: display formatted JSON
    return (
      <pre className="text-[11px] font-mono bg-[color:var(--bg-primary)] text-[color:var(--text-secondary)] p-3 rounded-md border border-[color:var(--border)] overflow-x-auto max-h-48 leading-relaxed">
        {JSON.stringify(payload, null, 2)}
      </pre>
    );
  };

  return (
    <div className="mt-2 border border-[color:var(--border)]/40 rounded-lg overflow-hidden bg-[color:var(--bg-primary)]/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-surface)] transition-all cursor-pointer select-none"
      >
        <span>Details & Payload</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180 text-[color:var(--accent)]" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="p-4 border-t border-[color:var(--border)]/30 bg-[color:var(--bg-surface)]/30 animate-in fade-in slide-in-from-top-1 duration-200">
          {renderContent()}
        </div>
      )}
    </div>
  );
}
