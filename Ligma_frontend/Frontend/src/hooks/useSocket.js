import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useSocket = (workspaceId) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to the socket server
    const token = localStorage.getItem("ligma_token");
    
    socketRef.current = io(socketUrl, {
      auth: {
        token,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log("⚡ Connected to real-time server");
      
      // If workspace context exists, join workspace room
      if (workspaceId) {
        socketRef.current.emit("JOIN_WORKSPACE", { workspaceId });
      }
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("⚡ Disconnected from real-time server:", reason);
    });

    return () => {
      if (socketRef.current) {
        if (workspaceId) {
          socketRef.current.emit("LEAVE_WORKSPACE", { workspaceId });
        }
        socketRef.current.disconnect();
      }
    };
  }, [workspaceId]);

  const emit = (event, data) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit event: ${event}. Socket not connected.`);
    }
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    isConnected: socketRef.current?.connected || false,
  };
};

export default useSocket;
