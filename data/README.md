# Data directory

- **`sample.fasta`** — Included in the repo. Used by “Use Sample Data” and `GET /api/mhc/sample`.
- **`published_epitopes.json.gz`** — Included in the repo. Gzipped full epitopes database (~21MB). The server uses this by default for published epitope lookup by UniProt ID.
- **`published_epitopes.json`** — Not in the repo (gitignored). Optional fallback when present; the server prefers `.gz`. See the main [README](../README.md) for format.
