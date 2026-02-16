# Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY client ./client
COPY server ./server
COPY shared ./shared
RUN npm run build

# Production stage
FROM node:20-bookworm-slim AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5398

# Python + Clustal Omega for multi-sequence MSA (server/scripts/run_clustal.py)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    clustalo \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY data ./data
COPY server/scripts ./server/scripts

# Use venv for Python deps (biopython)
RUN python3 -m venv /app/.venv && /app/.venv/bin/pip install -r server/scripts/requirements.txt

EXPOSE 5398

CMD ["node", "dist/server/src/index.js"]
