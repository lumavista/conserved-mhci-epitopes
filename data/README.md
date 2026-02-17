# Data directory

- **`sample.fasta`** — Included in the repo. Used by “Use Sample Data” and `GET /api/mhc/sample`.
- **`published_epitopes.sample.json`** — Included in the repo. Sample published epitopes for UniProt P18272 (used with “Use Sample Data”). If `published_epitopes.json` is missing, the server uses this file so published epitopes appear in the table and plot.
- **`published_epitopes.json`** — Not in the repo (gitignored). Add this file for your own data; see the main [README](../README.md#published-epitopes-data) for format. When present, it overrides the sample file.
