import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCheck } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const getUserId = (value) => String(value?._id || value || "");

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
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isPrependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState("");

  const activeSearchResults = useMemo(
    () => (Array.isArray(chatSearchResults) ? chatSearchResults : []),
    [chatSearchResults]
  );

  useEffect(() => {
    if (!selectedConversation?._id) return;

    getMessages(selectedConversation);
    markMessagesAsRead(selectedConversation);
    subscribeToMessages();
    setSearchQuery("");

    if (selectedConversation.kind === "direct") {
      searchChat({ userId: selectedConversation.participant?._id, query: "" });
    } else {
      searchChat({ userId: "", query: "" });
    }

    return () => unsubscribeFromMessages();
  }, [
    selectedConversation?._id,
    getMessages,
    markMessagesAsRead,
    searchChat,
    subscribeToMessages,
    unsubscribeFromMessages,
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
            placeholder={selectedConversation.kind === "group" ? "Search in chat (direct only)…" : "Search in chat…"}
            onChange={(e) => {
              const next = e.target.value;
              setSearchQuery(next);
              if (selectedConversation.kind === "direct") {
                searchChat({ userId: selectedConversation.participant?._id, query: next });
              } else {
                searchChat({ userId: "", query: "" });
              }
            }}
            disabled={selectedConversation.kind === "group"}
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
          const showSenderName = selectedConversation.kind === "group" && !isOwnMessage;

          return (
            <div
              key={message._id}
              data-message-id={message._id}
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
                  {showSenderName && (
                    <span className="text-xs text-base-content/70">
                      {message?.senderId?.fullName || "Member"}
                    </span>
                  )}
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                  {isOwnMessage && (
                    <span className="inline-flex items-center">
                      {message?.deliveryState === "sending" && (
                        <span className="text-[10px] text-base-content/50">Sending...</span>
                      )}
                      {message?.deliveryState === "failed" && (
                        <button
                          type="button"
                          className="text-[10px] text-error underline"
                          onClick={() => retryPendingMessage(message.clientMessageId)}
                        >
                          Retry
                        </button>
                      )}
                      {status === "sent" && <Check className="size-4 text-base-content/50" />}
                      {status === "delivered" && (
                        <CheckCheck className="size-4 text-base-content/50" />
                      )}
                      {status === "read" && <CheckCheck className="size-4 text-primary" />}
                    </span>
                  )}
                </div>
              </div>
              <div className="chat-bubble flex flex-col">
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
                {message.text && (
                  <p className={highlightMessageId === message._id ? "bg-warning/20 rounded px-1" : ""}>
                    {message.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
