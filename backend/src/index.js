import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import inviteRoutes from "./routes/invite.route.js";
import logRoutes from "./routes/log.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import { connectDB } from "./lib/db.js";
import { getMetricsSnapshot, recordHttpMetric } from "./lib/metrics.js";
import { logger } from "./lib/logger.js";
import { getRedisClient } from "./lib/redis.js";
import { ensureAppSecrets } from "./lib/secrets.js";
import { app, server } from "./lib/socket.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import mongoose from "mongoose";

dotenv.config();
ensureAppSecrets();

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
const allowlist = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const corsOrigin = (origin, cb) => {
  // Allow non-browser requests (no Origin header).
  if (!origin) return cb(null, true);
  if (allowlist.includes(origin)) return cb(null, true);
  const error = new Error("Not allowed by CORS");
  error.statusCode = 403;
  return cb(error);
};

app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    recordHttpMetric({
      method: req.method,
      route: req.route?.path || req.originalUrl,
      statusCode: res.statusCode,
    });

    logger.info("http.request.completed", {
      method: req.method,
      route: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
});

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.get("/api/health", async (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  const redisClient = await getRedisClient().catch(() => null);
  const redisConnected = Boolean(redisClient?.isOpen);
  const metrics = getMetricsSnapshot();
  const status = mongoConnected ? "ok" : "degraded";

  res.status(status === "ok" ? 200 : 503).json({
    status,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    services: {
      mongo: mongoConnected ? "up" : "down",
      redis: redisClient ? (redisConnected ? "up" : "down") : "disabled",
    },
    metrics,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

if (process.env.NODE_ENV === "production") {
  const frontendDistPath = path.join(__dirname, "../frontend/dist");
  const frontendIndexPath = path.join(frontendDistPath, "index.html");

  app.get("/", (req, res) => {
    if (fs.existsSync(frontendIndexPath)) {
      return res.sendFile(frontendIndexPath);
    }

    return res.status(200).json({
      status: "ok",
      service: "LinePe API",
      health: "/api/health",
    });
  });

  if (fs.existsSync(frontendIndexPath)) {
    app.use(express.static(frontendDistPath));

    app.get("/{*path}", (req, res) => {
      res.sendFile(frontendIndexPath);
    });
  }
}

app.use(notFound);
app.use(errorHandler);

server.listen(PORT, async () => {
  logger.info("server.starting", { port: PORT });
  await connectDB();
  logger.info("server.started", { port: PORT });
});
