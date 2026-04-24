import crypto from "crypto";

import Invite from "../models/invite.model.js";
import User from "../models/user.model.js";
import { getOrCreateConversation } from "./conversation.controller.js";
import { logger } from "../lib/logger.js";
import { sanitizePlainText } from "../lib/sanitize.js";

const normalizeIndianPhoneNumber = (value) => {
  const next = sanitizePlainText(value, { maxLength: 20 });
  if (!next) return "";

  const digitsOnly = next.replace(/\D/g, "");

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }

  if (next.startsWith("+91") && digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }

  return "";
};

const generateInviteCode = () => crypto.randomBytes(6).toString("hex");
const getInviteBaseUrl = () => (process.env.INVITE_BASE_URL || "https://linepe.app").replace(/\/+$/, "");
const buildInviteUrl = (inviteCode) => `${getInviteBaseUrl()}/invite/${inviteCode}`;
const INVITE_SAME_NUMBER_LIMIT = 3;
const INVITE_TOTAL_LIMIT = 20;
const INVITE_EXPIRY_DAYS = 7;
const ALLOWED_INVITE_CHANNELS = new Set(["sms", "whatsapp", "link"]);

const formatInvite = (invite) => ({
  _id: invite._id,
  phoneNumber: invite.phoneNumber,
  phone: invite.phoneNumber,
  email: invite.email || "",
  username: invite.username || "",
  inviteCode: invite.inviteCode,
  token: invite.inviteCode,
  inviteUrl: buildInviteUrl(invite.inviteCode),
  inviteLink: buildInviteUrl(invite.inviteCode),
  status: invite.status,
  expiresAt: invite.expiresAt,
  sentAt: invite.sentAt,
  acceptedAt: invite.acceptedAt,
  acceptedBy: invite.acceptedBy || null,
  channelUsed: invite.channelUsed || "link",
  inviter: invite.inviterId
    ? {
        _id: invite.inviterId._id,
        fullName: invite.inviterId.fullName,
        username: invite.inviterId.username || "",
        profilePic: invite.inviterId.profilePic || "",
      }
    : null,
});

export const sendInvite = async (req, res) => {
  try {
    const inviterId = req.user?._id;
    const normalizedPhoneNumber = normalizeIndianPhoneNumber(req.body?.phoneNumber);
    const normalizedEmail = sanitizePlainText(req.body?.email, { maxLength: 254 }).toLowerCase();
    const normalizedUsername = sanitizePlainText(req.body?.username, { maxLength: 30 }).toLowerCase();
    const requestedChannel = sanitizePlainText(req.body?.channelUsed, { maxLength: 20 }).toLowerCase();
    const channelUsed = ALLOWED_INVITE_CHANNELS.has(requestedChannel) ? requestedChannel : "link";

    if (!inviterId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!normalizedPhoneNumber && !normalizedEmail && !normalizedUsername) {
      return res.status(400).json({ message: "Phone, email, or username is required" });
    }

    const existingUser = await User.findOne({
      $or: [
        normalizedPhoneNumber ? { phoneNumber: normalizedPhoneNumber } : null,
        normalizedUsername ? { username: normalizedUsername } : null,
        normalizedEmail ? { email: normalizedEmail } : null,
      ].filter(Boolean),
    }).select("_id fullName username profilePic lastSeen");

    if (existingUser) {
      return res.status(200).json({
        success: true,
        alreadyOnPlatform: true,
        message: "User already exists on LinePe",
        user: {
          _id: existingUser._id,
          fullName: existingUser.fullName,
          username: existingUser.username || "",
          profilePic: existingUser.profilePic || "",
          lastSeen: existingUser.lastSeen || null,
        },
      });
    }

    const now = new Date();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recentInvitesToNumber, recentInvitesByUser] = await Promise.all([
      Invite.countDocuments({
        inviterId,
        $or: [
          normalizedPhoneNumber ? { phoneNumber: normalizedPhoneNumber } : null,
          normalizedUsername ? { username: normalizedUsername } : null,
          normalizedEmail ? { email: normalizedEmail } : null,
        ].filter(Boolean),
        createdAt: { $gte: last24Hours },
      }),
      Invite.countDocuments({
        inviterId,
        createdAt: { $gte: last24Hours },
      }),
    ]);

    if (recentInvitesToNumber >= INVITE_SAME_NUMBER_LIMIT) {
      return res.status(429).json({
        message: "You have reached the invite limit for this number. Try again later.",
      });
    }

    if (recentInvitesByUser >= INVITE_TOTAL_LIMIT) {
      return res.status(429).json({
        message: "You have reached your daily invite limit. Try again later.",
      });
    }

    const existingInvite = await Invite.findOne({
      inviterId,
      phoneNumber: normalizedPhoneNumber,
      email: normalizedEmail,
      username: normalizedUsername,
      status: { $in: ["pending", "sent"] },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    });

    if (existingInvite) {
      if (existingInvite.status !== "sent") {
        existingInvite.status = "sent";
        existingInvite.sentAt = now;
      }
      existingInvite.channelUsed = channelUsed;
      await existingInvite.save();

      logger.info("invite.sent", {
        inviterId: String(inviterId),
        inviteTarget: normalizedPhoneNumber || normalizedUsername || normalizedEmail,
        sentAt: existingInvite.sentAt?.toISOString?.() || now.toISOString(),
        acceptedAt: existingInvite.acceptedAt?.toISOString?.() || null,
        channelUsed,
        inviteCode: existingInvite.inviteCode,
        reused: true,
      });

      return res.status(200).json({
        success: true,
        alreadyOnPlatform: false,
        message: "Invite sent successfully",
        invite: formatInvite(existingInvite),
      });
    }

    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const invite = await Invite.create({
      inviterId,
      phoneNumber: normalizedPhoneNumber,
      email: normalizedEmail,
      username: normalizedUsername,
      channelUsed,
      inviteCode: generateInviteCode(),
      status: "sent",
      sentAt: now,
      expiresAt,
    });

    logger.info("invite.sent", {
      inviterId: String(inviterId),
      inviteTarget: normalizedPhoneNumber || normalizedUsername || normalizedEmail,
      sentAt: now.toISOString(),
      acceptedAt: null,
      channelUsed,
      inviteCode: invite.inviteCode,
      reused: false,
    });

    res.status(201).json({
      success: true,
      alreadyOnPlatform: false,
      message: "Invite sent successfully",
      invite: formatInvite(invite),
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.inviteCode) {
      return res.status(409).json({ message: "Failed to generate a unique invite code" });
    }

    console.log("Error in sendInvite controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const redeemInvite = async (req, res) => {
  try {
    const inviteCode = sanitizePlainText(req.body?.inviteCode, { maxLength: 100 });
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code is required" });
    }

    const invite = await Invite.findOne({ inviteCode });
    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    const isExpired = invite.expiresAt ? new Date(invite.expiresAt) <= new Date() : false;
    if (isExpired) {
      if (invite.status !== "expired") {
        invite.status = "expired";
        await invite.save();
      }
      return res.status(400).json({ message: "Invite has expired" });
    }

    if (invite.status === "accepted") {
      const conversation = await getOrCreateConversation([invite.inviterId, currentUserId]);
      return res.status(200).json({
        success: true,
        message: "Invite already redeemed",
        invite: formatInvite(invite),
        conversation,
      });
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedBy = currentUserId;
    await invite.save();

    const conversation = await getOrCreateConversation([invite.inviterId, currentUserId]);

    logger.info("invite.accepted", {
      inviterId: String(invite.inviterId),
      inviteTarget: invite.phoneNumber,
      sentAt: invite.sentAt?.toISOString?.() || null,
      acceptedAt: invite.acceptedAt.toISOString(),
      channelUsed: invite.channelUsed || "link",
      inviteCode: invite.inviteCode,
      redeemedByUserId: String(currentUserId),
    });

    res.status(200).json({
      success: true,
      message: "Invite redeemed successfully",
      invite: formatInvite(invite),
      conversation,
    });
  } catch (error) {
    console.log("Error in redeemInvite controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getInviteDetails = async (req, res) => {
  try {
    const inviteCode = sanitizePlainText(req.params.code, { maxLength: 100 });

    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code is required" });
    }

    const invite = await Invite.findOne({ inviteCode })
      .populate("inviterId", "fullName username profilePic");

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }

    const isExpired = invite.expiresAt ? new Date(invite.expiresAt) <= new Date() : false;
    const isInvalidStatus = ["accepted", "expired", "failed"].includes(invite.status);

    if (isExpired && invite.status !== "expired") {
      invite.status = "expired";
      await invite.save();
    }

    res.status(200).json({
      success: true,
      invite: {
        ...formatInvite(invite),
        isExpired: isExpired || invite.status === "expired",
        isRedeemable: !(isExpired || isInvalidStatus),
      },
    });
  } catch (error) {
    console.log("Error in getInviteDetails controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptInvite = async (req, res) => {
  req.body = {
    ...(req.body || {}),
    inviteCode: sanitizePlainText(req.params.token, { maxLength: 100 }),
  };
  return redeemInvite(req, res);
};
