import express from "express";
import { messageLimiter, protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessagesAsRead,
  sendMessage,
  uploadAttachment,
} from "../controllers/message.controller.js";
import { getConversations } from "../controllers/conversation.controller.js";
import { imageUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/conversations", protectRoute, getConversations);
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
