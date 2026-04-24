import { useMemo, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
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

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>

          {/* avatar upload section */}

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
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
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className="input input-bordered flex-1"
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
                <p className="text-xs text-warning">
                  Your current username was auto-generated. You can change it now.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <div className="space-y-2">
                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className={emailVerified ? "text-success" : "text-warning"}>
                    {emailVerified ? "Email verified" : "Email not verified"}
                  </span>
                  {!emailVerified && (
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={sendVerificationEmail}
                    >
                      Send verification email
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Change Password
              </div>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="New password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              />
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              />
              <button
                type="button"
                className="btn btn-primary"
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

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium  mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
