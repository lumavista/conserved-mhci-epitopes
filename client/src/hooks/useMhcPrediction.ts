import { useState, useCallback } from "react";
import type { MhcPredictionResult, PredictionStreamEvent } from "@shared/types";

export interface PredictionProgress {
  step: string;
  message: string;
  percent: number;
  etaSec?: number;
  current?: string;
}

interface UseMhcPredictionResult {
  data: MhcPredictionResult | null;
  loading: boolean;
  error: Error | null;
  progress: PredictionProgress | null;
  runPrediction: (params: {
    fastaFile: File | null;
    fastaContent?: string;
    uniprotId: string;
    alleles: string[];
    peptideLengthRange: [number, number];
    minConservedLength: number;
    highlightRegions: boolean;
    skipIedb: boolean;
  }) => Promise<void>;
}

const PREDICT_URL = "/api/mhc/predict?stream=1";

async function readNdjsonStream<T>(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onProgress?: (event: PredictionStreamEvent) => void
): Promise<T> {
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line) as PredictionStreamEvent;
        if (event.type === "progress" && onProgress) {
          onProgress(event);
        } else if (event.type === "result") {
          result = event.data as unknown as T;
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      } catch (e) {
        if (e instanceof Error && e.message && !e.message.startsWith("Unexpected")) throw e;
        if (result != null) return result;
        throw e;
      }
    }
  }
  if (result != null) return result;
  throw new Error("No result in stream");
}

export function useMhcPrediction(): UseMhcPredictionResult {
  const [data, setData] = useState<MhcPredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<PredictionProgress | null>(null);

  const runPrediction = useCallback(
    async (params: {
      fastaFile: File | null;
      fastaContent?: string;
      uniprotId: string;
      alleles: string[];
      peptideLengthRange: [number, number];
      minConservedLength: number;
      highlightRegions: boolean;
      skipIedb: boolean;
    }) => {
      setLoading(true);
      setError(null);
      setProgress(null);
      try {
        let res: Response;
        if (params.fastaFile) {
          const formData = new FormData();
          formData.append("fastaFile", params.fastaFile);
          formData.append("uniprotId", params.uniprotId);
          formData.append("alleles", JSON.stringify(params.alleles));
          formData.append("peptideLengthRange", JSON.stringify(params.peptideLengthRange));
          formData.append("minConservedLength", String(params.minConservedLength));
          formData.append("skipIedb", String(params.skipIedb));
          res = await fetch(PREDICT_URL, { method: "POST", body: formData });
        } else {
          res = await fetch(PREDICT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fastaContent: params.fastaContent,
              uniprotId: params.uniprotId,
              alleles: params.alleles,
              peptideLengthRange: params.peptideLengthRange,
              minConservedLength: params.minConservedLength,
              skipIedb: params.skipIedb,
            }),
          });
        }

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message ?? `HTTP ${res.status}`);
        }

        const body = res.body;
        if (!body) throw new Error("No response body");

        const reader = body.getReader();
        const result = await readNdjsonStream<MhcPredictionResult>(reader, (event) => {
          if (event.type === "progress") {
            setProgress({
              step: event.step,
              message: event.message,
              percent: event.percent,
              etaSec: event.etaSec,
              current: event.current,
            });
          }
        });
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Prediction failed"));
        setData(null);
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    []
  );

  return { data, loading, error, progress, runPrediction };
}
