import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      index: true,
      match: /^\+91\d{10}$/,
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
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Invite = mongoose.model("Invite", inviteSchema);

export default Invite;
