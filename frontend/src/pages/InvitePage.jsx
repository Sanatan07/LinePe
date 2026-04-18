import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader, MessageSquare, UserPlus } from "lucide-react";

import { axiosInstance } from "../lib/axios";

const InvitePage = () => {
  const { code } = useParams();
  const [invite, setInvite] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadInvite = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const res = await axiosInstance.get(`/invites/${code}`);
        if (!isMounted) return;
        setInvite(res.data?.invite || null);
      } catch (error) {
        if (!isMounted) return;
        setInvite(null);
        setErrorMessage(error?.response?.data?.message || "Unable to load invite");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInvite();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const inviterName = useMemo(
    () => invite?.inviter?.fullName || invite?.inviter?.username || "Someone",
    [invite]
  );

  const joinHref = `/signup?invite=${encodeURIComponent(code || "")}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 px-4 pt-16">
        <div className="flex items-center gap-3 text-base-content/70">
          <Loader className="size-5 animate-spin" />
          <span>Loading invite...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 px-4 pt-24 pb-10">
      <div className="max-w-xl mx-auto">
        <div className="bg-base-100 border border-base-300 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 text-center space-y-5">
            <div className="mx-auto size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="size-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Join LinePe</h1>
              {invite ? (
                <p className="text-base-content/70">
                  <span className="font-semibold text-base-content">{inviterName}</span> invited you to join
                  LinePe.
                </p>
              ) : (
                <p className="text-base-content/70">{errorMessage || "This invite could not be loaded."}</p>
              )}
            </div>

            {invite && (
              <div className="bg-base-200 rounded-xl p-4 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={invite?.inviter?.profilePic || "/avatar.png"}
                    alt={inviterName}
                    className="size-12 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{inviterName}</div>
                    <div className="text-sm text-base-content/60 truncate">
                      {invite?.inviter?.username ? `@${invite.inviter.username}` : "LinePe invite"}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-base-content/70">
                  Invite code: <span className="font-mono">{invite.inviteCode}</span>
                </div>

                {invite.isExpired && (
                  <div className="text-sm text-error">This invite has expired.</div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                to={joinHref}
                className={`btn btn-primary btn-lg ${invite && !invite.isRedeemable ? "btn-disabled" : ""}`}
              >
                <UserPlus className="size-5" />
                Join LinePe
              </Link>

              <Link to="/login" className="btn btn-ghost">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
