import jwt from "jsonwebtoken";
import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: isProduction,
};

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const generateAuthTokens = ({ userId, tokenVersion }) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Server misconfigured: JWT_SECRET is missing");
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("Server misconfigured: JWT_REFRESH_SECRET is missing");
  }

  const accessToken = jwt.sign({ userId, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });

  const tokenId = crypto.randomUUID();
  const refreshToken = jwt.sign(
    { userId, tokenVersion, tokenId },
    process.env.JWT_REFRESH_SECRET,
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
