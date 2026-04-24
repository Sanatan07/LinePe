import express from "express";

import {
  checkAuth,
  forgotPassword,
  getSessions,
  login,
  logout,
  logoutAll,
  logoutDevice,
  refreshTokenController,
  resetPassword,
  sendVerificationEmail,
  signup,
  updateProfile,
  verifyEmail,
  verifySignupOtp,
} from "../controllers/auth.controller.js";
import { authLimiter, protectRoute, refreshLimiter } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/signup/verify", authLimiter, verifySignupOtp);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/logout-all", protectRoute, logoutAll);
router.get("/sessions", protectRoute, refreshLimiter, getSessions);
router.post("/logout-device", protectRoute, refreshLimiter, logoutDevice);
router.post("/refresh", refreshLimiter, refreshTokenController);
router.post("/refresh-token", refreshLimiter, refreshTokenController);
router.post("/send-verification-email", protectRoute, refreshLimiter, sendVerificationEmail);
router.get("/verify-email/:token", verifyEmail);

router.get("/check", protectRoute, checkAuth);
router.put("/update-profile", protectRoute, updateProfile);

export default router;
