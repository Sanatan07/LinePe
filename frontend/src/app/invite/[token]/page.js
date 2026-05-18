import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/server-auth";
import { getInviteDetails } from "@/lib/server-invites";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "LinePe Invite",
  description: "Review and accept a LinePe invite.",
  robots: {
    index: false,
    follow: false,
  },
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const initialsFromName = (name) =>
  (name || "LinePe")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function StatusBadge({ invite }) {
  if (!invite) {
    return (
      <span className="rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
        Invalid
      </span>
    );
  }

  if (invite.isExpired) {
    return (
      <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
        Expired
      </span>
    );
  }

  if (!invite.isRedeemable) {
    return (
      <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700">
        {invite.status || "Unavailable"}
      </span>
    );
  }

  return (
    <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
      Valid
    </span>
  );
}

function InviterBlock({ invite }) {
  const inviterName =
    invite?.inviter?.fullName || invite?.inviter?.username || "Someone on LinePe";

  return (
    <div className="border-y border-stone-200 py-5">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">
          {initialsFromName(inviterName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-stone-950">{inviterName}</p>
          <p className="mt-1 truncate text-xs text-stone-500">
            {invite?.inviter?.username ? `@${invite.inviter.username}` : "LinePe invite"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function InvitePage({ params }) {
  const { token } = await params;
  const invitePath = `/invite/${encodeURIComponent(token || "")}`;
  const [{ user, canRefresh }, inviteResult] = await Promise.all([
    getAuthSession(),
    getInviteDetails(token),
  ]);
  const invite = inviteResult.invite;

  if (!user && canRefresh) {
    redirect(`/api/auth/refresh-session?next=${encodeURIComponent(invitePath)}`);
  }

  const inviterName =
    invite?.inviter?.fullName || invite?.inviter?.username || "Someone";
  const canAct = Boolean(invite?.isRedeemable);
  const signupHref = `/signup?invite=${encodeURIComponent(token || "")}`;
  const loginHref = `/login?invite=${encodeURIComponent(token || "")}`;

  return (
    <main className="min-h-screen bg-[#f4f6f2] text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="LinePe home">
            <span className="flex size-9 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
              L
            </span>
            <span className="text-lg font-bold">LinePe</span>
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-5xl items-center justify-center px-5 py-10 sm:px-6 sm:py-16">
        <div className="w-full max-w-xl rounded-lg border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-700">Invite</p>
              <h1 className="mt-3 text-3xl font-black text-stone-950">
                Join LinePe
              </h1>
            </div>
            <StatusBadge invite={invite} />
          </div>

          {invite ? (
            <>
              <p className="mt-5 text-base leading-7 text-stone-600">
                <span className="font-bold text-stone-950">{inviterName}</span>{" "}
                invited you to connect on LinePe.
              </p>

              <InviterBlock invite={invite} />

              <dl className="grid gap-4 py-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-stone-500">Invite code</dt>
                  <dd className="mt-1 font-mono text-stone-950">{invite.inviteCode}</dd>
                </div>
                <div>
                  <dt className="font-bold text-stone-500">Invite type</dt>
                  <dd className="mt-1 font-semibold text-stone-950">
                    Direct chat invite
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-stone-500">Sent</dt>
                  <dd className="mt-1 font-semibold text-stone-950">
                    {formatDate(invite.sentAt)}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-stone-500">Expires</dt>
                  <dd className="mt-1 font-semibold text-stone-950">
                    {formatDate(invite.expiresAt)}
                  </dd>
                </div>
              </dl>

              {invite.isExpired ? (
                <p className="rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                  This invite has expired. Ask {inviterName} to send a new invite.
                </p>
              ) : null}

              {!invite.isExpired && !invite.isRedeemable ? (
                <p className="rounded-md bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700">
                  This invite is no longer available.
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3">
                {user ? (
                  <>
                    <p className="text-sm text-stone-500">
                      Signed in as{" "}
                      <span className="font-bold text-stone-950">
                        {user.fullName || user.email}
                      </span>
                    </p>
                    <form
                      method="post"
                      action={`/api/invites/${encodeURIComponent(token || "")}/accept`}
                    >
                      <button
                        type="submit"
                        disabled={!canAct}
                        className="h-12 w-full rounded-md bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                      >
                        Accept invite
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href={signupHref}
                      aria-disabled={!canAct}
                      className={`inline-flex h-12 items-center justify-center rounded-md px-5 text-sm font-bold ${
                        canAct
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "pointer-events-none bg-stone-300 text-white"
                      }`}
                    >
                      Join LinePe
                    </Link>
                    <Link
                      href={loginHref}
                      className="inline-flex h-12 items-center justify-center rounded-md border border-stone-300 px-5 text-sm font-bold text-stone-950 hover:bg-stone-50"
                    >
                      Already have an account? Sign in
                    </Link>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="mt-6">
              <p className="rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                {inviteResult.message || "This invite could not be loaded."}
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-bold text-white hover:bg-stone-800"
              >
                Back to LinePe
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
