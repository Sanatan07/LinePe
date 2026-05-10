import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participantKey: {
      type: String,
      default: null,
    },
    kind: {
      type: String,
      enum: ["direct"],
      default: "direct",
      alias: "type",
      index: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
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
