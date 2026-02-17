import api from "../utils/fetch";

export const ReviewAPI = {
  addReview: async (eventId, data) => {
    const res = await api.post(`/events/${eventId}/reviews`, data);
    return res.data;
  },

  getUserReviews: async (userId, params = {}) => {
    if (!userId) throw new Error("User ID is required");
    const query = new URLSearchParams(params).toString();
    const res = await api.get(
      `/users/${userId}/reviews${query ? `?${query}` : ""}`,
    );

    return res.data;
  },

  getEventReviews: async (eventId, params = {}) => {
    if (!eventId) throw new Error("Event ID is required");
    const query = new URLSearchParams(params).toString();
    const res = await api.get(
      `/events/${eventId}/reviews${query ? `?${query}` : ""}`,
    );
    return res.data;
  },
};
