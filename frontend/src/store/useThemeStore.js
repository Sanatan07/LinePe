import { create } from "zustand";

const getSavedTheme = () =>
  typeof window === "undefined" ? "light" : localStorage.getItem("chat-theme") || "light";

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
