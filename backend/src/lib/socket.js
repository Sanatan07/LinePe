import dotenv from "dotenv";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { SOCKET_EVENTS } from "../constants/socket.events.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: [clientUrl],
    credentials: true,
  },
});

const userSocketMap = new Map();

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((cookies, rawCookie) => {
    const [name, ...valueParts] = rawCookie.trim().split("=");

    if (!name) {
      return cookies;
    }

    cookies[name] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});

const getSocketIdsForUser = (userId) => {
  const socketIds = userSocketMap.get(userId);
  return socketIds ? Array.from(socketIds) : [];
};

const emitOnlineUsers = () => {
  io.emit(SOCKET_EVENTS.ONLINE_USERS, Array.from(userSocketMap.keys()));
};

export function getReceiverSocketIds(userId) {
  return getSocketIdsForUser(String(userId));
}

export function emitMessageEvent(userIds, eventName, payload) {
  const targets = Array.isArray(userIds) ? userIds : [userIds];
  const uniqueSocketIds = new Set();

  targets.forEach((userId) => {
    getSocketIdsForUser(String(userId)).forEach((socketId) => uniqueSocketIds.add(socketId));
  });

  uniqueSocketIds.forEach((socketId) => {
    io.to(socketId).emit(eventName, payload);
  });
}

io.use((socket, next) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return next(new Error("Unauthorized"));
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    socket.user = { userId: String(decoded.userId) };

    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const { userId } = socket.user;
  console.log("Authenticated socket connected", socket.id, userId);

  const existingSockets = userSocketMap.get(userId) || new Set();
  existingSockets.add(socket.id);
  userSocketMap.set(userId, existingSockets);

  emitOnlineUsers();

  socket.on("disconnect", () => {
    console.log("Authenticated socket disconnected", socket.id, userId);

    const socketsForUser = userSocketMap.get(userId);
    if (socketsForUser) {
      socketsForUser.delete(socket.id);

      if (socketsForUser.size === 0) {
        userSocketMap.delete(userId);
      } else {
        userSocketMap.set(userId, socketsForUser);
      }
    }

    emitOnlineUsers();
  });
});

export { app, io, server };
