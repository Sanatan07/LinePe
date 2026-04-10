import express from "express";

import {
  checkAuth,
  login,
  logout,
  refreshTokenController,
  signup,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authLimiter, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshTokenController);

router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
