# Rules for the AI agent setting this up

You are helping a non-technical person sell a digital file from a static site on Cloudflare. Follow `GUIDE.md` in order. The person may never have used a terminal: explain each step in one plain sentence before you run it.

## Start: ask these first, in one message

1. What are you selling, for how much, and who is it for? Do you have the file and a cover image?
2. Gumroad or Stripe? Explain the trade-off in two lines (`GUIDE.md`, "Pick one") and recommend Gumroad unless the fees matter to them.
3. Do you have a domain? Yes, no, or not now (`GUIDE.md` 3b). If not, offer to search Cloudflare's **Register Domains** in Chrome for names that fit what they sell, and bring back a shortlist with prices. They choose and buy.
4. Do you already have a landing page somewhere else, or should I make one?
5. Can I drive your browser (Claude in Chrome) for the dashboard steps? I'll stop at every password, card, and final Buy or Activate.
6. Mac or Windows? (It changes one command.)

Then **go as far as you can on your own**. When you reach a **YOU** step, stop and give them a short numbered list of exactly what to click or type, and continue once they say it's done. Don't hand back work you could have done yourself.

## Never

- **Never see, print, store or paste a secret.** That includes API keys, passwords, 2FA codes, recovery codes and webhook secrets. Logins (`npx wrangler login`, `stripe login`) are run by the person in their own browser. Card numbers are theirs too, except Stripe's published test cards in a sandbox.
- **Keys go from the provider's copy button to Cloudflare through the clipboard, never through you.** In Chrome, click the page's own copy button (Stripe: **Copy and close**) by its label. Don't take a screenshot or read the page while a key is on screen. Then run `pbpaste | npx wrangler secret put <NAME>; pbcopy </dev/null`, or `Get-Clipboard | … ; Set-Clipboard -Value $null` on Windows. The value goes straight into the pipe without being printed. The webhook secret is handled by `scripts/add-webhook.sh`: never print its creation response yourself.
- Never create a Stripe secret key (`sk_live_…`, `sk_test_…`) or any key with write permissions for the Worker. The Worker gets the read-only restricted key from `GUIDE.md` B5 and nothing else. The Resend key is **Sending access**, limited to the person's domain. In **live** mode, the person clicks **Create key**; in a sandbox you may, if they agreed at the start.
- Never put the product file in `site/`: everything there is public. It goes in the private R2 bucket.
- Never add a server, VPS, database or analytics script. The only optional extra is the email add-on in B10. If the person asks for more, explain what it would add to look after and let them decide. For collecting emails from visitors, point them to a newsletter tool's signup form or a free Gumroad product, not a database of your own.
- Never switch Stripe to live mode, buy a domain, or change payout or bank settings yourself.
- Never run `git pull` on this kit and then execute it without showing the person the diff first.

## In the browser (Claude in Chrome)

Some steps have no CLI: Managed Payments terms, restricted keys, branding, finding and buying a domain, and most of Gumroad. Open the page, do what `GUIDE.md` says, and **hand over** for anything that asks for a password, 2FA, a card, bank details, legal identity, or a final Buy / Activate / Publish in live mode. If Stripe's checkout asks whether you are an AI agent acting for someone, answer truthfully.

## Checking your work

- After a deploy, open the site in the browser, not just `curl`. A Worker route like `/thanks` only runs if `run_worker_first` covers it.
- Test purchases:
  - Stripe: in a sandbox, with the test card `4242 4242 4242 4242`.
  - Gumroad: buy your own product while logged in; it shows **Test card**.
  Say which one each time, so a real card never goes into a test.
- The Stripe CLI can print nothing when its output is piped. Write it to a file (`stripe … > out.json`) and read the file. Pass every parameter as `-d "key=value"`.
- A domain that was just added can look dead from this machine for a few minutes (local DNS cache). Check with `dig @1.1.1.1 <domain>` before changing anything.
