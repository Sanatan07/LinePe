import { useEffect } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { ArrowRight, MessageSquare, Palette, Shield, Users } from "lucide-react";

import ClientProviders from "./app/ClientProviders.js";
import ChatMain from "./app/chat/ChatMain.js";
import ForgotPasswordClient from "./app/forgot-password/ForgotPasswordClient.js";
import LoginPageClient from "./app/login/LoginPageClient.js";
import ResetPasswordClient from "./app/reset-password/[token]/ResetPasswordClient.js";
import SignUpPageClient from "./app/signup/SignUpPageClient.js";
import ProfilePageClient from "./app/profile/ProfilePageClient.js";
import SettingsPageClient from "./app/settings/SettingsPageClient.js";
import { useAuthStore } from "./store/useAuthStore.js";
import { useThemeStore } from "./store/useThemeStore.js";
import { THEMES } from "./constants/index.js";

function AppBootstrap() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return null;
}

function ThemeDropdown() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        aria-label="Select theme"
        className="flex size-9 items-center justify-center rounded-md text-stone-600 hover:bg-stone-200/70 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-50 transition-colors"
      >
        <Palette className="size-5" />
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-2xl border border-base-300 max-h-80 overflow-y-auto text-base-content"
      >
        {THEMES.map((t) => (
          <li key={t}>
            <button
              onClick={() => setTheme(t)}
              className={`flex items-center justify-between ${theme === t ? "active" : ""}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="flex gap-0.5" data-theme={t}>
                <span className="w-2 h-4 rounded-full bg-primary" />
                <span className="w-2 h-4 rounded-full bg-secondary" />
                <span className="w-2 h-4 rounded-full bg-accent" />
                <span className="w-2 h-4 rounded-full bg-neutral" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LandingPage() {
  const features = [
    {
      title: "Real-time chat",
      description: "Send messages instantly without page reloads.",
    },
    {
      title: "Invite access",
      description: "Share private invite links with the right people.",
    },
    {
      title: "Secure auth",
      description: "JWT sessions, OTP signup, and cookie-based auth.",
    },
  ];

  return (
    <main className="min-h-screen bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100/90 backdrop-blur">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-content">
              L
            </span>
            <span className="text-lg font-bold text-base-content">LinePe</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeDropdown />
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-sm font-semibold text-base-content/85 hover:bg-base-300"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-content hover:opacity-90"
            >
              Create account
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-base-content/70">
            <Shield className="size-3.5" /> Secure direct messaging
          </p>
          <h1 className="mt-6 max-w-xl text-5xl font-black leading-[1.02] sm:text-6xl text-base-content">
            LinePe keeps private chat fast, clean, and simple.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-base-content/80">
            A React single-page client for signup, login, invites, and live
            messaging.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-content hover:opacity-90"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-md border border-base-300 bg-base-100 px-5 text-sm font-bold text-base-content hover:bg-base-200"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-base-300 bg-base-100 p-4"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-base-content">
                  <MessageSquare className="size-4 text-primary" />{" "}
                  {feature.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-base-content/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-base-300 pb-4">
            <div>
              <p className="text-sm font-bold uppercase text-base-content/60">
                Preview
              </p>
              <h2 className="text-lg font-black text-base-content">Chat workspace</h2>
            </div>
            <Users className="size-5 text-base-content/60" />
          </div>
          <div className="mt-5 space-y-4">
            <div className="max-w-[78%] rounded-2xl rounded-tl-md bg-base-200 p-4 text-sm text-base-content/85">
              Ready to move off Next and back to a plain React app.
            </div>
            <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-md bg-primary p-4 text-sm text-primary-content shadow-md">
              The auth flow now uses React Router and Vite env vars.
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-dashed border-base-300 p-4 text-sm text-base-content/70">
              Login, signup, forgot password, and chat routes are available.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResetPasswordRoute() {
  const { token } = useParams();
  return <ResetPasswordClient token={token} />;
}

function InviteRoute() {
  const { token } = useParams();
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900">
        <p className="text-sm font-bold uppercase text-stone-500">LinePe</p>
        <h1 className="mt-3 text-3xl font-black">Invite</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600 dark:text-stone-400">
          Invite token: {token || "not provided"}
        </p>
        <Link
          to="/signup"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-bold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}

function ProtectedChatRoute() {
  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-500 dark:bg-stone-950">
        Loading...
      </main>
    );
  }

  if (!authUser) {
    return <Navigate to="/login?next=/chat" replace />;
  }

  return <ChatMain />;
}

function ProtectedProfileRoute() {
  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-500 dark:bg-stone-950">
        Loading...
      </main>
    );
  }

  if (!authUser) {
    return <Navigate to="/login?next=/profile" replace />;
  }

  return <ProfilePageClient />;
}

function StubPage({ title, description }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900">
        <p className="text-sm font-bold uppercase text-stone-500">LinePe</p>
        <h1 className="mt-3 text-3xl font-black">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600 dark:text-stone-400">
          {description}
        </p>
        <Link
          to="/chat"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-stone-950 px-5 text-sm font-bold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950"
        >
          Open chat
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppBootstrap />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPageClient />} />
        <Route path="/signup" element={<SignUpPageClient />} />
        <Route path="/forgot-password" element={<ForgotPasswordClient />} />
        <Route path="/reset-password/:token" element={<ResetPasswordRoute />} />
        <Route path="/invite/:token" element={<InviteRoute />} />
        <Route path="/chat" element={<ProtectedChatRoute />} />
        <Route path="/profile" element={<ProtectedProfileRoute />} />
        <Route path="/settings" element={<SettingsPageClient />} />
        <Route
          path="/audit"
          element={
            <StubPage
              title="Audit"
              description="Admin audit views can be re-added after the migration."
            />
          }
        />
        <Route
          path="/u/:username"
          element={
            <StubPage
              title="Public profile"
              description="Public profile pages can be re-added after the migration."
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ClientProviders />
    </BrowserRouter>
  );
}
