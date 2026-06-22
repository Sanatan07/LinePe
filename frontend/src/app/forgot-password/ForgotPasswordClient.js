"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, MessageSquare } from "lucide-react";

import AuthImagePattern from "@/components/AuthImagePattern";
import { useAuthStore } from "@/store/useAuthStore";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { forgotPassword, isSendingPasswordReset } = useAuthStore();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await forgotPassword(email.trim());
    if (ok) setSubmitted(true);
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
                Forgot password?
              </h1>
              <p className="text-stone-500">
                {submitted
                  ? "Check your inbox for the reset link."
                  : "Enter your email and we’ll send a reset link."}
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="text-center space-y-4">
              <p className="text-stone-600 text-sm">
                If that address is registered you&apos;ll receive an email
                within a minute. The link expires in 15&nbsp;minutes.
              </p>
              <Link to="/login" className="btn btn-primary w-full">
                Back to sign in
              </Link>
            </div>
          ) : (
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
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSendingPasswordReset || !email.trim()}
              >
                {isSendingPasswordReset ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>
          )}

          <div className="text-center">
            <Link to="/login" className="link link-primary text-sm">
              Back to sign in
            </Link>
          </div>
        </div>
      </section>

      <AuthImagePattern
        title="Recover your account"
        subtitle="We’ll email you a secure link to reset your password."
      />
    </main>
  );
}
