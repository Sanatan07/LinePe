import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "development" ? "http://localhost:5000/api" : "/api");

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});
