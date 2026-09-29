#!/usr/bin/env node
// Checks that every buy button in site/ leads to a real, working checkout. Run it after every change to the page
// and before going live:
//   node scripts/check-buy-links.mjs              (sandbox links allowed)
//   node scripts/check-buy-links.mjs --live       (going live: sandbox links are an error)
//   node scripts/check-buy-links.mjs --site https://yourdomain.com   (also check Stripe sends buyers back here)
// Stripe links are checked with Stripe itself (needs the Stripe CLI, logged in). A Gumroad page can't be checked
// from a script (it renders in the browser), so for those it prints what to confirm by opening the link.
import { readFileSync, readdirSync, statSync, writeFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const SITE = (args[args.indexOf("--site") + 1] || "").replace(/\/$/, "");
const problems = [], todo = [];
const bad = (m) => problems.push(m), ask = (m) => todo.push(m);

// Every link in every .html page under site/
const pages = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") && pages.push(p); } })("site");
if (!pages.length) bad("No .html page in site/. (If your landing page lives elsewhere, check its buy button by hand.)");
const links = [];
for (const p of pages) {
  const html = readFileSync(p, "utf8");
  if (/BUY_LINK|plink_REPLACE_ME/.test(html)) bad(`${p}: a placeholder (BUY_LINK) is still in the page.`);
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    links.push({ page: p, href: m[1].trim(), text });
    if (/\b(buy|purchase|order|checkout|get it|comprar)\b/i.test(text) && /^(#.*|)$/.test(m[1].trim())) {
      bad(`${p}: the button "${text}" has no link yet (href="${m[1]}").`);
    }
  }
}
for (const p of pages) if (/you@example\.com/.test(readFileSync(p, "utf8"))) bad(`${p}: still shows you@example.com: put your real contact email.`);
const stripeLinks = links.filter((l) => /^https:\/\/buy\.stripe\.com\//.test(l.href));
const gumroadLinks = links.filter((l) => /^https:\/\/([\w-]+\.)?gumroad\.com\/l\/[\w-]+/.test(l.href));
if (pages.length && !stripeLinks.length && !gumroadLinks.length) {
  bad("No checkout link found in site/: a Stripe Payment Link (https://buy.stripe.com/...) or a Gumroad product (https://<you>.gumroad.com/l/...).");
}

// Stripe: ask Stripe about each link
if (stripeLinks.length) {
  const conf = readJsonc("wrangler.jsonc");
  const products = (conf.vars && conf.vars.PRODUCTS) || {};
  if (!conf.vars || !conf.vars.SUPPORT_EMAIL || /example\.com/.test(conf.vars.SUPPORT_EMAIL)) bad("SUPPORT_EMAIL in wrangler.jsonc is still a placeholder: buyers would be told to write to it.");
  const modes = LIVE ? ["--live"] : [...new Set(stripeLinks.map((l) => (/\/test_/.test(l.href) ? "" : "--live")))];
  const known = {};
  for (const mode of modes) {
    const out = join(tmpdir(), `plinks${mode}.json`);
    try { execSync(`stripe payment_links list -d limit=100 ${mode} > "${out}" 2>&1`, { stdio: "ignore" }); } catch {}
    let d = {};
    try { const t = readFileSync(out, "utf8"); d = JSON.parse(t.slice(t.indexOf("{"))); } catch {}
    rmSync(out, { force: true });
    if (!d.data) { bad(`Couldn't ask Stripe about ${mode ? "live" : "sandbox"} links (is the Stripe CLI installed and logged in? \`stripe whoami\`)`); continue; }
    for (const pl of d.data) known[pl.url] = pl;
  }
  for (const l of stripeLinks) {
    const where = `${l.page}: ${l.href}`;
    if (LIVE && /\/test_/.test(l.href)) { bad(`${where} is a sandbox (test) link. Replace it with the live one before going live.`); continue; }
    const pl = known[l.href];
    if (!pl) { if (Object.keys(known).length) bad(`${where} is not a Payment Link in this Stripe account (${/\/test_/.test(l.href) ? "sandbox" : "live"}).`); continue; }
    if (!pl.active) bad(`${where} is deactivated in Stripe.`);
    if (!(pl.managed_payments && pl.managed_payments.enabled)) bad(`${where} doesn't have Managed Payments on, so tax isn't handled. Make a new link with it (GUIDE.md B6).`);
    const r = pl.after_completion && pl.after_completion.type === "redirect" && pl.after_completion.redirect.url;
    if (!r || !/\/thanks\?session_id=\{CHECKOUT_SESSION_ID\}$/.test(r)) bad(`${where} doesn't send buyers to /thanks?session_id={CHECKOUT_SESSION_ID} after paying, so they won't get the file (GUIDE.md B6).`);
    else if (SITE && !r.startsWith(SITE + "/")) bad(`${where} sends buyers to ${r}, not to ${SITE}.`);
    if (!products[pl.id]) bad(`${where} is ${pl.id}, which isn't in PRODUCTS in wrangler.jsonc: buyers would pay and get "link not valid".`);
    if (!LIVE && /\/test_/.test(l.href)) ask(`${l.href} is a sandbox link: fine for testing, replace it before going live.`);
  }
}

// Gumroad: format and reachability here, the rest in a browser
for (const l of gumroadLinks) {
  let status = 0;
  try { status = (await fetch(l.href, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } })).status; } catch {}
  if (status !== 200) bad(`${l.page}: ${l.href} answers ${status || "nothing"}: the product doesn't exist or the link is mistyped.`);
  else ask(`Open ${l.href} in a browser, logged OUT of Gumroad (a private window): the product page must show its price and the buy button ("I want this!"). An unpublished product looks fine to a script but can't be bought.`);
}

for (const t of todo) console.log("• " + t);
if (problems.length) { for (const p of problems) console.log("✗ " + p); process.exit(1); }
console.log(`✓ ${stripeLinks.length + gumroadLinks.length} checkout link(s) OK${todo.length ? " (see the notes above)" : ""}.`);

function readJsonc(path) {
  const s = readFileSync(path, "utf8"); let out = "", i = 0, str = false;
  while (i < s.length) {
    const c = s[i], n = s[i + 1];
    if (str) { out += c; if (c === "\\") { out += n; i += 2; continue; } if (c === '"') str = false; i++; continue; }
    if (c === '"') { str = true; out += c; i++; continue; }
    if (c === "/" && n === "/") { while (i < s.length && s[i] !== "\n") i++; continue; }
    if (c === "/" && n === "*") { i = s.indexOf("*/", i + 2) + 2; continue; }
    out += c; i++;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}
