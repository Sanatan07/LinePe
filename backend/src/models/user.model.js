import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 12,
    },
    profilePic: {
      type: String,
      default: "",
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    refreshSessions: [
      {
        tokenId: { type: String, required: true },
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
        revokedAt: { type: Date, default: null },
        replacedByTokenId: { type: String, default: null },
        ip: { type: String, default: "" },
        userAgent: { type: String, default: "" },
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true } //shows creaatedAt and updatedAt automatically
);

const User = mongoose.model("User", userSchema);

export default User;
