import dotenv from "dotenv";
import { Worker } from "bullmq";
import IORedis from "ioredis";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "";

if (!REDIS_URL) {
  console.error("Worker requires REDIS_URL");
  process.exit(1);
}

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const worker = new Worker(
  "notifications",
  async (job) => {
    if (job.name === "user:welcome") {
      // Placeholder: integrate email provider later.
      console.log("Welcome job:", job.data);
      return { ok: true };
    }

    console.log("Unhandled job:", job.name, job.data);
    return { ok: true };
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error("Job failed:", job?.id, job?.name, err?.message || err);
});

worker.on("completed", (job) => {
  console.log("Job completed:", job?.id, job?.name);
});

console.log("Worker started");

