import type { PredictedEpitope, PublishedEpitope } from "@shared/types";

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv<T extends Record<string, string | number>>(rows: T[], columns: (keyof T)[]): string {
  const header = columns.map((c) => escapeCsvCell(String(c))).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCsvCell(r[c] ?? "")).join(",")).join("\n");
  return `${header}\n${body}`;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPredictedExcel(data: PredictedEpitope[], filename = "predicted_epitopes") {
  const rows = data.map((r) => ({
    Peptide: r.Peptide,
    Allele: r.Allele,
    Rank: r.Rank,
    Affinity: r.Affinity,
    AffinityClass: r.AffinityClass,
    Start: r.Start,
    End: r.End,
    Length: r.Length,
  }));
  const columns = [
    "Peptide",
    "Allele",
    "Rank",
    "Affinity",
    "AffinityClass",
    "Start",
    "End",
    "Length",
  ] as const;
  downloadCsv(toCsv(rows, columns), filename);
}

export function downloadPublishedExcel(data: PublishedEpitope[], filename = "published_epitopes") {
  const rows = data.map((r) => ({
    "Main Epitope ID": r.Main_Epitope_ID,
    Peptide: r.Peptide,
    Allele: r.Allele,
    "# Assays": r["#_Assays"],
    Start: r.Start,
    End: r.End,
    Assays: r.Assays,
  }));
  const columns = [
    "Main Epitope ID",
    "Peptide",
    "Allele",
    "# Assays",
    "Start",
    "End",
    "Assays",
  ] as const;
  downloadCsv(toCsv(rows, columns), filename);
}
