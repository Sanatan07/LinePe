import express from "express";

import { protectRoute, messageLimiter } from "../middleware/auth.middleware.js";
import { getInviteDetails, redeemInvite, sendInvite } from "../controllers/invite.controller.js";

const router = express.Router();

router.get("/:code", getInviteDetails);
router.post("/redeem", protectRoute, messageLimiter, redeemInvite);
router.post("/", protectRoute, messageLimiter, sendInvite);

export default router;
