import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";
import { getUnreadCount } from "../services/notification.service.js";

export async function listNotifications(req, res) {
  try {
    const { limit = 20, offset = 0, type } = req.query;

    const lim = Math.min(Number(limit) || 20, 100);
    const off = Math.max(Number(offset) || 0, 0);

    const query = { userId: req.user.id };
    if (type) query.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(off)
        .limit(lim)
        .lean(),
      Notification.countDocuments(query),
      getUnreadCount(req.user.id),
    ]);

    return res.json({
      notifications,
      pagination: {
        total,
        unreadCount,
        limit: lim,
        offset: off,
      },
    });
  } catch (error) {
    console.error("Error listing notifications:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
}

export async function markRead(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { readAt: new Date() },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to update notification", error: error.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, readAt: null },
      { readAt: new Date() },
    );

    return res.json({
      message: "All notifications marked as read",
      count: result.modifiedCount ?? result.nModified ?? 0,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      message: "Failed to update notifications",
      error: error.message,
    });
  }
}

export async function getUnreadNotificationsCount(req, res) {
  try {
    const count = await getUnreadCount(req.user.id);
    return res.json({ count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return res
      .status(500)
      .json({ message: "Failed to get unread count", error: error.message });
  }
}

export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete notification", error: error.message });
  }
}
