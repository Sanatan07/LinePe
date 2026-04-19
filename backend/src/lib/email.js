import { logger } from "./logger.js";

const RESEND_API_URL = "https://api.resend.com/emails";

export const sendEmail = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "LinePe <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Server misconfigured: RESEND_API_KEY is missing");
    }

    logger.info("email.dev.skipped", { to, subject, text });
    return { id: "dev-email" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.message || "Email provider rejected the request";
    throw new Error(message);
  }

  return body;
};
