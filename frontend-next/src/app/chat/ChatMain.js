"use client";

import { useEffect } from "react";

import ChatContainer from "@/components/ChatContainer";
import NoChatSelected from "@/components/NoChatSelected";
import { SOCKET_EVENTS } from "@/constants/socket.events";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";

export default function ChatMain() {
  const { authUser, socket } = useAuthStore();
  const {
    selectedConversation,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  useEffect(() => {
    if (!authUser || !socket) return undefined;

    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [authUser, socket, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (!socket?.connected) return undefined;

    const conversationId = String(selectedConversation?._id || "");
    if (!conversationId) return undefined;

    socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, conversationId);

    return () => {
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, conversationId);
    };
  }, [socket, socket?.connected, selectedConversation?._id]);

  return selectedConversation ? <ChatContainer /> : <NoChatSelected />;
}
