import api from "../utils/fetch";

export const ExploreAPI = {
  getUserHobbies: async () => {
    try {
      const res = await api.get("/users/me", {
        headers: { "Cache-Control": "no-cache" },
      });

      return res.data?.hobbies || res.data || [];
    } catch (err) {
      console.error("⚠️ Failed to fetch user hobbies:", err);
      throw err.response?.data || err;
    }
  },

  getNearbyEvents: async () => {
    try {
      const res = await api.get("/explore/feed", {
        headers: { "Cache-Control": "no-cache" },
      });
      return res.data?.events || [];
    } catch (err) {
      console.error("⚠️ Failed to fetch nearby events:", err);
      return [];
    }
  },

  getRecommendedCreators: async () => {
    try {
      const res = await api.get("/explore/creators", {
        headers: { "Cache-Control": "no-cache" },
      });
      return res.data?.creators || [];
    } catch (err) {
      console.error("⚠️ Failed to fetch recommended creators:", err);
      return [];
    }
  },

  getLatestPosts: async () => {
    try {
      const res = await api.get("/posts", {
        headers: { "Cache-Control": "no-cache" },
      });
      return res.data?.posts || [];
    } catch (err) {
      console.error("⚠️ Failed to fetch latest posts:", err);
      return [];
    }
  },
};
