import User from "../models/user.model.js";
import { sanitizePlainText } from "../lib/sanitize.js";

const formatDiscoverableUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  username: user.username || "",
  profilePic: user.profilePic || "",
  lastSeen: user.lastSeen || null,
});

const normalizeIndianPhoneQuery = (value) => {
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

export const searchUsers = async (req, res) => {
  try {
    const currentUserId = String(req.user?._id || "");
    const query = sanitizePlainText(req.query.q, { maxLength: 50 }).toLowerCase();

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalizedPhone = normalizeIndianPhoneQuery(query);

    const mongoQuery = normalizedPhone
      ? {
          _id: { $ne: currentUserId },
          phoneNumber: normalizedPhone,
          isPhoneVerified: true,
        }
      : {
          _id: { $ne: currentUserId },
          $or: [
            { username: query },
            { fullName: { $regex: escapedQuery, $options: "i" } },
          ],
        };

    const users = await User.find(mongoQuery)
      .select("_id fullName username profilePic lastSeen")
      .limit(10);

    res.status(200).json({
      success: true,
      results: users.map(formatDiscoverableUser),
    });
  } catch (error) {
    console.log("Error in searchUsers controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkInviteTarget = async (req, res) => {
  try {
    const currentUserId = String(req.user?._id || "");
    const username = sanitizePlainText(req.query.username, { maxLength: 30 }).toLowerCase();

    if (!username) {
      return res.status(400).json({ message: "username is required" });
    }

    const user = await User.findOne({
      _id: { $ne: currentUserId },
      username,
    }).select("_id fullName username profilePic lastSeen");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(formatDiscoverableUser(user));
  } catch (error) {
    console.log("Error in checkInviteTarget controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
