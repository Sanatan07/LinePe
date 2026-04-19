import AuditLog from "../models/audit-log.model.js";
import { logger } from "./logger.js";

const getRequestIp = (req) => (typeof req?.ip === "string" ? req.ip : "");
const getUserAgent = (req) => (typeof req?.get === "function" ? req.get("user-agent") || "" : "");

const cleanMeta = (meta = {}) => {
  if (!meta || typeof meta !== "object") return {};

  const blockedKeys = new Set(["password", "token", "accessToken", "refreshToken", "otp"]);
  return Object.fromEntries(
    Object.entries(meta).filter(([key]) => !blockedKeys.has(String(key)))
  );
};

export const recordAuditLog = ({
  req,
  type,
  action,
  status,
  userId = null,
  email = "",
  message = "",
  statusCode = null,
  meta = {},
}) => {
  AuditLog.create({
    type,
    action,
    status,
    userId,
    email,
    message,
    statusCode,
    method: req?.method || "",
    route: req?.originalUrl || "",
    ip: getRequestIp(req),
    userAgent: getUserAgent(req),
    meta: cleanMeta(meta),
  }).catch((error) => {
    logger.error("audit_log.create.failed", { error, action, type });
  });
};
