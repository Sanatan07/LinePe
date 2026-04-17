import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

const getOtherParticipant = (conversation, currentUserId) =>
  conversation.participants.find((participant) => String(participant._id) !== String(currentUserId));

const createParticipantKey = (participantIds) =>
  [...new Set(participantIds.map(String))].sort().join(":");

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
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

    const formattedConversations = conversations.map((conversation) => {
      const otherParticipant = getOtherParticipant(conversation, currentUserId);
      const unreadCount = Number(conversation.unreadCounts?.get(String(currentUserId)) || 0);

      return {
        _id: conversation._id,
        participant: otherParticipant,
        lastMessage: conversation.lastMessage,
        lastActivityAt: conversation.lastActivityAt,
        unreadCount,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.log("Error in getConversations controller:", error.message);
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
