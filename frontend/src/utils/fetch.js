import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 429) {
      console.warn("Rate limit hit (429)");
      return Promise.reject(error);
    }

    if (status === 401 || status === 403) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
