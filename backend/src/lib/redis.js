import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "";

const isRedisEnabled = () => Boolean(REDIS_URL);

let clientPromise = null;

export const getRedisClient = async () => {
  if (!isRedisEnabled()) return null;

  if (!clientPromise) {
    const client = createClient({ url: REDIS_URL });
    client.on("error", (err) => {
      console.error("Redis client error:", err?.message || err);
    });

    clientPromise = (async () => {
      if (!client.isOpen) {
        await client.connect();
      }
      return client;
    })();
  }

  return clientPromise;
};

export const getRedisClientOrThrow = async () => {
  const client = await getRedisClient();
  if (!client) throw new Error("Redis is not enabled (set REDIS_URL)");
  return client;
};

