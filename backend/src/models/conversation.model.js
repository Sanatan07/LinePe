import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participantKey: {
      type: String,
      default: null,
    },
    kind: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
      alias: "type",
      index: true,
    },
    groupName: {
      type: String,
      default: "",
      trim: true,
      alias: "name",
    },
    groupAvatar: {
      type: String,
      default: "",
      trim: true,
      alias: "groupImage",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    lastReadAt: {
      type: Map,
      of: Date,
      default: {},
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      alias: "lastActivity",
    },
    mutedBy: {
      type: Map,
      of: Boolean,
      default: {},
    },
    archivedBy: {
      type: Map,
      of: Boolean,
      default: {},
    },
    pinnedBy: {
      type: Map,
      of: Boolean,
      default: {},
    },
    hiddenBy: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ participantKey: 1 }, { unique: true, sparse: true });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
