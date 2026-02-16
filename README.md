# Conserved Human MHC-I Epitopes

React/TypeScript web app for alignment-consistent consensus MHC-I epitope prediction.

## Tech Stack

- **Client:** React 18, TypeScript, Vite, Tailwind CSS, Plotly.js
- **Server:** Express, ViteExpress (single port dev/prod)
- **External APIs:** IEDB MHC-I NetMHCpan
- **MSA:** Local Clustal Omega via Python (Biopython) for multi-sequence alignment; falls back to first sequence if Python/clustalo unavailable

## Setup

```bash
npm install
```

**Multi-sequence alignment (optional):** For multiple FASTA sequences, the server runs Clustal Omega locally via a Python script. Run once for full MSA support:

```bash
npm run setup:msa
```

This creates a Python venv at `.venv` and installs Biopython. Requires Python 3 and Clustal Omega on PATH (e.g. `apt install python3 clustalo` on Debian/Ubuntu). If unavailable, the server falls back to using the first sequence only.

## Commands

| Command           | Description                                          |
|-------------------|------------------------------------------------------|
| `npm run setup:msa` | One-time setup: create Python venv + install Biopython |
| `npm run dev`     | Run development (port 3000)                          |
| `npm run build`| Build for production          |
| `npm start`    | Build and run production (port 5398) |
| `npm run preview` | Preview built client      |

**Environment:** `PORT` (default 3000 for dev, 5398 for production). Set in `.env` or environment.

## Development

```bash
npm run dev
```

Runs the app on port 3000. Open http://localhost:3000. Vite HMR is enabled; API and frontend share the same port.

## Production

```bash
npm start
```

Builds the client, builds the server, and runs everything on port 5398 (or `PORT` env). One process serves both the UI and the API.

### Docker

The image uses **port 5398** and is intended to run as container **mhc-demo** by convention.

**Option 1 – Docker Compose (recommended)**

```bash
docker compose build
docker compose up -d
```

Stop and remove: `docker compose down`.

**Option 2 – Plain Docker**

```bash
docker build -t mhc-demo:latest .
docker run -d --name mhc-demo -p 5398:5398 mhc-demo:latest
```

To use a different host port: `-p 8080:5398` (host:container). The container always listens on 5398 inside the image.

## Usage

1. Open http://localhost:3000 (dev) or http://localhost:5398 (production / Docker)
2. Upload a FASTA file (e.g. `data/sample.fasta`) or click "Use Sample Data" (serves `data/sample.fasta`)
3. Optionally enter UniProt ID for published epitope lookup (requires local DB)
4. Select HLA alleles, peptide length range, and other options
5. Click "Run Prediction"
6. View the overview plot and tables; download results as Excel

## Project Structure

```
mhc-demo-app/
├── client/           # React frontend
│   └── src/
│       ├── components/  # Layout, LeftPanel, MhcOverviewPlot, PredictedTable, PublishedTable, HelpModal, ui/
│       ├── hooks/       # useMhcPrediction
│       ├── contexts/    # ThemeContext
│       └── utils/       # uiTheme, exportExcel
├── server/            # Express API
│   ├── scripts/       # run_clustal.py (Clustal Omega + Biopython)
│   └── src/
│       ├── parsers/    # fasta.ts (multi-seq)
│       ├── msa/        # consensus.ts (single + local Clustal for multi)
│       ├── iedb/       # client.ts (NetMHCpan API)
│       ├── epitopes/   # published.ts (loads data/published_epitopes.json from R export)
│       └── routes/     # mhc.ts
├── shared/            # types.ts
└── data/              # sample.fasta
```

## Notes

- **Published epitopes:** The Node app loads **one small JSON file per UniProt ID** from `data/published_epitopes/{UniProtID}.json` (e.g. `P18272.json`), so only the requested protein’s data is read. Generate these from the Shiny app’s RDS: from `mhc-demo-shiny/` run `Rscript export_db_to_json.R` (requires R with `data.table` and `jsonlite`). This reads `mhc_db/combined_db.rds` and writes per-ID files under `../data/published_epitopes/`. Lookup in `server/src/epitopes/published.ts` mirrors `find_published_epitopes_local()` in `mhc-demo-shiny/app.R`.
- **Multi-sequence MSA:** Uses local Clustal Omega only (no EBI API) via `server/scripts/run_clustal.py` (Python + Biopython); falls back to first sequence if Python/clustalo fails.
- **Sample data:** Single source of truth is `data/sample.fasta`; "Use Sample Data" and GET `/api/mhc/sample` serve that file.
- **IEDB:** Uses tools-cluster-interface.iedb.org; enable "Skip IEDB" for faster testing without API calls.
