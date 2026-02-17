# App Setup Evaluation: Development & Production (Containerized)

This document evaluates the MHC Demo app setup for development and production (Linux/Docker) and suggests improvements so others can run and contribute to the project easily.

**Applied improvements (as of this pass):** `.dockerignore`, `.env.example`, `GET /api/health`, Docker & Compose healthcheck, Vitest in devDependencies, `engines.node` in package.json, non-root user in Dockerfile, configurable `PORT` in docker-compose, optional data volume comment in compose.

---

## 1. Current Setup Summary

### 1.1 Development

- **Stack:** Node 20, TypeScript (ESM), Vite (client), Express + ViteExpress (single port), React, Tailwind, Plotly.
- **Commands:** `npm install` → `npm run dev` (port 3000). Optional MSA: `npm run setup:msa` (Python venv + Biopython, Clustal Omega on PATH).
- **Environment:** `PORT` (default 3000), optional `.env` / `.env.local` (gitignored).
- **Testing:** `npm test` (Vitest), `npm run test:e2e` (Playwright against dev server). E2E uses sample data and “Skip IEDB” for fast, offline-friendly runs.

### 1.2 Production (Local)

- **Build:** `npm run build` (Vite client → `dist/`, tsc + tsc-alias server → `dist/server/`, copy `server/scripts` into dist).
- **Run:** `npm start` → build then `node dist/server/src/index.js` on port 5398 (or `PORT`).
- **Paths:** Server uses `process.cwd()` as project root; static files from `dist/`, data from `data/`, Python from `server/scripts` and `.venv` (or `PYTHON_MSA_PATH`).

### 1.3 Production (Docker)

- **Image:** Multi-stage Dockerfile (builder + production). Base: `node:20-bookworm-slim`. Production stage installs `python3`, `python3-venv`, `clustalo`, creates `/app/.venv` and installs Biopython from `server/scripts/requirements.txt`.
- **Port:** 5398 (EXPOSE 5398, CMD runs Node server).
- **Compose:** `docker compose build` / `docker compose up -d`; service `mhc-demo`, port 5398, `restart: unless-stopped`.

---

## 2. Strengths

| Area | What’s good |
|------|-------------|
| **Structure** | Clear monorepo: `client/`, `server/`, `shared/`, `data/`, `e2e/`, `docs/`. Single `package.json` at root. |
| **Docker** | Multi-stage build; production image has only runtime deps; Python/Clustal in image so MSA works out of the box. |
| **Ports & binding** | Server listens on `0.0.0.0`; works in containers and remote dev. Vite `host: "0.0.0.0"` for dev. |
| **Environment** | `PORT` and `NODE_ENV` drive dev vs prod and port; `PYTHON_MSA_PATH` overrides Python in Docker. |
| **Documentation** | README covers install, dev, prod, Docker, E2E; E2E-TESTING.md and data/README explain strategy and data. |
| **E2E / CI** | Playwright with `webServer`, `CI` env for retries/reporter; Linux deps documented (`npx playwright install --with-deps`). |
| **Cross-platform** | `cross-env` for `NODE_ENV` in `npm start`; paths use `path.join` and `process.cwd()`. |
| **Git** | `.gitignore` covers `node_modules`, `.venv`, `dist`, env files, test/coverage, IDE. |

---

## 3. Gaps and Improvement Suggestions

### 3.1 Critical / High impact

1. **`npm test` and Vitest**  
   - **Issue:** Script is `"test": "vitest run"` but Vitest is not in `devDependencies`, so `npm test` fails for a fresh clone.  
   - **Fix:** Either add `vitest` (and e.g. `jsdom` if you add React component tests) to `devDependencies`, or change the script to a no-op / existing test runner so `npm test` always succeeds.

2. **No `.dockerignore`**  
   - **Issue:** Full tree (including `node_modules`, `.venv`, `dist`, `test-results`, etc.) is sent as build context; slower and larger context, risk of inconsistent images.  
   - **Fix:** Add a `.dockerignore` that excludes dev/test artifacts, local env, and anything not needed for `COPY` and `npm run build`.

3. **No health endpoint**  
   - **Issue:** Orchestrators (Docker, K8s, ECS) cannot check liveness/readiness; `restart: unless-stopped` only restarts on crash.  
   - **Fix:** Add a cheap GET endpoint (e.g. `/api/health` or `/health`) that returns 200 when the app is up, and use it in Docker `HEALTHCHECK` and optionally in compose.

4. **No `.env.example`**  
   - **Issue:** New users don’t know which env vars exist (`PORT`, `PYTHON_MSA_PATH`, etc.).  
   - **Fix:** Add `.env.example` with optional vars and short comments; document in README.

### 3.2 Medium impact (Linux/Docker-friendly)

5. **Docker runs as root**  
   - **Issue:** Process runs as root inside the container; not ideal for security and many deployment policies.  
   - **Fix:** Create a non-root user in the Dockerfile, copy files with correct ownership, and run `CMD` as that user (e.g. `USER node` or a dedicated `mhc` user).

6. **No Node version contract**  
   - **Issue:** README/Docker use Node 20, but `package.json` doesn’t declare it; different contributors might use different Node versions.  
   - **Fix:** Add `"engines": { "node": ">=20" }` (or `"^20"`) in `package.json` and document in README.

7. **Published epitopes in Docker**  
   - **Issue:** App only reads `data/published_epitopes.json`; if missing, published table is empty. data/README mentions a sample file fallback, but code doesn’t implement it.  
   - **Fix:** Either (a) add fallback in code to `published_epitopes.sample.json` when the main file is missing, or (b) document that for custom data users should mount a volume with `published_epitopes.json`, and ensure a sample file is in the image for demos.

8. **Compose port and health**  
   - **Issue:** Port is fixed (5398); no healthcheck in compose.  
   - **Fix:** Make host port configurable via env (e.g. `${PORT:-5398}:5398`) and add a `healthcheck` that calls the new health endpoint.

### 3.3 Nice to have

9. **Optional volume for data**  
   - **Suggestion:** In `docker-compose.yml`, add an optional volume for `./data:/app/data` so users can drop in `published_epitopes.json` or other files without rebuilding.

10. **CI example**  
    - **Suggestion:** Add a minimal GitHub Actions (or other) workflow that runs `npm ci`, `npm run build`, and `npm run test:e2e` with `CI=1` and Playwright install, so contributors have a reference.

11. **Explicit Python version in Docker**  
    - **Suggestion:** If you need a specific Python version for Biopython/Clustal, pin it in the Dockerfile (e.g. `python3.11` or a versioned base) to avoid future breakage.

---

## 4. Linux/Docker Compatibility Checklist

| Item | Status |
|------|--------|
| Listen on `0.0.0.0` | Yes (server and Vite dev) |
| Port configurable via env | Yes (`PORT`) |
| No hardcoded Windows paths | Yes |
| Multi-stage Docker build | Yes |
| Python/Clustal in image | Yes |
| `.dockerignore` | **Missing** → add |
| Health endpoint | **Missing** → add |
| Non-root container user | **Missing** → optional |
| `engines` in package.json | **Missing** → add |
| `.env.example` | **Missing** → add |
| E2E on Linux documented | Yes (Playwright `--with-deps`) |

---

## 5. Recommended Order of Changes

1. Add **`.dockerignore`** and **`.env.example`** (low risk, high value).  
2. Add **health endpoint** and **Docker + Compose healthcheck**.  
3. Fix **`npm test`** (add Vitest or adjust script).  
4. Add **`engines`** and (optionally) **non-root user** in Dockerfile.  
5. Optionally: **published epitopes fallback** and **compose volume** for `data/`.

---

## 6. Summary

The app is already in good shape for development and production on Linux and Docker: clear structure, multi-stage image with MSA support, single-port dev and prod, and solid docs. The main improvements are: make `npm test` valid, reduce Docker context and add health checks, document env vars, and optionally harden the container (non-root, Node engine). Applying the high-impact items above will make the project easier to adopt and run in typical Linux/Docker environments.
