import type { PredictedEpitope } from "@shared/types.js";

const IEDB_API_URL = "https://tools-cluster-interface.iedb.org/tools_api/mhci/";

function parseIedbTsv(text: string): PredictedEpitope[] {
  const lines = text.split(/\n/).filter((l) => l.trim());
  const headerIdx = lines.findIndex((l) => l.toLowerCase().startsWith("allele\t"));
  if (headerIdx < 0) return [];

  const header = lines[headerIdx]!.toLowerCase().split("\t");
  const rows = lines.slice(headerIdx + 1);
  const result: PredictedEpitope[] = [];

  for (const row of rows) {
    const cells = row.split("\t");
    const rowObj: Record<string, string> = {};
    header.forEach((h, i) => {
      rowObj[h] = cells[i] ?? "";
    });

    const peptide = rowObj.peptide ?? "";
    const allele = rowObj.allele ?? "";
    const rank = parseFloat(rowObj.percentile_rank ?? "999");
    const ic50Col = header.find((h) => h === "ic50" || h === "ic50(nm)");
    const affinity = parseFloat(rowObj[ic50Col ?? "ic50"] ?? "99999");
    const start = parseInt(rowObj["start"] ?? rowObj["pos"] ?? "0", 10);

    let affinityClass: "Strong" | "Intermediate" | "Weak" = "Weak";
    if (affinity <= 50) affinityClass = "Strong";
    else if (affinity <= 500) affinityClass = "Intermediate";

    result.push({
      Peptide: peptide,
      Allele: allele,
      Rank: rank,
      Affinity: affinity,
      AffinityClass: affinityClass,
      Start: start,
      End: start + peptide.length - 1,
      Length: peptide.length,
    });
  }
  return result;
}

export async function queryIedb(
  _peptides: string[],
  allele: string,
  length: number,
  sequence: string,
  maxRetries = 2,
  timeoutSec = 180
): Promise<PredictedEpitope[]> {
  if (!sequence || sequence.length < length) return [];

  const body = new URLSearchParams({
    method: "netmhcpan",
    sequence_text: sequence,
    allele,
    length: String(length),
    species: "human",
  });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutSec * 1000);

      const res = await fetch(IEDB_API_URL, {
        method: "POST",
        body: body.toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const text = await res.text();

      if (res.status !== 200) {
        const bodyPreview = text.slice(0, 800).replace(/\n/g, " ");
        const seqPreview = sequence.slice(0, 80) + (sequence.length > 80 ? "..." : "");
        throw new Error(
          `IEDB HTTP ${res.status} (allele=${allele} length=${length} seqLen=${sequence.length}) ` +
            `seqPreview=[${seqPreview}] ` +
            `Response: ${bodyPreview || "(empty)"}`
        );
      }
      return parseIedbTsv(text);
    } catch (e) {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        const msg =
          e instanceof Error
            ? e.message
            : String(e);
        throw new Error(
          `IEDB request failed (allele=${allele} length=${length} seqLen=${sequence.length}): ${msg}`
        );
      }
    }
  }
  return [];
}
