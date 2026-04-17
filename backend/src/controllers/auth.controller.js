import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import cloudinary from "../lib/cloudinary.js";
import {
  clearAuthCookies,
  generateAuthTokens,
  setAuthCookies,
} from "../lib/utils.js";
import { sanitizePlainText } from "../lib/sanitize.js";
import User from "../models/user.model.js";

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

const sanitizeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  profilePic: user.profilePic,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getRequestIp = (req) => (typeof req.ip === "string" ? req.ip : "");
const getUserAgent = (req) => (typeof req.get === "function" ? req.get("user-agent") || "" : "");

const addRefreshSession = async (user, tokens, req) => {
  const now = new Date();
  const sessions = Array.isArray(user.refreshSessions) ? user.refreshSessions : [];

  const cleaned = sessions.filter((session) => {
    if (!session) return false;
    if (session.revokedAt) return false;
    if (session.expiresAt && session.expiresAt <= now) return false;
    return true;
  });

  cleaned.push({
    tokenId: tokens.refreshTokenId,
    tokenHash: tokens.refreshTokenHash,
    expiresAt: tokens.refreshExpiresAt,
    ip: getRequestIp(req),
    userAgent: getUserAgent(req),
  });

  // Keep the most recent sessions only.
  user.refreshSessions = cleaned.slice(-20);
  await user.save();
};

export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    const nextFullName = sanitizePlainText(fullName, { maxLength: 80 });
    const nextEmail = sanitizePlainText(email, { maxLength: 254 }).toLowerCase();

    if (!nextFullName || !nextEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 12) {
      return res.status(400).json({ message: "Password must be at least 12 characters" });
    }

    const existingUser = await User.findOne({ email: nextEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: nextFullName,
      email: nextEmail,
      password: hashedPassword,
    });

    const tokens = generateAuthTokens({
      userId: newUser._id,
      tokenVersion: newUser.tokenVersion,
    });
    await addRefreshSession(newUser, tokens, req);
    setAuthCookies(res, tokens);

    res.status(201).json(sanitizeUser(newUser));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const nextEmail = sanitizePlainText(email, { maxLength: 254 }).toLowerCase();

    if (!nextEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: nextEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const tokens = generateAuthTokens({ userId: user._id, tokenVersion: user.tokenVersion });
    await addRefreshSession(user, tokens, req);
    setAuthCookies(res, tokens);

    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        User.updateOne(
          { _id: decoded.userId, "refreshSessions.tokenId": decoded.tokenId },
          { $set: { "refreshSessions.$.revokedAt": new Date() } }
        ).catch(() => {});
      } catch {
        // Ignore invalid/expired refresh tokens; cookie clearing is enough.
      }
    }

    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();
    const user = await User.findById(userId);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    if (Array.isArray(user.refreshSessions)) {
      user.refreshSessions.forEach((session) => {
        if (!session.revokedAt) session.revokedAt = now;
      });
    }
    await user.save();

    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out from all devices" });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const checkAuth = (req, res) => {
  res.status(200).json(req.user);
};

export const refreshTokenController = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (typeof decoded.tokenVersion === "number" && user.tokenVersion !== decoded.tokenVersion) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const session = Array.isArray(user.refreshSessions)
      ? user.refreshSessions.find(
          (s) => s && s.tokenId === decoded.tokenId && !s.revokedAt && (!s.expiresAt || s.expiresAt > new Date())
        )
      : null;

    if (!session || session.tokenHash !== sha256(refreshToken)) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tokens = generateAuthTokens({ userId: user._id, tokenVersion: user.tokenVersion });

    session.revokedAt = new Date();
    session.replacedByTokenId = tokens.refreshTokenId;
    user.refreshSessions = Array.isArray(user.refreshSessions) ? user.refreshSessions : [];
    user.refreshSessions.push({
      tokenId: tokens.refreshTokenId,
      tokenHash: tokens.refreshTokenHash,
      expiresAt: tokens.refreshExpiresAt,
      ip: getRequestIp(req),
      userAgent: getUserAgent(req),
    });
    user.refreshSessions = user.refreshSessions.slice(-20);
    await user.save();

    setAuthCookies(res, tokens);

    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    next(error);
  }
};
