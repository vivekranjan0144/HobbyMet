import { Notification } from "../models/Notification.js";
import { getIO } from "../sockets/index.js";

/**
 * Create a notification for a user
 * @param {string} userId
 * @param {string} type
 * @param {string} title
 * @param {string} message
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function createNotification(
  userId,
  type,
  title,
  message,
  data = {},
) {
  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    data,
    deliveredAt: new Date(),
  });

  try {
    const io = getIO();
    if (io) io.to(`user:${userId}`).emit("notification:new", notification);
  } catch (_) {}

  return notification;
}

/**
 * Create notifications for multiple users
 * @param {Array<string>} userIds
 * @param {string} type
 * @param {string} title
 * @param {string} message
 * @param {Object} data
 * @returns {Promise<Array<Object>>}
 */
export async function createNotificationBulk(
  userIds,
  type,
  title,
  message,
  data = {},
) {
  const notifications = await Notification.insertMany(
    userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      data,
      deliveredAt: new Date(),
    })),
  );

  try {
    const io = getIO();
    if (io) {
      notifications.forEach((notification) => {
        io.to(`user:${notification.userId}`).emit(
          "notification:new",
          notification,
        );
      });
    }
  } catch (_) {}

  return notifications;
}

/**
 * Get unread notifications count for a user
 * @param {string} userId 
 * @returns {Promise<number>} 
 */
export async function getUnreadCount(userId) {
  return await Notification.countDocuments({ userId, readAt: null });
}
