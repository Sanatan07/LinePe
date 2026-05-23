import { Suspense } from "react";

import ResetPasswordClient from "./ResetPasswordClient";

export const metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ params }) {
  const { token } = await params;
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient token={token} />
    </Suspense>
  );
}
