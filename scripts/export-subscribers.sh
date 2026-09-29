#!/bin/bash
# Add-on C2: download your email list as a CSV you can import into any newsletter tool.
#   usage: scripts/export-subscribers.sh            → private/subscribers.csv (git ignores private/)
# The file holds people's email addresses: keep it private and delete it once imported.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p private; umask 077; TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
npx wrangler d1 execute SUBSCRIBERS --remote --json \
  --command "SELECT email, created_at, source FROM subscribers ORDER BY created_at" > "$TMP"
node -e '
  const rows = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))[0].results;
  const q = (v) => `"${String(v ?? "").replace(/"/g, "\"\"")}"`;
  const csv = ["email,signed_up_at,source", ...rows.map((r) => [r.email, r.created_at, r.source].map(q).join(","))].join("\n") + "\n";
  require("fs").writeFileSync("private/subscribers.csv", csv);
  console.log(rows.length + " subscribers → private/subscribers.csv");
' "$TMP"
