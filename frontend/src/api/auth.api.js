import api from "../utils/fetch";

export const AuthAPI = {
  signup: async (data) => {
    try {
      const res = await api.post("/auth/signup", data);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },

  login: async (data) => {
    try {
      const res = await api.post("/auth/login", data);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },

  me: async () => {
    try {
      const res = await api.get("/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });
      return res.data;
    } catch (err) {
      console.error("⚠️ /auth/me failed:", err);
      throw err.response?.data || err;
    }
  },

  logout: async () => {
    try {
      const res = await api.post("/auth/logout");
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },

  updatePassword: async (data) => {
    try {
      const res = await api.patch("/auth/update-password", data);
      return res.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  },
};
