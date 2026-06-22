import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    files: ["src/**/*.{js,jsx}", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  globalIgnores(["dist/**", "build/**", "node_modules/**", ".next/**"]),
]);
