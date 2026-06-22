"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquarePlus, Pin, Search, Users } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { formatMessageTime } from "../lib/utils";

const Sidebar = ({ initialConversations = [], initialAuthUser = null }) => {
  const {
    getConversations,
    conversations,
    searchResults,
    searchResultsHasMore,
    isLoadingMoreSearchResults,
    selectedConversation,
    setSelectedConversation,
    isConversationsLoading,
    isUserSearchLoading,
    isOpeningConversation,
    isSendingInvite,
    searchUsers,
    loadMoreSearchUsers,
    clearUserSearch,
    sendInvite,
    openConversationFromUser,
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const displayAuthUser = authUser || initialAuthUser;
  const displayConversations =
    Array.isArray(conversations) && conversations.length > 0
      ? conversations
      : initialConversations;
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState("username");
  const [newChatQuery, setNewChatQuery] = useState("");
  const [lastResolvedQuery, setLastResolvedQuery] = useState("");
  const [inviteResult, setInviteResult] = useState(null); // { query, url }

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  useEffect(() => {
    if (!isNewChatModalOpen) return undefined;

    const trimmed = newChatQuery.trim();
    if (!trimmed) {
      clearUserSearch();
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      setLastResolvedQuery(trimmed);
      await searchUsers(trimmed);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [newChatQuery, isNewChatModalOpen, searchUsers, clearUserSearch]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = Array.isArray(displayConversations) ? displayConversations : [];

    if (showOnlineOnly) {
      list = list.filter((conversation) =>
        onlineUsers.includes(conversation.participant?._id),
      );
    }

    if (q) {
      list = list.filter((conversation) => {
        const label = conversation.participant?.fullName;
        return String(label || "")
          .toLowerCase()
          .includes(q);
      });
    }

    return list;
  }, [displayConversations, onlineUsers, search, showOnlineOnly]);

  if (isConversationsLoading && displayConversations.length === 0)
    return <SidebarSkeleton />;

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
              setInviteResult(null);
              clearUserSearch();
              setIsNewChatModalOpen(true);
            }}
            disabled={!displayAuthUser}
          >
            <MessageSquarePlus className="size-4" />
            New chat
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
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto w-full py-3">
        {filteredConversations.map((conversation) => {
          const participant = conversation.participant;
          const title = participant?.fullName || "Chat";
          const avatar = participant?.profilePic;
          const isOnline = onlineUsers.includes(participant?._id);
          const unreadCount = Number(conversation.unreadCount || 0);
          const previewText =
            conversation.lastMessage?.text ||
            (conversation.lastMessage?.image ||
            conversation.lastMessage?.attachments?.length
              ? "Photo"
              : "No messages yet");

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
                    {conversation.pinned && (
                      <Pin className="size-4 text-base-content/50" />
                    )}
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
                <div className="text-sm text-zinc-400 truncate">
                  {previewText}
                </div>
              </div>
            </button>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            {displayAuthUser ? "No conversations yet" : "No chats available"}
          </div>
        )}
      </div>

      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-base-100 w-full max-w-lg rounded-lg border border-base-300 shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">New chat</h3>
                <p className="text-sm text-base-content/60">
                  Search by username and open a chat instantly.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  setNewChatQuery("");
                  setLastResolvedQuery("");
                  setInviteResult(null);
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
                  setInviteResult(null);
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
                  setInviteResult(null);
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
                    onChange={(e) => {
                      setNewChatQuery(e.target.value);
                      setLastResolvedQuery("");
                      setInviteResult(null);
                    }}
                    maxLength={50}
                  />
                </label>

                <div className="border border-base-300 rounded-md max-h-80 overflow-auto">
                  {isUserSearchLoading && (
                    <div className="p-4 text-sm text-base-content/60">
                      Searching...
                    </div>
                  )}

                  {!isUserSearchLoading && !newChatQuery.trim() && (
                    <div className="p-4 text-sm text-base-content/60">
                      Start typing a username to find someone.
                    </div>
                  )}

                  {!isUserSearchLoading &&
                    newChatQuery.trim() &&
                    searchResults.length === 0 && (
                      <div className="p-4 space-y-3">
                        {inviteResult &&
                        inviteResult.query === lastResolvedQuery ? (
                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-success">
                              Invite created!
                            </div>
                            <div className="text-sm text-base-content/60">
                              Share this link with the person you want to
                              invite:
                            </div>
                            <div className="flex items-center gap-2 rounded-md border border-base-300 bg-base-200 px-3 py-2">
                              <span className="min-w-0 flex-1 truncate font-mono text-xs text-base-content/80">
                                {inviteResult.url}
                              </span>
                              <button
                                type="button"
                                className="btn btn-xs btn-ghost shrink-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    inviteResult.url,
                                  );
                                  toast.success("Link copied!");
                                }}
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-base-content/60">
                              No user found.
                            </div>
                            <div className="text-sm text-base-content/60">
                              Invite someone by email:
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="email"
                                id="usernameTabEmailInvite"
                                className="input input-bordered input-sm flex-1"
                                placeholder="friend@example.com"
                              />
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={isSendingInvite}
                                onClick={async () => {
                                  const emailInput = document.getElementById(
                                    "usernameTabEmailInvite",
                                  );
                                  const email = emailInput?.value?.trim() || "";
                                  if (!email)
                                    return toast.error(
                                      "Enter an email address",
                                    );
                                  const result = await sendInvite(email);
                                  if (!result) return;
                                  if (result.alreadyOnPlatform && result.user) {
                                    const conversation =
                                      await openConversationFromUser(
                                        result.user,
                                      );
                                    if (conversation) {
                                      setIsNewChatModalOpen(false);
                                      setNewChatQuery("");
                                      setLastResolvedQuery("");
                                      setInviteResult(null);
                                      clearUserSearch();
                                    }
                                    return;
                                  }
                                  setInviteResult({
                                    query: lastResolvedQuery,
                                    url:
                                      result.invite?.inviteUrl ||
                                      result.invite?.inviteLink ||
                                      "",
                                  });
                                  toast.success(
                                    result.message ||
                                      "Invite created successfully",
                                  );
                                }}
                              >
                                {isSendingInvite ? "Sending..." : "Invite"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  {!isUserSearchLoading &&
                    searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-base-200 transition-colors"
                        onClick={async () => {
                          const conversation =
                            await openConversationFromUser(user);
                          if (conversation) {
                            setIsNewChatModalOpen(false);
                            setNewChatQuery("");
                            setLastResolvedQuery("");
                            setInviteResult(null);
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
                          <div className="font-medium truncate">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-base-content/60 truncate">
                            @{user.username || "no-username"}
                          </div>
                        </div>
                        <span className="btn btn-sm btn-outline">
                          {isOpeningConversation ? "Opening..." : "Message"}
                        </span>
                      </button>
                    ))}

                  {!isUserSearchLoading && searchResultsHasMore && (
                    <div className="p-2 border-t border-base-300">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm w-full"
                        disabled={isLoadingMoreSearchResults}
                        onClick={() => loadMoreSearchUsers(newChatQuery.trim())}
                      >
                        {isLoadingMoreSearchResults
                          ? "Loading..."
                          : "Load more"}
                      </button>
                    </div>
                  )}
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
                    onChange={(e) => {
                      setNewChatQuery(e.target.value);
                      setLastResolvedQuery("");
                      setInviteResult(null);
                    }}
                    maxLength={20}
                  />
                </label>

                <div className="border border-base-300 rounded-md max-h-80 overflow-auto">
                  {isUserSearchLoading && (
                    <div className="p-4 text-sm text-base-content/60">
                      Searching...
                    </div>
                  )}

                  {!isUserSearchLoading && !newChatQuery.trim() && (
                    <div className="p-4 text-sm text-base-content/60">
                      Enter a `+91` phone number to message someone or send an
                      invite.
                    </div>
                  )}

                  {!isUserSearchLoading &&
                    searchResults.length > 0 &&
                    searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-base-200 transition-colors"
                        onClick={async () => {
                          const conversation =
                            await openConversationFromUser(user);
                          if (conversation) {
                            setIsNewChatModalOpen(false);
                            setNewChatQuery("");
                            setLastResolvedQuery("");
                            setInviteResult(null);
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
                          <div className="font-medium truncate">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-base-content/60 truncate">
                            {user.username
                              ? `@${user.username}`
                              : "LinePe user"}
                          </div>
                        </div>
                        <span className="btn btn-sm btn-outline">
                          {isOpeningConversation ? "Opening..." : "Message"}
                        </span>
                      </button>
                    ))}

                  {!isUserSearchLoading && searchResultsHasMore && (
                    <div className="p-2 border-t border-base-300">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm w-full"
                        disabled={isLoadingMoreSearchResults}
                        onClick={() => loadMoreSearchUsers(newChatQuery.trim())}
                      >
                        {isLoadingMoreSearchResults
                          ? "Loading..."
                          : "Load more"}
                      </button>
                    </div>
                  )}

                  {!isUserSearchLoading &&
                    newChatQuery.trim() &&
                    searchResults.length === 0 && (
                      <div className="p-4 space-y-3">
                        {inviteResult &&
                        inviteResult.query === lastResolvedQuery ? (
                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-success">
                              Invite created!
                            </div>
                            <div className="text-sm text-base-content/60">
                              Share this link with the person you want to
                              invite:
                            </div>
                            <div className="flex items-center gap-2 rounded-md border border-base-300 bg-base-200 px-3 py-2">
                              <span className="min-w-0 flex-1 truncate font-mono text-xs text-base-content/80">
                                {inviteResult.url}
                              </span>
                              <button
                                type="button"
                                className="btn btn-xs btn-ghost shrink-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    inviteResult.url,
                                  );
                                  toast.success("Link copied!");
                                }}
                              >
                                Copy
                              </button>
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
                                const result =
                                  await sendInvite(lastResolvedQuery);
                                if (!result) return;

                                if (result.alreadyOnPlatform && result.user) {
                                  const conversation =
                                    await openConversationFromUser(result.user);
                                  if (conversation) {
                                    setIsNewChatModalOpen(false);
                                    setNewChatQuery("");
                                    setLastResolvedQuery("");
                                    setInviteResult(null);
                                    clearUserSearch();
                                  }
                                  return;
                                }

                                setInviteResult({
                                  query: lastResolvedQuery,
                                  url:
                                    result.invite?.inviteUrl ||
                                    result.invite?.inviteLink ||
                                    "",
                                });
                                toast.success(
                                  result.message ||
                                    "Invite created successfully",
                                );
                              }}
                            >
                              {isSendingInvite
                                ? "Sending..."
                                : "Invite to LinePe"}
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
