// ReplayControls.jsx
// -----------------------------------------------------------------------------
// Phase 13 — Time Travel Replay
//
// Video-player-style transport controls: Beginning · Prev · Play/Pause ·
// Next · End · Speed selector · Exit. Wired directly to replaySlice actions.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronsLeft,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  ChevronsRight,
  X,
  Gauge,
} from "lucide-react";

import {
  play,
  pause,
  stepForward,
  stepBackward,
  seekToStart,
  seekToEnd,
  setSpeed,
  closeReplay,
  selectReplay,
} from "../replaySlice";

const SPEEDS = [0.5, 1, 2, 4];
// Base tick rate at 1x = 700ms per event — feels like a natural narration pace.
const BASE_INTERVAL_MS = 700;

export default function ReplayControls({ onExit }) {
  const dispatch = useDispatch();
  const { events, index, isPlaying, speed, status } = useSelector(selectReplay);
  const total = events.length;
  const atStart = index <= -1;
  const atEnd = total === 0 || index >= total - 1;
  const canControl = status === "ready" && total > 0;

  // ── Auto-play tick loop ────────────────────────────────────────────────────
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!isPlaying || !canControl) return undefined;

    const interval = Math.max(80, Math.floor(BASE_INTERVAL_MS / speed));
    timerRef.current = setInterval(() => {
      dispatch(stepForward());
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isPlaying, speed, canControl, dispatch]);

  // Auto-pause when reaching the last event.
  useEffect(() => {
    if (atEnd && isPlaying) {
      dispatch(pause());
    }
  }, [atEnd, isPlaying, dispatch]);

  const handleExit = () => {
    dispatch(closeReplay());
    onExit?.();
  };

  const btnBase =
    "cursor-pointer inline-flex items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--accent)]/60 hover:bg-[color:var(--bg-primary)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs";

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      {/* Beginning */}
      <button
        type="button"
        onClick={() => dispatch(seekToStart())}
        disabled={!canControl || atStart}
        title="Jump to beginning"
        className={`${btnBase} w-9 h-9`}
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      {/* Previous event */}
      <button
        type="button"
        onClick={() => dispatch(stepBackward())}
        disabled={!canControl || atStart}
        title="Previous event"
        className={`${btnBase} w-9 h-9`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Play / Pause */}
      <button
        type="button"
        onClick={() => dispatch(isPlaying ? pause() : play())}
        disabled={!canControl}
        title={isPlaying ? "Pause" : "Play"}
        className="cursor-pointer inline-flex items-center gap-1.5 justify-center rounded-lg h-9 px-4 bg-gradient-to-r from-[color:var(--accent)] to-purple-500 text-white font-semibold text-xs shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5 fill-current" /> Pause
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" /> {atEnd ? "Restart" : "Play"}
          </>
        )}
      </button>

      {/* Next event */}
      <button
        type="button"
        onClick={() => dispatch(stepForward())}
        disabled={!canControl || atEnd}
        title="Next event"
        className={`${btnBase} w-9 h-9`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* End */}
      <button
        type="button"
        onClick={() => dispatch(seekToEnd())}
        disabled={!canControl || atEnd}
        title="Jump to end"
        className={`${btnBase} w-9 h-9`}
      >
        <ChevronsRight className="w-4 h-4" />
      </button>

      {/* Speed selector */}
      <div className="ml-1 flex items-center gap-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-1 shadow-xs">
        <Gauge className="w-3.5 h-3.5 text-[color:var(--text-secondary)] ml-1" />
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => dispatch(setSpeed(s))}
            disabled={!canControl}
            className={`cursor-pointer text-[11px] font-bold tabular-nums px-2 h-7 rounded-md transition-all ${
              speed === s
                ? "bg-gradient-to-r from-[color:var(--accent)] to-purple-500 text-white shadow"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-primary)]"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Exit */}
      <button
        type="button"
        onClick={handleExit}
        title="Exit Replay"
        className="ml-auto cursor-pointer inline-flex items-center gap-1.5 justify-center rounded-lg h-9 px-3 border border-red-500/40 text-red-500 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/70 font-semibold text-xs transition-all"
      >
        <X className="w-3.5 h-3.5" /> Exit Replay
      </button>
    </div>
  );
}
