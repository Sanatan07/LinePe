import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

import { SOCKET_EVENTS } from "../constants/socket.events";
import { axiosInstance } from "../lib/axios.js";

const SESSION_HINT_KEY = "linepe.hasSession";

// Use environment variables for the socket URL. Fallback to localhost only in dev when none are set.
const BASE_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_ORIGIN ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");

const setSessionHint = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_HINT_KEY, "true");
  }
};

const removeSessionHint = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_HINT_KEY);
  }
};

const getErrorMessage = (error, fallbackMessage) =>
  error?.response?.data?.message || error?.message || fallbackMessage;

const joinSelectedConversationRoom = async (socket) => {
  if (!socket?.connected) return;
  const { useChatStore } = await import("./useChatStore");
  const selectedConversationId = String(
    useChatStore.getState().selectedConversation?._id || "",
  );
  if (!selectedConversationId) return;
  socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, selectedConversationId);
};

const resyncChatState = async () => {
  const { useChatStore } = await import("./useChatStore");
  const chatStore = useChatStore.getState();
  await chatStore.getConversations();

  if (chatStore.selectedConversation?._id) {
    await chatStore.getMessages(chatStore.selectedConversation);
    await chatStore.markMessagesAsRead(chatStore.selectedConversation);
  }

  Object.keys(chatStore.pendingMessages || {}).forEach((clientMessageId) => {
    chatStore.retryPendingMessage(clientMessageId);
  });
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isSendingPasswordReset: false,
  isResettingPassword: false,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      setSessionHint();
      get().connectSocket();
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.log("Error in checkAuth:", error);
      }

      removeSessionHint();
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
      toast.success(res.data?.message || "Verification code sent");
      return res.data;
    } catch (error) {
      toast.error(getErrorMessage(error, "Signup failed"));
      return null;
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifySignupOtp: async ({ email, otp }) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup/verify", {
        email,
        otp,
      });
      set({ authUser: res.data });
      setSessionHint();
      toast.success("Account created successfully");
      get().connectSocket();
      return res.data;
    } catch (error) {
      toast.error(getErrorMessage(error, "OTP verification failed"));
      return null;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      setSessionHint();
      toast.success("Logged in successfully");
      get().connectSocket();
      return res.data;
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
      return null;
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
      removeSessionHint();
      set({ authUser: null, onlineUsers: [] });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
      return res.data;
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(getErrorMessage(error, "Profile update failed"));
      return null;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  forgotPassword: async (email) => {
    set({ isSendingPasswordReset: true });
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      toast.success(
        res.data?.message ||
          "If that email is registered, a reset link has been sent.",
      );
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send reset email"));
      return false;
    } finally {
      set({ isSendingPasswordReset: false });
    }
  },

  resetPassword: async (token, password) => {
    set({ isResettingPassword: true });
    try {
      const res = await axiosInstance.post(`/auth/reset-password/${token}`, {
        password,
      });
      toast.success(
        res.data?.message || "Password reset successfully. Please sign in.",
      );
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Password reset failed"));
      return false;
    } finally {
      set({ isResettingPassword: false });
    }
  },

  sendVerificationEmail: async () => {
    try {
      const res = await axiosInstance.post("/auth/send-verification-email");
      toast.success(res.data?.message || "Verification email sent");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send verification email"));
      return false;
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
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    nextSocket.on("connect", () => {
      set({ socket: nextSocket });
      joinSelectedConversationRoom(nextSocket).catch(() => {});
      nextSocket.emit(SOCKET_EVENTS.MESSAGE_SYNC_REQUEST);
      resyncChatState().catch(() => {});
    });

    nextSocket.on("reconnect", () => {
      set((state) => ({ ...state, socket: nextSocket }));
      joinSelectedConversationRoom(nextSocket).catch(() => {});
      nextSocket.emit(SOCKET_EVENTS.MESSAGE_SYNC_REQUEST);
      resyncChatState().catch(() => {});
    });

    nextSocket.io.on("reconnect", () => {
      set({ socket: nextSocket });
      joinSelectedConversationRoom(nextSocket).catch(() => {});
      nextSocket.emit(SOCKET_EVENTS.MESSAGE_SYNC_REQUEST);
      resyncChatState().catch(() => {});
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
