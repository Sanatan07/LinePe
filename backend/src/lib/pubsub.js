import { getRedisClient } from "./redis.js";

export const publishJson = async (channel, payload) => {
  const redis = await getRedisClient();
  if (!redis) return false;
  await redis.publish(String(channel), JSON.stringify(payload ?? null));
  return true;
};

export const subscribeJson = async (channel, handler) => {
  const redis = await getRedisClient();
  if (!redis) return { close: async () => {} };

  const subscriber = redis.duplicate();
  await subscriber.connect();

  await subscriber.subscribe(String(channel), (message) => {
    try {
      handler(JSON.parse(message));
    } catch {
      handler(null);
    }
  });

  return {
    close: async () => {
      try {
        await subscriber.unsubscribe(String(channel));
      } finally {
        await subscriber.quit();
      }
    },
  };
};

