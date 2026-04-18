import { config } from "dotenv";

import { connectDB } from "../lib/db.js";
import { backfillRegisteredUsers } from "../lib/account-registry.js";

config();

const run = async () => {
  try {
    await connectDB();
    const result = await backfillRegisteredUsers();
    console.log(`Migrated ${result.migrated} users from MongoDB to PostgreSQL.`);
    process.exit(0);
  } catch (error) {
    console.error("User migration failed:", error);
    process.exit(1);
  }
};

run();
