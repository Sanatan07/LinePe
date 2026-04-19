import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "light",

  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);

    // apply theme to root html element
    document.documentElement.setAttribute("data-theme", theme);

    set({ theme });
  },
}));
