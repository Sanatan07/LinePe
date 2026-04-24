import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      alias: "invitedBy",
      index: true,
    },
    phoneNumber: {
      type: String,
      default: "",
      alias: "phone",
      index: true,
      match: /^\+91\d{10}$/,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    username: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    channelUsed: {
      type: String,
      enum: ["sms", "whatsapp", "link"],
      default: "link",
      index: true,
    },
    inviteCode: {
      type: String,
      required: true,
      alias: "token",
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "accepted", "expired", "failed"],
      default: "pending",
    },
    sentAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Invite = mongoose.model("Invite", inviteSchema);

export default Invite;
