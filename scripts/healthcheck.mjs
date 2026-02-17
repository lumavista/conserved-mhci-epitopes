#!/usr/bin/env node
/** Docker healthcheck: GET /api/health, exit 0 if 200 else 1 */
const port = process.env.PORT || 5398;
const url = `http://127.0.0.1:${port}/api/health`;
require("http")
  .get(url, (r) => {
    r.resume();
    process.exit(r.statusCode === 200 ? 0 : 1);
  })
  .on("error", () => process.exit(1));
