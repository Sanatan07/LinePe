import { getApiBaseUrl } from "./server-auth";

const serializeInviter = (inviter) => {
  if (!inviter) {
    return null;
  }

  return {
    _id: String(inviter?._id || ""),
    fullName: inviter?.fullName || "",
    username: inviter?.username || "",
    profilePic: inviter?.profilePic || "",
  };
};

const serializeInvite = (invite) => ({
  _id: String(invite?._id || ""),
  inviteCode: invite?.inviteCode || invite?.token || "",
  token: invite?.token || invite?.inviteCode || "",
  inviteUrl: invite?.inviteUrl || invite?.inviteLink || "",
  status: invite?.status || "",
  expiresAt: invite?.expiresAt || null,
  sentAt: invite?.sentAt || null,
  acceptedAt: invite?.acceptedAt || null,
  channelUsed: invite?.channelUsed || "link",
  inviter: serializeInviter(invite?.inviter),
  isExpired: Boolean(invite?.isExpired),
  isRedeemable: Boolean(invite?.isRedeemable),
});

export async function getInviteDetails(token) {
  const inviteToken = String(token || "").trim();

  if (!inviteToken) {
    return {
      invite: null,
      status: 400,
      message: "Invite token is required",
    };
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/invites/${encodeURIComponent(inviteToken)}`,
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
        invite: null,
        status: response.status,
        message: data?.message || "Unable to load invite",
      };
    }

    return {
      invite: serializeInvite(data?.invite),
      status: response.status,
      message: "",
    };
  } catch {
    return {
      invite: null,
      status: 503,
      message: "Invite service is unavailable",
    };
  }
}
