import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import ViteExpress from "vite-express";
import mhcRouter from "./routes/mhc.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const isProduction = process.env.NODE_ENV === "production";

const app = express();
const PORT = process.env.PORT || (isProduction ? 5398 : 3000);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api", mhcRouter);

if (isProduction) {
  const distDir = path.join(projectRoot, "dist");
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(distDir, "index.html"));
  });
}

const server = app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`MHC Demo App running at http://localhost:${PORT}`);
});

if (!isProduction) {
  ViteExpress.config({ viteConfigFile: path.join(projectRoot, "client", "vite.config.ts") });
  ViteExpress.bind(app, server).catch((err) => {
    console.error("ViteExpress failed:", err);
    process.exit(1);
  });
}
