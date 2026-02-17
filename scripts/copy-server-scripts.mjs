#!/usr/bin/env node
import { cpSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
cpSync(join(root, "server", "scripts"), join(root, "dist", "server", "scripts"), {
  recursive: true,
});
