import { NextResponse } from "next/server";

import { buildAuthCookieHeader, getApiBaseUrl } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const getSafeNextPath = (request) => {
  const nextPath = request.nextUrl.searchParams.get("next") || "/chat";

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/chat";
  }

  return nextPath;
};

const splitSetCookieHeader = (header) => {
  if (!header) {
    return [];
  }

  const cookies = [];
  let start = 0;
  let inExpires = false;

  for (let index = 0; index < header.length; index += 1) {
    const char = header[index];
    const nextChunk = header.slice(index, index + 8).toLowerCase();

    if (nextChunk === "expires=") {
      inExpires = true;
    }

    if (inExpires && char === ";") {
      inExpires = false;
    }

    if (!inExpires && char === ",") {
      cookies.push(header.slice(start, index).trim());
      start = index + 1;
    }
  }

  cookies.push(header.slice(start).trim());
  return cookies.filter(Boolean);
};

const getSetCookieHeaders = (headers) => {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  return splitSetCookieHeader(headers.get("set-cookie"));
};

export async function GET(request) {
  const nextPath = getSafeNextPath(request);
  const cookieHeader = await buildAuthCookieHeader();

  if (!cookieHeader.includes("refreshToken=")) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/refresh-token`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
  }).catch(() => null);

  if (!response?.ok) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  const redirectResponse = NextResponse.redirect(new URL(nextPath, request.url));

  getSetCookieHeaders(response.headers).forEach((setCookie) => {
    redirectResponse.headers.append("Set-Cookie", setCookie);
  });

  return redirectResponse;
}
