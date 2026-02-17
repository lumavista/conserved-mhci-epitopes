import type { PredictionProgress as ProgressType } from "../hooks/useMhcPrediction";

interface PredictionProgressProps {
  progress: ProgressType;
}

function formatEta(sec?: number): string {
  if (sec == null || sec < 0) return "";
  if (sec < 60) return `~${Math.round(sec)}s remaining`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `~${m}m ${s}s remaining` : `~${m}m remaining`;
}

export function PredictionProgress({ progress }: PredictionProgressProps) {
  const eta = formatEta(progress.etaSec);

  return (
    <div
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--color-text)]">{progress.message}</span>
        {progress.percent >= 0 && (
          <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
            {progress.percent}%
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-[var(--color-surface-subtle)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>
      {eta && <p className="text-xs text-[var(--color-text-muted)]">{eta}</p>}
    </div>
  );
}
