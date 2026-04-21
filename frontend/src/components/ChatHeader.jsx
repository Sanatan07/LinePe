import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BellOff,
  BellRing,
  ChevronDown,
  EyeOff,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  UserRoundCog,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

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
    users,
    getUsers,
    updateGroup,
    getGroupMedia,
    groupMediaByConversationId,
    isGroupMediaLoading,
    addGroupMembers,
    removeGroupMember,
    setGroupAdmin,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [draftGroupName, setDraftGroupName] = useState("");
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [selectedNewMemberIds, setSelectedNewMemberIds] = useState([]);

  const isDirect = selectedConversation?.kind !== "group";
  const participant = isDirect ? selectedConversation?.participant : null;
  const group = !isDirect ? selectedConversation?.group : null;

  const isTyping = isDirect ? Boolean(typingUsers?.[participant?._id]) : false;
  const isOnline = isDirect ? onlineUsers.includes(participant?._id) : false;
  const lastSeenText = participant?.lastSeen
    ? `Last seen ${formatMessageTime(participant.lastSeen)}`
    : "Offline";

  const conversation = Array.isArray(conversations)
    ? conversations.find((item) => String(item?._id || "") === String(selectedConversation?._id || ""))
    : null;

  const title = isDirect ? participant?.fullName : group?.name || "Group";
  const subtitle = isDirect
    ? isTyping
      ? "Typing…"
      : isOnline
        ? "Online"
        : lastSeenText
    : `${(group?.members?.length || 0)} members`;
  const adminIds = useMemo(
    () => new Set((group?.admins || []).map((admin) => String(admin?._id || admin))),
    [group?.admins]
  );
  const memberIds = useMemo(
    () => new Set((group?.members || []).map((member) => String(member?._id || member))),
    [group?.members]
  );
  const isCurrentUserAdmin = adminIds.has(String(authUser?._id || ""));
  const groupMedia = groupMediaByConversationId?.[selectedConversation?._id] || [];
  const addableUsers = (Array.isArray(users) ? users : []).filter(
    (user) =>
      String(user?._id || "") !== String(authUser?._id || "") &&
      !memberIds.has(String(user?._id || ""))
  );

  useEffect(() => {
    if (!isGroupPanelOpen || isDirect) return;
    getUsers();
  }, [getUsers, isDirect, isGroupPanelOpen]);

  useEffect(() => {
    if (!isGroupPanelOpen || !isMediaOpen || isDirect) return;
    if (selectedConversation?._id) getGroupMedia(selectedConversation._id);
  }, [getGroupMedia, isDirect, isGroupPanelOpen, isMediaOpen, selectedConversation?._id]);

  if (!selectedConversation) return null;

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={(isDirect ? participant?.profilePic : group?.avatar) || "/avatar.png"}
                alt={title}
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              className={`font-medium text-left ${!isDirect ? "hover:underline" : ""}`}
              onClick={() => {
                if (!isDirect) {
                  setDraftGroupName(group?.name || "");
                  setIsGroupPanelOpen(true);
                }
              }}
            >
              {title}
            </button>
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
                  {conversation?.muted ? <BellRing className="size-4" /> : <BellOff className="size-4" />}
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
                  {conversation?.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
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
              {isDirect && (
                <li>
                  <button
                    type="button"
                    onClick={() => setBlockStatus({ userId: participant?._id, enabled: true })}
                  >
                    <Shield className="size-4" />
                    Block
                  </button>
                </li>
              )}
              {!isDirect && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftGroupName(group?.name || "");
                      setIsGroupPanelOpen(true);
                    }}
                  >
                    <UserRoundCog className="size-4" />
                    Group profile
                  </button>
                </li>
              )}
              {!isDirect && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCurrentUserAdmin) {
                        toast.error("Only group admins can add members");
                        return;
                      }
                      setDraftGroupName(group?.name || "");
                      setIsGroupPanelOpen(true);
                      setIsAddMembersOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Add new member
                  </button>
                </li>
              )}
              {isDirect && (
                <li>
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm(
                        "Delete this chat and all its messages permanently?"
                      );
                      if (!confirmed) return;
                      await deleteConversation(selectedConversation);
                    }}
                  >
                    <Trash2 className="size-4" />
                    Delete chat
                  </button>
                </li>
              )}
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

      {isGroupPanelOpen && !isDirect && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md bg-base-100 border-l border-base-300 shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-base-100 border-b border-base-300 p-3 flex items-center justify-between">
              <h3 className="font-semibold">Group profile</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => {
                  setIsGroupPanelOpen(false);
                  setIsAddMembersOpen(false);
                  setSelectedNewMemberIds([]);
                }}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center gap-3 border-b border-base-300">
              <img
                src={group?.avatar || "/avatar.png"}
                alt={title}
                className="size-28 rounded-full object-cover border border-base-300"
              />
              <div className="w-full flex items-center gap-2">
                <input
                  className="input input-bordered input-sm flex-1 text-center font-medium"
                  value={draftGroupName}
                  onChange={(e) => setDraftGroupName(e.target.value)}
                  disabled={!isCurrentUserAdmin}
                  maxLength={60}
                />
                {isCurrentUserAdmin && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      const nextName = draftGroupName.trim();
                      if (!nextName) {
                        toast.error("Group name is required");
                        return;
                      }
                      await updateGroup({ conversationId: selectedConversation._id, name: nextName });
                    }}
                  >
                    Save
                  </button>
                )}
              </div>
            </div>

            <div className="border-b border-base-300">
              <button
                type="button"
                className="w-full p-4 flex items-center justify-between text-left hover:bg-base-200"
                onClick={() => setIsMediaOpen((value) => !value)}
              >
                <span className="font-medium">Media</span>
                <ChevronDown className={`size-5 transition-transform ${isMediaOpen ? "rotate-180" : ""}`} />
              </button>
              {isMediaOpen && (
                <div className="px-4 pb-4">
                  {isGroupMediaLoading && (
                    <div className="text-sm text-base-content/60">Loading media...</div>
                  )}
                  {!isGroupMediaLoading && groupMedia.length === 0 && (
                    <div className="text-sm text-base-content/60">No media shared yet</div>
                  )}
                  {!isGroupMediaLoading && groupMedia.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {groupMedia.map((item) => (
                        <a
                          key={item._id}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="aspect-square rounded-md overflow-hidden bg-base-200 border border-base-300"
                        >
                          <img src={item.url} alt={item.originalName || "Group media"} className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-b border-base-300">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{group?.members?.length || 0} members</div>
                {isCurrentUserAdmin && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsAddMembersOpen((value) => !value)}
                  >
                    <Plus className="size-4" />
                    Add
                  </button>
                )}
              </div>

              {isAddMembersOpen && (
                <div className="mt-3 border border-base-300 rounded-md p-2">
                  <div className="max-h-48 overflow-auto">
                    {addableUsers.length === 0 && (
                      <div className="text-sm text-base-content/60 p-2">No new members available</div>
                    )}
                    {addableUsers.map((user) => (
                      <label key={user._id} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-base-200 rounded">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedNewMemberIds.includes(user._id)}
                          onChange={(e) => {
                            setSelectedNewMemberIds((prev) =>
                              e.target.checked ? [...prev, user._id] : prev.filter((id) => id !== user._id)
                            );
                          }}
                        />
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-8 rounded-full object-cover" />
                        <span className="text-sm">{user.fullName}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm w-full mt-2"
                    disabled={selectedNewMemberIds.length === 0}
                    onClick={async () => {
                      const updated = await addGroupMembers({
                        conversationId: selectedConversation._id,
                        memberIds: selectedNewMemberIds,
                      });
                      if (updated) {
                        setSelectedNewMemberIds([]);
                        setIsAddMembersOpen(false);
                      }
                    }}
                  >
                    Add selected
                  </button>
                </div>
              )}
            </div>

            <div className="p-2">
              {(group?.members || []).map((member) => {
                const memberId = String(member?._id || member);
                const isMemberAdmin = adminIds.has(memberId);
                const isSelf = memberId === String(authUser?._id || "");
                return (
                  <div key={memberId} className="group flex items-center gap-3 p-2 rounded-md hover:bg-base-200">
                    <img src={member?.profilePic || "/avatar.png"} alt={member?.fullName || "Member"} className="size-10 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{member?.fullName || "Member"} {isSelf ? "(You)" : ""}</div>
                      <div className="text-xs text-base-content/60">{isMemberAdmin ? "Admin" : "Member"}</div>
                    </div>
                    {isCurrentUserAdmin && !isSelf && (
                      <div className="dropdown dropdown-end invisible group-hover:visible focus-within:visible">
                        <button type="button" className="btn btn-ghost btn-sm btn-square">
                          <MoreVertical className="size-4" />
                        </button>
                        <ul className="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-2 shadow border border-base-300">
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                setGroupAdmin({
                                  conversationId: selectedConversation._id,
                                  memberId,
                                  enabled: !isMemberAdmin,
                                })
                              }
                            >
                              <UserRoundCog className="size-4" />
                              {isMemberAdmin ? "Remove admin" : "Make admin"}
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                removeGroupMember({
                                  conversationId: selectedConversation._id,
                                  memberId,
                                })
                              }
                            >
                              <UserMinus className="size-4" />
                              Remove from group
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
