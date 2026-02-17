import mongoose from "mongoose";
import { ChatMessage } from "../models/ChatMessage.js";
import { Event } from "../models/Event.js";
import { createNotificationBulk } from "../services/notification.service.js";
import { getIO } from "../sockets/index.js";

function sendServerError(res, err, fallback = "Server error") {
  console.error(fallback, err);
  return res.status(500).json({ message: fallback });
}

async function ensureEventMembership(eventId, userId) {
  const event = await Event.findById(eventId)
    .select("hostId participants title")
    .lean();

  if (!event) {
    return { ok: false, reason: "not_found", event: null };
  }

  const isHost = String(event.hostId) === String(userId);
  const isParticipant = (event.participants || []).some(
    (p) => String(p) === String(userId),
  );

  if (!isHost && !isParticipant) {
    return { ok: false, reason: "forbidden", event: null };
  }

  return { ok: true, event, isHost, isParticipant };
}

export async function getChatHistory(req, res) {
  try {
    const { id } = req.params;
    const { before, limit = 50 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    if (before && isNaN(Date.parse(before))) {
      return res.status(400).json({ message: "Invalid 'before' date" });
    }

    const membership = await ensureEventMembership(id, req.user.id);
    if (!membership.ok) {
      if (membership.reason === "not_found") {
        return res.status(404).json({ message: "Event not found" });
      }
      return res
        .status(403)
        .json({ message: "Forbidden: not a participant or host" });
    }

    const filter = { eventId: id };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const safeLimit = Math.min(Number(limit) || 50, 100);

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .populate("userId", "username name")
      .lean();

    return res.json(messages.reverse());
  } catch (err) {
    return sendServerError(res, err, "Failed to load chat history");
  }
}

export async function postMessage(req, res) {
  try {
    const { id } = req.params;
    const { text, attachments } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const membership = await ensureEventMembership(id, userId);
    if (!membership.ok) {
      if (membership.reason === "not_found") {
        return res.status(404).json({ message: "Event not found" });
      }
      return res
        .status(403)
        .json({ message: "Forbidden: only participants can chat" });
    }

    const { event } = membership;

    const safeAttachments = Array.isArray(attachments)
      ? attachments
      : attachments
        ? [attachments]
        : [];

    const msg = await ChatMessage.create({
      eventId: id,
      userId,
      text: String(text).trim(),
      attachments: safeAttachments,
      sentAt: new Date(),
    });

    const populated = await msg.populate("userId", "username name");

    try {
      const io = getIO();

      const messageData = populated.toObject
        ? populated.toObject()
        : JSON.parse(JSON.stringify(populated));
      console.log(`Emitting message:new to event:${id}`, messageData._id);
      console.log(
        `Room: event:${id}, Message text:`,
        messageData.text?.substring(0, 50),
      );
      io.to(`event:${id}`).emit("message:new", messageData);
      console.log(`Message broadcasted to room event:${id}`);
    } catch (socketErr) {
      console.error("Socket emit failed (message:new):", socketErr.message);
      console.error("Socket error details:", socketErr);
    }

    try {
      const allMembers = (event.participants || []).map((p) => String(p));
      const recipientIds = allMembers.filter((uid) => uid !== String(userId));

      if (event.hostId && String(event.hostId) !== String(userId)) {
        recipientIds.push(String(event.hostId));
      }

      if (recipientIds.length > 0) {
        await createNotificationBulk(
          recipientIds,
          "message",
          "New Message",
          `New message in ${event.title}`,
          { eventId: id, messageId: msg._id },
        );
      }
    } catch (notifyErr) {
      console.warn("Notification error (chat):", notifyErr.message);
    }

    return res.status(201).json(populated);
  } catch (err) {
    return sendServerError(res, err, "Failed to send message");
  }
}

export async function markMessageRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const msg = await ChatMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    const membership = await ensureEventMembership(msg.eventId, userId);
    if (!membership.ok) {
      if (membership.reason === "not_found") {
        return res.status(404).json({ message: "Event not found" });
      }
      return res
        .status(403)
        .json({ message: "Forbidden: not a participant or host" });
    }

    if (!msg.readBy.some((uid) => String(uid) === String(userId))) {
      msg.readBy.push(userId);
      await msg.save();
    }

    try {
      const io = getIO();
      io.to(`event:${msg.eventId}`).emit("message:read", {
        _id: msg._id,
        userId,
      });
    } catch (socketErr) {
      console.warn("Socket emit failed (message:read):", socketErr.message);
    }

    return res.json(msg);
  } catch (err) {
    return sendServerError(res, err, "Failed to mark message read");
  }
}

export async function pinMessage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const msg = await ChatMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    const event = await Event.findById(msg.eventId).select("hostId").lean();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (String(event.hostId) !== String(userId)) {
      return res.status(403).json({ message: "Only host can pin messages" });
    }

    msg.pinnedAt = new Date();
    msg.pinnedBy = userId;
    await msg.save();

    try {
      const io = getIO();
      io.to(`event:${msg.eventId}`).emit("message:pinned", msg);
    } catch (socketErr) {
      console.warn("Socket emit failed (message:pinned):", socketErr.message);
    }

    return res.json(msg);
  } catch (err) {
    return sendServerError(res, err, "Failed to pin message");
  }
}

export async function unpinMessage(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const msg = await ChatMessage.findById(id);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    const event = await Event.findById(msg.eventId).select("hostId").lean();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (String(event.hostId) !== String(userId)) {
      return res.status(403).json({ message: "Only host can unpin messages" });
    }

    msg.pinnedAt = undefined;
    msg.pinnedBy = undefined;
    await msg.save();

    try {
      const io = getIO();
      io.to(`event:${msg.eventId}`).emit("message:unpinned", {
        _id: msg._id,
      });
    } catch (socketErr) {
      console.warn("Socket emit failed (message:unpinned):", socketErr.message);
    }

    return res.json(msg);
  } catch (err) {
    return sendServerError(res, err, "Failed to unpin message");
  }
}

export async function listUserChats(req, res) {
  try {
    const userId = req.user.id;

    const events = await Event.find({
      $or: [{ hostId: userId }, { participants: userId }],
    })
      .select("_id title eventDateTime hostId participants")
      .sort({ eventDateTime: -1 })
      .lean();

    return res.json(events);
  } catch (err) {
    return sendServerError(res, err, "Failed to load chatrooms");
  }
}
