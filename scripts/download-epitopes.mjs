#!/usr/bin/env node
/**
 * Download published epitopes database from GitHub Releases.
 * Saves to data/published_epitopes.json (decompresses if .gz).
 *
 * Usage: npm run data:epitopes
 *
 * Override repo: EPITOPES_REPO=owner/repo npm run data:epitopes
 * Override release tag: EPITOPES_TAG=v1.0.0 npm run data:epitopes
 */
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { createInterface } from "readline";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import { Readable } from "stream";

const REPO = process.env.EPITOPES_REPO || "lumavista/conserved-mhci-epitopes";
const TAG = process.env.EPITOPES_TAG || "latest";
const DATA_DIR = "data";
const OUT_FILE = "published_epitopes.json";

function assetUrl(filename) {
  const base = `https://github.com/${REPO}/releases`;
  const path = TAG === "latest" ? "latest/download" : `download/${TAG}`;
  return `${base}/${path}/${filename}`;
}

async function downloadAndDecompress(url, outPath, isGzip) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${url}`);
    err.statusCode = res.status;
    throw err;
  }
  await mkdir(DATA_DIR, { recursive: true });
  const dest = createWriteStream(outPath);
  const body = res.body;
  const src = isGzip
    ? Readable.fromWeb(body).pipe(createGunzip())
    : Readable.fromWeb(body);
  await pipeline(src, dest);
}

async function confirmOverwrite(path) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`Overwrite ${path}? [y/N] `, (answer) => {
      rl.close();
      resolve(/^y/i.test(answer.trim()));
    });
  });
}

async function main() {
  const outPath = `${DATA_DIR}/${OUT_FILE}`;
  const { existsSync } = await import("fs");
  if (existsSync(outPath) && process.stdout.isTTY && !process.argv.includes("-y")) {
    const ok = await confirmOverwrite(outPath);
    if (!ok) {
      console.log("Skipped.");
      return;
    }
  }

  console.log(`Downloading published epitopes from ${REPO} (${TAG})...`);
  const candidates = [
    { name: "published_epitopes.json.gz", gzip: true },
    { name: "published_epitopes.json", gzip: false },
  ];

  for (const { name, gzip } of candidates) {
    const url = assetUrl(name);
    try {
      console.log(`Trying ${name}...`);
      await downloadAndDecompress(url, outPath, gzip);
      console.log(`Saved to ${outPath}`);
      return;
    } catch (err) {
      if (err.statusCode === 404) continue;
      throw err;
    }
  }

  console.error(
    "No published epitopes asset found. Create a GitHub Release and upload one of:\n" +
      "  - published_epitopes.json.gz (recommended)\n" +
      "  - published_epitopes.json\n\n" +
      `Release URL: https://github.com/${REPO}/releases/new`
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
