# Published Epitopes Data Distribution

The full `published_epitopes.json` (~300MB) is too large for the Git repository. It is distributed via GitHub Releases.

## For users: downloading the data

```bash
npm run data:epitopes
```

See the main [README](../README.md) for details.

## For maintainers: publishing a new release

1. **Prepare the file** (recommended: gzip to reduce size and transfer time):

   ```bash
   gzip -c data/published_epitopes.json > published_epitopes.json.gz
   ```

2. **Create a GitHub Release** for [lumavista/conserved-mhci-epitopes](https://github.com/lumavista/conserved-mhci-epitopes):
   - Go to **Releases** → **Draft a new release**
   - Choose a tag (e.g. `v1.0.0` or `epitopes-2024`)
   - Upload `published_epitopes.json.gz` (or `published_epitopes.json` if uncompressed)

3. The download script will pick up the asset from the latest release. To use a specific release: `EPITOPES_TAG=v1.0.0 npm run data:epitopes`.
