import * as XLSX from "xlsx";
import type { PredictedEpitope, PublishedEpitope } from "@shared/types";

export function downloadPredictedExcel(data: PredictedEpitope[], filename = "predicted_epitopes") {
  const ws = XLSX.utils.json_to_sheet(
    data.map((r) => ({
      Peptide: r.Peptide,
      Allele: r.Allele,
      Rank: r.Rank,
      Affinity: r.Affinity,
      AffinityClass: r.AffinityClass,
      Start: r.Start,
      End: r.End,
      Length: r.Length,
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Predicted");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function downloadPublishedExcel(data: PublishedEpitope[], filename = "published_epitopes") {
  const ws = XLSX.utils.json_to_sheet(
    data.map((r) => ({
      "Main Epitope ID": r.Main_Epitope_ID,
      Peptide: r.Peptide,
      Allele: r.Allele,
      "# Assays": r["#_Assays"],
      Start: r.Start,
      End: r.End,
      Assays: r.Assays,
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Published");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
