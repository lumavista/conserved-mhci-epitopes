import { test, expect } from "@playwright/test";

/**
 * E2E tests for MHC Demo app.
 * Run with: npx playwright test
 *
 * Strategy:
 * - Use "Skip IEDB" so tests don't hit external API and run quickly.
 * - Use sample data (GET /api/mhc/sample) so no file upload is required.
 * - Cover: app load, sample data flow, run prediction, results UI, help modal.
 */

test.describe("MHC Demo App", () => {
  test("loads and shows initial state with no results", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await expect(
      page.getByRole("heading", { name: /Conserved Human MHC-I Epitopes/i })
    ).toBeVisible();
    await expect(page.getByTestId("run-prediction")).toBeVisible();
    await expect(page.getByText(/Upload FASTA or use sample data/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("no-results")).toBeVisible();
  });

  test("Use Sample Data loads FASTA and enables Run Prediction", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("run-prediction")).toBeDisabled();
    await page.getByTestId("use-sample-data").click();
    await expect(page.getByTestId("use-sample-data")).toContainText("Use Sample Data");
    await expect(page.getByText(/Sample data \(2 sequences/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("run-prediction")).toBeEnabled();
  });

  test("Run Prediction with Skip IEDB shows results (overview, tables)", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("use-sample-data").click();
    await expect(page.getByText(/Sample data \(2 sequences/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole("switch", { name: /Skip IEDB prediction/i }).check();
    await page.getByTestId("run-prediction").click();
    await expect(page.getByTestId("overview-plot-heading")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Interactive Overview Plot/i)).toBeVisible();
    await expect(page.getByTestId("no-results")).not.toBeVisible();
  });

  test("Help modal opens and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Help" }).click();
    const dialog = page.getByRole("dialog", { name: /Conserved Human MHC-I Epitopes/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/predicts MHC-I binding epitopes/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test("theme toggle is present and toggles", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    const themeSwitch = page.getByRole("switch", { name: /Toggle light or dark mode/i });
    await expect(themeSwitch).toBeVisible({ timeout: 10_000 });
    const initialChecked = await themeSwitch.isChecked();
    await themeSwitch.click();
    await expect(themeSwitch).toHaveAttribute("aria-checked", initialChecked ? "false" : "true");
  });
});
