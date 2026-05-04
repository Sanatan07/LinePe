import Link from "next/link";

export const dynamic = "force-static";

export const metadata = {
  title: "LinePe - Real-time messaging for teams and communities",
  description:
    "LinePe is a fast real-time messaging app with secure signup, invite links, profiles, settings, and admin audit visibility.",
  alternates: {
    canonical: "/",
  },
};

const features = [
  {
    title: "Real-time chat",
    description:
      "Send messages instantly and keep conversations moving without refreshing the page.",
  },
  {
    title: "Invite-based access",
    description:
      "Bring people into the right conversation with shareable invite flows.",
  },
  {
    title: "Secure onboarding",
    description:
      "Email verification and stronger password rules help protect new accounts from the start.",
  },
  {
    title: "Profiles and settings",
    description:
      "Users can manage their account details, preferences, and personal workspace.",
  },
  {
    title: "Admin visibility",
    description:
      "Audit tools give trusted admins a clearer view of important account activity.",
  },
  {
    title: "Built for growth",
    description:
      "The product foundation is ready for team spaces, richer controls, and future plans.",
  },
];

const plans = [
  {
    name: "Free",
    price: "Free",
    description: "For early users, friends, and small communities getting started with LinePe.",
    items: ["Real-time conversations", "Account signup and login", "Invite links"],
  },
  {
    name: "Community",
    price: "Planned",
    description: "Future tools for groups that need better moderation and member management.",
    items: ["Member roles", "Conversation controls", "Community insights"],
  },
  {
    name: "Team",
    price: "Planned",
    description: "A roadmap plan for teams that need reliable messaging and admin oversight.",
    items: ["Admin audit views", "Workspace settings", "Priority improvements"],
  },
];

const futurePlans = [
  "Dedicated team workspaces",
  "Richer admin controls",
  "Better media and attachment workflows",
  "Expanded security and audit reporting",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LinePe",
  applicationCategory: "CommunicationApplication",
  operatingSystem: "Web",
  description:
    "LinePe is a real-time messaging app for conversations, invite-based access, profiles, settings, and admin audit visibility.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

function ChatPreview() {
  return (
    <div
      className="pointer-events-none absolute inset-x-4 bottom-[-34px] mx-auto max-w-5xl opacity-95 sm:bottom-[-52px] lg:inset-x-auto lg:right-8 lg:top-24 lg:w-[620px]"
      aria-hidden="true"
    >
      <div className="rounded-lg border border-stone-900/10 bg-white/92 shadow-2xl shadow-stone-900/15">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
              L
            </div>
            <div>
              <div className="h-3 w-28 rounded bg-stone-900" />
              <div className="mt-2 h-2 w-20 rounded bg-emerald-500" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-500" />
          </div>
        </div>

        <div className="grid min-h-[310px] grid-cols-[150px_1fr] bg-stone-50 sm:grid-cols-[190px_1fr]">
          <div className="border-r border-stone-200 bg-white p-3">
            {["Project crew", "Family chat", "Design group", "Admin audit"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`mb-2 rounded-md px-3 py-3 ${
                    index === 0 ? "bg-emerald-50" : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-7 rounded-full ${
                        index === 0
                          ? "bg-emerald-500"
                          : index === 1
                            ? "bg-sky-500"
                            : index === 2
                              ? "bg-rose-500"
                              : "bg-stone-400"
                      }`}
                    />
                    <span className="h-2.5 w-20 rounded bg-stone-700" />
                  </div>
                  <div className="mt-3 h-2 w-24 rounded bg-stone-300" />
                </div>
              ),
            )}
          </div>

          <div className="flex flex-col justify-between p-4">
            <div className="space-y-4">
              <div className="max-w-[76%] rounded-lg rounded-tl-sm bg-white p-3 shadow-sm">
                <div className="mb-2 h-2.5 w-24 rounded bg-stone-700" />
                <div className="h-2 w-full rounded bg-stone-300" />
                <div className="mt-2 h-2 w-3/4 rounded bg-stone-300" />
              </div>
              <div className="ml-auto max-w-[72%] rounded-lg rounded-tr-sm bg-emerald-600 p-3">
                <div className="h-2 w-40 rounded bg-white/90" />
                <div className="mt-2 h-2 w-24 rounded bg-white/70" />
              </div>
              <div className="max-w-[82%] rounded-lg rounded-tl-sm bg-white p-3 shadow-sm">
                <div className="mb-2 h-2.5 w-28 rounded bg-stone-700" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-16 rounded-md bg-sky-100" />
                  <div className="h-16 rounded-md bg-amber-100" />
                  <div className="h-16 rounded-md bg-emerald-100" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2">
              <div className="h-2 w-full rounded bg-stone-300" />
              <div className="size-8 rounded-md bg-stone-900" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-[#f7f8f4] text-stone-950">
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#f7f8f4]/95 backdrop-blur">
          <nav
            className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6"
            aria-label="Main navigation"
          >
            <Link href="/" className="flex items-center gap-3" aria-label="LinePe home">
              <span className="flex size-9 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
                L
              </span>
              <span className="text-lg font-bold">LinePe</span>
            </Link>

            <div className="hidden items-center gap-6 text-sm font-medium text-stone-700 sm:flex">
              <a href="#features" className="hover:text-stone-950">
                Features
              </a>
              <a href="#pricing" className="hover:text-stone-950">
                Pricing
              </a>
              <a href="#future" className="hover:text-stone-950">
                Roadmap
              </a>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200/70 hover:text-stone-950"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
              >
                Create account
              </Link>
            </div>
          </nav>
        </header>

        <section className="relative overflow-hidden border-b border-stone-200 bg-[#eef2e8]">
          <ChatPreview />
          <div className="relative mx-auto flex min-h-[680px] w-full max-w-6xl items-center px-5 py-20 sm:px-6 lg:min-h-[640px] lg:py-24">
            <div className="max-w-2xl pb-48 sm:pb-52 lg:pb-0">
              <p className="mb-4 text-sm font-bold uppercase text-emerald-700">
                Real-time messaging
              </p>
              <h1 className="max-w-xl text-5xl font-black leading-[1.02] text-stone-950 sm:text-6xl lg:text-7xl">
                LinePe
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700 sm:text-xl">
                A fast, secure chat experience for people, communities, and teams
                that need conversations, invites, profiles, and admin visibility in
                one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 hover:bg-emerald-700"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-stone-300 bg-white/80 px-5 text-sm font-bold text-stone-950 hover:bg-white"
                >
                  Sign in
                </Link>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="font-bold text-stone-950">Instant</dt>
                  <dd className="mt-1 text-stone-600">messages</dd>
                </div>
                <div>
                  <dt className="font-bold text-stone-950">Verified</dt>
                  <dd className="mt-1 text-stone-600">signup</dd>
                </div>
                <div>
                  <dt className="font-bold text-stone-950">Invite</dt>
                  <dd className="mt-1 text-stone-600">flows</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase text-emerald-700">Features</p>
              <h2 className="mt-3 text-3xl font-black text-stone-950 sm:text-4xl">
                Messaging essentials rendered for search and speed.
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600">
                This landing page is delivered as server-rendered HTML, so users and
                crawlers can read the product story before any app JavaScript is needed.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-stone-200 bg-[#fbfcf8] p-5"
                >
                  <h3 className="text-lg font-bold text-stone-950">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-y border-stone-200 bg-[#f7f8f4] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase text-sky-700">
                  Pricing and future plans
                </p>
                <h2 className="mt-3 text-3xl font-black text-stone-950 sm:text-4xl">
                  Start free while the product grows.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-stone-600">
                Plans are intentionally simple today, with clear room for community
                and team features as LinePe matures.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className="rounded-lg border border-stone-200 bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-stone-950">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        {plan.description}
                      </p>
                    </div>
                    <p className="rounded-md bg-stone-100 px-3 py-1 text-sm font-bold text-stone-800">
                      {plan.price}
                    </p>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-stone-700">
                    {plan.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 rounded-full bg-emerald-600" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="future" className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase text-amber-700">Roadmap</p>
              <h2 className="mt-3 text-3xl font-black text-stone-950 sm:text-4xl">
                Built now for the next version of LinePe.
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600">
                The landing page keeps high-value SEO content public while the
                authenticated chat experience can evolve behind login.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {futurePlans.map((plan, index) => (
                <article
                  key={plan}
                  className="rounded-lg border border-stone-200 bg-[#fbfcf8] p-5"
                >
                  <p className="text-sm font-bold text-emerald-700">
                    0{index + 1}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-stone-950">{plan}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-stone-950 py-16 text-white">
          <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 px-5 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black">Start chatting on LinePe.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-300">
                Create an account, sign in, and move from public landing content
                into the real-time app experience.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-md bg-emerald-500 px-5 text-sm font-bold text-stone-950 hover:bg-emerald-400"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-5 text-sm font-bold text-white hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
