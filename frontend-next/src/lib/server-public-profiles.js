import { cache } from "react";

import { getApiBaseUrl } from "./server-auth";

const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/;

const serializePublicUser = (user) => ({
  fullName: user?.fullName || "",
  username: user?.username || "",
  profilePic: user?.profilePic || "",
  lastSeen: user?.lastSeen || null,
  joinedAt: user?.joinedAt || null,
});

export const getPublicProfile = cache(async (username) => {
  const normalizedUsername = String(username || "").trim().toLowerCase();

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return {
      user: null,
      status: 400,
      message: "Valid username is required",
    };
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/users/public/${encodeURIComponent(normalizedUsername)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        user: null,
        status: response.status,
        message: data?.message || "User not found",
      };
    }

    return {
      user: serializePublicUser(data?.user),
      status: response.status,
      message: "",
    };
  } catch {
    return {
      user: null,
      status: 503,
      message: "Profile service is unavailable",
    };
  }
});
