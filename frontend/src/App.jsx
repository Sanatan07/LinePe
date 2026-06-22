import { useEffect } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { ArrowRight, MessageSquare, Shield, Users } from "lucide-react";

import ClientProviders from "./app/ClientProviders.js";
import ChatMain from "./app/chat/ChatMain.js";
import ForgotPasswordClient from "./app/forgot-password/ForgotPasswordClient.js";
import LoginPageClient from "./app/login/LoginPageClient.js";
import ResetPasswordClient from "./app/reset-password/[token]/ResetPasswordClient.js";
import SignUpPageClient from "./app/signup/SignUpPageClient.js";
import { useAuthStore } from "./store/useAuthStore.js";

function AppBootstrap() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return null;
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
    <main className="min-h-screen bg-stone-50 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-stone-950 text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-950">
              L
            </span>
            <span className="text-lg font-bold">LinePe</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-md px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950"
            >
              Create account
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
            <Shield className="size-3.5" /> Secure direct messaging
          </p>
          <h1 className="mt-6 max-w-xl text-5xl font-black leading-[1.02] sm:text-6xl">
            LinePe keeps private chat fast, clean, and simple.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-700 dark:text-stone-300">
            A React single-page client for signup, login, invites, and live
            messaging.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-stone-950 px-5 text-sm font-bold text-white hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950"
            >
              Get started <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-md border border-stone-300 bg-white px-5 text-sm font-bold text-stone-950 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <MessageSquare className="size-4 text-stone-500" />{" "}
                  {feature.title}
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl shadow-stone-900/10 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between border-b border-stone-200 pb-4 dark:border-stone-800">
            <div>
              <p className="text-sm font-bold uppercase text-stone-500">
                Preview
              </p>
              <h2 className="text-lg font-black">Chat workspace</h2>
            </div>
            <Users className="size-5 text-stone-500" />
          </div>
          <div className="mt-5 space-y-4">
            <div className="max-w-[78%] rounded-2xl rounded-tl-md bg-stone-100 p-4 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-200">
              Ready to move off Next and back to a plain React app.
            </div>
            <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-md bg-stone-950 p-4 text-sm text-white dark:bg-stone-100 dark:text-stone-950">
              The auth flow now uses React Router and Vite env vars.
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-dashed border-stone-300 p-4 text-sm text-stone-600 dark:border-stone-700 dark:text-stone-400">
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
        <Route
          path="/profile"
          element={
            <StubPage
              title="Profile"
              description="Profile screens can be re-added after the migration."
            />
          }
        />
        <Route
          path="/settings"
          element={
            <StubPage
              title="Settings"
              description="Settings screens can be re-added after the migration."
            />
          }
        />
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
