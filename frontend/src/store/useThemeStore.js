import { create } from "zustand";

const getSavedTheme = () =>
  typeof window === "undefined" ? "retro" : localStorage.getItem("chat-theme") || "retro";

export const useThemeStore = create((set) => ({
  theme: getSavedTheme(),

  setTheme: (theme) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("chat-theme", theme);

    // apply theme to root html element
    document.documentElement.setAttribute("data-theme", theme);

    set({ theme });
  },
}));
