import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getJwtRefreshSecret, getJwtSecret } from "./secrets.js";

const isProduction = process.env.NODE_ENV === "production";
const normalizeSameSite = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return ["strict", "lax", "none"].includes(normalized) ? normalized : null;
};

const cookieSameSite =
  normalizeSameSite(process.env.COOKIE_SAME_SITE) || (isProduction ? "none" : "strict");
const cookieSecure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === "true"
  : isProduction;

const baseCookieOptions = {
  httpOnly: true,
  sameSite: cookieSameSite,
  secure: cookieSecure,
};

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const generateAuthTokens = ({ userId, tokenVersion }) => {
  const accessToken = jwt.sign({ userId, tokenVersion }, getJwtSecret(), {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });

  const tokenId = crypto.randomUUID();
  const refreshToken = jwt.sign(
    { userId, tokenVersion, tokenId },
    getJwtRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_TTL_SECONDS }
  );

  const refreshTokenHash = sha256(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

  return {
    accessToken,
    refreshToken,
    refreshTokenId: tokenId,
    refreshTokenHash,
    refreshExpiresAt,
  };
};

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};
