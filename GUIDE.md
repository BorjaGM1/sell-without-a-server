# Sell a digital product from a static site

You end up with a landing page on Cloudflare (free), a buy button, and either Gumroad or Stripe taking the money, the tax and the receipts. No server to rent, patch or log into.

Steps marked **YOU** are yours: logins, cards, bank details, anything that asks for a password or a 2FA code. An agent (Claude Code, with Claude in Chrome for dashboard pages) can do everything else and should stop at every **YOU**. Tested end to end in a Stripe sandbox on 2026-09-29: purchase, download, refund (the link closes), free copy with a 100%-off code, and the three permissions of the read-only key. Add-on C1 (the email with the link, including a replayed webhook not sending twice) and C2 (the signup form and its abuse guards) were tested the same day.

## Pick one: Gumroad or Stripe

**I'd use Gumroad.** Make the product on Gumroad, put its link on your buy button, done. Gumroad is the *merchant of record*: it charges the buyer, works out and pays VAT and sales tax worldwide, hosts your file, emails the buyer a receipt with the download, and lets you email your customers later. You write no code.

**Stripe if you want lower fees**, and you're in a country where [Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments/eligibility) works (US, Canada, UK, most of the EU, Switzerland, Norway, Australia, Japan, Singapore, Hong Kong). Managed Payments makes Stripe the merchant of record too, so tax is handled. What Stripe doesn't do is host your file or send the buyer their download. This kit does both:
- The file sits in a private Cloudflare bucket.
- One small Worker checks the payment with a read-only key and serves the file.
- Emailing the link is an optional add-on (C1).

| On a $19 sale (US card) | Gumroad | Stripe + Managed Payments |
|---|---|---|
| Fees | 10% + $0.50, plus 2.9% + $0.30 processing ≈ **$3.25** | 2.9% + $0.30 processing, plus 3.5% ≈ **$1.52** |
| Tax (VAT / sales tax) | Gumroad | Stripe |
| Hosts the file | Gumroad | This kit: a private Cloudflare bucket |
| Gives the buyer the download | Gumroad: the download page, and an email with the link | This kit: a download page. The email with the link is optional (C1); Stripe's receipt doesn't include it |
| Code you run | None | One small Worker (`src/worker.js`, read it; most of it is the optional add-ons) |
| Setup | ~30 minutes | 1.5 to 2.5 hours in the sandbox. Going live adds Stripe's account review, which can take days |

Fees change: check [gumroad.com/pricing](https://gumroad.com/pricing) (Gumroad's card processing is on top, see [its fee page](https://gumroad.com/help/article/66-gumroads-fees)) and [stripe.com/pricing](https://stripe.com/pricing). Selling through Gumroad's Discover marketplace costs 30%.

---

## 1. Accounts (YOU)

- [Cloudflare](https://dash.cloudflare.com/sign-up), plus [Gumroad](https://gumroad.com) **or** [Stripe](https://dashboard.stripe.com/register).
- Turn on **2FA** on every one of them, and on the email they log in with. That is the most important security step in this guide: with this setup there is no server to break into, so your accounts are the only way in.
- The tools the kit uses, [Node.js](https://nodejs.org), Cloudflare's `wrangler` and, for Stripe, the [Stripe CLI](https://docs.stripe.com/stripe-cli): your agent checks them and installs whatever is missing, right before the step that needs it. It also checks you're logged in; when you aren't, it runs the login and you click **Allow** in the browser. (Doing it by hand? `.claude/skills/tools/SKILL.md` has the commands.)

## 2. The landing page

One page in `site/`: `index.html` plus its images. Tell the agent what you sell, the price, who it's for, and give it a cover image; it writes the page. Or skip this if you already have a page somewhere else (Carrd, Framer, your blog): all it needs is a buy button.

The page's rules:
- The buy button is a plain link to your Gumroad product or Stripe Payment Link (steps A2 and B6). While you don't have it yet, use `#`.
- Everything in `site/` is public. **Never put the product file in `site/`.**
- The footer has a contact email and your refund policy (see "Legal basics").
- No trackers, and no forms or scripts that aren't needed (the one exception is the signup form, add-on C2). The page sells; Gumroad or Stripe does everything else.

## 3. Put it online (Cloudflare)

```bash
npm install                 # once: installs wrangler, Cloudflare's tool
npx wrangler whoami         # are you logged in? If not:
npx wrangler login          # YOU: a browser window opens, log in and click Allow
```

In `wrangler.jsonc`, give the shop a short name (lowercase, dashes) and use it for `"name"` and for `"bucket_name"` (`<name>-files`). Put your contact email in `"SUPPORT_EMAIL"`. If `wrangler whoami` lists more than one Cloudflare account, add `"account_id": "<the one you want>"`. Then:

```bash
npx wrangler deploy
```

It prints your address, `https://<name>.<you>.workers.dev`. On a brand-new Cloudflare account it first asks you to pick your `workers.dev` subdomain (once, forever). Open it. Every change to `site/` is another `npx wrangler deploy`.

**3b. Your domain.** The agent asks you at the start, because the Stripe link (B6) and the email add-on (C1) are built on your final address, and changing it later means redoing them. It asks whether you already have a domain:
- **No.** Buy it on Cloudflare. The agent offers to drive Chrome: Cloudflare dashboard → **Domain Registration → Register Domains**. It searches names based on what you sell and shows you a shortlist with the yearly price of each. It looks for names that are short, easy to say out loud and to spell, with no hyphens, and `.com` first. Cloudflare sells at cost and doesn't raise the price at renewal, and WHOIS privacy is free. **YOU** pick one and buy it: the agent stops before the card, the contact details and the Purchase button.
- **Yes, bought somewhere else** (GoDaddy, Namecheap…). Move it to Cloudflare, where renewals cost what Cloudflare pays for them, with nothing on top. The agent walks you through it:
  1. Cloudflare → **Add a domain** (Free plan). **YOU** change the nameservers at your current registrar to the two Cloudflare shows. This alone is enough for the kit to work, and takes minutes to a few hours.
  2. Then **Domain Registration → Transfer Domains**. **YOU** unlock the domain and get its auth code at the old registrar. You pay one year at Cloudflare's price, and it's added to your registration. A domain bought or moved in the last 60 days has to wait.
- **Not now.** The `workers.dev` address works for everything except the email add-on (C1). Stripe's link can be remade later.

Then the agent puts the domain in the `"routes"` line of `wrangler.jsonc` and deploys again. A brand-new domain can take a few minutes to answer. If it looks dead from your computer but `dig @1.1.1.1 yourdomain.com` shows an address, it's your computer's DNS cache, not the site.

**3c. Your shop's email (optional, needs your domain).** It gives you an address like `hello@yourdomain.com` that lands in the inbox you already use. It's free and takes 2 minutes; the agent can do it in Chrome.
1. Cloudflare → your domain → **Email → Email Routing** → enable it. Cloudflare adds the DNS records itself.
2. Add your real inbox as a destination (**YOU**: click the confirmation email Cloudflare sends there).
3. Send `hello@` (or a catch-all, so any address works) to that inbox.
4. Put that address in `"SUPPORT_EMAIL"` and in your page's footer, and send it a test email.

It only *receives*: if you reply from Gmail, the buyer sees your Gmail address. To reply as `hello@yourdomain.com`, and only if you set up Resend (add-on C1):
- In Resend, make one more **Sending access** key, just for Gmail.
- In Gmail: **Settings → Accounts and Import → Send mail as → Add another email address**.
  - Server `smtp.resend.com`, port `465` (SSL)
  - Username `resend`
  - Password: that key, pasted by you
- To stop, delete the key in Resend.

Now do **A** (Gumroad) or **B** (Stripe).

---

## A. Gumroad

**A1. Payouts first (YOU).** Gumroad → **Payouts**: connect your bank account or PayPal. Gumroad won't publish any product, not even a free one, until this is done.

**A2. The product (the agent can do it in Chrome, except the last click).**
1. Gumroad → **Products → New product**. Enter the name, pick **E-book** for a PDF (or **Digital product** for anything else), set the price, and click **Next: Customize**.
2. Add the description and cover, then **Save and continue**.
3. On **Content**, upload your file.
4. **Publish and continue** (YOU).

You don't configure tax: Gumroad does it.

**A3. The button.** Copy the product's link (`https://<you>.gumroad.com/l/<id>`) into the buy button's `href` in `site/index.html`. Then check it and deploy:
```bash
node scripts/check-buy-links.mjs    # every buy button must point at a real checkout
npx wrangler deploy
```
The script can't see inside a Gumroad page, so it also asks you to open the link in a private window, logged out. You must see the price and the buy button: an unpublished product loads fine but can't be bought.
Optional: add `<script src="https://gumroad.com/js/gumroad.js"></script>` to the page, and the checkout opens as an overlay on your page instead of on a new page.

**A4. Test it.** While **logged in to Gumroad**, open your own product and buy it: the payment method shows **Test card** and nothing is charged. You get the sale email and the buyer email, and can check the download. A 100%-off discount code also works.
⚠️ **Never buy your own product with a real card.** Gumroad may treat it as fraud and suspend the account.

That's it. Emails: Gumroad already sends the buyer the receipt and the download, and **Emails** in Gumroad lets you write to your customers later. For people who aren't buying yet, a free ($0) Gumroad product works as a lead magnet: they leave their email to get it.

`wrangler.jsonc` has a Stripe section you can leave as it is: on the Gumroad path `/thanks` and `/download` just answer "not set up yet". The first deploy also creates an empty private storage bucket, which costs nothing.

---

## B. Stripe with Managed Payments

Everything is done in a **sandbox** (fake money) first, then repeated live in B8.

**B1. Sandbox and CLI (YOU).**
- Stripe Dashboard → the account menu (top left) → **Sandboxes → Create**.
- If your Stripe CLI is v1.50 or newer, an account admin first allows it: **Settings → Team and security → MCP and CLI access**.
- Don't upgrade the Stripe CLI in the middle of setup: from v1.50 an account admin must first allow it (next line).
- `stripe whoami` shows whether you're logged in, and to which account. If not: `stripe login`, and pick the sandbox in the browser window that opens. The login lasts about 90 days.

**B2. Turn on Managed Payments (YOU, or the agent in Chrome).** In the sandbox: [Settings → Managed Payments](https://dashboard.stripe.com/settings/managed-payments), accept the terms.

**B3. Product and price.** Managed Payments only accepts digital products with an eligible tax code: `txcd_10302000` for an ebook, `txcd_10503000` for another downloadable document. If yours is something else, look it up in [Stripe's tax codes](https://docs.stripe.com/tax/tax-codes); Stripe refuses one that isn't eligible.

```bash
stripe products create -d "name=My Product" -d "tax_code=txcd_10302000"
stripe prices create -d "product=prod_..." -d "unit_amount=1900" -d "currency=usd"   # 1900 = $19.00
```

Use `-d "key=value"` for every parameter: some Stripe CLI versions misread `--flag true`.

**B4. Upload the file (private).** Put it in `private/` (git ignores that folder), then:

```bash
npx wrangler r2 object put my-shop-files/my-product.pdf --file private/my-product.pdf --content-type application/pdf --remote
```

`my-shop-files` is the bucket name in `wrangler.jsonc`: if the bucket doesn't exist yet, run `npx wrangler deploy` once first and it is created. The file is only reachable through `/download`, after a paid checkout.

**B5. The read-only key.** This is the Worker's only secret, and it can only *read*. The agent can do all of it in Chrome, and the key never passes through the chat.
1. Dashboard (still in the sandbox) → **Developers → API keys → Create secret key**.
2. **Build your own integration** → **Custom permissions**. Use the search box to set three permissions to **Read**: **Checkout Sessions**, **Payment Intents**, **Charges and Refunds**. Leave everything else at **None**.
3. Name it `download-worker`, then **Create key**.
4. Click **Copy and close**, so the key is on your clipboard and not on screen. Then send it from the clipboard to Cloudflare, and empty the clipboard:
   - Mac: `pbpaste | npx wrangler secret put STRIPE_READ_KEY; pbcopy </dev/null`
   - Windows (PowerShell): `Get-Clipboard | npx wrangler secret put STRIPE_READ_KEY; Set-Clipboard -Value $null`
   - If you're clicking and the agent runs the command: click **Copy and close**, copy nothing else, and tell the agent "copied". It runs the command straight away.
5. Don't save the key anywhere else. If you ever need it again, make a new one, and expire the old one (**⋯ → Expire key**).

**B6. The Payment Link.** (It doesn't need the key from B5, so it can be done while you wait on that.) It sends the buyer to your `/thanks` page after paying. Use your workers.dev address or your domain:

```bash
stripe payment_links create --stripe-version 2026-04-22.dahlia \
  -d "line_items[0][price]=price_..." -d "line_items[0][quantity]=1" \
  -d "managed_payments[enabled]=true" \
  -d "allow_promotion_codes=true" \
  -d "after_completion[type]=redirect" \
  -d "after_completion[redirect][url]=https://YOUR-SITE/thanks?session_id={CHECKOUT_SESSION_ID}"
```

Type `{CHECKOUT_SESSION_ID}` exactly as it is: Stripe fills it in. The answer has an `id` (`plink_...`) and a `url` (`https://buy.stripe.com/...`).
- Put the `plink_...` id in `PRODUCTS` in `wrangler.jsonc`, with all three fields:
  - `file`: the name in the bucket, from B4
  - `name`: the file name the buyer's computer saves, for example `Sourdough-for-Busy-People.pdf`
  - `title`: what the thank-you page calls it
- If creating the link fails with an error about Managed Payments, the terms from B2 aren't accepted yet.
- Put the `https://buy.stripe.com/...` url on the buy button.
- `node scripts/check-buy-links.mjs --site https://YOUR-SITE` asks Stripe whether each buy button's link is active, has Managed Payments on, sends buyers to your `/thanks`, and is listed in `PRODUCTS`. Fix whatever it reports.
- `npx wrangler deploy`.

(In the Dashboard instead: **Payment Links → New**, tick **Enable Managed Payments**, and under **After payment** choose to redirect to that same URL. Managed Payments can't be switched on for a link that already exists: make a new one.)

**B7. Test it (sandbox, fake money).** On your site, click Buy and pay with:

| Card | What happens |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Declined |
| `4000 0027 6000 3184` | Asks for 3D Secure (approve it in the pop-up) |

Any future expiry date, any CVC, any postcode. You should land on **Thank you → Download** and get the file. Then check the ways it should refuse:
- **Refund** the test payment in the Dashboard. The same thank-you link now says the purchase was refunded.
- **Free copies:** make a 100%-off promotion code and check out with it. The download works, with no card:
  ```bash
  stripe coupons create -d "percent_off=100" -d "duration=once" -d "name=Free copy"
  stripe promotion_codes create -d "promotion[type]=coupon" -d "promotion[coupon]=<the coupon id>" -d "code=FREECOPY"
  ```
  Stripe still asks for a name and a billing address, because tax depends on where the buyer is.
- The sandbox doesn't send receipt emails by itself: you can send one from the payment's page.

If the thank-you page says "paused", the key or one of its three permissions is wrong (redo B5). If it says "not valid", the `plink_...` in `PRODUCTS` doesn't match the link you bought through. `npx wrangler tail` shows the Worker's log live while you retry.

**B8. Go live (YOU for the account; the agent can do the rest).**
1. Activate your Stripe account (business details, bank account), and accept Managed Payments in **live** mode too.
2. `stripe login` again, this time choosing the live account.
3. Redo B3 and B6 with `--live` added to each command, and redo B5 in live mode (the key starts `rk_live_`).
4. Replace the sandbox `plink_...` in `PRODUCTS` and the button's link with the live ones. Run `node scripts/check-buy-links.mjs --live --site https://YOUR-SITE`: it fails if any sandbox link is left. Deploy.
5. Buy it once with your own real card, check the download, and refund yourself from the Dashboard.

**B9. When a buyer loses the link.** They write to you. You (or the agent) run:

```bash
stripe checkout sessions list --live -d "customer_details[email]=buyer@example.com"
```

and send them `https://YOUR-SITE/thanks?session_id=<the cs_live_... id>`. It works for `DOWNLOAD_DAYS` (30) after the purchase; for an older one, send the file by hand. Or add C1, so it doesn't happen.

---

## Day to day

- **New version of the file.**
  - Gumroad: upload it on the product's **Content** tab. Existing buyers get it in their library.
  - Stripe: upload it again under the same name (B4). Every current download link serves the new file.
- **New price.**
  - Gumroad: change it on the product.
  - Stripe: a link's price can't be changed.
    1. Make a new price and a new Payment Link (B3, B6).
    2. Put the new `plink_...` in `PRODUCTS`, but **keep the old entry too**, so people who bought through it can still download.
    3. Put the new link on the button, run the check, and deploy.
    4. Deactivate the old link in Stripe.
- **A second product.**
  - Gumroad: a new product and its own button.
  - Stripe: B3, B4 and B6 again, one more entry in `PRODUCTS`, a second button, then the check and a deploy.
- **Changed the page?** Run `node scripts/check-buy-links.mjs` before every deploy.
- **Sales, refunds, buyers:** all in the Gumroad or Stripe dashboard. The kit keeps no records of its own.

## Several shops, one backend

Selling more than one product, each with its own site and domain? You don't need one of everything per shop. The layout:
- **One "shop" domain** (for example `shop.yourbrand.com`, or a domain of its own) runs this kit's Worker: `/thanks`, `/download` and, with C1, the webhook and the emails.
- `PRODUCTS` lists every product's Payment Link.
- One bucket holds all the files.
- One Stripe account, and one Resend domain (Resend's free plan allows one).
- **Each shop's site** is a plain static site on its own domain. It's a second Cloudflare project with only `name`, `assets` and `routes`, and no code. Its buy buttons are the Payment Links, and every link redirects to `https://<shop domain>/thanks?...`.
- **Email:** Cloudflare Email Routing forwards each domain's address (hello@, support@) to your inbox, free.

**What's shared, and visible:**
- Every checkout shows your one Stripe business name.
- Every download email comes from the shop domain.
- Buyers see the shop domain on the thank-you page.
If you want each brand fully separate, run a separate copy of the kit per brand instead.

**Checking:** run `node scripts/check-buy-links.mjs --site https://<shop domain>` in each site's folder (copy `scripts/` over). It confirms every button's link returns buyers to the shop domain.

## Legal basics (not legal advice)

The merchant of record (Gumroad, or Stripe with Managed Payments) is the seller in the buyer's eyes for the payment. It handles the checkout terms, tax, invoices and the EU rules on buying digital content. You still need a few things on your page:
- **A way to reach you**, and **your refund policy**, in the footer. Stripe also looks for these when it reviews your account for going live.
- **Your legal name and address**, in countries that require it on commercial sites, such as Germany and Austria (an *Impressum*).
- **A privacy note** saying what you collect and why, if you add the signup form (C2) or anything else that stores personal data. Without C2 the page stores nothing, but a one-line note ("this site has no cookies and no tracking") is still good practice.

The agent can write these from your answers. Have them checked if your situation is unusual.

---

## C. Optional add-ons

The agent offers these once your shop works, not before. Each one adds something to look after, so take only what you'll use.

### C1. Email buyers their link (Stripe path)

**Recommended on the Stripe path.** Buyers expect an email with their purchase. It carries the download *link*, not the file: attachments land in spam more often, and an emailed file can't be taken back after a refund.

Stripe's receipt doesn't include the download, so a buyer who closes the tab has to write to you. This add-on emails them the thank-you link right after they pay, through [Resend](https://resend.com) (free up to 3,000 emails a month, 100 a day). It needs **your own domain** (step 3), and adds two secrets: a Stripe webhook secret and a Resend key that can only send.
1. **YOU:** make a Resend account and turn on 2FA. **Domains → Add domain**, and enter your domain. Resend shows a few DNS records: let it add them to Cloudflare if it offers to, or add them yourself in Cloudflare → your domain → **DNS**. Wait until Resend says **Verified**.
2. **YOU (the agent can drive Chrome):** Resend → **API Keys → Create API key**. Permission **Sending access**, domain **only yours**. Create it, copy it with Resend's copy button, and send it the same way as in B5: `pbpaste | npx wrangler secret put RESEND_API_KEY; pbcopy </dev/null` (on Windows, the `Get-Clipboard` version).
3. In `wrangler.jsonc`, set `"EMAIL_FROM": "Your Shop <orders@yourdomain.com>"` (any name @ your verified domain). Deploy.
4. `scripts/add-webhook.sh https://yourdomain.com` creates the Stripe webhook and stores its secret without showing it.
5. Test with a sandbox purchase (B7), using an email address you can read: the email arrives within a minute. **Stripe → Developers → Webhooks** shows each delivery. If one failed, Stripe retries it for three days.
6. When you go live (B8): run `scripts/add-webhook.sh https://yourdomain.com --live`. The Resend key stays the same.

The Worker doesn't trust what the webhook says: it asks Stripe about the purchase again with the read-only key, and emails the address Stripe has for it. A forged webhook can't make it send anything.

### C2. Email signup form (either path)

A "get notified" form on your page, for people who aren't buying yet. The emails go into a private Cloudflare database (D1, free at this size), and you download them as a CSV whenever you want to write to them.

It collects; it doesn't send. When you're ready to email your list, import the CSV into a newsletter tool (Buttondown, Kit, MailerLite…). That tool handles the unsubscribe links, bounces and the legal footer you'd otherwise have to build. If you'd rather use one of those tools from day one, put its own signup form on your page and skip this add-on.

**How it keeps abusers out:**
- **Cloudflare Turnstile** (free, no cookies, usually invisible to people) stops bots. The Worker checks every sign-up with Cloudflare, so a script that skips the check gets nothing in.
- **A hidden honeypot field** that people never see and bots fill in. Those sign-ups are dropped silently.
- **Same-site only:** another website can't post its visitors into your list.
- **An hourly cap** (100 by default, `SUBSCRIBE_HOURLY_CAP`): a flood can't fill your database, it only pauses sign-ups until the hour rolls over.
- **The same answer every time**, whether an email was new or already there, so nobody can use the form to find out who's on your list.

**Setting it up:**
1. In `wrangler.jsonc`, remove the `//` in front of the `"d1_databases"` line, then `npx wrangler deploy`. The deploy creates the database.
2. `npx wrangler d1 migrations apply SUBSCRIBERS --remote` creates the table.
3. **Turnstile (the agent can drive Chrome):** Cloudflare → **Turnstile → Add widget**.
   - Name it after your shop, add your domain (and the `workers.dev` address while you test), and choose mode **Managed**.
   - You get a *site key*, which is public and goes in the form, and a *secret key*. Copy the secret key with its copy button and run `pbpaste | npx wrangler secret put TURNSTILE_SECRET; pbcopy </dev/null`.
4. The agent adds the form to your page:
   ```html
   <form method="post" action="/subscribe">
     <label for="email">Get an email when the next one is out</label>
     <input id="email" name="email" type="email" required maxlength="254" autocomplete="email">
     <input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
     <div class="cf-turnstile" data-sitekey="YOUR-SITE-KEY"></div>
     <button>Notify me</button>
     <p>One email when there's something new. Unsubscribe any time.</p>
   </form>
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
   ```
   Say plainly what people are signing up for: that sentence is their consent. Add a line to your page's footer, for example: "If you sign up, we store your email address to write to you about [what]. Ask us and we'll delete it."
5. Deploy, and test it: sign up with your own address, then sign up again with it. Both times you see "You're on the list", and the list has you once.

**Using it:**
- Download the list: `scripts/export-subscribers.sh` writes `private/subscribers.csv`. Import it into your newsletter tool, then delete the file: it's people's personal data.
- Someone asks to be removed:
  `npx wrangler d1 execute SUBSCRIBERS --remote --command "DELETE FROM subscribers WHERE email = 'their@email.com'"`
  and remove them from the newsletter tool too.
- How many signed up: `npx wrangler d1 execute SUBSCRIBERS --remote --command "SELECT count(*) FROM subscribers"`

---

## Keeping it safe

- **2FA everywhere** (step 1). There is no server to hack, so an attacker goes after your accounts.
- **The one secret** is the read-only Stripe key, stored as a Cloudflare secret. With it, someone could read your orders and buyers' emails, but not charge, refund, change products or move money. If you suspect it leaked, delete it in Stripe and redo B5.
- **With C1**, two more secrets. The Resend key can only send email, but it can send it *as your domain*, which makes it useful for phishing your buyers. If you suspect a leak, delete it in Resend and make a new one. The webhook secret is close to worthless on its own (see C1).
- **Your CLI logins are the most powerful keys in this setup.** `stripe login` leaves a *full-access* key on your computer (you'll see it in the Dashboard as "CLI key for <your computer>"), and `wrangler login` can change anything on Cloudflare. Log out when you're done: `stripe logout`, `npx wrangler logout`.
- **Links can be shared.** A buyer can pass their thank-you link to a friend for 30 days. Lower `DOWNLOAD_DAYS` if that matters to you; Gumroad has the same trade-off.
- **With C2**, your list is personal data in your Cloudflare account: it's as safe as that login, and the CSV you export is as safe as your computer. Delete exports once imported.
- **Updating this kit:** don't blindly pull a newer version and run it (or let an agent do so). Look at what changed first (`git diff`), especially `src/worker.js`.
