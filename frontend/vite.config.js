import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, transformWithEsbuild } from "vite";

const jsxInJsPlugin = {
  name: "jsx-in-js-source",
  enforce: "pre",
  async transform(code, id) {
    if (!id.includes("/src/") || !id.endsWith(".js")) {
      return null;
    }

    return transformWithEsbuild(code, id, {
      loader: "jsx",
      jsx: "automatic",
    });
  },
};

export default defineConfig({
  plugins: [jsxInJsPlugin, react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
