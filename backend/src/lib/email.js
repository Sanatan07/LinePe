import nodemailer from "nodemailer";

import { logger } from "./logger.js";

const RESEND_API_URL = "https://api.resend.com/emails";

const createSmtpTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

export const sendEmail = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    const transporter = createSmtpTransport();
    return transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
  }

  if (!apiKey) {
    logger.error("email.config.missing", { to, subject });
    throw new Error(
      "Email is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM in backend/.env."
    );
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
