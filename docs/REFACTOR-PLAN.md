# MHC Demo - Refactoring Plan

**Goal:** Clean up code and structure. Remove unused code, unused files, legacy/redundant functions, and obsolete comments. Preserve all functionality and layout.

**Verification:** E2E tests (`npm run test:e2e`).

---

## Step 1: Baseline – Run E2E Tests

Run E2E tests before any changes to ensure baseline passes:

```bash
npm run test:e2e
```

---

## Step 2: Remove Unused Code & Parameters

### 2a. Server: IEDB client

- **File:** `server/src/iedb/client.ts`
- **Change:** Remove unused `_peptides` parameter from `queryIedb()`
- **Call site:** `server/src/routes/mhc.ts` – update call to drop the first argument

### 2b. Client: uiTheme

- **File:** `client/src/utils/uiTheme.ts`
- **Change:** Inline `applyTheme()` into `applyStoredTheme()` – `applyTheme` is only used there, so we can simplify. Or keep as-is if the separation is preferred for clarity.

---

## Step 3: Remove Obsolete/Redundant Comments

### 3a. Remove empty/no-op comments

- **File:** `server/src/routes/mhc.ts` – remove `/* keep default peptideRange */` (empty catch block comment)

### 3b. Keep useful comments

- **Keep:** `server/src/index.ts` – "Use cwd so production..." (explains build behavior)
- **Keep:** `e2e/app.spec.ts`, `playwright.config.ts`, `scripts/setup-msa.mjs` – docblocks (test/setup docs)

---

## Step 4: Extract Shared Table UI (Optional – Low Priority)

- **Files:** `PredictedTable.tsx`, `PublishedTable.tsx`
- **Observation:** Both define identical `SortTriangle` and similar `th`/sort logic
- **Decision:** Leave as-is for now – duplication is localized and extracting adds indirection. Can revisit in a later refactor.

---

## Step 5: Verify No Unused Files

Confirmed imports:

- All client components, hooks, utils, contexts are used
- All server modules (routes, parsers, msa, epitopes, iedb) are used
- No orphan TypeScript/TSX files

**Action:** None – no unused source files found.

---

## Step 6: Final Verification – Run E2E Tests

After all changes:

```bash
npm run test:e2e
```

All 5 tests must pass:

1. Loads and shows initial state with no results
2. Use Sample Data loads FASTA and enables Run Prediction
3. Run Prediction with Skip IEDB shows results
4. Help modal opens and closes
5. Theme toggle is present and toggles

---

## Summary of Changes (Completed)

| Category              | Action                                                | Status |
|-----------------------|--------------------------------------------------------|--------|
| Unused params         | Remove `_peptides` from `queryIedb`                    | Done   |
| Redundant comments    | Remove empty `/* keep default peptideRange */`         | Done   |
| Simplify uiTheme      | Inline `applyTheme` into `applyStoredTheme`            | Done   |
| Shared SortTriangle   | Leave as-is (low benefit)                              | Skipped |

**E2E verification:** All 5 tests passed after refactor.

No file deletions. No functional or layout changes.
