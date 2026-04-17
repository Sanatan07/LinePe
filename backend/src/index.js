import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

dotenv.config();

const PORT = process.env.PORT;
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

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(helmet());

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

server.listen(PORT, async () => {
  console.log("server is running on PORT:" + PORT);
  await connectDB();
});
