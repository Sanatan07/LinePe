"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";

const SESSION_HINT_KEY = "linepe.hasSession";

export default function ChatRuntime({ currentUser, initialConversations = [] }) {
  const connectSocket = useAuthStore((state) => state.connectSocket);

  useEffect(() => {
    if (!currentUser?._id) {
      return;
    }

    useAuthStore.setState({
      authUser: currentUser,
      isCheckingAuth: false,
    });
    useChatStore.setState({
      conversations: Array.isArray(initialConversations) ? initialConversations : [],
    });
    localStorage.setItem(SESSION_HINT_KEY, "true");
    connectSocket();

    window.dispatchEvent(
      new CustomEvent("linepe:chat-auth-ready", {
        detail: {
          userId: currentUser._id,
          socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "",
          initialConversations,
        },
      }),
    );
  }, [connectSocket, currentUser, initialConversations]);

  return null;
}
