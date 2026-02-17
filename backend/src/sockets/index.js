import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { Event } from "../models/Event.js";

export let ioInstance = null;

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
}

export function createSocketServer(server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
    transports: ["websocket"],
  });

  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next();
    }

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.data.userId = payload.sub;

      socket.join(`user:${payload.sub}`);
    } catch (err) {
      console.warn("Socket auth failed:", err.message);
    } finally {
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log(
      "Socket connected:",
      socket.id,
      "user:",
      socket.data.userId || "guest",
    );

    socket.on("join", async (eventId, cb) => {
      try {
        const userId = socket.data.userId;
        if (!userId) {
          cb?.({ ok: false, message: "Unauthenticated" });
          return;
        }
        if (!eventId) {
          cb?.({ ok: false, message: "eventId is required" });
          return;
        }

        const event = await Event.findById(eventId)
          .select("hostId participants")
          .lean();
        if (!event) {
          cb?.({ ok: false, message: "Event not found" });
          return;
        }

        const isHost = String(event.hostId) === String(userId);
        const isParticipant = (event.participants || []).some(
          (p) => String(p) === String(userId),
        );

        if (!isHost && !isParticipant) {
          cb?.({ ok: false, message: "Forbidden: not a participant" });
          return;
        }

        socket.join(`event:${eventId}`);
        console.log(`User ${userId} joined event room: event:${eventId}`);
        cb?.({ ok: true });
      } catch (err) {
        console.error("socket join error:", err);
        cb?.({ ok: false, message: "Server error" });
      }
    });

    socket.on("leave", (eventId, cb) => {
      try {
        if (eventId) {
          socket.leave(`event:${eventId}`);
        }
        cb?.({ ok: true });
      } catch (err) {
        console.error("socket leave error:", err);
        cb?.({ ok: false, message: "Server error" });
      }
    });

    socket.on("message:send", async (payload, cb) => {
      try {
        const userId = socket.data.userId;
        if (!userId) {
          cb?.({ ok: false, message: "Unauthenticated" });
          return;
        }

        const { eventId, text, attachments = [] } = payload || {};
        if (!eventId || !text?.trim()) {
          cb?.({ ok: false, message: "eventId and text are required" });
          return;
        }

        const event = await Event.findById(eventId)
          .select("hostId participants")
          .lean();
        if (!event) {
          cb?.({ ok: false, message: "Event not found" });
          return;
        }

        const isHost = String(event.hostId) === String(userId);
        const isParticipant = (event.participants || []).some(
          (p) => String(p) === String(userId),
        );
        if (!isHost && !isParticipant) {
          cb?.({ ok: false, message: "Forbidden: not a participant" });
          return;
        }

        const msg = await ChatMessage.create({
          eventId,
          userId,
          text: text.trim(),
          attachments,
          sentAt: new Date(),
        });

        const populated = await msg.populate("userId", "username name");

        io.to(`event:${eventId}`).emit("message:new", populated);

        cb?.({ ok: true, message: populated });
      } catch (err) {
        console.error("message:send error:", err);
        cb?.({ ok: false, message: "Failed to send message" });
      }
    });

    socket.on("message:edit", async ({ id, text }, cb) => {
      try {
        const userId = socket.data.userId;
        if (!userId) {
          cb?.({ ok: false, message: "Unauthenticated" });
          return;
        }
        if (!id || !text?.trim()) {
          cb?.({ ok: false, message: "id and text are required" });
          return;
        }

        const msg = await ChatMessage.findById(id);
        if (!msg) {
          cb?.({ ok: false, message: "Message not found" });
          return;
        }

        if (String(msg.userId) !== String(userId)) {
          cb?.({ ok: false, message: "Cannot edit others' messages" });
          return;
        }

        msg.text = text.trim();
        msg.editedAt = new Date();
        await msg.save();

        const populated = await msg.populate("userId", "username name");

        io.to(`event:${msg.eventId}`).emit("message:updated", populated);

        cb?.({ ok: true, message: populated });
      } catch (err) {
        console.error("message:edit error:", err);
        cb?.({ ok: false, message: "Failed to edit message" });
      }
    });

    socket.on("message:delete", async ({ id }, cb) => {
      try {
        const userId = socket.data.userId;
        if (!userId) {
          cb?.({ ok: false, message: "Unauthenticated" });
          return;
        }
        if (!id) {
          cb?.({ ok: false, message: "id is required" });
          return;
        }

        const msg = await ChatMessage.findById(id);
        if (!msg) {
          cb?.({ ok: false, message: "Message not found" });
          return;
        }

        if (String(msg.userId) !== String(userId)) {
          cb?.({ ok: false, message: "Cannot delete others' messages" });
          return;
        }

        msg.deletedAt = new Date();
        await msg.save();

        io.to(`event:${msg.eventId}`).emit("message:deleted", {
          _id: msg._id,
        });

        cb?.({ ok: true });
      } catch (err) {
        console.error("message:delete error:", err);
        cb?.({ ok: false, message: "Failed to delete message" });
      }
    });

    socket.on("typing:start", ({ eventId }) => {
      if (!eventId || !socket.data.userId) return;

      io.to(`event:${eventId}`).emit("typing:start", {
        userId: socket.data.userId,
        eventId,
      });
    });

    socket.on("typing:stop", ({ eventId }) => {
      if (!eventId || !socket.data.userId) return;

      io.to(`event:${eventId}`).emit("typing:stop", {
        userId: socket.data.userId,
        eventId,
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}
