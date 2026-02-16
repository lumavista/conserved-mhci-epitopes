#!/usr/bin/env node
/**
 * Create a Python venv and install biopython for MSA (run_clustal.py).
 * Run once for development: npm run setup:msa
 * Requires: python3, clustalo on PATH
 * Fallback: if python3-venv is unavailable, installs via pip3 --user (use system python)
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const venvDir = path.join(root, ".venv");
const isWin = process.platform === "win32";
const venvPython = path.join(venvDir, isWin ? "Scripts/python.exe" : "bin/python3");
const requirements = path.join(root, "server", "scripts", "requirements.txt");

console.log("Setting up MSA Python environment...\n");

let useVenv = existsSync(venvPython);

if (!useVenv) {
  console.log("Creating Python venv at .venv ...");
  const venv = spawnSync("python3", ["-m", "venv", venvDir], {
    cwd: root,
    stdio: "inherit",
  });
  if (venv.status === 0) {
    useVenv = true;
  } else {
    console.log("venv not available (install python3-venv for isolation). Using pip3 --user fallback...\n");
  }
}

if (useVenv) {
  console.log("Installing Biopython in venv...");
  let pip = spawnSync(venvPython, ["-m", "pip", "install", "-r", requirements], {
    cwd: root,
    stdio: "inherit",
  });
  if (pip.status !== 0) {
    console.log("Bootstrapping pip in venv...");
    const ensure = spawnSync(venvPython, ["-m", "ensurepip", "--upgrade"], {
      cwd: root,
      stdio: "inherit",
    });
    if (ensure.status === 0) {
      pip = spawnSync(venvPython, ["-m", "pip", "install", "-r", requirements], {
        cwd: root,
        stdio: "inherit",
      });
    }
    if (pip.status !== 0) {
      console.log("Using system pip to install into venv...");
      const sitePackages = spawnSync(venvPython, ["-c", "import site; print(site.getsitepackages()[0])"], {
        cwd: root,
        encoding: "utf8",
      });
      const target = sitePackages.stdout?.trim();
      if (target) {
        pip = spawnSync("python3", ["-m", "pip", "install", "--target", target, "-r", requirements], {
          cwd: root,
          stdio: "inherit",
        });
      }
    }
  }
  if (pip.status !== 0) process.exit(1);
  console.log("\nMSA setup complete. The server will use .venv/bin/python3 for run_clustal.py.");
} else {
  console.log("Installing Biopython for user...");
  const pip = spawnSync("python3", ["-m", "pip", "install", "--user", "-r", requirements], {
    cwd: root,
    stdio: "inherit",
  });
  if (pip.status !== 0) {
    console.error("pip install failed. Try: apt install python3-venv python3-pip && npm run setup:msa");
    process.exit(1);
  }
  console.log("\nMSA setup complete. The server will use system python3 (biopython installed for user).");
}

console.log("Run 'npm run dev' for development.\n");
