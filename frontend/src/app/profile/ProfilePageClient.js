import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import NavBar from "@/components/NavBar";
import { Camera, Mail, User } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePageClient = () => {
  const { authUser, isUpdatingProfile, updateProfile, sendVerificationEmail } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [username, setUsername] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const currentUsername = username || authUser?.username || "";
  const emailVerified = useMemo(() => Boolean(authUser?.isEmailVerified), [authUser?.isEmailVerified]);

  const handleSaveUsername = async () => {
    const nextUsername = currentUsername.trim().toLowerCase();
    if (!nextUsername) return toast.error("Username is required");
    if (!/^[a-z0-9_.]+$/.test(nextUsername)) {
      return toast.error("Username can only contain lowercase letters, numbers, underscores, and periods");
    }
    if (nextUsername.length < 3 || nextUsername.length > 30) {
      return toast.error("Username must be between 3 and 30 characters");
    }

    await updateProfile({ username: nextUsername });
    setUsername("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      return toast.error("All password fields are required");
    }
    if (passwordForm.newPassword.length < 12) {
      return toast.error("New password must be at least 12 characters");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New password and confirm password must match");
    }

    const result = await updateProfile({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    if (!result) return;
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  if (!authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 pt-20 pb-10 overflow-y-auto">
      <NavBar />
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-base-100 border border-base-300 rounded-xl p-6 space-y-8 shadow-xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-base-content">Profile</h1>
            <p className="mt-2 text-sm text-base-content/60">Your profile information</p>
          </div>

          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-base-300 shadow-md"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-primary text-primary-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200 shadow-md
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-xs text-base-content/50">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-base-content/75 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </span>
              </label>
              <div className="px-4 py-3 bg-base-200 rounded-lg border border-base-300 text-base-content font-medium">
                {authUser?.fullName}
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-base-content/75 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className="input input-bordered flex-1 bg-base-50 text-base-content"
                  value={currentUsername}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="your.username"
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isUpdatingProfile || !currentUsername.trim() || currentUsername === (authUser?.username || "")}
                  onClick={handleSaveUsername}
                >
                  {isUpdatingProfile ? "Saving..." : "Save Username"}
                </button>
              </div>
              {authUser?.usernameAutoGenerated && (
                <p className="text-xs text-warning mt-1">
                  Your current username was auto-generated. You can change it now.
                </p>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-base-content/75 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </span>
              </label>
              <div className="space-y-2">
                <div className="px-4 py-3 bg-base-200 rounded-lg border border-base-300 text-base-content font-medium">
                  {authUser?.email}
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className={emailVerified ? "text-success font-semibold" : "text-warning font-semibold"}>
                    {emailVerified ? "Email verified" : "Email not verified"}
                  </span>
                  {!emailVerified && (
                    <button
                      type="button"
                      className="btn btn-xs btn-outline btn-warning"
                      onClick={sendVerificationEmail}
                    >
                      Send verification email
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-base-300 my-6"></div>

            <div className="space-y-4">
              <h3 className="font-semibold text-base-content flex items-center gap-2">
                <User className="w-4 h-4" />
                Change Password
              </h3>
              <div className="form-control w-full">
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div className="form-control w-full">
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder="New password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="form-control w-full">
                <input
                  type="password"
                  className="input input-bordered w-full"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={
                  isUpdatingProfile ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                onClick={handlePasswordChange}
              >
                {isUpdatingProfile ? "Saving..." : "Change Password"}
              </button>
            </div>
          </div>

          <div className="mt-6 bg-base-200 border border-base-300 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-base-content mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span className="text-base-content/75">Member Since</span>
                <span className="text-base-content font-medium">{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-base-content/75">Account Status</span>
                <span className="text-success font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageClient;
