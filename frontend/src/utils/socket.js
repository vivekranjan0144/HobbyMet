import { io } from "socket.io-client";

let socket = null;
const getApiUrl = () => import.meta.env.VITE_API_BASE_URL;

const createSocket = () => {
  if (socket) return socket;

  const token = localStorage.getItem("token");

  socket = io(getApiUrl(), {
    transports: ["websocket"],
    autoConnect: false,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.warn("Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
    if (
      err.message?.toLowerCase().includes("unauthorized") ||
      err.message?.toLowerCase().includes("jwt")
    ) {
      socket.disconnect();
    }
  });

  return socket;
};

export const initSocket = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  createSocket();
  socket.auth.token = token;

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log("Socket disconnected manually");
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
