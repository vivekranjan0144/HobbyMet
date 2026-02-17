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

export const EventAPI = {
  createEvent: async (data) => {
    try {
      const res = await api.post("/events", data);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.createEvent failed:", err);
      throw buildError(err, "Failed to create event");
    }
  },

  listEvents: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/events${query ? `?${query}` : ""}`);

      return res.data?.events || [];
    } catch (err) {
      console.error("❌ EventAPI.listEvents failed:", err);
      throw buildError(err, "Failed to fetch events");
    }
  },

  getEvent: async (id) => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.get(`/events/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.getEvent failed:", err);
      throw buildError(err, "Failed to load event details");
    }
  },

  updateEvent: async (id, data) => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.patch(`/events/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.updateEvent failed:", err);
      throw buildError(err, "Failed to update event");
    }
  },

  deleteEvent: async (id) => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.delete(`/events/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.deleteEvent failed:", err);
      throw buildError(err, "Failed to delete event");
    }
  },

  getEventMembers: async (id) => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.get(`/events/${id}/members`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.getEventMembers failed:", err);
      throw buildError(err, "Failed to fetch event members");
    }
  },

  removeParticipant: async (eventId, userId) => {
    if (!eventId || !userId) {
      throw new Error("Event ID and User ID are required");
    }
    try {
      const res = await api.delete(`/events/${eventId}/members/${userId}`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.removeParticipant failed:", err);
      throw buildError(err, "Failed to remove participant");
    }
  },

  sendJoinRequest: async (id, message = "") => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.post(`/events/${id}/requests`, {
        message,
      });
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.sendJoinRequest failed:", err);
      throw buildError(err, "Failed to send join request");
    }
  },

  listJoinRequests: async (id) => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.get(`/events/${id}/requests`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.listJoinRequests failed:", err);
      throw buildError(err, "Failed to fetch join requests");
    }
  },

  decideJoinRequest: async (id, reqId, status) => {
    if (!id || !reqId) {
      throw new Error("Event ID and Request ID are required");
    }
    try {
      const res = await api.patch(`/events/${id}/requests/${reqId}`, {
        status,
      });
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.decideJoinRequest failed:", err);
      throw buildError(err, "Failed to update join request");
    }
  },

  getMyJoinRequests: async () => {
    try {
      const res = await api.get("/me/requests");
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.getMyJoinRequests failed:", err);
      throw buildError(err, "Failed to fetch your requests");
    }
  },

  joinEvent: async (id) => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.post(`/events/${id}/join`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.joinEvent failed:", err);
      throw buildError(err, "Failed to join event");
    }
  },

  getMyCreatedEvents: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(
        `/events/me/created${query ? `?${query}` : ""}`,
      );
      return res.data?.events || [];
    } catch (err) {
      console.error("❌ EventAPI.getMyCreatedEvents failed:", err);
      throw buildError(err, "Failed to fetch created events");
    }
  },

  getMyJoinedEvents: async () => {
    try {
      const res = await api.get("/events/me/joined");
      return res.data?.events || [];
    } catch (err) {
      console.error("❌ EventAPI.getMyJoinedEvents failed:", err);
      throw buildError(err, "Failed to fetch joined events");
    }
  },

  leaveEvent: async (id) => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.delete(`/events/${id}/leave`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.leaveEvent failed:", err);
      throw buildError(err, "Failed to leave event");
    }
  },

  cancelJoinRequest: async (eventId) => {
    if (!eventId) throw new Error("Event ID is required");
    try {
      const res = await api.delete(`/events/${eventId}/requests/me`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.cancelJoinRequest failed:", err);
      throw buildError(err, "Failed to cancel join request");
    }
  },

  getNearbyEvents: async ({ longitude, latitude, maxDistance }) => {
    try {
      console.log("🔵 getNearbyEvents called with:", {
        longitude,
        latitude,
        maxDistance,
      });

      const params = new URLSearchParams({
        longitude: String(longitude),
        latitude: String(latitude),
        maxDistance: String(maxDistance),
      });

      const res = await api.get(`/events/nearby?${params}`);

      console.log("✅ getNearbyEvents response:", res.data);

      return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error("❌ EventAPI.getNearbyEvents error:", err);
      throw buildError(err, "Failed to fetch nearby events");
    }
  },

  getMyEventChats: async () => {
    try {
      const res = await api.get("/events/chats");
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.getMyEventChats failed:", err);
      throw buildError(err, "Failed to fetch event chats");
    }
  },

  getEventChat: async (id) => {
    if (!id) throw new Error("Event ID is required");
    try {
      const res = await api.get(`/events/${id}/chat`);
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.getEventChat failed:", err);
      throw buildError(err, "Failed to load chat");
    }
  },

  sendEventMessage: async (id, text) => {
    if (!id) throw new Error("Event ID is required");
    if (!text || !text.trim()) {
      throw new Error("Message cannot be empty");
    }
    try {
      const res = await api.post(`/events/${id}/chat`, {
        text,
      });
      return res.data;
    } catch (err) {
      console.error("❌ EventAPI.sendEventMessage failed:", err);
      throw buildError(err, "Failed to send message");
    }
  },
};
