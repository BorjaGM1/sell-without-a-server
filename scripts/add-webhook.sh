#!/bin/bash
# Add-on C1 (GUIDE.md, "Email buyers their link"): creates the Stripe webhook that tells the Worker about each purchase,
# and stores its signing secret in Cloudflare. The secret is never printed, so an agent running this never sees it.
#   usage: scripts/add-webhook.sh https://yourdomain.com          (sandbox, while `stripe login` is on the sandbox)
#          scripts/add-webhook.sh https://yourdomain.com --live   (live)
# Run it once per mode. Running it again makes a second endpoint: delete the old one in Stripe → Developers → Webhooks.
set -euo pipefail
SITE="${1:?usage: scripts/add-webhook.sh https://yourdomain.com [--live]}"; LIVE="${2:-}"
cd "$(dirname "$0")/.."
umask 077; TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT

stripe webhook_endpoints create -d "url=${SITE%/}/stripe/webhook" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=checkout.session.async_payment_succeeded" \
  -d "description=download emails (sell-without-a-server)" $LIVE > "$TMP" 2>&1 || true

SECRET="$(node -e '
  const t = require("fs").readFileSync(process.argv[1], "utf8"); let d = {};
  try { d = JSON.parse(t.slice(t.indexOf("{"))); } catch {}
  if (!d.secret) { console.error("Stripe did not create the webhook:", (d.error && d.error.message) || "unexpected answer"); process.exit(1); }
  console.error("webhook endpoint created:", d.id, "→", d.url);
  process.stdout.write(d.secret);
' "$TMP")"

printf '%s' "$SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET
unset SECRET
