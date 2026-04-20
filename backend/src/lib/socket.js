import dotenv from "dotenv";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";

import { SOCKET_EVENTS } from "../constants/socket.events.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getRedisClient } from "./redis.js";
import { createInMemoryPresenceStore, createRedisPresenceStore } from "./presence.store.js";
import { incrementMetric } from "./metrics.js";
import { logger } from "./logger.js";
import { getJwtSecret } from "./secrets.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const clientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: clientUrls,
    credentials: true,
  },
});

const USER_ROOM_PREFIX = "user:";
const userRoom = (userId) => `${USER_ROOM_PREFIX}${String(userId)}`;

let presenceStore = createInMemoryPresenceStore();

// Optional Redis adapter + Redis-backed presence.
(async () => {
  try {
    const redis = await getRedisClient();
    if (!redis) return;

    const pubClient = redis;
    const subClient = redis.duplicate();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    presenceStore = createRedisPresenceStore({ redis });
    logger.info("socket.redis_adapter.enabled");
  } catch (error) {
    logger.error("socket.redis_adapter.failed", { error });
  }
})();

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, rawCookie) => {
    const [name, ...valueParts] = rawCookie.trim().split("=");

    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});

const emitOnlineUsers = () => {
  presenceStore
    .getOnlineUserIds()
    .then((userIds) => {
      io.emit(SOCKET_EVENTS.ONLINE_USERS, userIds);
    })
    .catch(() => {});
};

export function getReceiverSocketIds(userId) {
  // Prefer emitting to `user:<id>` rooms; keep this for backwards compatibility only.
  return [];
}

export function emitMessageEvent(userIds, eventName, payload) {
  const targets = Array.isArray(userIds) ? userIds : [userIds];
  targets.forEach((userId) => {
    io.to(userRoom(userId)).emit(eventName, payload);
  });
}

io.use((socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(accessToken, getJwtSecret());
    socket.user = { userId: String(decoded.userId) };

    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const { userId } = socket.user;
  incrementMetric("socketConnections");
  logger.info("socket.connected", { socketId: socket.id, userId });

  socket.join(userRoom(userId));
  presenceStore.addSocket(userId, socket.id).catch(() => {});
  presenceStore.touchUser?.(userId).catch?.(() => {});

  emitOnlineUsers();

  const heartbeat = setInterval(() => {
    presenceStore.touchUser?.(userId).catch?.(() => {});
  }, 30 * 1000);

  socket.on(SOCKET_EVENTS.TYPING_START, (payload = {}) => {
    const toUserId = String(payload?.toUserId || "");
    if (!toUserId || toUserId === String(userId)) {
      return;
    }

    emitMessageEvent(toUserId, SOCKET_EVENTS.TYPING_START, {
      fromUserId: String(userId),
      toUserId,
    });
  });

  socket.on(SOCKET_EVENTS.TYPING_STOP, (payload = {}) => {
    const toUserId = String(payload?.toUserId || "");
    if (!toUserId || toUserId === String(userId)) {
      return;
    }

    emitMessageEvent(toUserId, SOCKET_EVENTS.TYPING_STOP, {
      fromUserId: String(userId),
      toUserId,
    });
  });

  socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED_ACK, async (payload = {}) => {
    try {
      const messageId = String(payload?.messageId || "");
      if (!messageId) return;

      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          receiverId: userId,
          status: "sent",
        },
        { $set: { status: "delivered" } },
        { new: true }
      );

      if (!message) return;

      emitMessageEvent(message.senderId, SOCKET_EVENTS.MESSAGE_DELIVERED, {
        messageId: message._id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        deliveredAt: new Date().toISOString(),
      });

      emitMessageEvent(message.receiverId, SOCKET_EVENTS.MESSAGE_DELIVERED, {
        messageId: message._id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        deliveredAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("socket.message_delivered_ack.failed", { error, socketId: socket.id, userId });
    }
  });

  socket.on(SOCKET_EVENTS.MESSAGE_SYNC_REQUEST, async () => {
    try {
      const onlineUsers = await presenceStore.getOnlineUserIds();
      socket.emit(SOCKET_EVENTS.MESSAGE_SYNC, {
        onlineUsers,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("socket.sync.failed", { error, socketId: socket.id, userId });
    }
  });

  socket.on("disconnect", () => {
    incrementMetric("socketDisconnects");
    logger.info("socket.disconnected", { socketId: socket.id, userId });
    clearInterval(heartbeat);

    presenceStore
      .removeSocket(userId, socket.id)
      .then(() => presenceStore.getSocketIds(userId))
      .then((socketIds) => {
        if (socketIds.length > 0) return;
        return User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((error) => {
          logger.error("socket.last_seen_update.failed", { error, userId });
        });
      })
      .catch(() => {});

    emitOnlineUsers();
  });
});

export { app, io, server };
