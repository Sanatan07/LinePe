"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/useAuthStore";

export default function ResendVerificationButton() {
  const { sendVerificationEmail } = useAuthStore();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const ok = await sendVerificationEmail();
    if (ok) setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <p className="mt-3 text-xs font-semibold text-emerald-700">
        Verification email sent — check your inbox.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
    >
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      Resend verification email
    </button>
  );
}
