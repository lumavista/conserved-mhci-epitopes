export interface MhcPredictionParams {
  fastaContent: string;
  uniprotId?: string;
  alleles: string[];
  peptideLengthRange: [number, number];
  minConservedLength: number;
  highlightRegions: boolean;
  skipIedb: boolean;
}

export interface PredictedEpitope {
  Peptide: string;
  Allele: string;
  Rank: number;
  Affinity: number;
  AffinityClass: "Strong" | "Intermediate" | "Weak";
  Start: number;
  End: number;
  Length: number;
  RowID?: number;
}

export interface PublishedEpitope {
  Main_Epitope_ID: string;
  Peptide: string;
  Allele: string;
  "#_Assays": number;
  SourceFiles: string;
  Start: number;
  End: number;
  Assays: string;
}

export interface ConservedRegion {
  aln_start: number;
  aln_length: number;
  aln_end?: number;
}

export interface MhcPredictionResult {
  predicted: PredictedEpitope[];
  published: PublishedEpitope[];
  conserved_aln: ConservedRegion[];
  consensus_vec: string[];
  consensus_ungapped: string;
  map_ungap_to_aln: number[];
  consensus_aln_len: number;
  alignment_applied?: boolean;
}

export interface PredictionProgressEvent {
  type: "progress";
  step: string;
  message: string;
  percent: number;
  etaSec?: number;
  current?: string;
}

export interface PredictionResultEvent {
  type: "result";
  data: MhcPredictionResult;
}

export interface PredictionErrorEvent {
  type: "error";
  message: string;
}

export type PredictionStreamEvent =
  | PredictionProgressEvent
  | PredictionResultEvent
  | PredictionErrorEvent;
