import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
      // Avoid bundling plotly.js (large; causes OOM on 4GB systems). Load from CDN instead.
      "plotly.js/dist/plotly": path.resolve(__dirname, "src/plotly-global.ts"),
      "plotly.js": path.resolve(__dirname, "src/plotly-global.ts"),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
