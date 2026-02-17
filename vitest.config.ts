import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["client/**/*.test.{ts,tsx}", "server/**/*.test.ts", "shared/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
});
