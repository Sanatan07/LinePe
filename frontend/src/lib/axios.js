import axios from "axios";

const getApiBaseUrl = () => {
  const explicitBaseUrl =
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  const origin = (
    import.meta.env.VITE_API_ORIGIN || "http://localhost:5000"
  ).replace(/\/+$/, "");
  return origin.endsWith("/api") ? origin : `${origin}/api`;
};

const apiBaseUrl = getApiBaseUrl();

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
      (typeof window !== "undefined" &&
        localStorage.getItem(SESSION_HINT_KEY) !== "true") ||
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
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_HINT_KEY, "true");
      }
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_HINT_KEY);
      }
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);
