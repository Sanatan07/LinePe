import Link from "next/link";
import { redirect } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import { getAuthSession } from "@/lib/server-auth";
import { getInitialConversations } from "@/lib/server-chat";
import ChatRuntime from "./ChatRuntime";

export const dynamic = "force-dynamic";

const isAdmin = (user) =>
  user?.username === "admin070801" || user?.email === "admin070801@gmail.com";

export const metadata = {
  title: "Chat",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ChatLayout({ children }) {
  const { user: currentUser, canRefresh } = await getAuthSession();

  if (!currentUser) {
    if (canRefresh) {
      redirect("/api/auth/refresh-session?next=/chat");
    }

    redirect("/login?next=/chat");
  }

  const initialConversations = await getInitialConversations();

  return (
    <section className="min-h-screen bg-[#f4f6f2] text-stone-950">
      <ChatRuntime
        currentUser={currentUser}
        initialConversations={initialConversations}
      />

      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="LinePe home">
            <span className="flex size-9 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
              L
            </span>
            <span className="text-lg font-bold">LinePe</span>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin(currentUser) && (
              <Link
                href="/audit"
                className="rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950"
              >
                Audit
              </Link>
            )}
            <Link
              href="/settings"
              className="rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            >
              Settings
            </Link>
            <Link
              href="/profile"
              className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Profile
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl flex-col border-x border-stone-200 bg-white md:flex-row">
        <Sidebar
          initialAuthUser={currentUser}
          initialConversations={initialConversations}
        />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </section>
  );
}
