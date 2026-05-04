import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/server-auth";
import { getSecuritySessions } from "@/lib/server-settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings",
  robots: {
    index: false,
    follow: false,
  },
};

const notificationPreferences = [
  {
    name: "Message notifications",
    value: "On",
    description: "New direct and group messages",
  },
  {
    name: "Invite notifications",
    value: "On",
    description: "New invite activity",
  },
  {
    name: "Security alerts",
    value: "On",
    description: "Login, password, and verification events",
  },
];

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

const getBrowserLabel = (userAgent) => {
  const agent = userAgent || "";

  if (agent.includes("Edg/")) return "Microsoft Edge";
  if (agent.includes("Chrome/")) return "Chrome";
  if (agent.includes("Firefox/")) return "Firefox";
  if (agent.includes("Safari/")) return "Safari";

  return "Unknown browser";
};

function SettingRow({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-2 border-b border-stone-200 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold text-stone-950">{label}</p>
        {hint ? <p className="mt-1 text-xs leading-5 text-stone-500">{hint}</p> : null}
      </div>
      <p className="text-sm font-semibold text-stone-700">{value || "Not available"}</p>
    </div>
  );
}

function StatusPill({ active, children }) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
      }`}
    >
      {children}
    </span>
  );
}

export default async function SettingsPage() {
  const { user, canRefresh } = await getAuthSession();

  if (!user) {
    if (canRefresh) {
      redirect("/api/auth/refresh-session?next=/settings");
    }

    redirect("/login?next=/settings");
  }

  const sessions = await getSecuritySessions();

  return (
    <main className="min-h-screen bg-[#f4f6f2] text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="LinePe home">
            <span className="flex size-9 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
              L
            </span>
            <span className="text-lg font-bold">LinePe</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            >
              Chat
            </Link>
            <Link
              href="/profile"
              className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Profile
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase text-emerald-700">Settings</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950">Account settings</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-6 py-5">
              <h2 className="text-xl font-black text-stone-950">Account</h2>
            </div>
            <div className="px-6">
              <SettingRow label="Full name" value={user.fullName} />
              <SettingRow label="Username" value={user.username ? `@${user.username}` : ""} />
              <SettingRow label="Email address" value={user.email} />
              <SettingRow label="Phone number" value={user.phoneNumber} />
              <SettingRow label="Member since" value={formatDate(user.createdAt)} />
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-6 py-5">
              <h2 className="text-xl font-black text-stone-950">Security</h2>
            </div>
            <div className="px-6">
              <SettingRow
                label="Email verification"
                hint={user.email}
                value={user.isEmailVerified ? "Verified" : "Not verified"}
              />
              <SettingRow
                label="Phone verification"
                hint={user.phoneNumber || "No phone number added"}
                value={user.isPhoneVerified ? "Verified" : "Not verified"}
              />
              <SettingRow
                label="Password policy"
                value="12 character minimum"
                hint="Required for new passwords"
              />
              <SettingRow
                label="Active sessions"
                value={String(sessions.filter((session) => !session.revokedAt).length)}
                hint="Devices with a valid session"
              />
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-6 py-5">
              <h2 className="text-xl font-black text-stone-950">Notification Preferences</h2>
            </div>
            <div className="px-6">
              {notificationPreferences.map((preference) => (
                <SettingRow
                  key={preference.name}
                  label={preference.name}
                  value={preference.value}
                  hint={preference.description}
                />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-6 py-5">
              <h2 className="text-xl font-black text-stone-950">Recent Sessions</h2>
            </div>
            <div className="divide-y divide-stone-200 px-6">
              {sessions.length > 0 ? (
                sessions.slice(0, 4).map((session) => (
                  <div key={session.tokenId} className="py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-stone-950">
                          {getBrowserLabel(session.userAgent)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {session.ip || "Unknown IP"}
                        </p>
                      </div>
                      <StatusPill active={session.current}>
                        {session.current ? "Current" : "Active"}
                      </StatusPill>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-stone-500">
                      Created {formatDate(session.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-sm font-semibold text-stone-500">
                  Session details are unavailable.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
