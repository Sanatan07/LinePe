import crypto from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_BYTES = 32;
const pendingSignups = new Map();

const hashValue = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

const createOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

export const createPendingSignup = (email, payload) => {
  const otp = createOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const otpSalt = crypto.randomBytes(OTP_BYTES).toString("hex");

  pendingSignups.set(email, {
    ...payload,
    otpHash: hashValue(`${otpSalt}:${otp}`),
    otpSalt,
    expiresAt,
    attempts: 0,
  });

  return { otp, expiresAt };
};

export const consumePendingSignup = (email, otp) => {
  const pending = pendingSignups.get(email);

  if (!pending) {
    return { ok: false, message: "No pending signup found for this email" };
  }

  if (pending.expiresAt <= new Date()) {
    pendingSignups.delete(email);
    return { ok: false, message: "OTP has expired. Please sign up again." };
  }

  if (pending.attempts >= 5) {
    pendingSignups.delete(email);
    return { ok: false, message: "Too many invalid OTP attempts. Please sign up again." };
  }

  const nextHash = hashValue(`${pending.otpSalt}:${otp}`);
  if (nextHash !== pending.otpHash) {
    pending.attempts += 1;
    return { ok: false, message: "Invalid OTP" };
  }

  pendingSignups.delete(email);
  const { otpHash, otpSalt, attempts, ...payload } = pending;
  return { ok: true, payload };
};
