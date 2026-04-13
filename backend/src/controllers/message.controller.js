import mongoose from "mongoose";

import cloudinary from "../lib/cloudinary.js";
import { emitMessageEvent, getReceiverSocketIds } from "../lib/socket.js";
import { SOCKET_EVENTS } from "../constants/socket.events.js";
import { getOrCreateConversation } from "./conversation.controller.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

const MAX_TEXT_LENGTH = 2000;

const normalizeText = (text) => (typeof text === "string" ? text.trim() : "");

const isValidImagePayload = (image) => typeof image === "string" && image.startsWith("data:image/");

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      return res.status(400).json({ message: "Invalid chat user id" });
    }

    const conversation = await getOrCreateConversation([myId, userToChatId]);

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id" });
    }

    if (String(receiverId) === String(senderId)) {
      return res.status(400).json({ message: "You cannot send a message to yourself" });
    }

    const receiver = await User.findById(receiverId).select("_id");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const normalizedText = normalizeText(text);
    const hasImage = Boolean(image);

    if (!normalizedText && !hasImage) {
      return res.status(400).json({ message: "Message text or image is required" });
    }

    if (normalizedText.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ message: `Message must be ${MAX_TEXT_LENGTH} characters or less` });
    }

    if (hasImage && !isValidImagePayload(image)) {
      return res.status(400).json({ message: "Invalid image payload" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const conversation = await getOrCreateConversation([senderId, receiverId]);

    const newMessage = await Message.create({
      senderId,
      receiverId,
      conversationId: conversation._id,
      text: normalizedText,
      image: imageUrl,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic");

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: populatedMessage._id,
      lastActivityAt: populatedMessage.createdAt,
    });

    emitMessageEvent(senderId, SOCKET_EVENTS.MESSAGE_SENT, populatedMessage);
    emitMessageEvent(receiverId, SOCKET_EVENTS.MESSAGE_NEW, populatedMessage);

    const receiverSocketIds = getReceiverSocketIds(receiverId);
    if (receiverSocketIds.length > 0) {
      emitMessageEvent(senderId, SOCKET_EVENTS.MESSAGE_DELIVERED, {
        messageId: populatedMessage._id,
        senderId: populatedMessage.senderId._id,
        receiverId: populatedMessage.receiverId._id,
        deliveredAt: new Date().toISOString(),
      });
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
