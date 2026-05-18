"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCheck, Clock3, RotateCcw } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const getUserId = (value) => String(value?._id || value || "");

const getConversationMembers = (conversation) => {
  if (!conversation) return [];
  return [conversation.participant].filter(Boolean);
};

const getReceiptUserId = (entry) => getUserId(entry?.user);

const getMessageRecipients = (message, conversation) => {
  const senderId = getUserId(message?.senderId);
  const receiverId = getUserId(message?.receiverId);

  if (receiverId) return [receiverId];

  return [...new Set(getConversationMembers(conversation).map(getUserId).filter(Boolean))].filter(
    (recipientId) => recipientId !== senderId
  );
};

const getReceiptCount = (message, field) =>
  new Set((Array.isArray(message?.[field]) ? message[field] : []).map(getReceiptUserId).filter(Boolean)).size;

const getDeliveredLikeCount = (message) =>
  new Set(
    [
      ...(Array.isArray(message?.deliveredTo) ? message.deliveredTo : []),
      ...(Array.isArray(message?.readBy) ? message.readBy : []),
    ]
      .map(getReceiptUserId)
      .filter(Boolean)
  ).size;

const getStatusLabel = ({ message, conversation, status }) => {
  const totalRecipients = getMessageRecipients(message, conversation).length;
  if (status === "pending") return "Pending";
  if (status === "sent") return "Sent";
  if (status === "failed") return message?.errorMessage || "Failed to send. Retry";

  if (status === "delivered") {
    const deliveredCount = Math.min(totalRecipients, getDeliveredLikeCount(message));
    return totalRecipients > 1 ? `Delivered to ${deliveredCount}/${totalRecipients}` : "Delivered";
  }

  if (status === "read") {
    const readCount = Math.min(totalRecipients, getReceiptCount(message, "readBy"));
    return totalRecipients > 1 ? `Read by ${readCount}/${totalRecipients}` : "Read";
  }

  return "";
};

const MAX_COLLAPSED_MESSAGE_LENGTH = 50;

const MessageStatusIndicator = ({ message, conversation, status, errorMessage, onRetry }) => {
  const iconClass = "size-3.5";
  const label = getStatusLabel({ message, conversation, status });

  if (status === "pending") {
    return (
      <span className="inline-flex items-center text-base-content/50" title={label} aria-label={label}>
        <Clock3 className={iconClass} aria-hidden="true" />
      </span>
    );
  }

  if (status === "sent") {
    return (
      <span className="inline-flex items-center text-base-content/60" title={label} aria-label={label}>
        <Check className={iconClass} aria-hidden="true" />
      </span>
    );
  }

  if (status === "delivered") {
    return (
      <span className="inline-flex items-center text-base-content/60" title={label} aria-label={label}>
        <CheckCheck className={iconClass} aria-hidden="true" />
      </span>
    );
  }

  if (status === "read") {
    return (
      <span className="inline-flex items-center text-primary" title={label} aria-label={label}>
        <CheckCheck className={iconClass} aria-hidden="true" />
      </span>
    );
  }

  if (status === "failed") {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-0.5 text-error hover:text-error/80"
        title={errorMessage || label}
        aria-label={label}
        onClick={onRetry}
      >
        <AlertCircle className={iconClass} aria-hidden="true" />
        <RotateCcw className="size-3" aria-hidden="true" />
      </button>
    );
  }

  return null;
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    markMessagesAsRead,
    loadOlderMessages,
    isLoadingOlderMessages,
    messagesHasMore,
    isMessagesLoading,
    chatSearchResults,
    highlightMessageId,
    isChatSearchLoading,
    jumpToMessage,
    retryPendingMessage,
    searchChat,
    selectedConversation,
    typingUsers,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isPrependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMessageIds, setExpandedMessageIds] = useState(() => new Set());

  const activeSearchResults = useMemo(
    () => (Array.isArray(chatSearchResults) ? chatSearchResults : []),
    [chatSearchResults]
  );

  useEffect(() => {
    if (!selectedConversation?._id) return;

    getMessages(selectedConversation);
    markMessagesAsRead(selectedConversation);

    searchChat({ userId: selectedConversation.participant?._id, query: "" });
  }, [
    selectedConversation,
    getMessages,
    markMessagesAsRead,
    searchChat,
  ]);

  useEffect(() => {
    if (isPrependingRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 120;

    if (isNearBottom && messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useLayoutEffect(() => {
    if (!isPrependingRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const nextScrollHeight = container.scrollHeight;
    const delta = nextScrollHeight - prevScrollHeightRef.current;
    container.scrollTop = container.scrollTop + delta;
    isPrependingRef.current = false;
  }, [messages]);

  useEffect(() => {
    if (!highlightMessageId) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const element = container.querySelector(`[data-message-id="${highlightMessageId}"]`);
    if (element?.scrollIntoView) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightMessageId, messages]);

  const handleScroll = async () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop > 40) return;
    if (!messagesHasMore || isLoadingOlderMessages) return;

    prevScrollHeightRef.current = container.scrollHeight;
    isPrependingRef.current = true;
    await loadOlderMessages();
  };

  const toggleExpandedMessage = (messageId) => {
    const targetMessageId = String(messageId || "");
    if (!targetMessageId) return;

    setExpandedMessageIds((current) => {
      const next = new Set(current);
      if (next.has(targetMessageId)) next.delete(targetMessageId);
      else next.add(targetMessageId);
      return next;
    });
  };

  if (!selectedConversation) {
    return null;
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="px-4 pt-3">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={searchQuery}
            placeholder="Search in chat..."
            onChange={(e) => {
              const next = e.target.value;
              setSearchQuery(next);
              searchChat({ userId: selectedConversation.participant?._id, query: next });
            }}
          />

          {searchQuery.trim() && (
            <div className="border border-base-300 rounded-md p-2 max-h-44 overflow-auto bg-base-100">
              {isChatSearchLoading && (
                <div className="text-xs text-base-content/50">Searching…</div>
              )}
              {!isChatSearchLoading && activeSearchResults.length === 0 && (
                <div className="text-xs text-base-content/50">No matches</div>
              )}
              {!isChatSearchLoading &&
                activeSearchResults.map((result) => (
                  <button
                    key={result._id}
                    type="button"
                    className="w-full text-left text-sm py-1 hover:bg-base-200 rounded px-2"
                  onClick={() => {
                    jumpToMessage({
                      conversationId: selectedConversation._id,
                      createdAt: result.createdAt,
                      messageId: result._id,
                    });
                  }}
                >
                    <span className="text-xs text-base-content/50 mr-2">
                      {formatMessageTime(result.createdAt)}
                    </span>
                    <span className="truncate">{result.text}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoadingOlderMessages && (
          <div className="text-center text-xs text-base-content/50">Loading older messages...</div>
        )}
        {messages.map((message) => {
          const messageSenderId = getUserId(message.senderId);
          const currentUserId = getUserId(authUser);
          const isOwnMessage = messageSenderId === currentUserId;
          const status = message?.status || "sent";
          const messageId = String(message._id || message.clientMessageId || "");
          const messageText = String(message.text || "");
          const isLongMessage = messageText.length > MAX_COLLAPSED_MESSAGE_LENGTH;
          const isExpanded = expandedMessageIds.has(messageId);
          const visibleText =
            isLongMessage && !isExpanded
              ? `${messageText.slice(0, MAX_COLLAPSED_MESSAGE_LENGTH).trimEnd()}...`
              : messageText;

          return (
            <div
              key={message._id}
              data-message-id={messageId}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage
                        ? authUser.profilePic || "/avatar.png"
                        : message?.senderId?.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <div className="flex items-center gap-1.5">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                  {isOwnMessage && (
                    <span className="inline-flex items-center">
                      <MessageStatusIndicator
                        message={message}
                        conversation={selectedConversation}
                        status={status}
                        errorMessage={message.errorMessage}
                        onRetry={() => retryPendingMessage(message.clientMessageId)}
                      />
                    </span>
                  )}
                </div>
              </div>
              <div className="chat-bubble flex flex-col max-w-[min(78vw,28rem)] whitespace-pre-wrap break-words overflow-hidden">
                {Array.isArray(message.attachments) &&
                  message.attachments
                    .filter((attachment) => attachment?.type === "image" && attachment?.url)
                    .map((attachment) => (
                      <img
                        key={attachment.url}
                        src={attachment.url}
                        alt={attachment.originalName || "Attachment"}
                        className="sm:max-w-50 rounded-md mb-2"
                      />
                    ))}

                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-50 rounded-md mb-2"
                  />
                )}
                {messageText && (
                  <p
                    className={`max-w-full whitespace-pre-wrap break-words leading-relaxed ${
                      highlightMessageId === messageId ? "bg-warning/20 rounded px-1" : ""
                    }`}
                  >
                    {visibleText}
                    {isLongMessage && (
                      <button
                        type="button"
                        className="ml-1 inline text-xs font-medium text-primary hover:text-primary/80"
                        onClick={() => toggleExpandedMessage(messageId)}
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {(typingUsers || []).includes(String(selectedConversation?.participant?._id || "")) && (
          <div className="chat chat-start">
            <div className="chat-bubble chat-bubble-base-200 text-sm text-base-content/60 py-2 px-3">
              Typing...
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
