"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";

import AuthImagePattern from "@/components/AuthImagePattern";
import { useAuthStore } from "@/store/useAuthStore";

const getSafeNextPath = (value) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/chat";
  }

  return value;
};

export default function LoginPageClient() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite") || "";
  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { authUser, checkAuth, login, isLoggingIn, isCheckingAuth } =
    useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authUser) return;
    navigate(
      inviteCode ? `/invite/${encodeURIComponent(inviteCode)}` : nextPath,
      { replace: true },
    );
  }, [authUser, inviteCode, nextPath, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const user = await login(formData);

    if (user) {
      navigate(
        inviteCode ? `/invite/${encodeURIComponent(inviteCode)}` : nextPath,
        { replace: true },
      );
    }
  };

  return (
    <main className="min-h-screen grid bg-stone-50 lg:grid-cols-2">
      <section className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2 text-stone-950">
                Welcome Back
              </h1>
              <p className="text-stone-500">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="text-stone-700 font-medium text-sm">
                  Email
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="text-stone-700 font-medium text-sm">
                  Password
                </span>
                <Link
                  href="/forgot-password"
                  className="link link-primary text-xs"
                >
                  Forgot password?
                </Link>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-stone-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData({ ...formData, password: event.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-stone-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-stone-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoggingIn || isCheckingAuth}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-stone-500">
              Don&apos;t have an account?{" "}
              <Link
                href={
                  inviteCode
                    ? `/signup?invite=${encodeURIComponent(inviteCode)}`
                    : "/signup"
                }
                className="link link-primary"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </section>

      <AuthImagePattern
        title="Welcome back!"
        subtitle="Sign in to continue your conversations and catch up with your messages."
      />
    </main>
  );
}
