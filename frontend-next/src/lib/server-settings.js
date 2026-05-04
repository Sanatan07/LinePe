import { buildAuthCookieHeader, getApiBaseUrl } from "./server-auth";

const serializeSession = (session) => ({
  tokenId: String(session?.tokenId || ""),
  createdAt: session?.createdAt || null,
  expiresAt: session?.expiresAt || null,
  revokedAt: session?.revokedAt || null,
  ip: session?.ip || "",
  userAgent: session?.userAgent || "",
  current: Boolean(session?.current),
});

export async function getSecuritySessions() {
  const cookieHeader = await buildAuthCookieHeader();

  if (!cookieHeader.includes("accessToken=")) {
    return [];
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/sessions`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const sessions = Array.isArray(data?.sessions) ? data.sessions : [];

    return sessions.map(serializeSession);
  } catch {
    return [];
  }
}
