import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "./ClientProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  applicationName: "LinePe",
  title: {
    default: "LinePe - Real-time messaging",
    template: "%s | LinePe",
  },
  description:
    "LinePe is a real-time messaging app with secure signup, invite flows, profiles, settings, and admin audit visibility.",
  keywords: [
    "LinePe",
    "real-time messaging",
    "chat app",
    "secure signup",
    "team communication",
    "community messaging",
  ],
  authors: [{ name: "LinePe" }],
  creator: "LinePe",
  publisher: "LinePe",
  openGraph: {
    title: "LinePe - Real-time messaging",
    description:
      "Fast messaging, invite links, profiles, settings, and admin visibility for people, communities, and teams.",
    siteName: "LinePe",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LinePe - Real-time messaging",
    description:
      "Fast messaging, invite links, profiles, settings, and admin visibility.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ClientProviders />
      </body>
    </html>
  );
}
