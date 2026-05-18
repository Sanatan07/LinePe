import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "";

let clientPromise = null;

export const getRedisClient = async () => {
  if (!REDIS_URL) return null;

  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient({
        url: REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries >= 4) return false; // stop retrying, degrade gracefully
            return Math.min(retries * 500, 2000);
          },
        },
      });

      let errorLogged = false;
      client.on("error", (err) => {
        if (errorLogged) return;
        errorLogged = true;
        const message =
          err?.message ||
          (Array.isArray(err?.errors) ? err.errors[0]?.message : null) ||
          "connection refused";
        console.error(`Redis unavailable (${message}) — running without Redis`);
      });

      try {
        await client.connect();
        errorLogged = false;
        return client;
      } catch {
        return null;
      }
    })();
  }

  return clientPromise;
};

export const getRedisClientOrThrow = async () => {
  const client = await getRedisClient();
  if (!client) throw new Error("Redis is not enabled (set REDIS_URL)");
  return client;
};
