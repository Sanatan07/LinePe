import Link from "next/link";
import LandingThemeToggle from "@/components/LandingThemeToggle";

export const dynamic = "force-static";

export const metadata = {
  title: "LinePe - Real-time direct messaging",
  description:
    "LinePe is a fast direct messaging app with secure signup, invite links, profiles, settings, and admin audit visibility.",
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
    description: "For early users and friends getting started with LinePe.",
    items: ["Real-time conversations", "Account signup and login", "Invite links"],
  },
  {
    name: "Team",
    price: "Planned",
    description: "A roadmap plan for teams that need reliable messaging and admin oversight.",
    items: ["Admin audit views", "Workspace settings", "Priority improvements"],
  },
];

const futurePlans = [
  "Dedicated contact spaces",
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
    "LinePe is a real-time direct messaging app for conversations, invite-based access, profiles, settings, and admin audit visibility.",
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
      <div className="rounded-lg border border-stone-900/10 bg-white/92 shadow-2xl shadow-stone-900/15 dark:border-stone-100/10 dark:bg-stone-800/95">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-stone-900 text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-900">
              L
            </div>
            <div>
              <div className="h-3 w-28 rounded bg-stone-900 dark:bg-stone-200" />
              <div className="mt-2 h-2 w-20 rounded bg-stone-400 dark:bg-stone-500" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-stone-300 dark:bg-stone-600" />
            <span className="size-2 rounded-full bg-stone-300 dark:bg-stone-600" />
            <span className="size-2 rounded-full bg-stone-500 dark:bg-stone-400" />
          </div>
        </div>

        <div className="grid min-h-[310px] grid-cols-[150px_1fr] bg-stone-50 dark:bg-stone-900 sm:grid-cols-[190px_1fr]">
          <div className="border-r border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-800">
            {["Maya", "Arjun", "Design lead", "Admin audit"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`mb-2 rounded-md px-3 py-3 ${
                    index === 0
                      ? "bg-stone-100 dark:bg-stone-700"
                      : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-7 rounded-full ${
                        index === 0
                          ? "bg-stone-700 dark:bg-stone-300"
                          : index === 1
                            ? "bg-stone-500"
                            : index === 2
                              ? "bg-stone-400"
                              : "bg-stone-300 dark:bg-stone-600"
                      }`}
                    />
                    <span className="h-2.5 w-20 rounded bg-stone-700 dark:bg-stone-300" />
                  </div>
                  <div className="mt-3 h-2 w-24 rounded bg-stone-300 dark:bg-stone-600" />
                </div>
              ),
            )}
          </div>

          <div className="flex flex-col justify-between p-4">
            <div className="space-y-4">
              <div className="max-w-[76%] rounded-lg rounded-tl-sm bg-white p-3 shadow-sm dark:bg-stone-700">
                <div className="mb-2 h-2.5 w-24 rounded bg-stone-700 dark:bg-stone-300" />
                <div className="h-2 w-full rounded bg-stone-300 dark:bg-stone-500" />
                <div className="mt-2 h-2 w-3/4 rounded bg-stone-300 dark:bg-stone-500" />
              </div>
              <div className="ml-auto max-w-[72%] rounded-lg rounded-tr-sm bg-stone-900 p-3 dark:bg-stone-200">
                <div className="h-2 w-40 rounded bg-white/90 dark:bg-stone-900/80" />
                <div className="mt-2 h-2 w-24 rounded bg-white/70 dark:bg-stone-900/60" />
              </div>
              <div className="max-w-[82%] rounded-lg rounded-tl-sm bg-white p-3 shadow-sm dark:bg-stone-700">
                <div className="mb-2 h-2.5 w-28 rounded bg-stone-700 dark:bg-stone-300" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-16 rounded-md bg-stone-100 dark:bg-stone-600" />
                  <div className="h-16 rounded-md bg-stone-200 dark:bg-stone-500" />
                  <div className="h-16 rounded-md bg-stone-100 dark:bg-stone-600" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-800">
              <div className="h-2 w-full rounded bg-stone-300 dark:bg-stone-600" />
              <div className="size-8 rounded-md bg-stone-900 dark:bg-stone-200" />
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

      <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
          <nav
            className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6"
            aria-label="Main navigation"
          >
            <Link href="/" className="flex items-center gap-3" aria-label="LinePe home">
              <span className="flex size-9 items-center justify-center rounded-md bg-stone-900 text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-900">
                L
              </span>
              <span className="text-lg font-bold">LinePe</span>
            </Link>

            <div className="hidden items-center gap-6 text-sm font-medium text-stone-700 dark:text-stone-300 sm:flex">
              <a href="#features" className="hover:text-stone-950 dark:hover:text-stone-50">
                Features
              </a>
              <a href="#pricing" className="hover:text-stone-950 dark:hover:text-stone-50">
                Pricing
              </a>
              <a href="#future" className="hover:text-stone-950 dark:hover:text-stone-50">
                Roadmap
              </a>
            </div>

            <div className="flex items-center gap-2">
              <LandingThemeToggle />
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200/70 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-50"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
              >
                Create account
              </Link>
            </div>
          </nav>
        </header>

        <section className="relative overflow-hidden border-b border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900">
          <ChatPreview />
          <div className="relative mx-auto flex min-h-[680px] w-full max-w-6xl items-center px-5 py-20 sm:px-6 lg:min-h-[640px] lg:py-24">
            <div className="max-w-2xl pb-48 sm:pb-52 lg:pb-0">
              <p className="mb-4 text-sm font-bold uppercase text-stone-500 dark:text-stone-400">
                Real-time messaging
              </p>
              <h1 className="max-w-xl text-5xl font-black leading-[1.02] text-stone-950 dark:text-stone-50 sm:text-6xl lg:text-7xl">
                LinePe
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700 dark:text-stone-300 sm:text-xl">
                A fast, secure direct chat experience for people and teams
                that need conversations, invites, profiles, and admin visibility in
                one place.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-bold text-white shadow-lg shadow-stone-900/15 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-stone-300 bg-white/80 px-5 text-sm font-bold text-stone-950 hover:bg-white dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-100 dark:hover:bg-stone-800"
                >
                  Sign in
                </Link>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="font-bold text-stone-950 dark:text-stone-50">Instant</dt>
                  <dd className="mt-1 text-stone-600 dark:text-stone-400">messages</dd>
                </div>
                <div>
                  <dt className="font-bold text-stone-950 dark:text-stone-50">Verified</dt>
                  <dd className="mt-1 text-stone-600 dark:text-stone-400">signup</dd>
                </div>
                <div>
                  <dt className="font-bold text-stone-950 dark:text-stone-50">Invite</dt>
                  <dd className="mt-1 text-stone-600 dark:text-stone-400">flows</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-16 dark:bg-stone-950 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase text-stone-500 dark:text-stone-400">Features</p>
              <h2 className="mt-3 text-3xl font-black text-stone-950 dark:text-stone-50 sm:text-4xl">
                Messaging essentials rendered for search and speed.
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600 dark:text-stone-400">
                This landing page is delivered as server-rendered HTML, so users and
                crawlers can read the product story before any app JavaScript is needed.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900"
                >
                  <h3 className="text-lg font-bold text-stone-950 dark:text-stone-50">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="border-y border-stone-200 bg-stone-50 py-16 dark:border-stone-800 dark:bg-stone-900 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase text-stone-500 dark:text-stone-400">
                  Pricing and future plans
                </p>
                <h2 className="mt-3 text-3xl font-black text-stone-950 dark:text-stone-50 sm:text-4xl">
                  Start free while the product grows.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-stone-600 dark:text-stone-400">
                Plans are intentionally simple today, with clear room for safer
                direct messaging and admin features as LinePe matures.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className="rounded-lg border border-stone-200 bg-white p-6 dark:border-stone-700 dark:bg-stone-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-stone-950 dark:text-stone-50">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
                        {plan.description}
                      </p>
                    </div>
                    <p className="rounded-md bg-stone-100 px-3 py-1 text-sm font-bold text-stone-800 dark:bg-stone-700 dark:text-stone-200">
                      {plan.price}
                    </p>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-stone-700 dark:text-stone-300">
                    {plan.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 rounded-full bg-stone-600 dark:bg-stone-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="future" className="bg-white py-16 dark:bg-stone-950 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase text-stone-500 dark:text-stone-400">Roadmap</p>
              <h2 className="mt-3 text-3xl font-black text-stone-950 dark:text-stone-50 sm:text-4xl">
                Built now for the next version of LinePe.
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600 dark:text-stone-400">
                The landing page keeps high-value SEO content public while the
                authenticated chat experience can evolve behind login.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {futurePlans.map((plan, index) => (
                <article
                  key={plan}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900"
                >
                  <p className="text-sm font-bold text-stone-400 dark:text-stone-500">
                    0{index + 1}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-stone-950 dark:text-stone-50">{plan}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-stone-950 py-16 text-white dark:bg-stone-800">
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
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-5 text-sm font-bold text-stone-950 hover:bg-stone-100"
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
