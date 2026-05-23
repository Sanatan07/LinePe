import { NextResponse } from "next/server";

import { buildAuthCookieHeader, getApiBaseUrl } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { token } = await params;

  if (!token) {
    return NextResponse.redirect(new URL("/profile?verified=0", request.url));
  }

  const cookieHeader = await buildAuthCookieHeader();

  const response = await fetch(`${getApiBaseUrl()}/auth/verify-email/${encodeURIComponent(token)}`, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  }).catch(() => null);

  if (!response) {
    return NextResponse.redirect(new URL("/profile?verified=0", request.url));
  }

  // Backend responds with 302 → /profile?verified=1 on success, or 4xx JSON on failure.
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location") || "/profile?verified=1";
    // Rewrite the backend origin in the redirect to the frontend origin so the
    // browser lands on the frontend, not the backend server.
    let dest = location;
    try {
      const backendUrl = new URL(getApiBaseUrl());
      const locUrl = new URL(location, request.url);
      if (locUrl.hostname === backendUrl.hostname) {
        locUrl.hostname = request.nextUrl.hostname;
        locUrl.port = request.nextUrl.port;
        locUrl.protocol = request.nextUrl.protocol;
        dest = locUrl.toString();
      }
    } catch {
      dest = location.startsWith("/") ? location : "/profile?verified=1";
    }
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.redirect(new URL("/profile?verified=0", request.url));
}
