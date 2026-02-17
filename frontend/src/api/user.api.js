import api from "../utils/fetch";

export const UserAPI = {
  updateProfile: async (data) => {
    const res = await api.patch("/users/me", data);
    return res.data;
  },

  updateAvatar: async (avatar) => {
    const res = await api.patch("/users/me", { avatar });
    return res.data;
  },

  updateSocialLinks: async (socialLinks) => {
    const res = await api.patch("/users/me", { socialLinks });
    return res.data;
  },

  getPublicProfile: async (userId) => {
    if (!userId) throw new Error("User ID is required");
    const res = await api.get(`/users/${userId}`);
    return res.data;
  },

  deleteAccount: async (password) => {
    const res = await api.delete("/users/me", {
      data: { password },
    });
    return res.data;
  },

  updateLocation: async (coords) => {
    const [coordsValue, address] = Array.isArray(coords)
      ? [coords, undefined]
      : [coords?.coordinates, coords?.address];

    const body =
      address !== undefined
        ? { coordinates: coordsValue, address }
        : { coordinates: coordsValue || coords };

    const res = await api.patch("/users/me/location", body);
    return res.data;
  },

  updateLiveLocation: () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject({ message: "GPS not supported on this device" });
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const coords = [pos.coords.longitude, pos.coords.latitude];
            const res = await api.patch("/users/me/location", {
              coordinates: coords,
            });
            resolve(res.data);
          } catch (e) {
            reject(e);
          }
        },
        () => reject({ message: "Please allow location access" }),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }),

  getNearbyUsers: async (coords, options = {}) => {
    if (!Array.isArray(coords) || coords.length !== 2) return [];

    const [longitude, latitude] = coords;

    const res = await api.get("/users/nearby", {
      params: {
        longitude,
        latitude,
        maxDistance: options.maxDistance || 10000,
      },
    });

    const data = res.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.results)) return data.results;

    return [];
  },

  getUserEvents: async (userId, params = {}) => {
    if (!userId) throw new Error("User ID is required");

    const query = new URLSearchParams(params).toString();
    const res = await api.get(
      `/users/${userId}/events${query ? `?${query}` : ""}`,
    );

    return res.data;
  },

  getMyEvents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/me/events${query ? `?${query}` : ""}`);
    return res.data;
  },
};
