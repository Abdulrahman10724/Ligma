import { useEffect, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import useSocket from "./useSocket";
import {
  fetchZones,
  createZone as createZoneThunk,
  updateZone as updateZoneThunk,
  deleteZone as deleteZoneThunk,
  socketZoneCreated,
  socketZoneDeleted,
  socketZonePresence,
  socketZoneUpdated,
} from "@/redux/zoneSlice";

export function usePresenceZones(workspaceId) {
  const dispatch = useDispatch();
  const { on, off } = useSocket({ workspaceId });
  const fetchedRef = useRef(null);

  useEffect(() => {
    if (!workspaceId) return;
    if (fetchedRef.current !== workspaceId) {
      fetchedRef.current = workspaceId;
      dispatch(fetchZones(workspaceId));
    }
  }, [dispatch, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return undefined;

    const onCreated = (payload) => {
      if (payload?.zone?.workspaceId !== workspaceId) return;
      dispatch(socketZoneCreated(payload));
    };
    const onUpdated = (payload) => {
      if (payload?.zone?.workspaceId !== workspaceId) return;
      dispatch(socketZoneUpdated(payload));
    };
    const onDeleted = (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      dispatch(socketZoneDeleted(payload));
    };
    const onPresence = (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      dispatch(socketZonePresence(payload));
    };

    on("zone:created", onCreated);
    on("zone:updated", onUpdated);
    on("zone:deleted", onDeleted);
    on("zone:presence", onPresence);

    return () => {
      off("zone:created", onCreated);
      off("zone:updated", onUpdated);
      off("zone:deleted", onDeleted);
      off("zone:presence", onPresence);
    };
  }, [dispatch, off, on, workspaceId]);

  const zones = useSelector((state) =>
    (state.zones?.allIds || []).map((id) => state.zones.byId[id]).filter(Boolean)
  );
  const presence = useSelector((state) => state.zones?.presence || {});
  const loading = useSelector((state) => state.zones?.loading || false);
  const saving = useSelector((state) => state.zones?.saving || false);

  const createZone = useCallback(
    (payload) => dispatch(createZoneThunk({ workspaceId, payload })),
    [dispatch, workspaceId]
  );

  const updateZone = useCallback(
    (zoneId, payload) => dispatch(updateZoneThunk({ workspaceId, zoneId, payload })),
    [dispatch, workspaceId]
  );

  const removeZone = useCallback(
    (zoneId) => dispatch(deleteZoneThunk({ workspaceId, zoneId })),
    [dispatch, workspaceId]
  );

  return useMemo(
    () => ({ zones, items: zones, presence, loading, saving, createZone, updateZone, removeZone }),
    [zones, presence, loading, saving, createZone, updateZone, removeZone]
  );
}

export default usePresenceZones;