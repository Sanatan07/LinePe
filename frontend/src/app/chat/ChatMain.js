"use client";

import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import ChatContainer from "@/components/ChatContainer";
import NoChatSelected from "@/components/NoChatSelected";
import { SOCKET_EVENTS } from "@/constants/socket.events";
import { requestNotificationPermission } from "@/lib/notifications";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";

export default function ChatMain() {
  const { authUser, socket } = useAuthStore();
  const {
    selectedConversation,
    conversations,
    setSelectedConversation,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const inviteHandled = useRef(false);

  // Show toast immediately when landing from an accepted invite
  useEffect(() => {
    if (searchParams.get("invite") === "accepted") {
      toast.success("Invite accepted! You're now connected.");
    }
  }, []);

  // Auto-select the conversation once conversations are loaded
  useEffect(() => {
    if (inviteHandled.current) return;
    if (searchParams.get("invite") !== "accepted") return;

    const cid = searchParams.get("cid");
    if (!cid || conversations.length === 0) return;

    const conv = conversations.find((c) => String(c._id) === String(cid));
    if (!conv) return;

    inviteHandled.current = true;
    setSelectedConversation(conv);
    navigate("/chat", { replace: true });
  }, [conversations, navigate, searchParams, setSelectedConversation]);

  useEffect(() => {
    if (!authUser) return;
    requestNotificationPermission();
  }, [authUser]);

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
