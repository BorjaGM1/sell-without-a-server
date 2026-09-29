---
name: dashboards
description: Known click paths for the dashboard steps that have no CLI (Stripe restricted keys, Managed Payments, branding, going live; Cloudflare domain search, purchase and transfer, Turnstile; Resend domain and key; Gumroad product, test purchase, payouts). Use when driving the browser with Claude in Chrome for any GUIDE.md step, or when telling the person exactly what to click.
---

# Dashboards: known click paths

✅ means walked through end to end on 2026-09-29. The others come from the providers' docs: expect small label differences, and read the page before clicking. Dashboards may be in the person's language (Stripe showed Spanish labels), so match by meaning.

**Stop and hand over** for:
- passwords, 2FA, cards, bank details, legal identity
- the final Buy, Activate or Publish in live mode

Before handing over, get them as close as you can: open the page and fill in everything else. Then say exactly which field or button is left.

## Stripe

- **Sandbox:** the account switcher (top left) → **Sandboxes → Create**.
- **Managed Payments terms:** open `dashboard.stripe.com/settings/managed-payments` in the sandbox, and again in live mode, and accept. Accepting terms is the person's click.
- **Read-only key** ✅
  - Direct URL: `dashboard.stripe.com/test/apikeys/create?type=restricted`. For live, drop `test/`; the person clicks Create there.
  - Steps:
    1. **Build your own integration** → Continue.
    2. **Custom permissions** → Continue.
    3. Use the search box to set three permissions to **Read**. If the name doesn't match, search the endpoint instead (`payment_intents`, `/v1/charges`).
       - **Checkout Sessions**
       - **Payment Intents**
       - **Charges and Refunds**
    4. Continue: the summary must say "3 permissions, 3 read".
    5. Name it `download-worker` → **Create key**.
    6. Find the **Copy and close** button by its label and click it. Take no screenshot while the key is on screen.
    7. Run the clipboard pipe from `AGENTS.md`.
  - If a "leave without saving?" box appears (it happens when the window resizes), choose **keep editing**.
- **Delete a key** ✅: API keys → **⋯** on its row → **Expire key** → confirm.
- **Branding** (so the checkout looks like their shop): Settings → **Branding** → icon, logo, brand colour. The person can pick; the agent can upload the cover or logo from the kit folder.
- **Go live:** Dashboard → **Activate payments** (or "Complete your profile"). It asks for business details, identity and bank account, so it's all the person's. The agent can open it and explain each section. After that, repeat Managed Payments terms and the read-only key in live mode.
- **Webhooks** (C1): Developers → **Webhooks** shows each delivery and lets you resend one.

## Cloudflare

- **Find a domain:**
  1. Dashboard → **Domain Registration → Register Domains**.
  2. Search 5 to 10 names built from what they sell: short, easy to say and spell, no hyphens, `.com` first.
  3. Bring back a table of name, available or not, and price per year.
  4. They pick. You fill the cart; they enter the contact details and card and click **Purchase**.
  - Cloudflare charges at cost, renewals included, and WHOIS privacy is free.
- **Move a domain from another registrar** (recommended, same at-cost pricing):
  1. First the domain has to be on Cloudflare: **Add a domain** (Free plan), and they change the nameservers at the old registrar to the two Cloudflare shows.
  2. Then **Domain Registration → Transfer Domains**. They get the auth code from the old registrar and unlock the domain there. It costs one year at cost and adds a year to the registration.
  - A domain bought or transferred in the last 60 days can't be moved yet. Step 1 is enough in the meantime.
- **Turnstile** (C2):
  1. **Turnstile → Add widget**. Name it after the shop.
  2. Hostnames: their domain, plus the `workers.dev` address while testing. Mode: **Managed**.
  3. The *site key* is public and goes in the form's `data-sitekey`.
  4. Copy the *secret key* with its copy button, then run the clipboard pipe into `TURNSTILE_SECRET`.
  - For tests, Cloudflare's public test secrets are `1x0000000000000000000000000000000AA` (always passes) and `2x0000000000000000000000000000000AA` (always fails), with the token `XXXX.DUMMY.TOKEN.XXXX`. Never leave a test secret on a live site.
- **Email to their domain** (the footer's contact address): their domain → **Email → Email Routing** → enable → add their real inbox as the destination → catch-all.

## Resend (C1)

If an existing key shows **Full access** and is used only to send, suggest replacing it with a Sending-access key limited to the domain.

- **Domain:** **Domains → Add domain**.
  - If it offers to configure Cloudflare automatically, let it; the person approves the Cloudflare prompt.
  - Otherwise, add the records it lists in Cloudflare → the domain → **DNS**.
  - Wait until it says **Verified**.
- **Key** ✅: **API keys → Create API key**.
  - Name; Permission **Sending access**; Domain: only theirs → **Add**.
  - The key is shown once: click the **Copy to clipboard** button by its label, then run the clipboard pipe.
- **Delete a key** ✅: API keys → **More actions** on its row → **Delete API key**, then type the key's name to confirm.
- **Check an email went out** ✅: **Emails** lists each one with its status (Delivered, Bounced…). Open one and pick **Plain Text** to see the body and the link.

## Gumroad

- **Product:** **Products → New product** → **Digital product**, then name and price.
  - Upload the file as the content, add the description and cover, and **Publish**.
  - The agent can fill all of this from what they told you at the start. Publishing is theirs.
- **Test purchase:** while logged in, open the product page and buy it; the payment method shows **Test card**. Never with a real card: Gumroad may suspend the account.
- **Payouts:** Settings → **Payments**. Bank or PayPal details are the person's.
- **Buy button:** the product's share link (`https://<user>.gumroad.com/l/<id>`) goes in the page's button.
