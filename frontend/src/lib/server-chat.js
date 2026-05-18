import { buildAuthCookieHeader, getApiBaseUrl } from "./server-auth";

const serializeUser = (user) => ({
  _id: String(user?._id || ""),
  fullName: user?.fullName || "",
  profilePic: user?.profilePic || "",
  lastSeen: user?.lastSeen || null,
});

const serializeMessage = (message) => {
  if (!message) {
    return null;
  }

  return {
    _id: String(message?._id || ""),
    text: message?.text || "",
    image: message?.image || "",
    attachments: Array.isArray(message?.attachments) ? message.attachments : [],
    status: message?.status || "sent",
    createdAt: message?.createdAt || null,
    senderId:
      typeof message?.senderId === "object"
        ? serializeUser(message.senderId)
        : String(message?.senderId || ""),
  };
};

const serializeConversation = (conversation) => ({
  _id: String(conversation?._id || ""),
  kind: "direct",
  participant: conversation?.participant ? serializeUser(conversation.participant) : null,
  lastMessage: serializeMessage(conversation?.lastMessage),
  lastActivityAt: conversation?.lastActivityAt || null,
  unreadCount: Number(conversation?.unreadCount || 0),
  muted: Boolean(conversation?.muted),
  archived: Boolean(conversation?.archived),
  pinned: Boolean(conversation?.pinned),
});

export async function getInitialConversations() {
  const cookieHeader = await buildAuthCookieHeader();

  if (!cookieHeader.includes("accessToken=")) {
    return [];
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/messages/conversations`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      return [];
    }

    const conversations = await response.json();

    if (!Array.isArray(conversations)) {
      return [];
    }

    return conversations.map(serializeConversation);
  } catch {
    return [];
  }
}
