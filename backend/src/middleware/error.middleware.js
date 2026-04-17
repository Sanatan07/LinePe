import { logger } from "../lib/logger.js";

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

  res.status(statusCode).json({ message });
};
