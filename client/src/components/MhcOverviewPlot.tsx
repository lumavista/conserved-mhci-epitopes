import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { PredictedEpitope, PublishedEpitope, ConservedRegion } from "@shared/types";

interface MhcOverviewPlotProps {
  predicted: PredictedEpitope[];
  published: PublishedEpitope[];
  conservedAln: ConservedRegion[];
  mapUngapToAln: number[];
  consensusAlnLen: number;
  highlightRegions: boolean;
  selectedRowIds?: number[];
  selectedPublishedIds?: string[];
  displayedData?: PredictedEpitope[];
}

function addAlnStart<T extends { Start: number }>(
  rows: T[],
  map: number[]
): Array<T & { AlnStart: number }> {
  return rows
    .filter((r) => r.Start > 0 && r.Start <= map.length)
    .map((r) => ({ ...r, AlnStart: map[r.Start - 1] ?? 0 }));
}

export function MhcOverviewPlot({
  predicted,
  published,
  conservedAln,
  mapUngapToAln,
  consensusAlnLen,
  highlightRegions,
  selectedRowIds = [],
  selectedPublishedIds = [],
  displayedData = [],
}: MhcOverviewPlotProps) {
  const { traces, shapes } = useMemo(() => {
    const predA = addAlnStart(predicted, mapUngapToAln);
    const pubA = addAlnStart(published, mapUngapToAln);

    const traces: Plotly.Data[] = [];

    if (predA.length > 0) {
      traces.push({
        x: predA.map((r) => r.AlnStart),
        y: predA.map((r) => r.Allele),
        type: "scatter",
        mode: "markers",
        marker: {
          size: 10,
          opacity: 0.85,
          color: predA.map((r) => r.Rank),
          colorscale: "Reds",
          reversescale: true,
          colorbar: { title: { text: "Binding Rank" } },
        },
        text: predA.map((r) =>
          "Peptide" in r
            ? `<b>Predicted:</b> ${r.Peptide}<br>Start: ${r.Start}–${r.End}<br>Allele: ${r.Allele}<br>Rank: ${r.Rank?.toFixed(2)}%`
            : ""
        ),
        hoverinfo: "text",
        name: "Predicted",
      } as Plotly.Data);
    }

    const selected = displayedData.filter((r) => r.RowID && selectedRowIds.includes(r.RowID));
    const selectedA = addAlnStart(selected, mapUngapToAln);
    if (selectedA.length > 0) {
      traces.push({
        x: selectedA.map((r) => r.AlnStart),
        y: selectedA.map((r) => r.Allele),
        type: "scatter",
        mode: "markers",
        marker: { size: 14, color: "#1f77b4", symbol: "circle", line: { color: "#1f77b4", width: 1.5 } },
        text: selectedA.map((r) =>
          "Peptide" in r ? `<b>Selected:</b> ${r.Peptide}<br>Allele: ${r.Allele}` : ""
        ),
        hoverinfo: "text",
        name: "Selected",
      } as Plotly.Data);
    }

    if (pubA.length > 0) {
      traces.push({
        x: pubA.map((r) => r.AlnStart),
        y: pubA.map((r) => r.Allele),
        type: "scatter",
        mode: "markers",
        marker: { color: "#00B894", size: 9, symbol: "circle" },
        text: pubA.map((r) =>
          "Peptide" in r
            ? `<b>Published:</b> ${r.Peptide}<br>Start: ${r.Start}–${r.End}<br>ID: ${(r as PublishedEpitope).Main_Epitope_ID}`
            : ""
        ),
        hoverinfo: "text",
        name: "Published",
      } as Plotly.Data);
    }

    const selectedPub = pubA.filter((r) =>
      selectedPublishedIds.includes((r as PublishedEpitope).Main_Epitope_ID)
    );
    if (selectedPub.length > 0) {
      traces.push({
        x: selectedPub.map((r) => r.AlnStart),
        y: selectedPub.map((r) => r.Allele),
        type: "scatter",
        mode: "markers",
        marker: {
          size: 14,
          color: "#9b59b6",
          symbol: "circle",
          line: { color: "#7d3c98", width: 1.5 },
        },
        text: selectedPub.map((r) =>
          "Peptide" in r
            ? `<b>Selected (published):</b> ${r.Peptide}<br>Allele: ${r.Allele}<br>ID: ${(r as PublishedEpitope).Main_Epitope_ID}`
            : ""
        ),
        hoverinfo: "text",
        name: "Selected (published)",
      } as Plotly.Data);
    }

    const shapes: Partial<Plotly.Shape>[] = [];
    if (highlightRegions && conservedAln.length > 0) {
      for (const reg of conservedAln) {
        const start = reg.aln_start;
        const end = (reg.aln_end ?? reg.aln_start + reg.aln_length - 1) as number;
        shapes.push({
          type: "rect",
          xref: "x",
          yref: "paper",
          x0: start - 0.5,
          x1: end + 0.5,
          y0: 0,
          y1: 1,
          fillcolor: "rgba(30,144,255,0.25)",
          line: { color: "transparent" },
          layer: "below",
        });
      }
    }

    return { traces, shapes };
  }, [
    predicted,
    published,
    conservedAln,
    mapUngapToAln,
    highlightRegions,
    selectedRowIds,
    selectedPublishedIds,
    displayedData,
  ]);

  return (
    <Plot
      data={traces}
      layout={{
        xaxis: {
          title: "Position",
          range: [0.5, consensusAlnLen + 0.5],
          dtick: 20,
          showgrid: false,
        },
        yaxis: {
          title: { text: "HLA Allele", standoff: 20 },
          type: "category",
          gridcolor: "rgba(0,0,0,0.1)",
          automargin: true,
        },
        legend: { orientation: "h", y: -0.28, yref: "paper" },
        plot_bgcolor: "rgba(240,240,240,0.5)",
        shapes,
        margin: { t: 20, r: 20, b: 88, l: 80 },
      }}
      useResizeHandler
      style={{ width: "100%", minHeight: 420 }}
      config={{ responsive: true }}
    />
  );
}
