import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicProfile } from "@/lib/server-public-profiles";

export const dynamic = "force-dynamic";

const formatDate = (value) => {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const initialsFromUser = (user) =>
  (user?.fullName || user?.username || "LinePe")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

export async function generateMetadata({ params }) {
  const { username } = await params;
  const { user } = await getPublicProfile(username);

  if (!user) {
    return {
      title: "LinePe Profile",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${user.fullName || `@${user.username}`} (@${user.username})`;
  const description = `View ${user.fullName || user.username}'s public LinePe profile and connect on LinePe.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/u/${user.username}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicUserPage({ params }) {
  const { username } = await params;
  const { user, status, message } = await getPublicProfile(username);

  if (!user && status === 404) {
    notFound();
  }

  const jsonLd = user
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: user.fullName || user.username,
        alternateName: `@${user.username}`,
        url: `/u/${user.username}`,
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

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
              href="/signup"
              className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Join LinePe
            </Link>
          </nav>
        </header>

        <section className="mx-auto flex w-full max-w-5xl items-center justify-center px-5 py-10 sm:px-6 sm:py-16">
          <div className="w-full max-w-xl rounded-lg border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
            {user ? (
              <>
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-24 items-center justify-center rounded-lg bg-emerald-600 text-3xl font-black text-white">
                    {initialsFromUser(user)}
                  </div>
                  <p className="mt-5 text-sm font-bold uppercase text-emerald-700">
                    Public Profile
                  </p>
                  <h1 className="mt-2 text-3xl font-black text-stone-950">
                    {user.fullName || `@${user.username}`}
                  </h1>
                  <p className="mt-2 text-sm font-semibold text-stone-500">
                    @{user.username}
                  </p>
                </div>

                <dl className="mt-8 grid gap-4 border-y border-stone-200 py-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-stone-500">Member since</dt>
                    <dd className="mt-1 font-semibold text-stone-950">
                      {formatDate(user.joinedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold text-stone-500">Profile</dt>
                    <dd className="mt-1 font-semibold text-stone-950">Public</dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/u/${user.username}`)}`}
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    Sign in to message
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex h-12 flex-1 items-center justify-center rounded-md border border-stone-300 px-5 text-sm font-bold text-stone-950 hover:bg-stone-50"
                  >
                    Create account
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold uppercase text-rose-700">Profile unavailable</p>
                <h1 className="mt-3 text-3xl font-black text-stone-950">
                  We could not load this profile.
                </h1>
                <p className="mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                  {message || "Try again later."}
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-bold text-white hover:bg-stone-800"
                >
                  Back to LinePe
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
