# End-to-End Test Strategy

E2E tests run the full app (client + server) in a real browser to protect critical user flows before and after refactoring.

## Running E2E Tests

```bash
npm run test:e2e
```

Interactive UI (recommended for debugging):

```bash
npm run test:e2e:ui
```

## Strategy

- **Tool:** [Playwright](https://playwright.dev/) (Chromium by default).
- **Server:** `playwright.config.ts` starts `npm run dev` (port 3000) via `webServer`; tests use `baseURL: http://localhost:3000`.
- **No external APIs in tests:** Tests use **Skip IEDB prediction** so runs are fast and don't depend on IEDB.
- **Sample data:** Tests use "Use Sample Data" (GET `/api/mhc/sample`) so no file uploads are required.
- **Selectors:** Prefer `data-testid` for critical actions (e.g. `run-prediction`, `use-sample-data`) and `getByRole`/`getByText` elsewhere.

## Covered Flows

| Flow                       | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| App load                   | Initial state, "No results", Run Prediction visible    |
| Use Sample Data            | Loads FASTA, enables Run Prediction                    |
| Run Prediction (Skip IEDB) | Full prediction flow; overview plot and results appear |
| Help modal                 | Opens/closes; accessibility                            |
| Theme toggle               | UI toggle present and works                            |

## Adding Tests

1. Add stable selectors in the UI where needed: `data-testid="…"` or `aria-label` on controls.
2. Add specs under `e2e/` (e.g. `e2e/app.spec.ts`).
3. Keep tests independent: each test can assume a fresh page; use `page.goto("/")` and set up state in the test.

## CI

In CI, set `CI=1` so that:

- The dev server is always started by Playwright (no `reuseExistingServer`).
- Retries are 2; reporter is GitHub Actions–friendly.
- One worker is used to avoid port conflicts.

Example (GitHub Actions):

```yaml
- run: npm run test:e2e
  env:
    CI: 1
```

Install browsers once (e.g. `npx playwright install --with-deps`) in the job or use a Playwright Docker image.

## System requirements (Linux)

On Linux, Playwright browsers need system libraries. If you see errors like **`libnspr4.so: cannot open shared object file`** (Chromium) or **`Host system is missing dependencies to run browsers`** (Firefox), install dependencies once:

```bash
npx playwright install --with-deps
```

This runs the system package manager (e.g. `apt`) to install required libs; it may prompt for `sudo`. Alternatively use the [Playwright Docker image](https://playwright.dev/docs/docker) in CI, which includes all dependencies.
