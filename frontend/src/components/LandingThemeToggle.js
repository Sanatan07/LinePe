"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function LandingThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("landing-theme") === "dark";
    setDark(saved);
    if (saved) document.documentElement.classList.add("dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("landing-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("landing-theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex size-9 items-center justify-center rounded-md text-stone-600 hover:bg-stone-200/70 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-stone-50 transition-colors"
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
