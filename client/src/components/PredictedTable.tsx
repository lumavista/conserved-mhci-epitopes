import { useState, useMemo } from "react";
import { Card, CardHeader, CardContent, Button } from "./ui";
import type { PredictedEpitope } from "@shared/types";

const AFFINITY_CLASS_NAMES: Record<string, string> = {
  Strong: "affinity-strong",
  Intermediate: "affinity-intermediate",
  Weak: "affinity-weak",
};

interface PredictedTableProps {
  data: PredictedEpitope[];
  selectedRowIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onDownload?: () => void;
}

export function PredictedTable({
  data,
  selectedRowIds,
  onSelectionChange,
  onDownload,
}: PredictedTableProps) {
  const [sortBy, setSortBy] = useState<keyof PredictedEpitope>("Rank");
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

  const [anchorRowId, setAnchorRowId] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    onSelectionChange(
      selectedRowIds.includes(id) ? selectedRowIds.filter((x) => x !== id) : [...selectedRowIds, id]
    );
    setAnchorRowId(id);
  };

  const handleRowClick = (e: React.MouseEvent, id: number) => {
    if (e.shiftKey) {
      if (anchorRowId == null) {
        onSelectionChange([id]);
        setAnchorRowId(id);
      } else {
        const anchorIdx = sorted.findIndex((r) => r.RowID === anchorRowId);
        const clickIdx = sorted.findIndex((r) => r.RowID === id);
        if (anchorIdx >= 0 && clickIdx >= 0) {
          const [lo, hi] = anchorIdx <= clickIdx ? [anchorIdx, clickIdx] : [clickIdx, anchorIdx];
          const rangeIds = sorted
            .slice(lo, hi + 1)
            .map((r) => r.RowID!)
            .filter(Boolean);
          onSelectionChange(rangeIds);
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      toggleRow(id);
    } else {
      onSelectionChange([id]);
      setAnchorRowId(id);
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

  const th = (key: keyof PredictedEpitope, label: string) => (
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
          <span>Predicted Epitopes</span>
          {onDownload && (
            <Button variant="primary" onClick={onDownload} disabled>
              Download
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-[var(--color-text-muted)] text-sm">No predicted epitopes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <span>Predicted Epitopes</span>
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
              {th("Peptide", "Peptide")}
              {th("Allele", "Allele")}
              {th("Rank", "Rank")}
              {th("Affinity", "Affinity")}
              {th("AffinityClass", "Class")}
              {th("Start", "Start")}
              {th("End", "End")}
            </tr>
          </thead>
          <tbody className="select-none">
            {sorted.map((r) => (
              <tr
                key={r.RowID ?? `${r.Peptide}-${r.Allele}-${r.Start}`}
                role="button"
                tabIndex={0}
                onClick={(e) => handleRowClick(e, r.RowID!)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (e.shiftKey) {
                      if (anchorRowId == null) {
                        onSelectionChange([r.RowID!]);
                        setAnchorRowId(r.RowID!);
                      } else {
                        const anchorIdx = sorted.findIndex((x) => x.RowID === anchorRowId);
                        const clickIdx = sorted.findIndex((x) => x.RowID === r.RowID);
                        if (anchorIdx >= 0 && clickIdx >= 0) {
                          const [lo, hi] =
                            anchorIdx <= clickIdx ? [anchorIdx, clickIdx] : [clickIdx, anchorIdx];
                          onSelectionChange(
                            sorted
                              .slice(lo, hi + 1)
                              .map((x) => x.RowID!)
                              .filter(Boolean)
                          );
                        }
                      }
                    } else if (e.ctrlKey || e.metaKey) {
                      toggleRow(r.RowID!);
                    } else {
                      onSelectionChange([r.RowID!]);
                      setAnchorRowId(r.RowID!);
                    }
                  }
                }}
                className={`cursor-pointer border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-subtle)]/50 ${
                  selectedRowIds.includes(r.RowID!) ? "bg-[var(--color-accent-muted)]" : ""
                }`}
              >
                <td className="px-2 py-1 font-mono">{r.Peptide}</td>
                <td className="px-2 py-1">{r.Allele}</td>
                <td className="px-2 py-1">{r.Rank?.toFixed(2)}</td>
                <td className="px-2 py-1">{r.Affinity?.toFixed(1)}</td>
                <td className={`px-2 py-1 ${AFFINITY_CLASS_NAMES[r.AffinityClass] ?? ""}`}>
                  {r.AffinityClass}
                </td>
                <td className="px-2 py-1">{r.Start}</td>
                <td className="px-2 py-1">{r.End}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
