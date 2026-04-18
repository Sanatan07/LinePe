import { useEffect, useMemo, useState } from "react";
import { MessageSquarePlus, Pin, Search, Users } from "lucide-react";
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
    searchResults,
    selectedConversation,
    setSelectedConversation,
    isConversationsLoading,
    isUserSearchLoading,
    isOpeningConversation,
    isSendingInvite,
    searchUsers,
    clearUserSearch,
    sendInvite,
    openConversationFromUser,
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState("username");
  const [newChatQuery, setNewChatQuery] = useState("");
  const [lastResolvedQuery, setLastResolvedQuery] = useState("");
  const [inviteSentPhone, setInviteSentPhone] = useState("");

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  useEffect(() => {
    getConversations();
    getUsers();
  }, [getConversations, getUsers]);

  useEffect(() => {
    if (!isNewChatModalOpen) return undefined;

    const trimmed = newChatQuery.trim();
    if (!trimmed) {
      setLastResolvedQuery("");
      setInviteSentPhone("");
      clearUserSearch();
      return undefined;
    }

    setInviteSentPhone("");
    const timeoutId = setTimeout(async () => {
      setLastResolvedQuery(trimmed);
      await searchUsers(trimmed);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [newChatQuery, isNewChatModalOpen, searchUsers, clearUserSearch]);

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
            className="btn btn-sm btn-primary w-full"
            onClick={() => {
              setNewChatTab("username");
              setNewChatQuery("");
              setLastResolvedQuery("");
              setInviteSentPhone("");
              clearUserSearch();
              setIsNewChatModalOpen(true);
            }}
            disabled={!authUser}
          >
            <MessageSquarePlus className="size-4" />
            New chat
          </button>
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

      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-base-100 w-full max-w-lg rounded-lg border border-base-300 shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">New chat</h3>
                <p className="text-sm text-base-content/60">Search by username and open a chat instantly.</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  setNewChatQuery("");
                  setLastResolvedQuery("");
                  setInviteSentPhone("");
                  clearUserSearch();
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-4 tabs tabs-boxed w-fit">
              <button
                type="button"
                className={`tab ${newChatTab === "username" ? "tab-active" : ""}`}
                onClick={() => {
                  setNewChatTab("username");
                  setNewChatQuery("");
                  setLastResolvedQuery("");
                  setInviteSentPhone("");
                  clearUserSearch();
                }}
              >
                Username
              </button>
              <button
                type="button"
                className={`tab ${newChatTab === "phone" ? "tab-active" : ""}`}
                onClick={() => {
                  setNewChatTab("phone");
                  setNewChatQuery("");
                  setLastResolvedQuery("");
                  setInviteSentPhone("");
                  clearUserSearch();
                }}
              >
                Phone
              </button>
            </div>

            {newChatTab === "username" ? (
              <div className="mt-4 space-y-3">
                <label className="input input-bordered flex items-center gap-2">
                  <Search className="size-4 text-base-content/50" />
                  <input
                    type="text"
                    className="grow"
                    placeholder="Search by username or full name"
                    value={newChatQuery}
                    onChange={(e) => setNewChatQuery(e.target.value)}
                    maxLength={50}
                  />
                </label>

                <div className="border border-base-300 rounded-md max-h-80 overflow-auto">
                  {isUserSearchLoading && (
                    <div className="p-4 text-sm text-base-content/60">Searching...</div>
                  )}

                  {!isUserSearchLoading && !newChatQuery.trim() && (
                    <div className="p-4 text-sm text-base-content/60">
                      Start typing a username to find someone.
                    </div>
                  )}

                  {!isUserSearchLoading && newChatQuery.trim() && searchResults.length === 0 && (
                    <div className="p-4 text-sm text-base-content/60">No user found</div>
                  )}

                  {!isUserSearchLoading &&
                    searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-base-200 transition-colors"
                        onClick={async () => {
                          const conversation = await openConversationFromUser(user);
                          if (conversation) {
                            setIsNewChatModalOpen(false);
                            setNewChatQuery("");
                            setLastResolvedQuery("");
                            setInviteSentPhone("");
                            clearUserSearch();
                          }
                        }}
                        disabled={isOpeningConversation}
                      >
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                          className="size-12 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{user.fullName}</div>
                          <div className="text-sm text-base-content/60 truncate">
                            @{user.username || "no-username"}
                          </div>
                        </div>
                        <span className="btn btn-sm btn-outline">
                          {isOpeningConversation ? "Opening..." : "Message"}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="input input-bordered flex items-center gap-2">
                  <Search className="size-4 text-base-content/50" />
                  <input
                    type="text"
                    className="grow"
                    placeholder="Search by +91 phone number"
                    value={newChatQuery}
                    onChange={(e) => setNewChatQuery(e.target.value)}
                    maxLength={20}
                  />
                </label>

                <div className="border border-base-300 rounded-md max-h-80 overflow-auto">
                  {isUserSearchLoading && (
                    <div className="p-4 text-sm text-base-content/60">Searching...</div>
                  )}

                  {!isUserSearchLoading && !newChatQuery.trim() && (
                    <div className="p-4 text-sm text-base-content/60">
                      Enter a `+91` phone number to message someone or send an invite.
                    </div>
                  )}

                  {!isUserSearchLoading && searchResults.length > 0 &&
                    searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-base-200 transition-colors"
                        onClick={async () => {
                          const conversation = await openConversationFromUser(user);
                          if (conversation) {
                            setIsNewChatModalOpen(false);
                            setNewChatQuery("");
                            setLastResolvedQuery("");
                            setInviteSentPhone("");
                            clearUserSearch();
                          }
                        }}
                        disabled={isOpeningConversation}
                      >
                        <img
                          src={user.profilePic || "/avatar.png"}
                          alt={user.fullName}
                          className="size-12 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{user.fullName}</div>
                          <div className="text-sm text-base-content/60 truncate">
                            {user.username ? `@${user.username}` : "LinePe user"}
                          </div>
                        </div>
                        <span className="btn btn-sm btn-outline">
                          {isOpeningConversation ? "Opening..." : "Message"}
                        </span>
                      </button>
                    ))}

                  {!isUserSearchLoading && newChatQuery.trim() && searchResults.length === 0 && (
                    <div className="p-4 space-y-3">
                      {inviteSentPhone && inviteSentPhone === lastResolvedQuery ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-success">Invite sent</div>
                          <div className="text-sm text-base-content/60">
                            We created a shareable invite for {inviteSentPhone}.
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-base-content/60">
                            This phone number is not on LinePe yet.
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={isSendingInvite}
                            onClick={async () => {
                              const result = await sendInvite(lastResolvedQuery);
                              if (!result) return;

                              if (result.alreadyOnPlatform && result.user) {
                                const conversation = await openConversationFromUser(result.user);
                                if (conversation) {
                                  setIsNewChatModalOpen(false);
                                  setNewChatQuery("");
                                  setLastResolvedQuery("");
                                  setInviteSentPhone("");
                                  clearUserSearch();
                                }
                                return;
                              }

                              setInviteSentPhone(lastResolvedQuery);
                              toast.success(result.message || "Invite sent successfully");
                            }}
                          >
                            {isSendingInvite ? "Sending..." : "Invite to LinePe"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
