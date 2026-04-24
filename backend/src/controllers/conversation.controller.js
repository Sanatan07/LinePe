import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { sanitizePlainText } from "../lib/sanitize.js";
import mongoose from "mongoose";

const getOtherParticipant = (conversation, currentUserId) =>
  conversation.participants.find((participant) => String(participant._id) !== String(currentUserId));

const createParticipantKey = (participantIds) =>
  [...new Set(participantIds.map(String))].sort().join(":");

const toUserId = (value) => String(value?._id || value || "");

const formatConversationForUser = (conversation, currentUserId) => {
  const unreadCount = Number(conversation.unreadCounts?.get(String(currentUserId)) || 0);
  const isMuted = Boolean(conversation.mutedBy?.get(String(currentUserId)) || false);
  const isArchived = Boolean(conversation.archivedBy?.get(String(currentUserId)) || false);
  const isPinned = Boolean(conversation.pinnedBy?.get(String(currentUserId)) || false);
  const isHidden = Boolean(conversation.hiddenBy?.get(String(currentUserId)) || false);

  if (conversation.kind === "group") {
    return {
      _id: conversation._id,
      kind: "group",
      group: {
        name: conversation.groupName,
        avatar: conversation.groupAvatar,
        members: conversation.participants,
        admins: conversation.admins || [],
        createdBy: conversation.createdBy,
      },
      lastMessage: conversation.lastMessage,
      lastActivityAt: conversation.lastActivityAt,
      unreadCount,
      muted: isMuted,
      archived: isArchived,
      pinned: isPinned,
      hidden: isHidden,
    };
  }

  const otherParticipant = getOtherParticipant(conversation, currentUserId);

  return {
    _id: conversation._id,
    kind: "direct",
    participant: otherParticipant,
    lastMessage: conversation.lastMessage,
    lastActivityAt: conversation.lastActivityAt,
    unreadCount,
    muted: isMuted,
    archived: isArchived,
    pinned: isPinned,
    hidden: isHidden,
  };
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .populate("participants", "fullName profilePic lastSeen")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName profilePic")
      .populate({
        path: "lastMessage",
        populate: [
          { path: "senderId", select: "fullName profilePic" },
          { path: "receiverId", select: "fullName profilePic" },
        ],
      })
      .sort({ lastActivityAt: -1 });

    const formattedConversations = conversations.map((conversation) =>
      formatConversationForUser(conversation, currentUserId)
    );

    const visibleConversations = formattedConversations.filter((conversation) => !conversation.hidden);

    visibleConversations.sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return new Date(b.lastActivityAt) - new Date(a.lastActivityAt);
    });

    res.status(200).json(visibleConversations);
  } catch (error) {
    console.log("Error in getConversations controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const searchConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const query = sanitizePlainText(req.query.q, { maxLength: 100 }).toLowerCase();

    const conversations = await Conversation.find({ participants: currentUserId })
      .populate("participants", "fullName profilePic lastSeen")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName profilePic")
      .populate({
        path: "lastMessage",
        populate: [
          { path: "senderId", select: "fullName profilePic" },
          { path: "receiverId", select: "fullName profilePic" },
        ],
      })
      .sort({ lastActivityAt: -1 });

    const formatted = conversations
      .map((conversation) => formatConversationForUser(conversation, currentUserId))
      .filter((conversation) => !conversation.hidden);

    if (!query) {
      return res.status(200).json(formatted);
    }

    const filtered = formatted.filter((conversation) => {
      if (conversation.kind === "group") {
        return String(conversation.group?.name || "").toLowerCase().includes(query);
      }

      return String(conversation.participant?.fullName || "").toLowerCase().includes(query);
    });

    filtered.sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return new Date(b.lastActivityAt) - new Date(a.lastActivityAt);
    });

    res.status(200).json(filtered);
  } catch (error) {
    console.log("Error in searchConversations controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const setConversationFlag = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetId = req.params.id;
    const flag = sanitizePlainText(req.params.flag, { maxLength: 20 });

    if (!targetId) return res.status(400).json({ message: "Conversation id is required" });
    if (!["mute", "archive", "pin", "hide"].includes(flag)) {
      return res.status(400).json({ message: "Invalid flag" });
    }

    const enabled = Boolean(req.body?.enabled);
    const flagNameByFlag = {
      mute: "mutedBy",
      archive: "archivedBy",
      pin: "pinnedBy",
      hide: "hiddenBy",
    };

    const conversation = await Conversation.findOne({
      _id: targetId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const key = String(currentUserId);
    const field = conversation[flagNameByFlag[flag]] || new Map();
    if (enabled) field.set(key, true);
    else field.delete(key);
    conversation[flagNameByFlag[flag]] = field;
    await conversation.save();

    res.status(200).json({
      conversationId: conversation._id,
      flag,
      enabled,
    });
  } catch (error) {
    console.log("Error in setConversationFlag controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteDirectConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    }).select("_id kind");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.kind !== "direct") {
      return res.status(400).json({ message: "Only direct chats can be deleted here" });
    }

    await Message.deleteMany({ conversationId: conversation._id });
    await Conversation.deleteOne({ _id: conversation._id });

    res.status(200).json({
      success: true,
      conversationId: String(conversation._id),
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteDirectConversation controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const createGroupConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const groupName = sanitizePlainText(req.body?.name, { maxLength: 60 });
    const groupAvatar = sanitizePlainText(req.body?.avatar, { maxLength: 500 });
    const rawMembers = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];

    if (!groupName) return res.status(400).json({ message: "Group name is required" });

    const members = [...new Set([currentUserId, ...rawMembers].map(String))];
    if (members.length < 3) {
      return res.status(400).json({ message: "A group must have at least 3 members" });
    }

    const invalidMember = members.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidMember) return res.status(400).json({ message: "Invalid member id" });

    const users = await User.find({ _id: { $in: members } }).select("_id");
    if (users.length !== members.length) {
      return res.status(400).json({ message: "One or more members not found" });
    }

    const unreadCounts = members.reduce((acc, memberId) => {
      acc[memberId] = 0;
      return acc;
    }, {});

    const lastReadAt = members.reduce((acc, memberId) => {
      acc[memberId] = null;
      return acc;
    }, {});

    const conversation = await Conversation.create({
      kind: "group",
      groupName,
      groupAvatar,
      createdBy: currentUserId,
      participants: members,
      admins: [currentUserId],
      unreadCounts,
      lastReadAt,
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "fullName profilePic lastSeen")
      .populate("admins", "fullName profilePic")
      .populate("createdBy", "fullName profilePic");

    res.status(201).json(formatConversationForUser(populated, currentUserId));
  } catch (error) {
    console.log("Error in createGroupConversation controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const requireGroupAdmin = (conversation, userId) =>
  Array.isArray(conversation.admins) &&
  conversation.admins.some((adminId) => String(adminId) === String(userId));

const populateGroupConversation = (conversationId) =>
  Conversation.findById(conversationId)
    .populate("participants", "fullName profilePic lastSeen")
    .populate("admins", "fullName profilePic")
    .populate("createdBy", "fullName profilePic")
    .populate({
      path: "lastMessage",
      populate: [
        { path: "senderId", select: "fullName profilePic" },
        { path: "receiverId", select: "fullName profilePic" },
      ],
    });

export const updateGroupConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversationId = req.params.id;
    const groupName = sanitizePlainText(req.body?.name, { maxLength: 60 });
    const groupAvatar = sanitizePlainText(req.body?.avatar, { maxLength: 500 });

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      kind: "group",
      participants: currentUserId,
    });

    if (!conversation) return res.status(404).json({ message: "Group not found" });
    if (!requireGroupAdmin(conversation, currentUserId)) {
      return res.status(403).json({ message: "Admin permission required" });
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "name")) {
      if (!groupName) return res.status(400).json({ message: "Group name is required" });
      conversation.groupName = groupName;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "avatar")) {
      conversation.groupAvatar = groupAvatar;
    }

    await conversation.save();

    const populated = await populateGroupConversation(conversation._id);
    res.status(200).json(formatConversationForUser(populated, currentUserId));
  } catch (error) {
    console.log("Error in updateGroupConversation controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupMedia = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      kind: "group",
      participants: currentUserId,
    }).select("_id");

    if (!conversation) return res.status(404).json({ message: "Group not found" });

    const messages = await Message.find({
      conversationId,
      $or: [
        { image: { $exists: true, $ne: "" } },
        { "attachments.type": "image" },
      ],
    })
      .select("_id image attachments senderId createdAt")
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: -1 })
      .limit(200);

    const media = messages.flatMap((message) => {
      const attachmentMedia = (message.attachments || [])
        .filter((attachment) => attachment?.type === "image" && attachment?.url)
        .map((attachment) => ({
          _id: `${message._id}:${attachment.url}`,
          messageId: message._id,
          url: attachment.url,
          originalName: attachment.originalName || "Group media",
          senderId: message.senderId,
          createdAt: message.createdAt,
        }));

      if (message.image) {
        attachmentMedia.unshift({
          _id: `${message._id}:image`,
          messageId: message._id,
          url: message.image,
          originalName: "Group media",
          senderId: message.senderId,
          createdAt: message.createdAt,
        });
      }

      return attachmentMedia;
    });

    res.status(200).json({ media });
  } catch (error) {
    console.log("Error in getGroupMedia controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addGroupMembers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversationId = req.params.id;
    const rawMembers = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      kind: "group",
      participants: currentUserId,
    });

    if (!conversation) return res.status(404).json({ message: "Group not found" });
    if (!requireGroupAdmin(conversation, currentUserId)) {
      return res.status(403).json({ message: "Admin permission required" });
    }

    const nextIds = [...new Set(rawMembers.map(String))].filter(Boolean);
    if (nextIds.length === 0) return res.status(400).json({ message: "memberIds is required" });

    const invalid = nextIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalid) return res.status(400).json({ message: "Invalid member id" });

    const users = await User.find({ _id: { $in: nextIds } }).select("_id");
    if (users.length !== nextIds.length) return res.status(400).json({ message: "One or more members not found" });

    const existing = new Set((conversation.participants || []).map(String));
    nextIds.forEach((id) => existing.add(id));
    conversation.participants = Array.from(existing);

    const unread = conversation.unreadCounts || new Map();
    const readAt = conversation.lastReadAt || new Map();
    nextIds.forEach((id) => {
      if (unread.get(id) === undefined) unread.set(id, 0);
      if (readAt.get(id) === undefined) readAt.set(id, null);
    });
    conversation.unreadCounts = unread;
    conversation.lastReadAt = readAt;

    await conversation.save();

    const populated = await populateGroupConversation(conversation._id);

    res.status(200).json(formatConversationForUser(populated, currentUserId));
  } catch (error) {
    console.log("Error in addGroupMembers controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversationId = req.params.id;
    const memberId = req.params.memberId;

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      kind: "group",
      participants: currentUserId,
    });

    if (!conversation) return res.status(404).json({ message: "Group not found" });
    const isAdmin = requireGroupAdmin(conversation, currentUserId);
    const isSelf = String(memberId) === String(currentUserId);

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin permission required" });
    }

    if (isSelf) {
      return res.status(400).json({ message: "Use the leave group action to remove yourself" });
    }

    conversation.participants = (conversation.participants || []).filter((id) => String(id) !== String(memberId));
    conversation.admins = (conversation.admins || []).filter((id) => String(id) !== String(memberId));

    if (conversation.participants.length < 3) {
      return res.status(400).json({ message: "A group must have at least 3 members" });
    }

    if ((conversation.admins || []).length === 0) {
      // Ensure at least one admin remains.
      conversation.admins = [conversation.participants[0]];
    }

    conversation.unreadCounts?.delete(String(memberId));
    conversation.lastReadAt?.delete(String(memberId));
    conversation.mutedBy?.delete(String(memberId));
    conversation.archivedBy?.delete(String(memberId));
    conversation.pinnedBy?.delete(String(memberId));
    conversation.hiddenBy?.delete(String(memberId));

    await conversation.save();

    const populated = await populateGroupConversation(conversation._id);
    res.status(200).json(formatConversationForUser(populated, currentUserId));
  } catch (error) {
    console.log("Error in removeGroupMember controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const setGroupAdmin = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversationId = req.params.id;
    const memberId = req.params.memberId;
    const enabled = Boolean(req.body?.enabled);

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      kind: "group",
      participants: currentUserId,
    });

    if (!conversation) return res.status(404).json({ message: "Group not found" });
    if (!requireGroupAdmin(conversation, currentUserId)) {
      return res.status(403).json({ message: "Admin permission required" });
    }

    const isMember = (conversation.participants || []).some((id) => String(id) === String(memberId));
    if (!isMember) return res.status(400).json({ message: "User is not a member" });

    const adminSet = new Set((conversation.admins || []).map(String));
    if (enabled) adminSet.add(String(memberId));
    else adminSet.delete(String(memberId));

    if (adminSet.size === 0) return res.status(400).json({ message: "At least one admin is required" });

    conversation.admins = Array.from(adminSet);
    await conversation.save();

    const populated = await populateGroupConversation(conversation._id);
    res.status(200).json(formatConversationForUser(populated, currentUserId));
  } catch (error) {
    console.log("Error in setGroupAdmin controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      kind: "group",
      participants: currentUserId,
    });

    if (!conversation) return res.status(404).json({ message: "Group not found" });

    conversation.participants = (conversation.participants || []).filter(
      (id) => String(id) !== String(currentUserId)
    );
    conversation.admins = (conversation.admins || []).filter(
      (id) => String(id) !== String(currentUserId)
    );

    conversation.unreadCounts?.delete(String(currentUserId));
    conversation.lastReadAt?.delete(String(currentUserId));
    conversation.mutedBy?.delete(String(currentUserId));
    conversation.archivedBy?.delete(String(currentUserId));
    conversation.pinnedBy?.delete(String(currentUserId));
    conversation.hiddenBy?.delete(String(currentUserId));

    if (conversation.participants.length === 0) {
      await Message.deleteMany({ conversationId: conversation._id });
      await Conversation.deleteOne({ _id: conversation._id });
      return res.status(200).json({
        conversationId,
        left: true,
        deleted: true,
      });
    }

    if ((conversation.admins || []).length === 0) {
      conversation.admins = [conversation.participants[0]];
    }

    await conversation.save();

    res.status(200).json({
      conversationId,
      left: true,
      deleted: false,
    });
  } catch (error) {
    console.log("Error in leaveGroup controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrCreateConversation = async (participantIds) => {
  const sortedParticipants = [...new Set(participantIds.map(String))].sort();
  const participantKey = createParticipantKey(sortedParticipants);

  let conversation = await Conversation.findOne({ participantKey });

  if (!conversation) {
    const unreadCounts = sortedParticipants.reduce((acc, participantId) => {
      acc[participantId] = 0;
      return acc;
    }, {});

    const lastReadAt = sortedParticipants.reduce((acc, participantId) => {
      acc[participantId] = null;
      return acc;
    }, {});

    conversation = await Conversation.create({
      participantKey,
      participants: sortedParticipants,
      unreadCounts,
      lastReadAt,
    });
  } else {
    let changed = false;
    const conversationUnreadCounts = conversation.unreadCounts || new Map();
    const conversationLastReadAt = conversation.lastReadAt || new Map();

    sortedParticipants.forEach((participantId) => {
      if (conversationUnreadCounts.get(participantId) === undefined) {
        conversationUnreadCounts.set(participantId, 0);
        changed = true;
      }

      if (conversationLastReadAt.get(participantId) === undefined) {
        conversationLastReadAt.set(participantId, null);
        changed = true;
      }
    });

    if (changed) {
      conversation.unreadCounts = conversationUnreadCounts;
      conversation.lastReadAt = conversationLastReadAt;
      await conversation.save();
    }
  }

  return conversation;
};

export const getConversationMessages = async (conversationId) =>
  Message.find({ conversationId }).sort({ createdAt: 1 });
