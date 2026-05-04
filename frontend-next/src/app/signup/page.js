import { Suspense } from "react";

import SignUpPageClient from "./SignUpPageClient";

export const metadata = {
  title: "Create Account",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpPageClient />
    </Suspense>
  );
}
