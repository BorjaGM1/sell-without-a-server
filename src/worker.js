// The kit's only code, used only on the Stripe path. Your landing page (site/) is static and served as-is.
//
//   GET /thanks?session_id=cs_...    where your Stripe Payment Link sends the buyer: a page with the download button
//   GET /download?session_id=cs_...  the file itself, streamed from your private R2 bucket
//
// Both ask Stripe, with a READ-ONLY key, whether that checkout was paid, is recent, and was not refunded or
// disputed. Which file comes from the session's payment link, never from the URL.
//
// No database, no webhook, no email service, no server. The one secret is STRIPE_READ_KEY, a restricted key
// that can only read Checkout Sessions, PaymentIntents and Charges: if it leaks, nobody can charge, refund,
// create products or move money with it.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = { "/thanks": thanks, "/download": download }[url.pathname];
    if (!route) return env.ASSETS.fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD") return page(env, 405, "Not allowed.");
    try {
      return await route(request, env, url);
    } catch (e) {
      console.error(url.pathname, "failed:", e && e.stack || e); // logs only; the visitor never sees internals
      return page(env, 500, "Something went wrong on our side. Please try again in a minute.");
    }
  },
};

// Returns { product, sid } for a good purchase, or a Response explaining why not.
async function check(env, url) {
  const products = parseProducts(env.PRODUCTS);
  if (!env.STRIPE_READ_KEY || !products) return page(env, 503, "Downloads are not set up yet.");
  const sid = url.searchParams.get("session_id") || "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sid)) return page(env, 404, "This link is not valid.");

  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sid}?expand[]=payment_intent.latest_charge`, {
    headers: { authorization: "Bearer " + env.STRIPE_READ_KEY, "stripe-version": "2026-04-22.dahlia" },
  });
  if (res.status === 404) return page(env, 404, "This link is not valid.");
  if (!res.ok) {
    console.error("stripe", res.status); // 401/403: wrong key or a missing permission (GUIDE.md, the read-only key)
    return page(env, 503, "Downloads are paused for a moment. Please try again later.");
  }
  const s = await res.json();

  const product = s.payment_link && products[s.payment_link];
  if (!product) return page(env, 404, "This link is not valid.");
  if (s.status !== "complete") return page(env, 402, "This checkout was not finished.");
  if (s.payment_status === "unpaid") return page(env, 402, "Your payment is still processing. Try this link again in a little while.");
  // "paid", or "no_payment_required" (a 100%-off promotion code: free copies, and free test purchases)
  const charge = s.payment_intent && s.payment_intent.latest_charge;
  if (charge && (charge.refunded || charge.disputed)) return page(env, 410, "This purchase was refunded or disputed, so the download is closed.");
  const days = Number(env.DOWNLOAD_DAYS || 30);
  if (Date.now() / 1000 - s.created > days * 86400) return page(env, 410, `This link has expired (it works for ${days} days).`);
  return { product, sid };
}

async function thanks(request, env, url) {
  const ok = await check(env, url);
  if (ok instanceof Response) return ok;
  const days = Number(env.DOWNLOAD_DAYS || 30);
  return page(env, 200, `<h1>Thank you!</h1>
<p>${esc(ok.product.title || "Your file")} is ready.</p>
<p><a class="btn" href="/download?session_id=${esc(ok.sid)}">Download</a></p>
<p class="muted">Bookmark this page: the button works for ${days} days. Save the file once you have it.</p>`, true);
}

async function download(request, env, url) {
  const ok = await check(env, url);
  if (ok instanceof Response) return ok;
  const { product } = ok;
  const obj = await env.FILES.get(product.file);
  if (!obj) {
    console.error("file missing in the bucket:", product.file);
    return page(env, 500, "The file is missing on our side. Please write to us.");
  }
  return new Response(request.method === "HEAD" ? null : obj.body, {
    headers: {
      "content-type": obj.httpMetadata && obj.httpMetadata.contentType || "application/octet-stream",
      "content-disposition": `attachment; filename="${(product.name || product.file).replace(/[^\w.-]/g, "_")}"`,
      "content-length": String(obj.size),
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}

function parseProducts(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return null; }
}

// One small page for every answer, so a buyer never sees a raw error. `html` is trusted markup; anything else is text.
function page(env, status, body, html = false) {
  const help = env.SUPPORT_EMAIL
    ? `<p class="muted">Need help? Write to <a href="mailto:${esc(env.SUPPORT_EMAIL)}">${esc(env.SUPPORT_EMAIL)}</a> with your receipt.</p>` : "";
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${status === 200 ? "Thank you" : "Download"}</title>
<style>:root{color-scheme:light dark}body{font:18px/1.6 system-ui,sans-serif;max-width:34rem;margin:0 auto;padding:4rem 1rem}
.btn{display:inline-block;padding:.9rem 1.6rem;background:#1f5f4a;color:#fff;border-radius:8px;font-weight:700;text-decoration:none}
.muted{opacity:.7;font-size:.9rem}</style>
<main>${html ? body : `<p>${esc(body)}</p>`}${help}<p class="muted"><a href="/">Home</a></p></main>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
