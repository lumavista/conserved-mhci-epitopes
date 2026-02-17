import { useState, useCallback, useRef } from "react";
import { Card, CardHeader, CardContent, Button, Input, Label, RangeSlider, Switch } from "./ui";

const ALLELES = ["HLA-A*01:01", "HLA-A*02:01", "HLA-B*07:02", "HLA-B*08:01"];

export interface LeftPanelProps {
  highlightRegions?: boolean;
  onHighlightRegionsChange?: (v: boolean) => void;
  onRun: (params: {
    fastaFile: File | null;
    fastaContent?: string;
    uniprotId: string;
    alleles: string[];
    peptideLengthRange: [number, number];
    minConservedLength: number;
    highlightRegions: boolean;
    skipIedb: boolean;
  }) => void;
  loading: boolean;
}

export function LeftPanel({
  onRun,
  loading,
  highlightRegions = true,
  onHighlightRegionsChange,
}: LeftPanelProps) {
  const [fastaFile, setFastaFile] = useState<File | null>(null);
  const [fastaContent, setFastaContent] = useState<string>("");
  const [uniprotId, setUniprotId] = useState("");
  const [alleles, setAlleles] = useState<string[]>(["HLA-A*02:01"]);
  const [peptideLengthRange, setPeptideLengthRange] = useState<[number, number]>([9, 10]);
  const [minConservedLength, setMinConservedLength] = useState(10);
  const [skipIedb, setSkipIedb] = useState(false);
  const [usedSampleData, setUsedSampleData] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSample = useCallback(async () => {
    setSampleLoading(true);
    try {
      const res = await fetch("/api/mhc/sample");
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Failed to load sample");
      setFastaContent(text);
      setUsedSampleData(true);
      setFastaFile(null);
      setUniprotId("P18272");
    } catch {
      setFastaContent("");
      setUsedSampleData(false);
    } finally {
      setSampleLoading(false);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFastaFile(f ?? null);
    setFastaContent("");
    setUsedSampleData(false);
    e.target.value = "";
  }, []);

  const handleRun = useCallback(() => {
    const hasFasta = usedSampleData || fastaFile || fastaContent.trim();
    if (!hasFasta || alleles.length === 0) return;
    onRun({
      fastaFile: usedSampleData ? null : fastaFile,
      fastaContent: usedSampleData ? fastaContent : fastaContent.trim() || undefined,
      uniprotId: uniprotId.trim(),
      alleles,
      peptideLengthRange,
      minConservedLength,
      highlightRegions,
      skipIedb,
    });
  }, [
    fastaFile,
    fastaContent,
    usedSampleData,
    uniprotId,
    alleles,
    peptideLengthRange,
    minConservedLength,
    highlightRegions,
    skipIedb,
    onRun,
  ]);

  const hasFasta = usedSampleData || !!fastaFile || !!fastaContent.trim();
  const canRun = hasFasta && alleles.length > 0 && !loading;

  const toggleAllele = (a: string) => {
    setAlleles((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>Input FASTA</CardHeader>
        <CardContent className="space-y-2">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".fasta,.fa"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="secondary"
              className="w-full text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {fastaFile ? fastaFile.name : "Choose FASTA file"}
            </Button>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={loadSample}
            disabled={sampleLoading}
            data-testid="use-sample-data"
          >
            {sampleLoading ? "Loading…" : "Use Sample Data"}
          </Button>
          {usedSampleData && (
            <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2 font-mono text-xs text-[var(--color-text-muted)]">
              Sample data (2 sequences, ~400 aa each)
            </div>
          )}
          {fastaContent && !usedSampleData && (
            <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-2 font-mono text-xs max-h-24 overflow-auto">
              {fastaContent.slice(0, 200)}...
            </div>
          )}

          <div>
            <Label htmlFor="uniprot">UniProt ID (for published epitopes)</Label>
            <Input
              id="uniprot"
              value={uniprotId}
              onChange={(e) => setUniprotId(e.target.value)}
              placeholder="e.g. P18272"
            />
          </div>

          <div>
            <Label className="mb-1">HLA Alleles</Label>
            <div className="flex flex-wrap gap-1">
              {ALLELES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllele(a)}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    alleles.includes(a)
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-border)] text-[var(--color-text)]"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>
              Peptide length:{" "}
              {peptideLengthRange[0] === peptideLengthRange[1]
                ? peptideLengthRange[0]
                : `${peptideLengthRange[0]}–${peptideLengthRange[1]}`}
            </Label>
            <RangeSlider
              min={8}
              max={14}
              step={1}
              value={peptideLengthRange}
              onChange={setPeptideLengthRange}
              className="mt-1"
              aria-label={["Min peptide length", "Max peptide length"]}
            />
          </div>

          <div>
            <Label htmlFor="minlen">Min conserved length</Label>
            <Input
              id="minlen"
              type="number"
              min={5}
              max={100}
              value={minConservedLength}
              onChange={(e) => setMinConservedLength(Number(e.target.value) || 10)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Highlight conserved regions</Label>
            <Switch
              checked={highlightRegions}
              onCheckedChange={(v) => onHighlightRegionsChange?.(v)}
            />
          </div>

          <div className="flex items-center justify-between" data-testid="skip-iedb-row">
            <Label>Skip IEDB prediction</Label>
            <Switch
              checked={skipIedb}
              onCheckedChange={setSkipIedb}
              aria-label="Skip IEDB prediction"
            />
          </div>

          <Button
            variant="primary"
            className="w-full py-3 font-semibold"
            onClick={handleRun}
            disabled={!canRun}
            data-testid="run-prediction"
          >
            {loading ? "Running…" : "Run Prediction"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
