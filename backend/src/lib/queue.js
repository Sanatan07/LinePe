import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "";

let queue = null;

const getConnection = () => {
  if (!REDIS_URL) return null;
  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

export const getNotificationsQueue = () => {
  if (!REDIS_URL) return null;
  if (queue) return queue;
  const connection = getConnection();
  queue = new Queue("notifications", { connection });
  return queue;
};

export const enqueueNotification = async (name, data, opts = {}) => {
  const q = getNotificationsQueue();
  if (!q) return null;
  return q.add(String(name), data, {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
    removeOnFail: 50,
    ...opts,
  });
};

