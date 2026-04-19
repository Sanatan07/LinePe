import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api");

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

let refreshPromise = null;
const SESSION_HINT_KEY = "linepe.hasSession";

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const url = originalRequest?.url || "";

    if (
      status !== 401 ||
      originalRequest?._retry ||
      localStorage.getItem(SESSION_HINT_KEY) !== "true" ||
      url.includes("/auth/login") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ||= axiosInstance.post("/auth/refresh-token");
      await refreshPromise;
      localStorage.setItem(SESSION_HINT_KEY, "true");
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem(SESSION_HINT_KEY);
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);
