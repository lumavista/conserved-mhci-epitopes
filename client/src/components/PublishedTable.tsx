import { useState, useMemo } from "react";
import { Card, CardHeader, CardContent, Button } from "./ui";
import type { PublishedEpitope } from "@shared/types";

function formatSource(sf: string): string {
  const lower = sf.toLowerCase();
  if (lower.includes("tcell") && lower.includes("mhc")) return "MHC / T Cell";
  if (lower.includes("mhc")) return "MHC";
  if (lower.includes("tcell")) return "T Cell";
  return sf;
}

type SortKey = keyof PublishedEpitope;

interface PublishedTableProps {
  data: PublishedEpitope[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onDownload?: () => void;
}

export function PublishedTable({
  data,
  selectedIds = [],
  onSelectionChange,
  onDownload,
}: PublishedTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("Main_Epitope_ID");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va ?? "").localeCompare(String(vb ?? ""));
      return sortAsc ? cmp : -cmp;
    });
  }, [data, sortBy, sortAsc]);

  const [anchorId, setAnchorId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    );
    setAnchorId(id);
  };

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    if (!onSelectionChange) return;
    if (e.shiftKey) {
      if (anchorId == null) {
        onSelectionChange([id]);
        setAnchorId(id);
      } else {
        const anchorIdx = sorted.findIndex((r) => r.Main_Epitope_ID === anchorId);
        const clickIdx = sorted.findIndex((r) => r.Main_Epitope_ID === id);
        if (anchorIdx >= 0 && clickIdx >= 0) {
          const [lo, hi] = anchorIdx <= clickIdx ? [anchorIdx, clickIdx] : [clickIdx, anchorIdx];
          onSelectionChange(sorted.slice(lo, hi + 1).map((r) => r.Main_Epitope_ID));
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      toggleRow(id);
    } else {
      onSelectionChange([id]);
      setAnchorId(id);
    }
  };

  const SortTriangle = ({ active, asc }: { active: boolean; asc: boolean }) =>
    active ? (
      <span className="ml-0.5 inline-block text-[10px] opacity-90" aria-hidden>
        {asc ? "▲" : "▼"}
      </span>
    ) : (
      <span className="ml-0.5 inline-block text-[10px] opacity-40" aria-hidden>
        △
      </span>
    );

  const th = (key: SortKey, label: string) => (
    <th
      key={String(key)}
      className="cursor-pointer border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2 py-1.5 text-left text-xs font-medium whitespace-nowrap select-none"
      onClick={() => {
        setSortBy(key);
        setSortAsc((prev) => (sortBy === key ? !prev : true));
      }}
    >
      {label}
      <SortTriangle active={sortBy === key} asc={sortAsc} />
    </th>
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <span>Published Epitopes (mapped to consensus)</span>
          {onDownload && (
            <Button variant="primary" onClick={onDownload} disabled>
              Download
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-[var(--color-text-muted)] text-sm">
            No published epitopes. Add UniProt ID and ensure local DB is available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasSelection = typeof onSelectionChange === "function";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <span>Published Epitopes (mapped to consensus)</span>
        {onDownload && (
          <Button variant="primary" onClick={onDownload} disabled={data.length === 0}>
            Download
          </Button>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {th("Main_Epitope_ID", "Main Epitope ID")}
              {th("Peptide", "Peptide")}
              {th("Allele", "Allele")}
              {th("#_Assays", "# Assays")}
              {th("SourceFiles", "Source")}
              {th("Start", "Start")}
              {th("End", "End")}
              {th("Assays", "Assays")}
            </tr>
          </thead>
          <tbody className="select-none">
            {sorted.map((r, i) => (
              <tr
                key={`${r.Main_Epitope_ID}-${r.Peptide}-${i}`}
                role={hasSelection ? "button" : undefined}
                tabIndex={hasSelection ? 0 : undefined}
                onClick={hasSelection ? (e) => handleRowClick(e, r.Main_Epitope_ID) : undefined}
                onKeyDown={
                  hasSelection
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (e.shiftKey) {
                            if (anchorId == null) {
                              onSelectionChange!([r.Main_Epitope_ID]);
                              setAnchorId(r.Main_Epitope_ID);
                            } else {
                              const anchorIdx = sorted.findIndex((x) => x.Main_Epitope_ID === anchorId);
                              const clickIdx = sorted.findIndex((x) => x.Main_Epitope_ID === r.Main_Epitope_ID);
                              if (anchorIdx >= 0 && clickIdx >= 0) {
                                const [lo, hi] = anchorIdx <= clickIdx ? [anchorIdx, clickIdx] : [clickIdx, anchorIdx];
                                onSelectionChange!(sorted.slice(lo, hi + 1).map((x) => x.Main_Epitope_ID));
                              }
                            }
                          } else if (e.ctrlKey || e.metaKey) {
                            toggleRow(r.Main_Epitope_ID);
                          } else {
                            onSelectionChange!([r.Main_Epitope_ID]);
                            setAnchorId(r.Main_Epitope_ID);
                          }
                        }
                      }
                    : undefined
                }
                className={`border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-subtle)]/50 ${
                  hasSelection && selectedIds.includes(r.Main_Epitope_ID)
                    ? "bg-[var(--color-accent-muted)]"
                    : ""
                } ${hasSelection ? "cursor-pointer" : ""}`}
              >
                <td className="px-2 py-1 font-mono text-xs">{r.Main_Epitope_ID}</td>
                <td className="px-2 py-1 font-mono">{r.Peptide}</td>
                <td className="px-2 py-1">{r.Allele}</td>
                <td className="px-2 py-1">{r["#_Assays"]}</td>
                <td className="px-2 py-1">{formatSource(r.SourceFiles)}</td>
                <td className="px-2 py-1">{r.Start}</td>
                <td className="px-2 py-1">{r.End}</td>
                <td className="px-2 py-1 max-w-[200px] truncate" title={r.Assays}>
                  {r.Assays}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
