import { useState, useCallback } from "react";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { ToastProvider, useToast } from "./components/ui/Toast";
import { Layout } from "./components/layout/Layout";
import { LeftPanel } from "./components/LeftPanel";
import { MhcOverviewPlot } from "./components/MhcOverviewPlot";
import { PredictedTable } from "./components/PredictedTable";
import { PublishedTable } from "./components/PublishedTable";
import { HelpModal } from "./components/HelpModal";
import { Card, CardContent } from "./components/ui";
import { useMhcPrediction } from "./hooks/useMhcPrediction";
import { PredictionProgress } from "./components/PredictionProgress";
import { downloadPredictedExcel, downloadPublishedExcel } from "./utils/exportExcel";

function AppContent() {
  const { data, loading, error, progress, runPrediction } = useMhcPrediction();
  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [highlightRegions, setHighlightRegions] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [selectedPublishedIds, setSelectedPublishedIds] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleRun = useCallback(
    (params: Parameters<Parameters<typeof LeftPanel>[0]["onRun"]>[0]) => {
      runPrediction({
        fastaFile: params.fastaFile,
        fastaContent: params.fastaContent,
        uniprotId: params.uniprotId,
        alleles: params.alleles,
        peptideLengthRange: params.peptideLengthRange,
        minConservedLength: params.minConservedLength,
        highlightRegions: params.highlightRegions,
        skipIedb: params.skipIedb,
      });
    },
    [runPrediction]
  );

  const handleDownloadPredicted = useCallback(() => {
    if (!data?.predicted.length) {
      addToast("error", "No data", "Run prediction first.");
      return;
    }
    downloadPredictedExcel(data.predicted);
    addToast("success", "Downloaded predicted epitopes.");
  }, [data, addToast]);

  const handleDownloadPublished = useCallback(() => {
    if (!data?.published.length) {
      addToast("error", "No data", "No published epitopes to download.");
      return;
    }
    downloadPublishedExcel(data.published);
    addToast("success", "Downloaded published epitopes.");
  }, [data, addToast]);

  const leftPanel = (
    <LeftPanel
      onRun={handleRun}
      loading={loading}
      highlightRegions={highlightRegions}
      onHighlightRegionsChange={setHighlightRegions}
    />
  );

  const rightPanel = (
    <div className="mx-auto max-w-7xl space-y-4">
      {loading && progress && <PredictionProgress progress={progress} />}
      {error && (
        <Card className="border-[var(--color-critical)]">
          <CardContent>
            <p className="text-[var(--color-critical)]">{error.message}</p>
          </CardContent>
        </Card>
      )}

      {!data && !loading && !error && (
        <Card
          className="flex min-h-[320px] flex-col items-center justify-center text-center"
          data-testid="no-results"
        >
          <CardContent className="max-w-md space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              No results
            </p>
            <p className="text-sm text-[var(--color-text)]">
              Upload FASTA or use sample data, then click Run Prediction.
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {data.alignment_applied === false && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Single sequence mode (no multi-sequence alignment).
            </p>
          )}
          {data.alignment_applied === true && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Multi-sequence alignment applied (Clustal Omega).
            </p>
          )}
          <Card>
            <div
              className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text)]"
              data-testid="overview-plot-heading"
            >
              Interactive Overview Plot
            </div>
            <CardContent className="p-0 relative">
              <MhcOverviewPlot
                predicted={data.predicted}
                published={data.published}
                conservedAln={data.conserved_aln}
                mapUngapToAln={data.map_ungap_to_aln}
                consensusAlnLen={data.consensus_aln_len}
                highlightRegions={highlightRegions}
                selectedRowIds={selectedRowIds}
                selectedPublishedIds={selectedPublishedIds}
                displayedData={data.predicted}
              />
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-bg)]/70">
                  <span className="rounded-lg bg-[var(--color-surface)] px-4 py-2 text-sm font-medium shadow border border-[var(--color-border)]">
                    Updating…
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <PredictedTable
            data={data.predicted}
            selectedRowIds={selectedRowIds}
            onSelectionChange={setSelectedRowIds}
            onDownload={handleDownloadPredicted}
          />

          <PublishedTable
            data={data.published}
            selectedIds={selectedPublishedIds}
            onSelectionChange={setSelectedPublishedIds}
            onDownload={handleDownloadPublished}
          />
        </>
      )}

      <footer className="border-t border-[var(--color-border)] pt-4 font-mono text-[10px] text-[var(--color-text-muted)]">
        Version 0.9.0 · © 2025 LumaVista Bio · IEDB MHC Binding API
      </footer>
    </div>
  );

  return (
    <>
      <Layout
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        onHelpClick={() => setHelpOpen(true)}
        onThemeToggle={toggleTheme}
        theme={theme}
      />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
