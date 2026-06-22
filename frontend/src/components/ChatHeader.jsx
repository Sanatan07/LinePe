"use client";

import {
  Archive,
  BellOff,
  BellRing,
  EyeOff,
  Pin,
  PinOff,
  Shield,
  Trash2,
  X,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";

const ChatHeader = () => {
  const {
    selectedConversation,
    setSelectedConversation,
    typingUsers,
    conversations,
    setConversationFlag,
    setBlockStatus,
    deleteConversation,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedConversation) return null;

  const participant = selectedConversation.participant;
  const isTyping = (typingUsers || []).includes(participant?._id);
  const isOnline = onlineUsers.includes(participant?._id);
  const lastSeenText = participant?.lastSeen
    ? `Last seen ${formatMessageTime(participant.lastSeen)}`
    : "Offline";

  const conversation = Array.isArray(conversations)
    ? conversations.find(
        (item) =>
          String(item?._id || "") === String(selectedConversation?._id || ""),
      )
    : null;

  const title = participant?.fullName || "Chat";
  const subtitle = isTyping ? "Typing..." : isOnline ? "Online" : lastSeenText;

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={participant?.profilePic || "/avatar.png"} alt={title} />
            </div>
          </div>

          <div>
            <div className="font-medium text-left">{title}</div>
            <p className="text-sm text-base-content/70">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="dropdown dropdown-end">
            <button type="button" className="btn btn-ghost btn-sm">
              Manage
            </button>
            <ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow border border-base-300">
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setConversationFlag({
                      conversationId: selectedConversation._id,
                      flag: "mute",
                      enabled: !conversation?.muted,
                    })
                  }
                >
                  {conversation?.muted ? (
                    <BellRing className="size-4" />
                  ) : (
                    <BellOff className="size-4" />
                  )}
                  {conversation?.muted ? "Unmute" : "Mute"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setConversationFlag({
                      conversationId: selectedConversation._id,
                      flag: "pin",
                      enabled: !conversation?.pinned,
                    })
                  }
                >
                  {conversation?.pinned ? (
                    <PinOff className="size-4" />
                  ) : (
                    <Pin className="size-4" />
                  )}
                  {conversation?.pinned ? "Unpin" : "Pin"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setConversationFlag({
                      conversationId: selectedConversation._id,
                      flag: "archive",
                      enabled: !conversation?.archived,
                    })
                  }
                >
                  <Archive className="size-4" />
                  {conversation?.archived ? "Unarchive" : "Archive"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setConversationFlag({
                      conversationId: selectedConversation._id,
                      flag: "hide",
                      enabled: true,
                    })
                  }
                >
                  <EyeOff className="size-4" />
                  Hide
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() =>
                    setBlockStatus({ userId: participant?._id, enabled: true })
                  }
                >
                  <Shield className="size-4" />
                  Block
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = window.confirm(
                      "Delete this chat and all its messages permanently?",
                    );
                    if (!confirmed) return;
                    await deleteConversation(selectedConversation);
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete chat
                </button>
              </li>
            </ul>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedConversation(null)}
            type="button"
          >
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
