import { logger } from "./logger.js";

const RESEND_API_URL = "https://api.resend.com/emails";

export const sendEmail = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "LinePe <onboarding@resend.dev>";

  if (!apiKey) {
    logger.error("email.config.missing", { to, subject });
    throw new Error("Email is not configured. Add RESEND_API_KEY and EMAIL_FROM in backend/.env.");
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
