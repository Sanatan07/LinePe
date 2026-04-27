import mongoose from "mongoose";

const messageDeliverySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageReadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    clientMessageId: {
      type: String,
      default: null,
      trim: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image"], required: true },
        mimeType: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        width: { type: Number, default: null },
        height: { type: Number, default: null },
        originalName: { type: String, default: "" },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed"],
      default: "sent",
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredTo: {
      type: [messageDeliverySchema],
      default: [],
    },
    readBy: {
      type: [messageReadSchema],
      default: [],
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index(
  { conversationId: 1, senderId: 1, clientMessageId: 1 },
  { unique: true, partialFilterExpression: { clientMessageId: { $type: "string" } } }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
