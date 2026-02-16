import { Button } from "./ui";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="help-title" className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Conserved Human MHC-I Epitopes
        </h2>
        <div className="space-y-4 text-sm text-[var(--color-text)]">
          <p>
            This tool predicts MHC-I binding epitopes from protein sequences using the IEDB
            NetMHCpan API. Upload a FASTA file (single or multiple sequences) or use the sample data.
          </p>
          <h3 className="font-semibold">Workflow</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Upload FASTA or load sample data</li>
            <li>Optionally enter a UniProt ID to map published epitopes from the local database</li>
            <li>Select HLA alleles and peptide length range</li>
            <li>Click Run Prediction</li>
          </ol>
          <h3 className="font-semibold">Output</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Overview plot:</strong> Predicted (colored by rank) and published epitopes
              along the alignment
            </li>
            <li>
              <strong>Predicted table:</strong> Strong binders (Rank &lt; 2%) with affinity class
            </li>
            <li>
              <strong>Published table:</strong> Literature epitopes mapped to your consensus
            </li>
          </ul>
          <p className="text-[var(--color-text-muted)]">
            Predictions powered by{" "}
            <a
              href="https://www.iedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] underline"
            >
              IEDB MHC Binding API
            </a>
            . Research and educational use only. Please cite IEDB when generating data.
          </p>
        </div>
        <div className="mt-6">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
