---
name: tools
description: Install, log in to, and work around the quirks of the command-line tools this kit uses (Node.js, wrangler, the Stripe CLI). Use before any GUIDE.md step that runs wrangler or stripe, when a command fails with an auth or "not found" error, or when parsing Stripe CLI output.
---

# Tools: install, log in, known quirks

Check each tool before the step that needs it, not all up front. Install what's missing yourself. A login is the person's step: run the login command, tell them what to click in the browser that opens, and wait.

## Node.js (everything needs it)

- Check: `node -v` (current LTS or newer).
- Install:
  - Mac: `brew install node`, or the installer from nodejs.org if there's no Homebrew.
  - Windows: `winget install OpenJS.NodeJS.LTS`.

## wrangler (Cloudflare)

- Install: `npm install` in the kit folder. That installs the version pinned in `package.json`; always run it as `npx wrangler …`.
- Check the login: `npx wrangler whoami`.
- Log in: `npx wrangler login`. The person clicks **Allow** in the browser.
- **Several Cloudflare accounts** (`whoami` lists more than one): ask which one to use, then add `"account_id": "<id>"` to `wrangler.jsonc`.
- **Login blocked:** if the login hits a Cloudflare bot challenge or a 403, it's usually a VPN. Ask them to turn it off and retry.
- **Bucket:** the first `npx wrangler deploy` creates the private R2 bucket named in `wrangler.jsonc` by itself (tested). No separate step.
- **Uploads:** `npx wrangler r2 object put <bucket>/<key> --file <path> --content-type <type> --remote`. Without `--remote` it writes to a local simulation.
- **Secrets:** `npx wrangler secret put NAME` reads the value from a pipe. Use the clipboard pipe from `AGENTS.md`, never an argument or a file.
- **Checking a Worker route** (`/thanks`, `/download`): use a browser, or curl with `-H 'sec-fetch-mode: navigate' -H 'sec-fetch-dest: document'`. A route that `run_worker_first` doesn't cover still passes a plain curl, but real clicks get the 404 page.
- **A new domain looks dead from this computer:** it's often the local DNS cache. `dig @1.1.1.1 <domain>` tells you whether it's really live.

## Stripe CLI (Stripe path only)

- Check: `stripe version`.
- Install:
  - Mac: `brew install stripe/stripe-cli/stripe`.
  - Windows: `scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git`, then `scoop install stripe`, or the zip from the Stripe CLI's GitHub releases.
- Check the login: `stripe whoami`. It shows the account and when the CLI key expires; it never prints the key.
  - **Never run `stripe config --list`: it prints the stored keys.**
- Log in: `stripe login`. The person confirms in the browser and picks the **sandbox** (or the live account, in B8).
  - The login lasts about 90 days. `whoami` shows the expiry date; after that, log in again.
- From CLI v1.50, an account admin first allows it: Dashboard → **Settings → Team and security → MCP and CLI access**.
- The login leaves a full-access key on the computer. At the end, remind them: `stripe logout`.

### Quirks (each one cost a failed command)

- **Piped output can come back empty** when an agent runs the CLI. Always write to a file and read that: `stripe … > out.json 2>&1`. The file can start with a blank or hint line, so parse from the first `{`.
- **Pass every parameter as `-d "key=value"`.** `--flag true` is sometimes taken as an extra argument ("requires exactly 0 positional arguments").
- **Live mode:** add `--live` at the end of the command.
- **Managed Payments links:** add `-d "managed_payments[enabled]=true"` and `--stripe-version 2026-04-22.dahlia` or later. It can't be switched on for an existing link; make a new one.
- **Promotion codes** on current API versions: `-d "promotion[type]=coupon" -d "promotion[coupon]=<id>"`. The old top-level `coupon=` fails with "unknown parameter".
- **Replaying a webhook event** (to test C1): `stripe events resend <evt_…> --webhook-endpoint <we_…>`. Passing it as `-d "webhook_endpoint=…"` fails.
- **Finding a buyer's purchase:** `stripe checkout sessions list -d "customer_details[email]=<email>"`.
- **Free copies:** a 100%-off purchase under Managed Payments comes back `payment_status: "paid"` with no `payment_intent`. The Worker accepts it.
