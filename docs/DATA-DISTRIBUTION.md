# Published Epitopes Data Distribution

The full epitopes database is distributed as `data/published_epitopes.json.gz` (~21MB compressed), included in the repository. The server loads it by default and falls back to `data/published_epitopes.json` if present.

## Optional: GitHub Releases + download script

If you want to distribute updates via GitHub Releases instead of repo commits, you can:

1. **Prepare the file:** `gzip -c data/published_epitopes.json > published_epitopes.json.gz`
2. **Create a GitHub Release** and upload the asset
3. Users run `npm run data:epitopes` to fetch it into `data/published_epitopes.json`

Currently the data is in the repo, so this workflow is optional.
