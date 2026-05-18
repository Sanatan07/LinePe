"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import toast from "react-hot-toast";

import AuthImagePattern from "@/components/AuthImagePattern";
import { useAuthStore } from "@/store/useAuthStore";

const MIN_PASSWORD_LENGTH = 12;

const getSafeNextPath = (value) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/chat";
  }

  return value;
};

export default function SignUpPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite") || "";
  const nextPath = useMemo(
    () => getSafeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const { authUser, checkAuth, signup, verifySignupOtp, isSigningUp } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authUser) return;
    router.replace(inviteCode ? `/invite/${encodeURIComponent(inviteCode)}` : nextPath);
  }, [authUser, inviteCode, nextPath, router]);

  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!formData.username.trim()) return toast.error("Username is required");
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (!/^[a-z0-9_.]+$/.test(formData.username.trim().toLowerCase())) {
      return toast.error("Username can only contain lowercase letters, numbers, underscores, and periods");
    }
    if (formData.username.trim().length < 3 || formData.username.trim().length > 30) {
      return toast.error("Username must be between 3 and 30 characters");
    }
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      return toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (validateForm() !== true) return;

    if (pendingEmail) {
      if (!/^\d{6}$/.test(otp)) {
        return toast.error("Enter the 6 digit verification code");
      }

      const verifiedUser = await verifySignupOtp({ email: pendingEmail, otp });
      if (verifiedUser) {
        router.replace(inviteCode ? `/invite/${encodeURIComponent(inviteCode)}` : nextPath);
      }
      return;
    }

    const result = await signup(formData);
    if (result?.requiresEmailVerification) {
      setPendingEmail(result.email || formData.email.trim().toLowerCase());
    }
  };

  const resetPendingVerification = (nextData) => {
    setFormData(nextData);
    setPendingEmail("");
    setOtp("");
  };

  return (
    <main className="min-h-screen grid bg-stone-50 lg:grid-cols-2">
      <section className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2 text-stone-950">Create Account</h1>
              <p className="text-stone-500">Get started with your free account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label" htmlFor="fullName">
                <span className="text-stone-700 font-medium text-sm">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-stone-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(event) =>
                    resetPendingVerification({ ...formData, fullName: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="text-stone-700 font-medium text-sm">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-stone-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(event) =>
                    resetPendingVerification({ ...formData, email: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="username">
                <span className="text-stone-700 font-medium text-sm">Username</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-stone-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="your.username"
                  value={formData.username}
                  onChange={(event) =>
                    resetPendingVerification({
                      ...formData,
                      username: event.target.value.toLowerCase(),
                    })
                  }
                />
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Lowercase only. Use letters, numbers, underscores, or periods.
              </p>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="text-stone-700 font-medium text-sm">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-stone-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  placeholder="Enter a strong password"
                  value={formData.password}
                  onChange={(event) =>
                    resetPendingVerification({ ...formData, password: event.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-stone-400" />
                  ) : (
                    <Eye className="size-5 text-stone-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Use at least 12 characters for stronger account security.
              </p>
            </div>

            {pendingEmail && (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-stone-600">
                  Verification code sent to {pendingEmail}. Enter it below to create your account.
                </div>

                <div className="form-control">
                  <label className="label" htmlFor="otp">
                    <span className="text-stone-700 font-medium text-sm">Verification Code</span>
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    className="w-full py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-center text-2xl tracking-[0.5em]"
                    placeholder="000000"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full"
                  disabled={isSigningUp}
                  onClick={async () => {
                    const result = await signup(formData);
                    if (result?.requiresEmailVerification) {
                      setOtp("");
                      setPendingEmail(result.email || pendingEmail);
                    }
                  }}
                >
                  Resend code
                </button>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={isSigningUp}>
              {isSigningUp ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  {pendingEmail ? "Creating..." : "Sending..."}
                </>
              ) : (
                pendingEmail ? "Create Account" : "Send Verification Code"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-stone-500">
              Already have an account?{" "}
              <Link
                href={inviteCode ? `/login?invite=${encodeURIComponent(inviteCode)}` : "/login"}
                className="link link-primary"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </main>
  );
}
