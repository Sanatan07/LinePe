import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { formatMessageTime } from "../lib/utils";

const Sidebar = () => {
  const {
    getConversations,
    conversations,
    selectedUser,
    setSelectedUser,
    isConversationsLoading,
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  const filteredConversations = showOnlineOnly
    ? conversations.filter((conversation) => onlineUsers.includes(conversation.participant?._id))
    : conversations;

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredConversations.map((conversation) => {
          const participant = conversation.participant;
          const isOnline = onlineUsers.includes(participant?._id);
          const previewText =
            conversation.lastMessage?.text ||
            (conversation.lastMessage?.image ? "Photo" : "No messages yet");

          return (
            <button
              key={conversation._id}
              onClick={() => setSelectedUser(participant)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === participant?._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={participant?.profilePic || "/avatar.png"}
                  alt={participant?.fullName}
                  className="size-12 object-cover rounded-full"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{participant?.fullName}</div>
                  {conversation.lastActivityAt && (
                    <div className="text-xs text-zinc-500 whitespace-nowrap">
                      {formatMessageTime(conversation.lastActivityAt)}
                    </div>
                  )}
                </div>
                <div className="text-sm text-zinc-400 truncate">{previewText}</div>
              </div>
            </button>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            {authUser ? "No conversations yet" : "No chats available"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
