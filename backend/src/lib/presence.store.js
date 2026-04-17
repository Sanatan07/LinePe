import crypto from "crypto";

const PRESENCE_TTL_SECONDS = 60;
const PRESENCE_KEY_PREFIX = "presence:user:";
const SOCKET_KEY_PREFIX = "presence:socket:";

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const createInMemoryPresenceStore = () => {
  const socketsByUserId = new Map(); // userId -> Set(socketId)
  const userExpiryByUserId = new Map(); // userId -> epoch seconds

  const touchUser = (userId) => {
    userExpiryByUserId.set(String(userId), nowSeconds() + PRESENCE_TTL_SECONDS);
  };

  const cleanup = () => {
    const now = nowSeconds();
    for (const [userId, expiry] of userExpiryByUserId.entries()) {
      if (expiry > now) continue;
      userExpiryByUserId.delete(userId);
      socketsByUserId.delete(userId);
    }
  };

  return {
    async addSocket(userId, socketId) {
      cleanup();
      const key = String(userId);
      const sockets = socketsByUserId.get(key) || new Set();
      sockets.add(String(socketId));
      socketsByUserId.set(key, sockets);
      touchUser(key);
    },

    async removeSocket(userId, socketId) {
      cleanup();
      const key = String(userId);
      const sockets = socketsByUserId.get(key);
      if (!sockets) return;
      sockets.delete(String(socketId));
      if (sockets.size === 0) {
        socketsByUserId.delete(key);
        userExpiryByUserId.delete(key);
      } else {
        socketsByUserId.set(key, sockets);
        touchUser(key);
      }
    },

    async getSocketIds(userId) {
      cleanup();
      const sockets = socketsByUserId.get(String(userId));
      return sockets ? Array.from(sockets) : [];
    },

    async getOnlineUserIds() {
      cleanup();
      const now = nowSeconds();
      return Array.from(userExpiryByUserId.entries())
        .filter(([, expiry]) => expiry > now)
        .map(([userId]) => userId);
    },

    async touchUser(userId) {
      cleanup();
      touchUser(userId);
    },
  };
};

export const createRedisPresenceStore = ({ redis }) => {
  const userKey = (userId) => `${PRESENCE_KEY_PREFIX}${String(userId)}`;
  const socketKey = (socketId) => `${SOCKET_KEY_PREFIX}${String(socketId)}`;
  const zKey = "presence:index";

  return {
    async addSocket(userId, socketId) {
      const uKey = userKey(userId);
      const sKey = socketKey(socketId);
      const expiry = PRESENCE_TTL_SECONDS;

      // Keep a set of socket ids per user and a reverse mapping socket -> user.
      await redis.multi()
        .sAdd(uKey, String(socketId))
        .expire(uKey, expiry)
        .set(sKey, String(userId), { EX: expiry })
        .zAdd(zKey, [{ score: nowSeconds(), value: String(userId) }])
        .expire(zKey, PRESENCE_TTL_SECONDS * 2)
        .exec();
    },

    async removeSocket(userId, socketId) {
      const uKey = userKey(userId);
      const sKey = socketKey(socketId);
      await redis.multi().sRem(uKey, String(socketId)).del(sKey).exec();
    },

    async getSocketIds(userId) {
      return redis.sMembers(userKey(userId));
    },

    async getOnlineUserIds() {
      const now = nowSeconds();
      const cutoff = now - PRESENCE_TTL_SECONDS;
      const userIds = await redis.zRangeByScore(zKey, cutoff, "+inf");
      return userIds;
    },

    async touchUser(userId) {
      await redis.zAdd(zKey, [{ score: nowSeconds(), value: String(userId) }]);
      await redis.expire(zKey, PRESENCE_TTL_SECONDS * 2);
    },
  };
};
