import { NextResponse } from "next/server";

import { buildAuthCookieHeader, getApiBaseUrl } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const getInvitePath = (token) => `/invite/${encodeURIComponent(token || "")}`;

export async function POST(request, { params }) {
  const { token } = await params;
  const invitePath = getInvitePath(token);
  const cookieHeader = await buildAuthCookieHeader();

  if (!cookieHeader.includes("accessToken=")) {
    const hasRefreshToken = cookieHeader.includes("refreshToken=");

    if (hasRefreshToken) {
      return NextResponse.redirect(
        new URL(`/api/auth/refresh-session?next=${encodeURIComponent(invitePath)}`, request.url),
        303,
      );
    }

    return NextResponse.redirect(
      new URL(`/login?invite=${encodeURIComponent(token || "")}`, request.url),
      303,
    );
  }

  const response = await fetch(
    `${getApiBaseUrl()}/invites/${encodeURIComponent(token || "")}/accept`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
    },
  ).catch(() => null);

  if (!response?.ok) {
    return NextResponse.redirect(new URL(`${invitePath}?accepted=0`, request.url), 303);
  }

  const data = await response.json().catch(() => null);
  const conversationId = data?.conversation?._id || "";
  const chatUrl = conversationId
    ? `/chat?invite=accepted&cid=${encodeURIComponent(conversationId)}`
    : "/chat?invite=accepted";

  return NextResponse.redirect(new URL(chatUrl, request.url), 303);
}
