import express from "express";

import { protectRoute, messageLimiter } from "../middleware/auth.middleware.js";
import { checkInviteTarget, searchUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, messageLimiter, searchUsers);
router.get("/lookup", protectRoute, messageLimiter, checkInviteTarget);

export default router;
