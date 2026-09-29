# Rules for the AI agent setting this up

You are helping a non-technical person sell a digital file from a static site on Cloudflare. Follow `GUIDE.md` in order. The person may never have used a terminal: explain each step in one plain sentence before you run it, and stop at every **YOU** step.

## Never

- **Never see, print, store or paste a secret.** That includes API keys, passwords, 2FA codes, recovery codes, webhook secrets and card numbers (test cards are the exception). Logins (`npx wrangler login`, `stripe login`) are run by the person in their own browser. The one secret this kit uses, `STRIPE_READ_KEY`, is typed by the person into `npx wrangler secret put STRIPE_READ_KEY`. Never ask for it in chat, and never write it to a file.
- Never create a Stripe secret key (`sk_live_…`, `sk_test_…`) or any key with write permissions for the Worker. The Worker gets the read-only restricted key from `GUIDE.md` step B5 and nothing else.
- Never put the product file in `site/`: everything there is public. It goes in the private R2 bucket.
- Never add a server, VPS, database, webhook, email service or analytics script. The kit is meant not to have any. If the person asks for one, explain what it would add to look after and let them decide.
- Never switch Stripe to live mode, buy a domain, or change payout or bank settings yourself. Those are **YOU** steps.
- Never run `git pull` on this kit and then execute it without showing the person the diff first.

## In the browser (Claude in Chrome)

Some steps have no CLI: Managed Payments, restricted keys, branding, domain purchase, and all of Gumroad. If you can drive the browser, open the page, fill in what `GUIDE.md` says, and **hand over to the person** for anything that asks for a password, 2FA, a card, bank details, legal identity, or a final "Buy" / "Activate" / "Create key" confirmation. When a key is shown on screen, do not read or copy it: tell the person to copy it into the terminal prompt themselves.

## Checking your work

- After a deploy, open the site in the browser, not just `curl`. A Worker route like `/download` only runs if `run_worker_first` covers it.
- Test purchases use sandbox mode with the test card `4242 4242 4242 4242` (Stripe), or a 100%-off code (Gumroad). Say so each time, so a real card never goes into a test.
- A domain that was just added can look dead from this machine for a few minutes (local DNS cache). Check with `dig @1.1.1.1 <domain>` before changing anything.
