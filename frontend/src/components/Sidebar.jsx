import { useEffect, useMemo, useState } from "react";
import { Pin, Users } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { formatMessageTime } from "../lib/utils";

const Sidebar = () => {
  const {
    getConversations,
    getUsers,
    users,
    createGroup,
    isGroupCreating,
    conversations,
    selectedConversation,
    setSelectedConversation,
    isConversationsLoading,
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  useEffect(() => {
    getConversations();
    getUsers();
  }, [getConversations, getUsers]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = Array.isArray(conversations) ? conversations : [];

    if (showOnlineOnly) {
      list = list.filter((conversation) => onlineUsers.includes(conversation.participant?._id));
    }

    if (q) {
      list = list.filter((conversation) =>
        String(conversation.participant?.fullName || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [conversations, onlineUsers, search, showOnlineOnly]);

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
        </div>
        <div className="mt-3 hidden lg:block">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered input-sm w-full"
            placeholder="Search chats…"
            type="text"
          />
        </div>
        <div className="mt-3 hidden lg:flex">
          <button
            type="button"
            className="btn btn-sm btn-outline w-full"
            onClick={() => {
              setGroupName("");
              setSelectedMemberIds([]);
              setIsGroupModalOpen(true);
            }}
            disabled={!authUser}
          >
            New group
          </button>
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
          const isDirect = conversation.kind !== "group";
          const participant = isDirect ? conversation.participant : null;
          const group = !isDirect ? conversation.group : null;
          const title = isDirect ? participant?.fullName : group?.name || "Group";
          const avatar = isDirect ? participant?.profilePic : group?.avatar;
          const isOnline = isDirect ? onlineUsers.includes(participant?._id) : false;
          const unreadCount = Number(conversation.unreadCount || 0);
          const previewText =
            conversation.lastMessage?.text ||
            (conversation.lastMessage?.image ? "Photo" : "No messages yet");

          return (
            <button
              key={conversation._id}
              onClick={() => setSelectedConversation(conversation)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedConversation?._id === conversation._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={avatar || "/avatar.png"}
                  alt={title}
                  className="size-12 object-cover rounded-full"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 size-3 bg-primary rounded-full ring-2 ring-zinc-900 lg:hidden" />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium truncate">{title}</div>
                  <div className="flex items-center gap-2">
                    {conversation.pinned && <Pin className="size-4 text-base-content/50" />}
                    {conversation.lastActivityAt && (
                      <div className="text-xs text-zinc-500 whitespace-nowrap">
                        {formatMessageTime(conversation.lastActivityAt)}
                      </div>
                    )}
                    {unreadCount > 0 && (
                      <span className="min-w-6 h-6 px-2 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-primary text-primary-content">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
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

      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-base-100 w-full max-w-md rounded-lg border border-base-300 shadow p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Create group</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsGroupModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              <input
                className="input input-bordered w-full"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={60}
              />

              <div className="border border-base-300 rounded-md p-2 max-h-56 overflow-auto">
                <div className="text-xs text-base-content/60 mb-2">Select members</div>
                {(Array.isArray(users) ? users : [])
                  .filter((u) => String(u?._id || "") !== String(authUser?._id || ""))
                  .map((u) => {
                    const checked = selectedMemberIds.includes(u._id);
                    return (
                      <label key={u._id} className="flex items-center gap-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={checked}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setSelectedMemberIds((prev) =>
                              enabled ? [...prev, u._id] : prev.filter((id) => id !== u._id)
                            );
                          }}
                        />
                        <span className="text-sm">{u.fullName}</span>
                      </label>
                    );
                  })}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={isGroupCreating}
                onClick={async () => {
                  try {
                    await createGroup({ name: groupName, memberIds: selectedMemberIds });
                    setIsGroupModalOpen(false);
                  } catch (error) {
                    toast.error(error?.response?.data?.message || "Failed to create group");
                  }
                }}
              >
                {isGroupCreating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
