import { useEffect, useLayoutEffect, useRef } from "react";
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
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isPrependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    markMessagesAsRead(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [
    selectedUser?._id,
    getMessages,
    markMessagesAsRead,
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

  const handleScroll = async () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop > 40) return;
    if (!messagesHasMore || isLoadingOlderMessages) return;

    prevScrollHeightRef.current = container.scrollHeight;
    isPrependingRef.current = true;
    await loadOlderMessages();
  };

  if (!selectedUser) {
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

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isOwnMessage ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"
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
                {message.text && <p>{message.text}</p>}
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
