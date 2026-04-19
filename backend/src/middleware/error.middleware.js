import { logger } from "../lib/logger.js";
import { recordAuditLog } from "../lib/audit-log.js";

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  logger.error("http.request.failed", {
    error,
    statusCode,
    method: req.method,
    route: req.originalUrl,
  });

  recordAuditLog({
    req,
    type: "error",
    action: "http_error",
    status: "failure",
    userId: req.user?._id || null,
    email: req.user?.email || "",
    message,
    statusCode,
    meta: {
      name: error.name,
    },
  });

  res.status(statusCode).json({ message });
};
