"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

export default function ClientProviders() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return <Toaster />;
}
