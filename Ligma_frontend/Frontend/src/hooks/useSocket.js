import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socketInstance = null;
const joinedWorkspaces = new Set();

const ensureSocket = () => {
  if (socketInstance) {
    return socketInstance;
  }

  const token = localStorage.getItem("ligma_token");

  socketInstance = io(socketUrl, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socketInstance.on("connect", () => {
    const workspaceIds = Array.from(joinedWorkspaces);
    for (const workspaceId of workspaceIds) {
      socketInstance.emit("workspace:join", { workspaceId });
    }
  });

  return socketInstance;
};

export const useSocket = ({ workspaceId, autoJoin = true } = {}) => {
  const socketRef = useRef(null);
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    socketRef.current = ensureSocket();

    const socket = socketRef.current;

    const handleConnect = () => setStatus("connected");
    const handleReconnectAttempt = () => setStatus("reconnecting");
    const handleConnectError = () => setStatus("offline");
    const handleDisconnect = () => setStatus("offline");

    if (socket.connected) {
      setStatus("connected");
    }

    socket.on("connect", handleConnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    if (workspaceId && autoJoin) {
      joinedWorkspaces.add(workspaceId);
      socket.emit("workspace:join", { workspaceId });
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);

      if (workspaceId && autoJoin) {
        joinedWorkspaces.delete(workspaceId);
        socket.emit("workspace:leave", { workspaceId });
      }
    };
  }, [workspaceId, autoJoin]);

  const emit = (event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event, callback) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event, callback) => {
    socketRef.current?.off(event, callback);
  };

  const api = useMemo(
    () => ({
      socket: socketRef.current,
      emit,
      on,
      off,
      status,
      isConnected: status === "connected",
    }),
    [status]
  );

  return api;
};

export default useSocket;
