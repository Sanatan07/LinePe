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

const typingTimeoutsByUserId = new Map();

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  users: [],
  selectedUser: null,
  typingUsers: {},
  messagesCursor: null,
  messagesHasMore: true,
  isLoadingOlderMessages: false,
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
      const res = await axiosInstance.get(`/messages/${userId}`, { params: { limit: 30 } });
      set({
        messages: res.data.messages || [],
        messagesCursor: res.data.nextBefore || null,
        messagesHasMore: Boolean(res.data.hasMore),
      });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadOlderMessages: async () => {
    const { selectedUser, messagesCursor, messagesHasMore, isLoadingOlderMessages } = get();
    if (!selectedUser?._id || !messagesHasMore || isLoadingOlderMessages) return null;

    set({ isLoadingOlderMessages: true });
    try {
      const res = await axiosInstance.get(`/messages/${selectedUser._id}`, {
        params: { limit: 30, before: messagesCursor },
      });

      const olderMessages = res.data.messages || [];

      set((state) => ({
        messages: [...olderMessages, ...state.messages],
        messagesCursor: res.data.nextBefore || state.messagesCursor,
        messagesHasMore: Boolean(res.data.hasMore),
      }));

      return olderMessages.length;
    } catch (error) {
      return null;
    } finally {
      set({ isLoadingOlderMessages: false });
    }
  },

  markMessagesAsRead: async (userId) => {
    try {
      const res = await axiosInstance.post(`/messages/read/${userId}`);
      const conversationId = String(res.data?.conversationId || "");
      if (!conversationId) return;

      set((state) => ({
        messages: state.messages.map((message) => {
          const messageConversationId = String(message?.conversationId || "");
          if (messageConversationId !== conversationId) return message;

          const receiverId = getUserId(message.receiverId);
          const authUserId = getUserId(useAuthStore.getState().authUser);

          if (receiverId !== authUserId) return message;
          if (message.status === "read") return message;
          return { ...message, status: "read" };
        }),
        conversations: upsertConversation(state.conversations, {
          _id: conversationId,
          unreadCount: 0,
        }),
      }));
    } catch (error) {
      // Silent: failing to mark read shouldn't block chat UX.
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
          unreadCount: 0,
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

    if (!socket || !authUser) {
      return;
    }

    const handleIncomingMessage = (incomingMessage) => {
      const authUserId = getUserId(authUser);
      const selectedUserId = getUserId(get().selectedUser);

      const senderId = getUserId(incomingMessage.senderId);
      const receiverId = getUserId(incomingMessage.receiverId);
      const isIncomingToMe = receiverId === authUserId;
      const otherParticipant = senderId === authUserId ? incomingMessage.receiverId : incomingMessage.senderId;

      const isSelectedConversation =
        Boolean(selectedUserId) && isSameConversation(incomingMessage, selectedUserId, authUserId);

      if (isIncomingToMe && incomingMessage?.status === "sent") {
        socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED_ACK, { messageId: incomingMessage?._id });
      }

      set((state) => ({
        conversations: upsertConversation(state.conversations, {
          _id: incomingMessage.conversationId,
          participant: otherParticipant,
          lastMessage: incomingMessage,
          lastActivityAt: incomingMessage.createdAt,
          unreadCount: isIncomingToMe && !isSelectedConversation
            ? Number(
                state.conversations.find(
                  (conversation) => String(conversation?._id || "") === String(incomingMessage.conversationId || "")
                )?.unreadCount || 0
              ) + 1
            : 0,
        }),
      }));

      if (isSelectedConversation) {
        set((state) => ({ messages: upsertMessage(state.messages, incomingMessage) }));
      }
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

    const handleReadMessage = (payload) => {
      const conversationId = String(payload?.conversationId || "");
      const readerId = getUserId(payload?.readerId);
      if (!conversationId) return;

      const authUserId = getUserId(useAuthStore.getState().authUser);

      set((state) => ({
        messages: state.messages.map((message) => {
          if (String(message?.conversationId || "") !== conversationId) return message;

          const senderId = getUserId(message.senderId);
          const receiverId = getUserId(message.receiverId);

          const isReceiverTab = authUserId === readerId && receiverId === authUserId;
          const isSenderTab = authUserId !== readerId && senderId === authUserId && receiverId === readerId;

          if (!isReceiverTab && !isSenderTab) return message;
          if (message.status === "read") return message;
          return { ...message, status: "read" };
        }),
      }));
    };

    const handleTypingStart = (payload) => {
      const fromUserId = getUserId(payload?.fromUserId);
      if (!fromUserId) return;

      const selectedUserId = getUserId(get().selectedUser);
      if (selectedUserId !== fromUserId) return;

      set((state) => ({
        typingUsers: { ...state.typingUsers, [fromUserId]: true },
      }));

      const existingTimeout = typingTimeoutsByUserId.get(fromUserId);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeoutId = setTimeout(() => {
        typingTimeoutsByUserId.delete(fromUserId);
        set((state) => ({
          typingUsers: { ...state.typingUsers, [fromUserId]: false },
        }));
      }, 3500);

      typingTimeoutsByUserId.set(fromUserId, timeoutId);
    };

    const handleTypingStop = (payload) => {
      const fromUserId = getUserId(payload?.fromUserId);
      if (!fromUserId) return;

      const selectedUserId = getUserId(get().selectedUser);
      if (selectedUserId !== fromUserId) return;

      const existingTimeout = typingTimeoutsByUserId.get(fromUserId);
      if (existingTimeout) clearTimeout(existingTimeout);
      typingTimeoutsByUserId.delete(fromUserId);

      set((state) => ({
        typingUsers: { ...state.typingUsers, [fromUserId]: false },
      }));
    };

    socket.off(SOCKET_EVENTS.MESSAGE_NEW);
    socket.off(SOCKET_EVENTS.MESSAGE_SENT);
    socket.off(SOCKET_EVENTS.MESSAGE_DELIVERED);
    socket.off(SOCKET_EVENTS.MESSAGE_READ);
    socket.off(SOCKET_EVENTS.TYPING_START);
    socket.off(SOCKET_EVENTS.TYPING_STOP);

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleIncomingMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_SENT, handleIncomingMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, handleDeliveredMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_READ, handleReadMessage);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
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
    socket.off(SOCKET_EVENTS.MESSAGE_READ);
    socket.off(SOCKET_EVENTS.TYPING_START);
    socket.off(SOCKET_EVENTS.TYPING_STOP);
  },

  setSelectedUser: (selectedUser) => {
    const selectedUserId = getUserId(selectedUser);
    set((state) => ({
      selectedUser,
      typingUsers: selectedUserId ? { ...state.typingUsers, [selectedUserId]: false } : state.typingUsers,
    }));
  },
}));
