import { create } from "zustand";
import toast from "react-hot-toast";

import { SOCKET_EVENTS } from "../constants/socket.events";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const getMessageId = (message) => String(message?._id || message?.messageId || "");

const getUserId = (value) => String(value?._id || value || "");

const isSameConversation = (message, selectedUserId, authUserId) => {
  const senderId = getUserId(message.senderId);
  const receiverId = getUserId(message.receiverId);

  return (
    (senderId === authUserId && receiverId === selectedUserId) ||
    (senderId === selectedUserId && receiverId === authUserId)
  );
};

const upsertMessage = (messages, incomingMessage) => {
  const incomingMessageId = getMessageId(incomingMessage);
  if (!incomingMessageId) {
    return messages;
  }

  const existingIndex = messages.findIndex((message) => getMessageId(message) === incomingMessageId);

  if (existingIndex === -1) {
    return [...messages, incomingMessage];
  }

  const nextMessages = [...messages];
  nextMessages[existingIndex] = {
    ...nextMessages[existingIndex],
    ...incomingMessage,
  };

  return nextMessages;
};

const upsertConversation = (conversations, incomingConversation) => {
  const incomingConversationId = String(incomingConversation?._id || "");
  if (!incomingConversationId) {
    return conversations;
  }

  const existingIndex = conversations.findIndex(
    (conversation) => String(conversation?._id || "") === incomingConversationId
  );

  if (existingIndex === -1) {
    return [incomingConversation, ...conversations];
  }

  const nextConversations = [...conversations];
  nextConversations[existingIndex] = {
    ...nextConversations[existingIndex],
    ...incomingConversation,
  };

  return nextConversations.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
};

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isConversationsLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/messages/conversations");
      set({ conversations: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load conversations");
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set((state) => ({
        messages: upsertMessage(state.messages, res.data),
        conversations: upsertConversation(state.conversations, {
          _id: res.data.conversationId,
          participant: selectedUser,
          lastMessage: res.data,
          lastActivityAt: res.data.createdAt,
        }),
      }));
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    const selectedUser = get().selectedUser;

    if (!selectedUser || !socket) return;

    const handleIncomingMessage = (incomingMessage) => {
      const selectedUserId = getUserId(selectedUser);
      const authUserId = getUserId(authUser);

      if (!isSameConversation(incomingMessage, selectedUserId, authUserId)) {
        return;
      }

      set((state) => ({ messages: upsertMessage(state.messages, incomingMessage) }));
      set((state) => ({
        conversations: upsertConversation(state.conversations, {
          _id: incomingMessage.conversationId,
          participant: isSameConversation(incomingMessage, selectedUserId, authUserId)
            ? selectedUser
            : incomingMessage.senderId,
          lastMessage: incomingMessage,
          lastActivityAt: incomingMessage.createdAt,
        }),
      }));
    };

    const handleDeliveredMessage = (receipt) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          getMessageId(message) === String(receipt.messageId)
            ? { ...message, status: "delivered" }
            : message
        ),
      }));
    };

    socket.off(SOCKET_EVENTS.MESSAGE_NEW);
    socket.off(SOCKET_EVENTS.MESSAGE_SENT);
    socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED);

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleIncomingMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_SENT, handleIncomingMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, handleDeliveredMessage);
  },

  refreshConversation: (conversationPayload) => {
    set((state) => ({
      conversations: upsertConversation(state.conversations, conversationPayload),
    }));
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;

    if (!socket) return;

    socket.off(SOCKET_EVENTS.MESSAGE_NEW);
    socket.off(SOCKET_EVENTS.MESSAGE_SENT);
    socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED);
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
