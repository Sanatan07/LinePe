import express from "express";

import {
  checkAuth,
  login,
  logout,
  logoutAll,
  refreshTokenController,
  signup,
  updateProfile,
} from "../controllers/auth.controller.js";
import { authLimiter, protectRoute, refreshLimiter } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/logout-all", protectRoute, logoutAll);
router.post("/refresh-token", refreshLimiter, refreshTokenController);

router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
