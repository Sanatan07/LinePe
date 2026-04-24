import express from "express";
import { messageLimiter, protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getMessagesByConversation,
  getUsersForSidebar,
  markMessagesAsRead,
  markConversationAsRead,
  searchMessages,
  sendMessage,
  sendMessageToConversation,
  setBlockStatus,
  uploadAttachment,
} from "../controllers/message.controller.js";
import {
  getConversations,
  searchConversations,
  setConversationFlag,
  deleteDirectConversation,
  createGroupConversation,
  getGroupMedia,
  addGroupMembers,
  leaveGroup,
  removeGroupMember,
  setGroupAdmin,
  updateGroupConversation,
} from "../controllers/conversation.controller.js";
import { imageUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/conversations", protectRoute, getConversations);
router.get("/conversations/search", protectRoute, searchConversations);
router.post("/conversations/:id/:flag", protectRoute, messageLimiter, setConversationFlag);
router.delete("/conversations/:id", protectRoute, messageLimiter, deleteDirectConversation);

router.post("/groups", protectRoute, messageLimiter, createGroupConversation);
router.post("/group", protectRoute, messageLimiter, createGroupConversation);
router.patch("/groups/:id", protectRoute, messageLimiter, updateGroupConversation);
router.patch("/group/:id", protectRoute, messageLimiter, updateGroupConversation);
router.get("/groups/:id/media", protectRoute, getGroupMedia);
router.post("/groups/:id/members", protectRoute, messageLimiter, addGroupMembers);
router.patch("/group/:id/members/add", protectRoute, messageLimiter, addGroupMembers);
router.delete("/groups/:id/members/:memberId", protectRoute, messageLimiter, removeGroupMember);
router.patch("/group/:id/members/remove", protectRoute, messageLimiter, removeGroupMember);
router.patch("/group/:id/leave", protectRoute, messageLimiter, leaveGroup);
router.post("/groups/:id/admins/:memberId", protectRoute, messageLimiter, setGroupAdmin);

router.post("/block/:id", protectRoute, messageLimiter, setBlockStatus);
router.get("/search/:id", protectRoute, messageLimiter, searchMessages);
router.get("/conversation/:id", protectRoute, getMessagesByConversation);
router.post("/conversation/send/:id", protectRoute, messageLimiter, sendMessageToConversation);
router.post("/conversation/read/:id", protectRoute, messageLimiter, markConversationAsRead);
router.post(
  "/upload",
  protectRoute,
  messageLimiter,
  imageUpload.single("file"),
  uploadAttachment
);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, messageLimiter, sendMessage);
router.post("/read/:id", protectRoute, messageLimiter, markMessagesAsRead);

export default router;
