import mongoose from "mongoose";
import { logger } from "./logger.js";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("Missing MongoDB connection string (set MONGODB_URI or MONGO_URI)");
    }

    const conn = await mongoose.connect(uri);
    logger.info("db.mongo.connected", { host: conn.connection.host });
  } catch (error) {
    logger.error("db.mongo.connection_failed", { error });
  }
};
