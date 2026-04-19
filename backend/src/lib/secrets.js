import crypto from "crypto";

const GENERATED_SECRET_BYTES = 64;

const generatedSecrets = new Map();

const placeholderValues = new Set([
  "change-me-access-secret",
  "change-me-refresh-secret",
  "replace-with-a-long-random-jwt-secret",
  "replace-with-a-long-random-refresh-secret",
]);

const generateSecret = () => crypto.randomBytes(GENERATED_SECRET_BYTES).toString("hex");

export const getRequiredSecret = (name) => {
  const value = process.env[name];
  const isProduction = process.env.NODE_ENV === "production";

  if (value && !placeholderValues.has(value)) {
    return value;
  }

  if (isProduction) {
    const reason = value ? "still uses a placeholder value" : "is missing";
    throw new Error(`Server misconfigured: ${name} ${reason}`);
  }

  if (!generatedSecrets.has(name)) {
    const secret = generateSecret();
    generatedSecrets.set(name, secret);
    process.env[name] = secret;
    console.warn(`[secrets] Generated development-only ${name}. Set a real value for production.`);
  }

  return generatedSecrets.get(name);
};

export const getJwtSecret = () => getRequiredSecret("JWT_SECRET");

export const getJwtRefreshSecret = () => getRequiredSecret("JWT_REFRESH_SECRET");

export const ensureAppSecrets = () => {
  getJwtSecret();
  getJwtRefreshSecret();
};
