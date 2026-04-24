import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User } from "lucide-react";
import toast from "react-hot-toast";

import AuthImagePattern from "../components/AuthImagePattern";
import { useAuthStore } from "../store/useAuthStore";

const MIN_PASSWORD_LENGTH = 12;

const SignUpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const { signup, verifySignupOtp, isSigningUp } = useAuthStore();
  const inviteCode = new URLSearchParams(location.search).get("invite");

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = validateForm();

    if (success !== true) return;

    if (pendingEmail) {
      if (!/^\d{6}$/.test(otp)) {
        return toast.error("Enter the 6 digit verification code");
      }

      const verifiedUser = await verifySignupOtp({ email: pendingEmail, otp });
      if (verifiedUser && inviteCode) {
        navigate(`/invite/${encodeURIComponent(inviteCode)}`);
      }
      return;
    }

    const result = await signup(formData);
    if (result?.requiresEmailVerification) {
      setPendingEmail(result.email || formData.email.trim().toLowerCase());
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
              group-hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Create Account</h1>
              <p className="text-base-content/60">Get started with your free account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setPendingEmail("");
                    setOtp("");
                  }}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Username</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="your.username"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      username: e.target.value.toLowerCase(),
                    });
                    setPendingEmail("");
                    setOtp("");
                  }}
                />
              </div>
              <p className="text-xs text-base-content/60 mt-2">
                Lowercase only. Use letters, numbers, underscores, or periods.
              </p>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10"
                  placeholder="Enter a strong password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setPendingEmail("");
                    setOtp("");
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5 text-base-content/40" />
                  ) : (
                    <Eye className="size-5 text-base-content/40" />
                  )}
                </button>
              </div>
              <p className="text-xs text-base-content/60 mt-2">
                Use at least 12 characters for stronger account security.
              </p>
            </div>

            {pendingEmail && (
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-base-content/70">
                  Verification code sent to {pendingEmail}. Enter it below to create your account.
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Verification Code</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    className="input input-bordered w-full text-center text-2xl tracking-[0.5em]"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Join our community"
        subtitle="Connect with friends, share moments, and stay in touch with your loved ones."
      />
    </div>
  );
};

export default SignUpPage;
