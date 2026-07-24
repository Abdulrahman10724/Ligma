import { useEffect, useRef } from "react";

import useSocket from "./useSocket";

/**
 * Throttled (~120ms) cursor broadcast that piggybacks on the existing
 * `workspace:cursor` event. The server then maps the coordinate to the
 * containing zone and rebroadcasts `zone:presence`. Viewers with no canvas
 * access still trigger updates because the cursor event itself has no
 * RBAC block. If you disable broadcast, call .stop() on the returned
 * function.
 */
export function useZoneCursorBroadcast({ workspaceId, enabled = true } = {}) {
  const { emit, isConnected } = useSocket({ workspaceId });
  const lastSentRef = useRef(0);
  const lastPointRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || !workspaceId || !isConnected) return undefined;

    const send = () => {
      rafRef.current = null;
      const now = Date.now();
      const point = lastPointRef.current;
      if (!point) return;
      if (now - lastSentRef.current < 90) return;
      lastSentRef.current = now;
      emit("workspace:cursor", { workspaceId, x: point.x, y: point.y });
    };

    const handleMove = (e) => {
      lastPointRef.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(send);
      }
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [emit, enabled, isConnected, workspaceId]);

  return { isBroadcasting: isConnected };
}

export default useZoneCursorBroadcast;
