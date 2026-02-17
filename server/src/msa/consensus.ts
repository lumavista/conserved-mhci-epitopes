import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import type { FastaRecord } from "../parsers/fasta.js";
import type { ConservedRegion } from "@shared/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Project root: use cwd so production (dist/server/src/msa/) finds repo root and .venv. */
function getProjectRoot(): string {
  const fromFile = path.resolve(__dirname, "..", "..", "..");
  const inDist = fromFile.includes(path.sep + "dist" + path.sep) || fromFile.endsWith(path.sep + "dist");
  return inDist ? process.cwd() : fromFile;
}

const projectRoot = getProjectRoot();
const runClustalScript = path.join(
  projectRoot,
  "server",
  "scripts",
  "run_clustal.py"
);

function getPythonPath(): string {
  if (process.env.PYTHON_MSA_PATH) return process.env.PYTHON_MSA_PATH;
  const venvPython = path.join(projectRoot, ".venv", "bin", "python3");
  if (existsSync(venvPython)) return venvPython;
  return "python3";
}

export interface ConsensusResult {
  consensusVec: string[];
  consensusUngapped: string;
  mapUngapToAln: number[];
  consensusAlnLen: number;
  conservedAln: ConservedRegion[];
  alignmentApplied?: boolean;
}

function getConsensusFromAlignedMatrix(aln: string[][]): string[] {
  const nCols = aln[0]?.length ?? 0;
  const result: string[] = [];
  for (let c = 0; c < nCols; c++) {
    const col = aln.map((row) => row[c] ?? "-").filter((x) => x !== "-");
    if (col.length === 0) {
      result.push("-");
      continue;
    }
    const counts: Record<string, number> = {};
    for (const aa of col) {
      counts[aa] = (counts[aa] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    result.push(sorted[0]![0]);
  }
  return result;
}

function runLengthConserved(isCons: boolean[], minLength: number): ConservedRegion[] {
  const blocks: ConservedRegion[] = [];
  let i = 0;
  while (i < isCons.length) {
    if (!isCons[i]) {
      i++;
      continue;
    }
    const start = i + 1;
    while (i < isCons.length && isCons[i]) i++;
    const len = i - start + 1;
    if (len >= minLength) {
      blocks.push({ aln_start: start, aln_length: len });
    }
  }
  return blocks;
}

export function consensusSingle(record: FastaRecord, minConservedLength: number): ConsensusResult {
  const seq = record.sequence;
  const vec = seq.split("");
  const ungapped = vec.filter((c) => c !== "-").join("");
  const mapUngapToAln: number[] = [];
  vec.forEach((c, i) => {
    if (c !== "-") mapUngapToAln.push(i + 1);
  });
  const conservedAln =
    seq.length >= minConservedLength ? [{ aln_start: 1, aln_length: seq.length }] : [];
  return {
    consensusVec: vec,
    consensusUngapped: ungapped,
    mapUngapToAln,
    consensusAlnLen: vec.length,
    conservedAln,
    alignmentApplied: false,
  };
}

export async function consensusMulti(
  records: FastaRecord[],
  minConservedLength: number
): Promise<ConsensusResult> {
  if (records.length === 0) throw new Error("No sequences");
  if (records.length === 1) return consensusSingle(records[0]!, minConservedLength);

  const fastaContent = records.map((r) => `>${r.id}\n${r.sequence}`).join("\n");

  const { aln, stderr: clustalStderr } = await runLocalClustal(fastaContent, records.length);
  if (aln) {
    const consensusVec = getConsensusFromAlignedMatrix(aln);
    const consensusUngapped = consensusVec.filter((c) => c !== "-").join("");
    const mapUngapToAln: number[] = [];
    consensusVec.forEach((c, i) => {
      if (c !== "-") mapUngapToAln.push(i + 1);
    });
    const isConserved: boolean[] = consensusVec.map((_, c) => {
      const col = aln.map((row) => row[c] ?? "-");
      return col.every((x) => x !== "-") && new Set(col).size === 1;
    });
    const conservedAln = runLengthConserved(isConserved, minConservedLength);

    return {
      consensusVec,
      consensusUngapped,
      mapUngapToAln,
      consensusAlnLen: consensusVec.length,
      conservedAln,
      alignmentApplied: true,
    };
  }

  const hint = clustalStderr ? ` ${clustalStderr}` : "";
  throw new Error(
    `Multi-sequence alignment failed for ${records.length} sequences.` +
      ` Ensure Python 3, Biopython, and Clustal Omega are installed (run 'npm run setup:msa').` +
      hint
  );
}

interface ClustalResult {
  aln: string[][] | null;
  stderr?: string;
}

function runLocalClustal(fastaContent: string, expectedRows: number): Promise<ClustalResult> {
  return new Promise((resolve) => {
    const pythonPath = getPythonPath();
    const child = spawn(pythonPath, [runClustalScript], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: projectRoot,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => resolve({ aln: null, stderr: String(err.message) }));
    child.on("close", (code) => {
      if (code !== 0) {
        if (stderr) console.warn("[consensus] run_clustal.py:", stderr.trim());
        resolve({ aln: null, stderr: stderr.trim() || `clustalo exited with code ${code}` });
        return;
      }
      try {
        const data = JSON.parse(stdout) as { rows?: Array<{ id: string; sequence: string }> };
        const rows = data?.rows;
        if (!Array.isArray(rows) || rows.length !== expectedRows) {
          resolve({ aln: null, stderr: `Expected ${expectedRows} rows, got ${rows?.length ?? 0}` });
          return;
        }
        const minInputLen = Math.min(
          ...rows.map((r) => (r.sequence ?? "").replace(/-/g, "").length)
        );
        const aln: string[][] = rows.map((r) => (r.sequence ?? "").toUpperCase().split(""));
        const alnLen = aln[0]?.length ?? 0;
        const sameLength = aln.every((row) => row.length === alnLen);
        const consensusUngappedLen =
          alnLen > 0 ? getConsensusFromAlignedMatrix(aln).filter((c) => c !== "-").length : 0;
        if (!sameLength || consensusUngappedLen < Math.min(50, Math.floor(minInputLen / 2))) {
          resolve({ aln: null, stderr: "Alignment validation failed (row lengths or consensus)" });
          return;
        }
        resolve({ aln });
      } catch {
        resolve({ aln: null, stderr: "Failed to parse Clustal output" });
      }
    });

    child.stdin.write(fastaContent, "utf8", () => {
      child.stdin.end();
    });
  });
}
