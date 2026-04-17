import mongoose from "mongoose";

import cloudinary from "../lib/cloudinary.js";
import { emitMessageEvent, getReceiverSocketIds } from "../lib/socket.js";
import { SOCKET_EVENTS } from "../constants/socket.events.js";
import { getOrCreateConversation } from "./conversation.controller.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { isSafeHttpUrl, sanitizePlainText } from "../lib/sanitize.js";

const MAX_TEXT_LENGTH = 2000;

const normalizeText = (text) => sanitizePlainText(text, { maxLength: MAX_TEXT_LENGTH });

const isValidImagePayload = (image) => typeof image === "string" && image.startsWith("data:image/");

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isValidAttachmentPayload = (attachment) => {
  if (!attachment || typeof attachment !== "object") return false;
  if (!isNonEmptyString(attachment.url)) return false;
  if (attachment.type !== "image") return false;
  if (!isNonEmptyString(attachment.mimeType) || !attachment.mimeType.startsWith("image/")) return false;
  if (typeof attachment.sizeBytes !== "number" || attachment.sizeBytes <= 0) return false;
  const allowHttp = process.env.NODE_ENV !== "production";
  if (!isSafeHttpUrl(attachment.url, { allowHttp })) return false;
  return true;
};

const uploadImageBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });

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
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 1), 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      return res.status(400).json({ message: "Invalid chat user id" });
    }

    const conversation = await getOrCreateConversation([myId, userToChatId]);

    const query = { conversationId: conversation._id };
    if (before && !Number.isNaN(before.getTime())) {
      query.createdAt = { $lt: before };
    }

    const docs = await Message.find(query).sort({ createdAt: -1 }).limit(limit + 1);
    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;
    const messages = page.reverse();
    const nextBefore = hasMore ? messages[0]?.createdAt : null;

    res.status(200).json({
      conversationId: conversation._id,
      messages,
      hasMore,
      nextBefore,
    });
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, attachments } = req.body;
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
    const attachmentList = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    const hasAttachments = attachmentList.length > 0;

    if (!normalizedText && !hasImage && !hasAttachments) {
      return res.status(400).json({ message: "Message text or attachment is required" });
    }

    // `normalizeText` already trims + clamps max length; reject if caller tries to exceed limit.
    if (typeof text === "string" && text.trim().length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ message: `Message must be ${MAX_TEXT_LENGTH} characters or less` });
    }

    const nextAttachments = [];

    if (hasAttachments) {
      const invalidIndex = attachmentList.findIndex((attachment) => !isValidAttachmentPayload(attachment));
      if (invalidIndex !== -1) {
        return res.status(400).json({ message: "Invalid attachment payload" });
      }

      attachmentList.forEach((attachment) => {
        nextAttachments.push({
          url: attachment.url.trim(),
          type: "image",
          mimeType: attachment.mimeType.trim(),
          sizeBytes: attachment.sizeBytes,
          width: typeof attachment.width === "number" ? attachment.width : null,
          height: typeof attachment.height === "number" ? attachment.height : null,
          originalName: typeof attachment.originalName === "string" ? attachment.originalName : "",
        });
      });
    }

    let imageUrl;
    if (hasImage) {
      if (!isValidImagePayload(image)) {
        return res.status(400).json({ message: "Invalid image payload" });
      }

      const uploadResponse = await cloudinary.uploader.upload(image, { resource_type: "image" });
      imageUrl = uploadResponse.secure_url;
      nextAttachments.push({
        url: uploadResponse.secure_url,
        type: "image",
        mimeType: uploadResponse.format ? `image/${uploadResponse.format}` : "image/*",
        sizeBytes: uploadResponse.bytes || 0,
        width: uploadResponse.width || null,
        height: uploadResponse.height || null,
        originalName: "",
      });
    }

    const conversation = await getOrCreateConversation([senderId, receiverId]);

    const newMessage = await Message.create({
      senderId,
      receiverId,
      conversationId: conversation._id,
      text: normalizedText,
      image: imageUrl,
      attachments: nextAttachments.length > 0 ? nextAttachments : undefined,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic");

    const receiverUnreadCount = Number(conversation.unreadCounts?.get(String(receiverId)) || 0) + 1;
    conversation.unreadCounts?.set(String(receiverId), receiverUnreadCount);
    conversation.unreadCounts?.set(String(senderId), 0);
    conversation.lastReadAt?.set(String(senderId), populatedMessage.createdAt);

    conversation.lastMessage = populatedMessage._id;
    conversation.lastActivityAt = populatedMessage.createdAt;
    await conversation.save();

    emitMessageEvent(senderId, SOCKET_EVENTS.MESSAGE_SENT, populatedMessage);
    emitMessageEvent(receiverId, SOCKET_EVENTS.MESSAGE_NEW, populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const readerId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: "Invalid chat user id" });
    }

    if (String(otherUserId) === String(readerId)) {
      return res.status(400).json({ message: "You cannot mark your own chat as read" });
    }

    const conversation = await getOrCreateConversation([readerId, otherUserId]);

    const readAt = new Date();

    const updateResult = await Message.updateMany(
      {
        conversationId: conversation._id,
        receiverId: readerId,
        status: { $ne: "read" },
      },
      { $set: { status: "read" } }
    );

    conversation.unreadCounts?.set(String(readerId), 0);
    conversation.lastReadAt?.set(String(readerId), readAt);
    await conversation.save();

    emitMessageEvent([otherUserId, readerId], SOCKET_EVENTS.MESSAGE_READ, {
      conversationId: conversation._id,
      readerId,
      readAt: readAt.toISOString(),
    });

    res.status(200).json({
      conversationId: conversation._id,
      unreadCount: 0,
      updatedCount: updateResult.modifiedCount ?? updateResult.nModified ?? 0,
      readAt: readAt.toISOString(),
    });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const uploadAttachment = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "File is required" });
    }

    if (!file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ message: "Only image uploads are supported" });
    }

    const uploadResult = await uploadImageBufferToCloudinary(file.buffer);

    res.status(201).json({
      attachment: {
        url: uploadResult.secure_url,
        type: "image",
        mimeType: file.mimetype,
        sizeBytes: file.size,
        width: uploadResult.width || null,
        height: uploadResult.height || null,
        originalName: file.originalname || "",
      },
    });
  } catch (error) {
    console.log("Error in uploadAttachment controller: ", error.message);
    res.status(500).json({ message: "Upload failed" });
  }
};
