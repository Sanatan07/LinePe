import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/server-auth";
import AuditPageClient from "./AuditPageClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit Logs",
  robots: { index: false, follow: false },
};

const isAdmin = (user) =>
  user?.username === "admin070801" || user?.email === "admin070801@gmail.com";

export default async function AuditPage() {
  const { user, canRefresh } = await getAuthSession();

  if (!user) {
    if (canRefresh) redirect("/api/auth/refresh-session?next=/audit");
    redirect("/login?next=/audit");
  }

  if (!isAdmin(user)) redirect("/chat");

  return <AuditPageClient />;
}
