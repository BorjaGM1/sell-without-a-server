# Digital product kit

Sell a PDF, template or any other file from your own page, **without a server**.

- Your landing page lives on Cloudflare (free).
- The buy button goes to **Gumroad** (simplest), or to **Stripe** with Managed Payments (lower fees).
- Either way the checkout provider handles the payment, the VAT and sales tax, and the receipt.
- On the Stripe path, one small Cloudflare Worker (`src/worker.js`) hands out the file after it checks the payment with a read-only key.

There's no box to SSH into, no database, and no powerful API key sitting in a `.env` file.

## Use it

1. Download this repo and open the folder in [Claude Code](https://claude.com/claude-code) (or your agent of choice).
2. Say: **"Follow GUIDE.md to set up my shop. I sell ___ for $__."**
3. The agent does the steps and stops whenever it needs you: to log in, click Allow, enter a card, or paste a key. It never sees your passwords or keys (see `AGENTS.md`).

Prefer doing it by hand? `GUIDE.md` is written for people who have never used a terminal.

## What's in here

| File | What it is |
|---|---|
| `GUIDE.md` | Every step, Gumroad (A) or Stripe (B), including testing with fake cards |
| `AGENTS.md` | The rules an agent follows here: never touch secrets, stop at every **YOU** step |
| `site/` | Your landing page goes here (the agent writes it) |
| `src/worker.js` | Stripe path only: the thank-you page, the file download, and the optional email |
| `scripts/add-webhook.sh` | Optional email add-on: creates the Stripe webhook without showing its secret |
| `wrangler.jsonc` | Cloudflare settings: name, domain, products |
| `.claude/skills/` | For the agent: tool install and login steps, and known dashboard click paths |

## What can go wrong, and what doesn't exist to go wrong

| If someone gets… | …they can | Mitigation |
|---|---|---|
| Your Gumroad, Stripe or Cloudflare login | Anything | 2FA on all of them and on your email (GUIDE step 1) |
| The Worker's Stripe key | Read orders and buyer emails | It's a read-only restricted key; delete it and make a new one |
| A buyer's thank-you link | Download the file for 30 days | `DOWNLOAD_DAYS`; refunded or disputed purchases are cut off |
| The Resend key (optional email add-on) | Send email as your domain | A sending-only key limited to one domain; delete it and make a new one |
| The webhook secret (optional email add-on) | Almost nothing | The Worker re-checks every purchase with Stripe before it emails |
| A server | Nothing: there isn't one | |

Don't update by blindly pulling and running a new version: read the diff first.
