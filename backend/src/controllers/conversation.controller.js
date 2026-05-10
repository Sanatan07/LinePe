import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { sanitizePlainText } from "../lib/sanitize.js";
import mongoose from "mongoose";

const getOtherParticipant = (conversation, currentUserId) =>
  conversation.participants.find((participant) => String(participant._id) !== String(currentUserId));

const createParticipantKey = (participantIds) =>
  [...new Set(participantIds.map(String))].sort().join(":");

const formatConversationForUser = (conversation, currentUserId, unreadCountOverride = null) => {
  const unreadCount =
    unreadCountOverride === null
      ? Number(conversation.unreadCounts?.get(String(currentUserId)) || 0)
      : Number(unreadCountOverride || 0);
  const isMuted = Boolean(conversation.mutedBy?.get(String(currentUserId)) || false);
  const isArchived = Boolean(conversation.archivedBy?.get(String(currentUserId)) || false);
  const isPinned = Boolean(conversation.pinnedBy?.get(String(currentUserId)) || false);
  const isHidden = Boolean(conversation.hiddenBy?.get(String(currentUserId)) || false);

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

const getUnreadCountsByConversationId = async (conversations, currentUserId) => {
  const conversationIds = conversations.map((conversation) => conversation._id);
  if (conversationIds.length === 0) return new Map();

  const directCounts = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        receiverId: currentUserId,
        status: { $ne: "read" },
      },
    },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
  ]);

  return directCounts.reduce((counts, item) => {
    counts.set(String(item._id), Number(item.count || 0));
    return counts;
  }, new Map());
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      kind: { $ne: "group" },
      participants: currentUserId,
    })
      .populate("participants", "fullName profilePic lastSeen")
      .populate({
        path: "lastMessage",
        populate: [
          { path: "senderId", select: "fullName profilePic" },
          { path: "receiverId", select: "fullName profilePic" },
        ],
      })
      .sort({ lastActivityAt: -1 });

    const unreadCounts = await getUnreadCountsByConversationId(conversations, currentUserId);

    const formattedConversations = conversations.map((conversation) =>
      formatConversationForUser(
        conversation,
        currentUserId,
        unreadCounts.get(String(conversation._id)) || 0
      )
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

    const conversations = await Conversation.find({ kind: { $ne: "group" }, participants: currentUserId })
      .populate("participants", "fullName profilePic lastSeen")
      .populate({
        path: "lastMessage",
        populate: [
          { path: "senderId", select: "fullName profilePic" },
          { path: "receiverId", select: "fullName profilePic" },
        ],
      })
      .sort({ lastActivityAt: -1 });

    const unreadCounts = await getUnreadCountsByConversationId(conversations, currentUserId);

    const formatted = conversations
      .map((conversation) =>
        formatConversationForUser(
          conversation,
          currentUserId,
          unreadCounts.get(String(conversation._id)) || 0
        )
      )
      .filter((conversation) => !conversation.hidden);

    if (!query) {
      return res.status(200).json(formatted);
    }

    const filtered = formatted.filter((conversation) =>
      String(conversation.participant?.fullName || "").toLowerCase().includes(query)
    );

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
      kind: { $ne: "group" },
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
      kind: { $ne: "group" },
      participants: currentUserId,
    }).select("_id kind");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
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
