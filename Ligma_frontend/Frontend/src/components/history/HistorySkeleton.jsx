import React from "react";

// ponytail: layout skeleton using pulse shimmers for premium loading experience
export default function HistorySkeleton() {
  const skeletons = Array(3).fill(null);

  return (
    <div className="space-y-6 relative ml-3 pl-6 border-l border-[color:var(--border)]">
      {skeletons.map((_, idx) => (
        <div key={idx} className="relative animate-pulse">
          {/* Timeline Dot */}
          <span className="absolute -left-[35px] top-1.5 w-4.5 h-4.5 rounded-full bg-[color:var(--border)] border-2 border-[color:var(--bg-surface)]"></span>

          {/* Card */}
          <div className="bg-[color:var(--bg-surface)] border border-[color:var(--border)]/60 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Icon placeholder */}
                <div className="w-8 h-8 rounded-full bg-[color:var(--border)]/60"></div>
                {/* Title & Description placeholder */}
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-[color:var(--border)] rounded"></div>
                  <div className="h-3 w-28 bg-[color:var(--border)]/60 rounded"></div>
                </div>
              </div>
              {/* Relative Time placeholder */}
              <div className="h-3.5 w-16 bg-[color:var(--border)]/60 rounded"></div>
            </div>
            {/* Metadata panel placeholder */}
            <div className="h-7 w-full bg-[color:var(--bg-primary)]/50 rounded border border-[color:var(--border)]/30"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
