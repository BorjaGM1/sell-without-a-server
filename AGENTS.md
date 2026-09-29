# Rules for the AI agent setting this up

You are helping a non-technical person sell a digital file from a static site on Cloudflare. Follow `GUIDE.md` in order. The person may never have used a terminal: explain each step in one plain sentence before you run it.

## Start: ask these first, in one message

Most people arrive with part of it done: a finished file, a landing page, a Gumroad product, a domain. Find out what exists before you plan anything, and skip the steps it covers.

1. What are you selling, for how much, and who is it for? What do you already have: the file, a cover image, a landing page (where?), a Gumroad or Stripe account or product, a domain?
2. Gumroad or Stripe, if they haven't chosen? Explain the trade-off in two lines (`GUIDE.md`, "Pick one"), and recommend Gumroad unless the fees matter to them.
3. No domain yet? Offer to search Cloudflare's **Register Domains** in Chrome for names that fit what they sell, and bring back a shortlist with prices. They choose and buy (`GUIDE.md` 3b). "Not now" is fine too.
4. Can I drive your browser (Claude in Chrome) for the dashboard steps? I'll stop at every password, card, and final Buy or Activate.
5. Mac or Windows? (It changes one command.)

If they already have a landing page, work with it: only the buy button (and, for C2, the form) has to change. If it's hosted elsewhere, only the Worker needs deploying (Stripe path); the landing can stay where it is.

Before each step that runs `wrangler` or `stripe`, check the tool is installed and logged in, and fix it if not (`.claude/skills/tools/SKILL.md`).

Then **go as far as you can on your own**. When you reach a **YOU** step, stop and give them a short numbered list of exactly what to click or type, and continue once they say it's done. Don't hand back work you could have done yourself.

## Never

- **Never see, print, store or paste a secret.** That includes API keys, passwords, 2FA codes, recovery codes and webhook secrets. Logins (`npx wrangler login`, `stripe login`) are run by the person in their own browser. Card numbers are theirs too, except Stripe's published test cards in a sandbox.
- **Keys go from the provider's copy button to Cloudflare through the clipboard, never through you.** In Chrome, click the page's own copy button (Stripe: **Copy and close**) by its label. Don't take a screenshot or read the page while a key is on screen. Then run `pbpaste | npx wrangler secret put <NAME>; pbcopy </dev/null`, or `Get-Clipboard | … ; Set-Clipboard -Value $null` on Windows. The value goes straight into the pipe without being printed. If this doesn't work (no copy button, the clipboard command fails, a different terminal), don't improvise: ask the person to run `npx wrangler secret put <NAME>` in their own terminal and paste it there themselves. The webhook secret is handled by `scripts/add-webhook.sh`: never print its creation response yourself.
- Never create a Stripe secret key (`sk_live_…`, `sk_test_…`) or any key with write permissions for the Worker. The Worker gets the read-only restricted key from `GUIDE.md` B5 and nothing else. The Resend key is **Sending access**, limited to the person's domain. In **live** mode, the person clicks **Create key**; in a sandbox you may, if they agreed at the start.
- Never put the product file in `site/`: everything there is public. It goes in the private R2 bucket, which the first `npx wrangler deploy` creates by itself.
- Never add a server, VPS or analytics script. The add-ons are in `GUIDE.md` section C, and each one is built only if the person says yes. If they ask for something else, explain what it would add to look after and let them decide.
- The last click on going live, buying a domain, or payout and bank settings is always theirs. Take them right up to it: open the page, fill in everything else, explain what each field means, and name the one button left.
- Never run `git pull` on this kit and then execute it without showing the person the diff first.

## End: offer the add-ons

Once the shop works end to end, and not before, offer the add-ons in one message, with one line each on what it gives and what it adds to look after:
- **C1. Email buyers their link.** Stripe path only; needs their own domain and a Resend account.
- **C2. Email signup form.** Either path. A free newsletter tool's own form is the alternative if they'd rather not keep the list themselves.

Follow `GUIDE.md` exactly for whichever they pick, including every protection. For C2, never ship the form without Turnstile unless they explicitly decline it after you explain what it's for, and always say on the page what people are signing up for.

## In the browser (Claude in Chrome)

Some steps have no CLI: Managed Payments terms, restricted keys, branding, finding and buying a domain, Turnstile, Resend, and most of Gumroad. The known click paths, with what's been tested, are in `.claude/skills/dashboards/SKILL.md`. Open the page, do what it says, and **hand over** for anything that asks for a password, 2FA, a card, bank details, legal identity, or a final Buy / Activate / Publish in live mode. Stripe's checkout has an "I am an AI agent acting on behalf of someone else" checkbox: when you're the one checking out, tick it.

If Chrome won't screenshot a page (it can refuse a domain it hasn't been given permission for), read its title and text instead, or check it with curl.

## Checking your work

- After a deploy, open the site in the browser, not just `curl`. A Worker route like `/thanks` only runs if `run_worker_first` covers it.
- Test purchases:
  - Stripe: in a sandbox, with the test card `4242 4242 4242 4242`.
  - Gumroad: buy your own product while logged in; it shows **Test card**.
  Say which one each time, so a real card never goes into a test.
- The Stripe CLI can print nothing when its output is piped. Write it to a file (`stripe … > out.json`) and read the file. Pass every parameter as `-d "key=value"`.
- A domain that was just added can look dead from this machine for a few minutes (local DNS cache). Check with `dig @1.1.1.1 <domain>` before changing anything.
