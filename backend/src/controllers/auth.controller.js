import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import cloudinary from "../lib/cloudinary.js";
import {
  clearAuthCookies,
  generateAuthTokens,
  setAuthCookies,
} from "../lib/utils.js";
import User from "../models/user.model.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  profilePic: user.profilePic,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 12) {
      return res.status(400).json({ message: "Password must be at least 12 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    const tokens = generateAuthTokens(newUser._id);
    setAuthCookies(res, tokens);

    res.status(201).json(sanitizeUser(newUser));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const tokens = generateAuthTokens(user._id);
    setAuthCookies(res, tokens);

    res.status(200).json(sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  try {
    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out successfully" });
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

    const tokens = generateAuthTokens(user._id);
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
