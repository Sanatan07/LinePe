import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["auth", "error"],
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "failure"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
      index: true,
    },
    message: {
      type: String,
      default: "",
      maxlength: 500,
    },
    method: {
      type: String,
      default: "",
    },
    route: {
      type: String,
      default: "",
      index: true,
    },
    statusCode: {
      type: Number,
      default: null,
      index: true,
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
