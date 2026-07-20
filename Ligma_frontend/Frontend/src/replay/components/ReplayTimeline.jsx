// ReplayTimeline.jsx
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Professional timeline scrubber. Supports:
//   • Click-to-seek anywhere on the track
//   • Drag anywhere on the track (pointer events for touch + mouse parity)
//   • Keyboard arrow-key navigation when focused
//   • Live tick marks distinguishing NODE vs TASK events
//   • Buttery-smooth movement via requestAnimationFrame throttling
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { seekToIndex, selectReplay } from "../replaySlice";
import { indexToPercent, percentToIndex } from "../replay.service";

export default function ReplayTimeline() {
  const dispatch = useDispatch();
  const { events, index } = useSelector(selectReplay);
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const isDraggingRef = useRef(false);

  const total = events.length;
  const percent = useMemo(() => indexToPercent(index, total), [index, total]);

  const seekFromClientX = useCallback(
    (clientX) => {
      const track = trackRef.current;
      if (!track || !total) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const next = percentToIndex(ratio * 100, total);

      // Throttle Redux writes to the next animation frame so a 120Hz mouse
      // doesn't drown the reducer while dragging across a huge event log.
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        dispatch(seekToIndex(next));
      });
    },
    [dispatch, total]
  );

  const handlePointerDown = (event) => {
    if (!total) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    isDraggingRef.current = true;
    seekFromClientX(event.clientX);
  };

  const handlePointerMove = (event) => {
    if (!isDraggingRef.current) return;
    seekFromClientX(event.clientX);
  };

  const handlePointerUp = (event) => {
    isDraggingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleKeyDown = (event) => {
    if (!total) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      dispatch(seekToIndex(Math.min(total - 1, index + 1)));
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      dispatch(seekToIndex(Math.max(-1, index - 1)));
    } else if (event.key === "Home") {
      event.preventDefault();
      dispatch(seekToIndex(-1));
    } else if (event.key === "End") {
      event.preventDefault();
      dispatch(seekToIndex(total - 1));
    }
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // Sparse tick markers for large logs; render at most ~80 ticks even when
  // there are thousands of events so the track stays visually clean.
  const ticks = useMemo(() => {
    if (total <= 0) return [];
    const step = Math.max(1, Math.ceil(total / 80));
    const out = [];
    for (let i = 0; i < total; i += step) {
      const evt = events[i];
      const isTask = evt?.eventType?.startsWith("TASK_");
      out.push({
        left: ((i + 1) / total) * 100,
        isTask,
        isDeleted: evt?.eventType?.includes("DELETED"),
      });
    }
    return out;
  }, [events, total]);

  return (
    <div className="w-full flex flex-col gap-2 select-none">
      {/* Percentage + counter */}
      <div className="flex items-center justify-between text-[11px] font-medium text-[color:var(--text-secondary)] tabular-nums">
        <span>
          {total > 0 && index >= 0
            ? `Event ${index + 1} of ${total}`
            : total > 0
              ? `Ready · ${total} events`
              : "No events"}
        </span>
        <span>{percent.toFixed(1)}%</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label="Replay timeline"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative w-full h-8 group cursor-pointer focus:outline-none"
      >
        {/* Track bed */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-[color:var(--bg-primary)] border border-[color:var(--border)] overflow-hidden">
          {/* Progress fill (gradient) */}
          <div
            className="h-full bg-gradient-to-r from-[color:var(--accent)] via-indigo-500 to-purple-500 transition-[width] duration-100 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Tick marks */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 pointer-events-none">
          {ticks.map((tick, i) => (
            <span
              key={i}
              className={`absolute top-0 h-full w-px ${
                tick.isDeleted
                  ? "bg-red-500/50"
                  : tick.isTask
                    ? "bg-emerald-500/40"
                    : "bg-white/40 dark:bg-white/20"
              }`}
              style={{ left: `${tick.left}%` }}
            />
          ))}
        </div>

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-[color:var(--accent)] shadow-lg ring-4 ring-[color:var(--accent)]/20 group-hover:scale-110 group-active:scale-125 transition-transform duration-150"
          style={{ left: `${percent}%` }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-[color:var(--text-secondary)] font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-[color:var(--accent)]" /> Node
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Task
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-500" /> Delete
        </span>
      </div>
    </div>
  );
}
