import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parseFastaMulti } from "../parsers/fasta.js";
import { consensusSingle, consensusMulti } from "../msa/consensus.js";
import { queryIedb } from "../iedb/client.js";
import { findPublishedEpitopes } from "../epitopes/published.js";
import type {
  MhcPredictionParams,
  MhcPredictionResult,
  PredictedEpitope,
  PublishedEpitope,
} from "@shared/types.js";
import type { PredictionStreamEvent } from "@shared/types.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const sampleFastaPath = path.join(process.cwd(), "data", "sample.fasta");

function readSampleFasta(): string {
  try {
    return fs.readFileSync(sampleFastaPath, "utf-8");
  } catch {
    return "";
  }
}

router.get("/mhc/sample", (_req, res) => {
  const content = readSampleFasta();
  if (!content.trim()) {
    res.status(404).type("text/plain").send("Sample FASTA not found (data/sample.fasta)");
    return;
  }
  res.type("text/plain").send(content);
});

function looksLikeFasta(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 20) return false;
  if (/<\?xml|<!DOCTYPE|<html|^{\s*"/.test(t)) return false;
  return t.includes(">") && /[A-Za-z]{10,}/.test(t);
}

function writeProgress(res: Response, event: PredictionStreamEvent): void {
  res.write(JSON.stringify(event) + "\n");
}

const MSA_ETA_SEC = 5;
const IEDB_CALL_ETA_SEC = 2;

router.post("/mhc/predict", upload.single("fastaFile"), async (req, res) => {
  const stream = req.query.stream === "1" || req.query.stream === "true";

  try {
    const body = req.body as Partial<MhcPredictionParams> & { fastaContent?: string; useSample?: string | boolean };
    let fastaContent = body.fastaContent ?? "";

    if (req.file) {
      fastaContent = req.file.buffer.toString("utf-8");
    }

    if (body.useSample === "true" || body.useSample === true) {
      fastaContent = readSampleFasta();
    }

    if (!fastaContent?.trim()) {
      res.status(400).json({ message: "FASTA content or file required" });
      return;
    }

    if (!looksLikeFasta(fastaContent)) {
      res.status(400).json({
        message:
          "Invalid FASTA: input looks like XML/HTML. Use 'Use Sample Data' or upload a proper .fasta file. First 100 chars: " +
          fastaContent.slice(0, 100).replace(/\n/g, " "),
      });
      return;
    }

    const uniprotId = (body.uniprotId ?? "").trim();
    let alleles: string[] = [];
    if (Array.isArray(body.alleles)) {
      alleles = body.alleles;
    } else if (typeof body.alleles === "string") {
      try {
        alleles = JSON.parse(body.alleles);
      } catch {
        alleles = [];
      }
    }
    let peptideRange: [number, number] = [9, 10];
    if (Array.isArray(body.peptideLengthRange) && body.peptideLengthRange.length >= 2) {
      peptideRange = [Number(body.peptideLengthRange[0]) || 9, Number(body.peptideLengthRange[1]) || 10];
    } else if (typeof body.peptideLengthRange === "string") {
      try {
        const arr = JSON.parse(body.peptideLengthRange);
        if (Array.isArray(arr) && arr.length >= 2) {
          peptideRange = [Number(arr[0]) || 9, Number(arr[1]) || 10];
        }
      } catch {
        /* keep default peptideRange */
      }
    }
    const minConserved = Math.max(5, Math.min(100, Number(body.minConservedLength) || 10));
    const skipIedb = body.skipIedb === true;

    if (alleles.length === 0) {
      res.status(400).json({ message: "Select at least one HLA allele" });
      return;
    }

    const peptideLengths = Array.from(
      { length: peptideRange[1]! - peptideRange[0]! + 1 },
      (_, i) => peptideRange[0]! + i
    );
    const totalIedbCalls = skipIedb ? 0 : alleles.length * peptideLengths.length;
    const totalEtaSec = (skipIedb ? 0 : totalIedbCalls * IEDB_CALL_ETA_SEC) + (totalIedbCalls > 0 ? MSA_ETA_SEC : 0);

    if (stream) {
      res.setHeader("Content-Type", "application/x-ndjson");
      res.status(200);
    }

    const progress = (step: string, message: string, percent: number, etaSec?: number, current?: string) => {
      if (stream) {
        writeProgress(res, { type: "progress", step, message, percent, etaSec, current });
      }
    };

    progress("parse", "Parsing FASTA…", 5, totalEtaSec);

    const records = parseFastaMulti(fastaContent);
    if (records.length === 0) {
      res.status(400).json({ message: "No valid sequences in FASTA" });
      return;
    }

    let consensusResult;
    try {
      if (records.length === 1) {
        progress("consensus", "Single sequence (no alignment needed)", 15, totalEtaSec - MSA_ETA_SEC);
        consensusResult = consensusSingle(records[0]!, minConserved);
      } else {
        progress("consensus", "Running multi-sequence alignment (Clustal Omega)…", 10, totalEtaSec);
        consensusResult = await consensusMulti(records, minConserved);
        progress("consensus", "Alignment complete", 25, totalEtaSec - MSA_ETA_SEC);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Consensus failed";
      if (msg.includes("alignment failed") || msg.includes("Multi-sequence")) {
        if (stream) writeProgress(res, { type: "error", message: msg });
        else res.status(400).json({ message: msg });
        return;
      }
      throw e;
    }

    const { consensusUngapped, mapUngapToAln } = consensusResult;

    if (consensusUngapped.length < 9) {
      const msg = `Consensus sequence too short (${consensusUngapped.length} aa). Check FASTA input. First 80 chars: ${consensusUngapped.slice(0, 80)}`;
      if (stream) writeProgress(res, { type: "error", message: msg });
      else res.status(400).json({ message: msg });
      return;
    }

    progress("published", "Looking up published epitopes…", 30, totalEtaSec - MSA_ETA_SEC);

    const published = uniprotId
      ? findPublishedEpitopes(consensusUngapped, uniprotId)
      : ([] as PublishedEpitope[]);

    const allHits: PredictedEpitope[] = [];
    let iedbDone = 0;

    if (!skipIedb) {
      for (const allele of alleles) {
        for (const len of peptideLengths) {
          const remaining = totalIedbCalls - iedbDone;
          progress(
            "iedb",
            `Querying IEDB: ${allele} (${len}mer)…`,
            30 + Math.floor((iedbDone / totalIedbCalls) * 65),
            remaining * IEDB_CALL_ETA_SEC,
            `${allele} ${len}mer`
          );
          const df = await queryIedb([], allele, len, consensusUngapped);
          for (const row of df) {
            const pos = consensusUngapped.indexOf(row.Peptide);
            if (pos >= 0) {
              allHits.push({
                ...row,
                Start: pos + 1,
                End: pos + row.Peptide.length,
                Length: len,
                Allele: allele,
              });
            }
          }
          iedbDone++;
        }
      }
    }

    progress("finish", "Processing results…", 98);

    const binders = allHits.filter((r) => r.Rank < 2);
    binders.forEach((r, i) => {
      r.RowID = i + 1;
    });

    const result: MhcPredictionResult = {
      predicted: binders.sort((a, b) => a.Rank - b.Rank),
      published,
      conserved_aln: consensusResult.conservedAln.map((r) => ({
        ...r,
        aln_end: r.aln_start + r.aln_length - 1,
      })),
      consensus_vec: consensusResult.consensusVec,
      consensus_ungapped: consensusUngapped,
      map_ungap_to_aln: mapUngapToAln,
      consensus_aln_len: consensusResult.consensusAlnLen,
      alignment_applied: consensusResult.alignmentApplied,
    };

    if (stream) {
      writeProgress(res, { type: "result", data: result });
      res.end();
    } else {
      res.json(result);
    }
  } catch (e) {
    console.error("MHC predict error:", e);
    const msg = e instanceof Error ? e.message : "Prediction failed";
    if (stream && !res.headersSent) {
      res.setHeader("Content-Type", "application/x-ndjson");
      res.status(500);
      writeProgress(res, { type: "error", message: msg });
      res.end();
    } else if (stream && res.headersSent) {
      writeProgress(res, { type: "error", message: msg });
      res.end();
    } else if (!res.headersSent) {
      res.status(500).json({ message: msg });
    }
  }
});

export default router;
