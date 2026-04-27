import { create } from "zustand";
import toast from "react-hot-toast";

import { SOCKET_EVENTS } from "../constants/socket.events";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const getMessageId = (message) => String(message?._id || message?.messageId || "");
const getClientMessageId = (message) => String(message?.clientMessageId || "");

const getUserId = (value) => String(value?._id || value || "");

const getConversationId = (value) => String(value?._id || value?.conversationId || value || "");

const upsertMessage = (messages, incomingMessage) => {
  const incomingMessageId = getMessageId(incomingMessage);
  const incomingClientMessageId = getClientMessageId(incomingMessage);
  if (!incomingMessageId) {
    if (!incomingClientMessageId) {
      return messages;
    }
  }

  const existingIndex = messages.findIndex((message) => {
    const messageId = getMessageId(message);
    const clientMessageId = getClientMessageId(message);

    if (incomingMessageId && messageId === incomingMessageId) return true;
    if (incomingClientMessageId && clientMessageId === incomingClientMessageId) return true;
    return false;
  });

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

  return nextConversations.sort((a, b) => {
    if (Boolean(a?.pinned) !== Boolean(b?.pinned)) return a.pinned ? -1 : 1;
    return new Date(b.lastActivityAt) - new Date(a.lastActivityAt);
  });
};

const createClientMessageId = () =>
  globalThis.crypto?.randomUUID?.() || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const getSendErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  (error?.response?.status === 401
    ? "Your session expired. Sign in again to retry."
    : error?.message || "Failed to send message");

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  users: [],
  searchResults: [],
  selectedConversation: null,
  typingUsers: [],
  chatSearchResults: [],
  groupMediaByConversationId: {},
  highlightMessageId: null,
  messagesCursor: null,
  messagesHasMore: true,
  isLoadingOlderMessages: false,
  isUsersLoading: false,
  isMessagesLoading: false,
  isConversationsLoading: false,
  isChatSearchLoading: false,
  isUserSearchLoading: false,
  isGroupMediaLoading: false,
  isOpeningConversation: false,
  isSendingInvite: false,
  isGroupCreating: false,
  pendingMessages: {},

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

  createGroup: async ({ name, memberIds, avatar } = {}) => {
    const trimmedName = typeof name === "string" ? name.trim() : "";
    const ids = Array.isArray(memberIds) ? memberIds.filter(Boolean) : [];

    if (!trimmedName) {
      toast.error("Group name is required");
      return null;
    }

    if (ids.length < 2) {
      toast.error("Select at least 2 members");
      return null;
    }

    set({ isGroupCreating: true });
    try {
      const res = await axiosInstance.post("/messages/groups", {
        name: trimmedName,
        avatar: typeof avatar === "string" ? avatar : "",
        memberIds: ids,
      });

      await get().getConversations();
      set({ selectedConversation: res.data });
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    } finally {
      set({ isGroupCreating: false });
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

  setConversationFlag: async ({ conversationId, flag, enabled }) => {
    if (!conversationId || !flag) return;
    try {
      await axiosInstance.post(`/messages/conversations/${conversationId}/${flag}`, { enabled });
      await get().getConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update conversation");
    }
  },

  updateGroup: async ({ conversationId, name, avatar }) => {
    if (!conversationId) return null;

    try {
      const payload = {};
      if (typeof name === "string") payload.name = name.trim();
      if (typeof avatar === "string") payload.avatar = avatar;

      const res = await axiosInstance.patch(`/messages/groups/${conversationId}`, payload);
      const updatedConversation = res.data;

      set((state) => ({
        conversations: upsertConversation(state.conversations, updatedConversation),
        selectedConversation:
          getConversationId(state.selectedConversation) === getConversationId(updatedConversation)
            ? updatedConversation
            : state.selectedConversation,
      }));

      toast.success("Group updated");
      return updatedConversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
      return null;
    }
  },

  getGroupMedia: async (conversationId) => {
    if (!conversationId) return [];

    set({ isGroupMediaLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/groups/${conversationId}/media`);
      const media = Array.isArray(res.data?.media) ? res.data.media : [];
      set((state) => ({
        groupMediaByConversationId: {
          ...state.groupMediaByConversationId,
          [conversationId]: media,
        },
      }));
      return media;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load group media");
      return [];
    } finally {
      set({ isGroupMediaLoading: false });
    }
  },

  addGroupMembers: async ({ conversationId, memberIds }) => {
    if (!conversationId) return null;

    try {
      const res = await axiosInstance.post(`/messages/groups/${conversationId}/members`, {
        memberIds: Array.isArray(memberIds) ? memberIds.filter(Boolean) : [],
      });
      const updatedConversation = res.data;

      set((state) => ({
        conversations: upsertConversation(state.conversations, updatedConversation),
        selectedConversation:
          getConversationId(state.selectedConversation) === getConversationId(updatedConversation)
            ? updatedConversation
            : state.selectedConversation,
      }));

      toast.success("Members added");
      return updatedConversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
      return null;
    }
  },

  removeGroupMember: async ({ conversationId, memberId }) => {
    if (!conversationId || !memberId) return null;

    try {
      const res = await axiosInstance.delete(`/messages/groups/${conversationId}/members/${memberId}`);
      const updatedConversation = res.data;

      set((state) => ({
        conversations: upsertConversation(state.conversations, updatedConversation),
        selectedConversation:
          getConversationId(state.selectedConversation) === getConversationId(updatedConversation)
            ? updatedConversation
            : state.selectedConversation,
      }));

      toast.success("Member removed");
      return updatedConversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
      return null;
    }
  },

  leaveGroup: async (conversationId) => {
    const targetConversationId = getConversationId(conversationId);
    if (!targetConversationId) return false;

    try {
      await axiosInstance.patch(`/messages/group/${targetConversationId}/leave`);

      set((state) => ({
        conversations: (state.conversations || []).filter(
          (item) => String(item?._id || "") !== targetConversationId
        ),
        selectedConversation:
          String(state.selectedConversation?._id || "") === targetConversationId
            ? null
            : state.selectedConversation,
        messages:
          String(state.selectedConversation?._id || "") === targetConversationId
            ? []
            : state.messages,
        typingUsers: [],
        chatSearchResults: [],
        highlightMessageId: null,
      }));

      toast.success("Left group");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
      return false;
    }
  },

  setGroupAdmin: async ({ conversationId, memberId, enabled }) => {
    if (!conversationId || !memberId) return null;

    try {
      const res = await axiosInstance.post(`/messages/groups/${conversationId}/admins/${memberId}`, {
        enabled,
      });
      const updatedConversation = res.data;

      set((state) => ({
        conversations: upsertConversation(state.conversations, updatedConversation),
        selectedConversation:
          getConversationId(state.selectedConversation) === getConversationId(updatedConversation)
            ? updatedConversation
            : state.selectedConversation,
      }));

      toast.success(enabled ? "Admin added" : "Admin removed");
      return updatedConversation;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update admin");
      return null;
    }
  },

  deleteConversation: async (conversation) => {
    const conversationId = getConversationId(conversation);
    if (!conversationId) return false;

    try {
      await axiosInstance.delete(`/messages/conversations/${conversationId}`);

      set((state) => ({
        conversations: (state.conversations || []).filter(
          (item) => String(item?._id || "") !== conversationId
        ),
        selectedConversation:
          String(state.selectedConversation?._id || "") === conversationId
            ? null
            : state.selectedConversation,
        messages:
          String(state.selectedConversation?._id || "") === conversationId
            ? []
            : state.messages,
        chatSearchResults: [],
        highlightMessageId: null,
      }));

      toast.success("Chat deleted successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete chat");
      return false;
    }
  },

  setBlockStatus: async ({ userId, enabled }) => {
    if (!userId) return;
    try {
      await axiosInstance.post(`/messages/block/${userId}`, { enabled });
      await get().getUsers();
      await get().getConversations();

      const selectedConversation = get().selectedConversation;
      const selectedParticipantId =
        selectedConversation?.kind === "direct" ? getUserId(selectedConversation?.participant) : "";

      if (selectedParticipantId === String(userId) && enabled) {
        set({ selectedConversation: null, messages: [] });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update block status");
    }
  },

  getMessages: async (conversation) => {
    set({ isMessagesLoading: true });
    try {
      const conversationId = getConversationId(conversation);
      const res = await axiosInstance.get(`/messages/conversation/${conversationId}`, {
        params: { limit: 30 },
      });
      set({
        messages: (res.data.messages || []).map((message) => ({
          ...message,
          status: message.status || "sent",
        })),
        messagesCursor: res.data.nextBefore || null,
        messagesHasMore: Boolean(res.data.hasMore),
      });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  searchChat: async ({ userId, query }) => {
    const trimmed = typeof query === "string" ? query.trim() : "";
    if (!userId || !trimmed) {
      set({ chatSearchResults: [], highlightMessageId: null });
      return;
    }

    set({ isChatSearchLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/search/${userId}`, {
        params: { q: trimmed, limit: 20 },
      });
      set({ chatSearchResults: res.data?.results || [] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Search failed");
    } finally {
      set({ isChatSearchLoading: false });
    }
  },

  searchUsers: async (query) => {
    const trimmed = typeof query === "string" ? query.trim() : "";

    if (!trimmed) {
      set({ searchResults: [] });
      return [];
    }

    set({ isUserSearchLoading: true });
    try {
      const res = await axiosInstance.get(`/users/search?q=${encodeURIComponent(trimmed)}`);
      const results = Array.isArray(res.data?.results) ? res.data.results : [];
      set({ searchResults: results });
      return results;
    } catch (error) {
      set({ searchResults: [] });
      toast.error(error?.response?.data?.message || "User search failed");
      return [];
    } finally {
      set({ isUserSearchLoading: false });
    }
  },

  clearUserSearch: () => {
    set({ searchResults: [], isUserSearchLoading: false });
  },

  sendInvite: async (phoneNumber) => {
    const trimmed = typeof phoneNumber === "string" ? phoneNumber.trim() : "";
    if (!trimmed) {
      toast.error("Invite target is required");
      return null;
    }

    set({ isSendingInvite: true });
    try {
      const payload = trimmed.includes("@")
        ? { email: trimmed }
        : /^\+?\d[\d\s()-]*$/.test(trimmed)
          ? { phoneNumber: trimmed }
          : { username: trimmed };
      const res = await axiosInstance.post("/invites", payload);
      return res.data || null;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send invite");
      return null;
    } finally {
      set({ isSendingInvite: false });
    }
  },

  openConversationFromUser: async (user) => {
    const userId = getUserId(user);
    if (!userId) return null;

    const existingConversation = (get().conversations || []).find(
      (conversation) =>
        conversation?.kind === "direct" && getUserId(conversation?.participant) === userId
    );

    if (existingConversation) {
      set({
        selectedConversation: existingConversation,
        searchResults: [],
      });
      return existingConversation;
    }

    set({ isOpeningConversation: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`, {
        params: { limit: 30 },
      });

      await get().getConversations();

      const createdConversation = (get().conversations || []).find(
        (conversation) =>
          String(conversation?._id || "") === String(res.data?.conversationId || "") ||
          (conversation?.kind === "direct" && getUserId(conversation?.participant) === userId)
      );

      const nextConversation =
        createdConversation ||
        {
          _id: res.data?.conversationId || "",
          kind: "direct",
          participant: user,
        };

      set({
        selectedConversation: nextConversation,
        searchResults: [],
      });

      return nextConversation;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to open chat");
      return null;
    } finally {
      set({ isOpeningConversation: false });
    }
  },

  jumpToMessage: async ({ conversationId, createdAt, messageId }) => {
    if (!conversationId || !createdAt) return;
    set({ isMessagesLoading: true });
    try {
      const timestamp = new Date(createdAt).getTime();
      const before = Number.isFinite(timestamp) ? new Date(timestamp + 1).toISOString() : null;

      const res = await axiosInstance.get(`/messages/conversation/${conversationId}`, {
        params: { limit: 60, before },
      });

      set({
        messages: res.data.messages || [],
        messagesCursor: res.data.nextBefore || null,
        messagesHasMore: Boolean(res.data.hasMore),
        highlightMessageId: messageId ? String(messageId) : null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to jump to message");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadOlderMessages: async () => {
    const { selectedConversation, messagesCursor, messagesHasMore, isLoadingOlderMessages } = get();
    const conversationId = getConversationId(selectedConversation);
    if (!conversationId || !messagesHasMore || isLoadingOlderMessages) return null;

    set({ isLoadingOlderMessages: true });
    try {
      const res = await axiosInstance.get(`/messages/conversation/${conversationId}`, {
        params: { limit: 30, before: messagesCursor },
      });

      const olderMessages = res.data.messages || [];

      set((state) => ({
        messages: [...olderMessages, ...state.messages],
        messagesCursor: res.data.nextBefore || state.messagesCursor,
        messagesHasMore: Boolean(res.data.hasMore),
      }));

      return olderMessages.length;
    } catch {
      return null;
    } finally {
      set({ isLoadingOlderMessages: false });
    }
  },

  markMessagesAsRead: async (conversation) => {
    try {
      const targetConversationId = getConversationId(conversation);
      if (!targetConversationId) return;

      const res = await axiosInstance.post(`/messages/conversation/read/${targetConversationId}`);
      const updatedConversationId = String(res.data?.conversationId || "");
      const readAt = res.data?.readAt || new Date().toISOString();
      const messageIds = Array.isArray(res.data?.messageIds) ? res.data.messageIds.map((id) => String(id)) : null;
      if (!updatedConversationId) return;

      set((state) => ({
        messages: state.messages.map((message) => {
          const messageConversationId = String(message?.conversationId || "");
          if (messageConversationId !== updatedConversationId) return message;
          if (messageIds && messageIds.length > 0 && !messageIds.includes(getMessageId(message))) return message;

          const receiverId = getUserId(message.receiverId);
          const authUserId = getUserId(useAuthStore.getState().authUser);

          if (receiverId !== authUserId) return message;
          if (message.status === "read") return message;
          return { ...message, status: "read", readAt };
        }),
        conversations: upsertConversation(state.conversations, {
          _id: updatedConversationId,
          unreadCount: 0,
        }),
      }));
    } catch {
      // Silent: failing to mark read shouldn't block chat UX.
    }
  },

  sendMessage: async (messageData) => {
    const { selectedConversation } = get();
    const conversationId = getConversationId(selectedConversation);
    if (!conversationId) return null;

    const clientMessageId = messageData.clientMessageId || createClientMessageId();
    const authUser = useAuthStore.getState().authUser;
    const optimisticMessage = {
      _id: `temp:${clientMessageId}`,
      clientMessageId,
      conversationId,
      senderId: authUser,
      receiverId: selectedConversation?.kind === "direct" ? selectedConversation?.participant : null,
      text: messageData.text || "",
      attachments: messageData.attachments || [],
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    set((state) => ({
      messages: upsertMessage(state.messages, optimisticMessage),
      pendingMessages: {
        ...state.pendingMessages,
        [clientMessageId]: {
          clientMessageId,
          conversationId,
          payload: { ...messageData, clientMessageId },
          attempts: Number(state.pendingMessages?.[clientMessageId]?.attempts || 0),
        },
      },
    }));

    try {
      const res = await axiosInstance.post(`/messages/conversation/send/${conversationId}`, {
        ...messageData,
        clientMessageId,
      }, {
        headers: { "x-idempotency-key": clientMessageId },
      });

      set((state) => ({
        messages: upsertMessage(state.messages, {
          ...res.data,
          status: res.data?.status || "sent",
        }),
        conversations: upsertConversation(state.conversations, {
          _id: conversationId,
          lastMessage: res.data,
          lastActivityAt: res.data.createdAt,
          unreadCount: 0,
        }),
        pendingMessages: Object.fromEntries(
          Object.entries(state.pendingMessages || {}).filter(([key]) => key !== clientMessageId)
        ),
      }));
      return res.data;
    } catch (error) {
      const errorMessage = getSendErrorMessage(error);

      set((state) => ({
        messages: state.messages.map((message) =>
          getClientMessageId(message) === clientMessageId
            ? { ...message, status: "failed", errorMessage }
            : message
        ),
        pendingMessages: {
          ...state.pendingMessages,
          [clientMessageId]: {
            ...(state.pendingMessages?.[clientMessageId] || {}),
            clientMessageId,
            conversationId,
            payload: { ...messageData, clientMessageId },
            errorMessage,
            attempts: Number(state.pendingMessages?.[clientMessageId]?.attempts || 0) + 1,
          },
        },
      }));

      toast.error(errorMessage);
      throw error;
    }
  },

  retryPendingMessage: async (clientMessageId) => {
    const pending = get().pendingMessages?.[clientMessageId];
    if (!pending) return null;

    set((state) => ({
      messages: state.messages.map((message) =>
        getClientMessageId(message) === clientMessageId
          ? { ...message, status: "pending", errorMessage: "" }
          : message
      ),
    }));

    return get().sendMessage(pending.payload);
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    if (!socket || !authUser) {
      return;
    }

    const handleIncomingMessage = (incomingMessage) => {
      const authUserId = getUserId(authUser);
      const selectedConversationId = getConversationId(get().selectedConversation);

      const receiverId = getUserId(incomingMessage.receiverId);
      const incomingConversationId = getConversationId(incomingMessage?.conversationId);
      const isIncomingToMe =
        receiverId === authUserId || (incomingConversationId && incomingMessage.receiverId === null);

      const isSelectedConversation =
        Boolean(selectedConversationId) && incomingConversationId === selectedConversationId;

      const existing = get().conversations.find(
        (conversation) => getConversationId(conversation) === String(incomingMessage.conversationId || "")
      );

      if (!existing) {
        get().getConversations();
      } else {
        set((state) => ({
          conversations: upsertConversation(state.conversations, {
            _id: incomingMessage.conversationId,
            lastMessage: incomingMessage,
            lastActivityAt: incomingMessage.createdAt,
            unreadCount:
              isIncomingToMe && !isSelectedConversation ? Number(existing?.unreadCount || 0) + 1 : 0,
          }),
        }));
      }

      if (isSelectedConversation) {
        set((state) => ({
          messages: upsertMessage(state.messages, {
            ...incomingMessage,
            status: incomingMessage.status || "sent",
          }),
        }));
      }

      if (isIncomingToMe && incomingMessage?._id && incomingConversationId) {
        socket.emit(SOCKET_EVENTS.MESSAGE_DELIVERED, {
          messageId: incomingMessage._id,
          conversationId: incomingConversationId,
        });
      }
    };

    const handleDeliveredMessage = (receipt) => {
      set((state) => ({
        messages: state.messages.map((message) =>
          getMessageId(message) === String(receipt.messageId)
            ? {
                ...message,
                status: receipt.status || "delivered",
                deliveredAt: receipt.deliveredAt || message.deliveredAt,
                deliveredTo: Array.isArray(receipt.deliveredTo) ? receipt.deliveredTo : message.deliveredTo,
              }
            : message
        ),
      }));
    };

    const handleReadMessage = (payload) => {
      const conversationId = String(payload?.conversationId || "");
      const readerId = getUserId(payload?.readBy || payload?.readerId);
      const readAt = payload?.readAt || new Date().toISOString();
      const messageIds = Array.isArray(payload?.messageIds) ? payload.messageIds.map((id) => String(id)) : null;
      const hasExplicitMessageIds = Array.isArray(messageIds);
      if (!conversationId) return;

      set((state) => ({
        messages: state.messages.map((message) => {
          if (String(message?.conversationId || "") !== conversationId) return message;
          if (hasExplicitMessageIds && !messageIds.includes(getMessageId(message))) return message;
          if (!["sent", "delivered"].includes(message.status || "sent")) return message;
          if (message.status === "read") return message;
          return {
            ...message,
            status: "read",
            readAt,
            readBy: Array.isArray(message.readBy)
              ? message.readBy.some((entry) => getUserId(entry?.user) === readerId)
                ? message.readBy
                : [...message.readBy, { user: readerId, readAt }]
              : [{ user: readerId, readAt }],
          };
        }),
        conversations: upsertConversation(state.conversations, {
          _id: conversationId,
          unreadCount: 0,
        }),
      }));
    };

    const handleTypingStart = (payload) => {
      const userId = getUserId(payload?.userId);
      if (!userId) return;

      set((state) => ({
        typingUsers: [...new Set([...(Array.isArray(state.typingUsers) ? state.typingUsers : []), userId])],
      }));
    };

    const handleTypingStop = (payload) => {
      const userId = getUserId(payload?.userId);
      if (!userId) return;

      set((state) => ({
        typingUsers: (Array.isArray(state.typingUsers) ? state.typingUsers : []).filter((id) => id !== userId),
      }));
    };

    socket.off(SOCKET_EVENTS.MESSAGE_NEW);
    socket.off(SOCKET_EVENTS.MESSAGE_SENT);
    socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE);
    socket.off(SOCKET_EVENTS.MESSAGE_READ_UPDATE);
    socket.off(SOCKET_EVENTS.TYPING_START);
    socket.off(SOCKET_EVENTS.TYPING_STOP);

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleIncomingMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_SENT, handleIncomingMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, handleDeliveredMessage);
    socket.on(SOCKET_EVENTS.MESSAGE_READ_UPDATE, handleReadMessage);
    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart);
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop);
    socket.on(SOCKET_EVENTS.MESSAGE_SYNC, () => {
      get().getConversations();
      if (get().selectedConversation?._id) {
        get().getMessages(get().selectedConversation);
      }
      Object.keys(get().pendingMessages || {}).forEach((clientMessageId) => {
        const message = (get().messages || []).find((item) => getClientMessageId(item) === clientMessageId);
        if (message?.status === "pending") {
          get().retryPendingMessage(clientMessageId);
        }
      });
    });
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
    socket.off(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE);
    socket.off(SOCKET_EVENTS.MESSAGE_READ_UPDATE);
    socket.off(SOCKET_EVENTS.TYPING_START);
    socket.off(SOCKET_EVENTS.TYPING_STOP);
    socket.off(SOCKET_EVENTS.MESSAGE_SYNC);
  },

  setSelectedConversation: (selectedConversation) => {
    const socket = useAuthStore.getState().socket;
    const previousConversationId = getConversationId(get().selectedConversation);
    const nextConversationId = getConversationId(selectedConversation);

    if (socket?.connected && previousConversationId && previousConversationId !== nextConversationId) {
      socket.emit(SOCKET_EVENTS.CONVERSATION_LEAVE, previousConversationId);
    }

    if (socket?.connected && nextConversationId && previousConversationId !== nextConversationId) {
      socket.emit(SOCKET_EVENTS.CONVERSATION_JOIN, nextConversationId);
    }

    set({
      selectedConversation,
      typingUsers: [],
      chatSearchResults: [],
      highlightMessageId: null,
    });
  },
}));
