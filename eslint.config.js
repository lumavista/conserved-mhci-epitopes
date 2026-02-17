import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "dist",
      "node_modules",
      "**/node_modules/**",
      "*.min.js",
      ".vite",
      "coverage",
      "package-lock.json",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
  {
    files: ["scripts/**"],
    languageOptions: {
      globals: { process: "readonly", console: "readonly" },
    },
  },
];
