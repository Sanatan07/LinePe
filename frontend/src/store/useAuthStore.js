import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

import { SOCKET_EVENTS } from "../constants/socket.events";
import { axiosInstance } from "../lib/axios.js";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
      get().disconnectSocket();
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(getErrorMessage(error, "Signup failed"));
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Logout failed"));
    } finally {
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: [] });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(getErrorMessage(error, "Profile update failed"));
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser || socket?.connected) {
      return;
    }

    if (socket) {
      socket.disconnect();
    }

    const nextSocket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: false,
    });

    nextSocket.on("connect", () => {
      set({ socket: nextSocket });
    });

    nextSocket.on("reconnect", () => {
      set({ socket: nextSocket });
    });

    nextSocket.on(SOCKET_EVENTS.ONLINE_USERS, (userIds) => {
      set({ onlineUsers: userIds });
    });

    nextSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    nextSocket.on("disconnect", () => {
      set((state) => (state.socket === nextSocket ? { socket: null } : state));
    });

    set({ socket: nextSocket });
    nextSocket.connect();
  },

  disconnectSocket: () => {
    const socket = get().socket;

    if (socket) {
      socket.off("connect");
      socket.off(SOCKET_EVENTS.ONLINE_USERS);
      socket.off("connect_error");
      socket.off("disconnect");
      socket.disconnect();
    }

    set({ socket: null, onlineUsers: [] });
  },
}));
