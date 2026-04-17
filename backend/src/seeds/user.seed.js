import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();

const FIRST_NAMES = [
  "Aarav",
  "Aisha",
  "Arjun",
  "Diya",
  "Ishaan",
  "Kabir",
  "Meera",
  "Neha",
  "Riya",
  "Rohan",
  "Saanvi",
  "Shaurya",
  "Vivaan",
  "Zara",
  "Aditya",
  "Ananya",
  "Kiran",
  "Lakshmi",
];

const LAST_NAMES = [
  "Sharma",
  "Patel",
  "Gupta",
  "Singh",
  "Kumar",
  "Iyer",
  "Reddy",
  "Mehta",
  "Nair",
  "Das",
  "Chatterjee",
  "Bose",
  "Kapoor",
  "Malhotra",
  "Jain",
  "Rao",
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const parseCountArg = () => {
  const index = process.argv.indexOf("--count");
  if (index === -1) return null;
  const raw = process.argv[index + 1];
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const buildRandomUser = ({ index, passwordHash }) => {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;

  const suffix = `${Date.now()}${Math.floor(Math.random() * 1e6)}${index}`;
  const email = `${firstName}.${lastName}.${suffix}@example.com`.toLowerCase();

  const isFemale = Math.random() < 0.5;
  const portraitIndex = (index % 90) + 1;
  const profilePic = `https://randomuser.me/api/portraits/${isFemale ? "women" : "men"}/${portraitIndex}.jpg`;

  return {
    email,
    fullName,
    password: passwordHash,
    profilePic,
  };
};

const seedDatabase = async () => {
  try {
    await connectDB();

    const count = parseCountArg() || parseInt(process.env.SEED_COUNT || "0", 10) || 20;

    const plainPassword = process.env.SEED_PASSWORD || "ChangeMeNow_123!";
    if (plainPassword.length < 12) {
      throw new Error("SEED_PASSWORD must be at least 12 characters");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plainPassword, salt);

    const users = Array.from({ length: count }, (_, index) =>
      buildRandomUser({ index, passwordHash })
    );

    const result = await User.insertMany(users, { ordered: false });
    console.log(`Seeded ${result.length} users successfully.`);
    console.log(`Seed password (all users): ${plainPassword}`);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

// Call the function
seedDatabase();
