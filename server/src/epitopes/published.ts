import path from "path";
import fs from "fs";
import zlib from "zlib";
import type { PublishedEpitope } from "@shared/types.js";

interface PublishedDbRow {
  MoleculeParentIRI: string;
  SourceFile: string;
  Assay: string;
  Peptide: string;
  Allele: string;
  EpitopeID: string;
}

let db: PublishedDbRow[] | null = null;
const dataDir = path.join(process.cwd(), "data");
const publishedEpitopesGz = path.join(dataDir, "published_epitopes.json.gz");
const publishedEpitopesJson = path.join(dataDir, "published_epitopes.json");

const NEG_PAT = /negative|no\s*binding|not\s*detected|non.?binding|no\s*activity/i;

function loadFromGz(): string | null {
  try {
    const compressed = fs.readFileSync(publishedEpitopesGz);
    return zlib.gunzipSync(compressed).toString("utf-8");
  } catch {
    return null;
  }
}

function loadFromJson(): string | null {
  try {
    return fs.readFileSync(publishedEpitopesJson, "utf-8");
  } catch {
    return null;
  }
}

export function loadPublishedDb(): void {
  if (db !== null) return;
  const raw = loadFromGz() ?? loadFromJson();
  if (!raw) {
    db = [];
    return;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    db = Array.isArray(parsed) ? parsed : [];
  } catch {
    db = [];
  }
}

export function findPublishedEpitopes(
  consensusUngapped: string,
  uniprotId: string
): PublishedEpitope[] {
  loadPublishedDb();
  if (!db || db.length === 0) return [];

  const uid = uniprotId.toUpperCase().trim();
  if (!uid) return [];

  let rows = db.filter((r) => (r.MoleculeParentIRI ?? "").toUpperCase().includes(uid));
  if (rows.length === 0) return [];

  const keepT = (r: PublishedDbRow) =>
    (r.SourceFile ?? "").toLowerCase() === "tcell" && /positive/i.test(r.Assay ?? "");
  const keepM = (r: PublishedDbRow) =>
    (r.SourceFile ?? "").toLowerCase() === "mhc" && !NEG_PAT.test(r.Assay ?? "");
  rows = rows.filter((r) => keepT(r) || keepM(r));
  if (rows.length === 0) return [];

  const withPos = rows
    .map((r) => {
      const pos = consensusUngapped.indexOf(r.Peptide ?? "");
      if (pos < 0) return null;
      return {
        ...r,
        Start: pos + 1,
        End: pos + (r.Peptide?.length ?? 0),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (withPos.length === 0) return [];

  const key = (r: { Peptide: string; Allele: string }) => `${r.Peptide}\t${r.Allele}`;
  const groups = new Map<string, typeof withPos>();
  for (const r of withPos) {
    const k = key(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }

  const result: PublishedEpitope[] = [];
  for (const arr of groups.values()) {
    const first = arr[0]!;
    const epitopeIds = [...new Set(arr.map((r) => r.EpitopeID).filter(Boolean))];
    const assays = [...new Set(arr.map((r) => r.Assay).filter(Boolean))];
    const sourceFiles = [...new Set(arr.map((r) => r.SourceFile).filter(Boolean))];
    result.push({
      Main_Epitope_ID: epitopeIds[0] ?? "",
      Peptide: first.Peptide ?? "",
      Allele: first.Allele ?? "",
      "#_Assays": arr.length,
      SourceFiles: sourceFiles.join("+"),
      Start: first.Start,
      End: first.End,
      Assays: assays.join(" | "),
    });
  }

  return result;
}
