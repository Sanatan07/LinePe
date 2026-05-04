import { Suspense } from "react";

import LoginPageClient from "./LoginPageClient";

export const metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
