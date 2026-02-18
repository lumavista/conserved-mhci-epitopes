# Data directory

- **`sample.fasta`** — Included in the repo. Used by “Use Sample Data” and `GET /api/mhc/sample`.
- **`published_epitopes.sample.json`** — Included in the repo. Sample published epitopes for UniProt P18272 (used with “Use Sample Data”). If `published_epitopes.json` is missing, the server uses this file so published epitopes appear in the table and plot.
- **`published_epitopes.json`** — Not in the repo (gitignored). Run `npm run data:epitopes` to download the full dataset from [GitHub Releases](https://github.com/lumavista/conserved-mhci-epitopes/releases), or add your own file. When present, it is used for published epitope lookup by UniProt ID. See the main [README](../README.md) for format.
