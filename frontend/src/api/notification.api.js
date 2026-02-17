import api from "../utils/fetch";

function buildError(err, fallbackMessage) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  return {
    status,
    data,
    message: data?.message || fallbackMessage,
  };
}

export const NotificationAPI = {
  getNotifications: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/notifications${query ? `?${query}` : ""}`);
      return res.data;
    } catch (err) {
      console.error("❌ NotificationAPI.getNotifications failed:", err);
      throw buildError(err, "Failed to fetch notifications");
    }
  },

  getUnreadCount: async () => {
    try {
      const res = await api.get("/notifications/unread/count");
      return res.data?.count || 0;
    } catch (err) {
      console.error("❌ NotificationAPI.getUnreadCount failed:", err);
      throw buildError(err, "Failed to fetch unread count");
    }
  },

  markAsRead: async (notificationId) => {
    if (!notificationId) throw new Error("Notification ID is required");
    try {
      const res = await api.patch(`/notifications/${notificationId}/read`);
      return res.data;
    } catch (err) {
      console.error("❌ NotificationAPI.markAsRead failed:", err);
      throw buildError(err, "Failed to mark notification as read");
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await api.patch("/notifications/read-all");
      return res.data;
    } catch (err) {
      console.error("❌ NotificationAPI.markAllAsRead failed:", err);
      throw buildError(err, "Failed to mark all notifications as read");
    }
  },

  deleteNotification: async (notificationId) => {
    if (!notificationId) throw new Error("Notification ID is required");
    try {
      const res = await api.delete(`/notifications/${notificationId}`);
      return res.data;
    } catch (err) {
      console.error("❌ NotificationAPI.deleteNotification failed:", err);
      throw buildError(err, "Failed to delete notification");
    }
  },
};
