// Digital Shubham website + admin panel.
// Built on Node's own web server, so the only package needed is "pg" (for Neon).
const http = require("http");
const fs = require("fs");
const path = require("path");
const numbers = require("./lib/numbers");
const db = require("./lib/db");
const auth = require("./lib/auth");
const { normalize, problems, defaults } = require("./lib/content");
const crypto = require("crypto");
const { schema, tabs } = require("./lib/schema");
const { PRESETS } = require("./lib/theme");
const { render, vcard } = require("./lib/render");
const { mail, whatsappAlert } = require("./lib/mail");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const ADMIN = path.join(__dirname, "admin");

// ---- Content cache: the page is rebuilt only when you save in the panel ----
let cache = null;
async function content() {
  if (cache) return cache;
  let saved = null, photo = null;
  try { saved = await db.getContent(); } catch (e) { console.error("Loading content failed, using defaults:", e.message); }
  try { photo = await db.getMedia("profile", false); } catch (e) { console.error("Loading photo info failed:", e.message); }
  const data = normalize(saved ? saved.data : null);
  const photoUrl = photo ? `media/profile?v=${new Date(photo.updated_at).getTime()}` : "img/shubham.jpg";
  cache = { data, photoUrl, customPhoto: !!photo, updatedAt: saved ? saved.updated_at : null, html: new Map() };
  return cache;
}
const clearCache = () => { cache = null; };

// Your site address, worked out from the request (works for onrender.com and your own domain)
function baseUrl(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim().replace(/[^A-Za-z0-9.:-]/g, "");
  const proto = req.headers["x-forwarded-proto"] === "https" || /onrender\.com$|\.[a-z]{2,}$/.test(host) && !/^localhost|^127\./.test(host) ? "https" : "http";
  return host ? `${proto}://${host}` : "";
}
async function pageHtml(req) {
  const c = await content();
  const base = baseUrl(req);
  if (!c.html.has(base)) c.html.set(base, render(c.data, { base, photoUrl: c.photoUrl }));
  return c.html.get(base);
}

// Previews of unsaved changes (admin only, kept 15 minutes)
const previews = new Map();
setInterval(() => { const now = Date.now(); for (const [k, v] of previews) if (v.expires < now) previews.delete(k); }, 60e3).unref();

// ---- Small helpers ----
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2" };

const BASE_HEADERS = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin", "X-Frame-Options": "SAMEORIGIN" };
const ADMIN_HEADERS = {
  "Cache-Control": "no-store", "X-Frame-Options": "DENY", "X-Robots-Tag": "noindex, nofollow",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...BASE_HEADERS, ...headers });
  res.end(body);
}
const json = (res, status, obj, headers = {}) => send(res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });

function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.socket.remoteAddress || "unknown";
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error("Too large"), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(Object.assign(new Error("Bad JSON"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

function serveFile(res, root, urlPath, extraHeaders = {}) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return false; }
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root + path.sep)) return false; // blocks ../ tricks
  let stat;
  try { stat = fs.statSync(file); } catch { return false; }
  if (!stat.isFile()) return false;
  const ext = path.extname(file).toLowerCase();
  const cacheCtl = /\.(css|js|html)$/.test(ext) ? "no-cache" : "public, max-age=86400";
  res.writeHead(200, { ...BASE_HEADERS, "Content-Type": MIME[ext] || "application/octet-stream", "Content-Length": stat.size, "Cache-Control": cacheCtl, ...extraHeaders });
  fs.createReadStream(file).pipe(res);
  return true;
}

// ---- Public form rate limit: 5 per IP per 10 minutes ----
const formHits = new Map();
function formLimited(ip) {
  const now = Date.now();
  const list = (formHits.get(ip) || []).filter((t) => now - t < 600e3);
  list.push(now); formHits.set(ip, list);
  return list.length > 5;
}
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : "");

async function handleContact(req, res) {
  const b = await readBody(req, 20e3);
  if (b.website) return json(res, 200, { ok: true }); // honeypot for bots
  const lead = { name: clean(b.name, 120), email: clean(b.email, 160), phone: clean(b.phone, 30), service: clean(b.service, 80), budget: clean(b.budget, 60), message: clean(b.message, 2000) };
  if (!lead.name || (!lead.email && !lead.phone)) return json(res, 400, { ok: false, error: "Please share your name and an email or phone number." });
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return json(res, 400, { ok: false, error: "That email doesn't look right." });
  if (formLimited(clientIp(req))) return json(res, 429, { ok: false, error: "Too many requests. Please try again in a few minutes." });
  try {
    await db.insertLead(lead);
    json(res, 200, { ok: true });
    mail.leadAlert(lead); whatsappAlert(lead);
  } catch (e) {
    console.error("Saving lead failed:", e.message);
    json(res, 500, { ok: false, error: "Something went wrong. Please WhatsApp me instead." });
  }
}

const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stops Excel formula injection
  return `"${s.replace(/"/g, '""')}"`;
};
const STATUSES = ["new", "contacted", "converted", "not-interested", "spam"];

// ---- Admin API (every route here needs a valid login) ----
async function handleAdminApi(req, res, url) {
  const p = url.pathname, m = req.method;
  const ip = clientIp(req);

  // Login steps (no session needed yet)
  if (p === "/api/admin/status" && m === "GET") return json(res, 200, { setupProblem: auth.setupProblem(), loggedIn: await auth.isAdmin(req) });
  if (m !== "GET" && req.headers["x-admin-request"] !== "1") return json(res, 403, { error: "Blocked." }); // CSRF guard
  if (p === "/api/admin/login" && m === "POST") {
    const b = await readBody(req, 2e3);
    const r = await auth.startLogin(b.password, ip);
    return json(res, r.status, r.error ? { error: r.error } : { loginId: r.loginId, email: r.email });
  }
  if (p === "/api/admin/verify" && m === "POST") {
    const b = await readBody(req, 2e3);
    const r = await auth.verifyCode(b.loginId, b.code, ip, req.headers["user-agent"]);
    if (r.error) return json(res, r.status, { error: r.error });
    return json(res, 200, { ok: true }, { "Set-Cookie": auth.loginCookie(req, r.token) });
  }

  if (!(await auth.isAdmin(req))) return json(res, 401, { error: "Please log in." });

  if (p === "/api/admin/logout" && m === "POST") { await auth.logout(req); return json(res, 200, { ok: true }, { "Set-Cookie": auth.clearCookie(req) }); }
  if (p === "/api/admin/logout-all" && m === "POST") { await db.deleteAllSessions(); return json(res, 200, { ok: true }, { "Set-Cookie": auth.clearCookie(req) }); }

  if (p === "/api/admin/content" && m === "GET") {
    const c = await content();
    return json(res, 200, { content: c.data, updatedAt: c.updatedAt, schema, tabs, defaults, presets: PRESETS, savedInDb: db.usingDb(), photo: { url: "/" + c.photoUrl, custom: c.customPhoto } });
  }
  if (p === "/api/admin/content" && m === "PUT") {
    const b = await readBody(req, 600e3);
    if (!b || typeof b.content !== "object") return json(res, 400, { error: "Nothing to save." });
    const issues = problems(b.content);
    const current = (await content()).data;
    const data = normalize(b.content, current);
    await db.saveContent(data, current);
    clearCache();
    const ctx = numbers.compute(data);
    const unknown = numbers.unknownTags(data, ctx);
    if (unknown.length) issues.push(`These tags don't exist, so they show as typed: ${unknown.map((t) => `{${t}}`).join(" ")}`);
    issues.push(...ctx.errors);
    return json(res, 200, { ok: true, content: data, warnings: issues, updatedAt: (await content()).updatedAt });
  }
  if (p === "/api/admin/preview" && m === "POST") {
    const b = await readBody(req, 600e3);
    if (!b || typeof b.content !== "object") return json(res, 400, { error: "Nothing to preview." });
    const c = await content();
    const data = normalize(b.content, c.data);
    const banner = '<div style="position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:99;background:#ffc83d;color:#111;font:700 13px system-ui;padding:8px 14px;border-radius:100px;box-shadow:0 10px 30px rgba(0,0,0,.4);pointer-events:none">PREVIEW · not saved yet</div>';
    // live = the small preview inside the panel: no banner, no scroll animations (everything shows at once)
    let html = render(data, { base: baseUrl(req), photoUrl: c.photoUrl });
    html = b.live ? html.replace(/(<body[^>]*?)data-anim="[^"]*"/, '$1data-anim="off"') : html.replace(/<body([^>]*)>/, (mm) => mm + banner);
    const token = crypto.randomBytes(18).toString("base64url");
    previews.set(token, { html, expires: Date.now() + 15 * 60e3 });
    if (previews.size > 40) previews.delete(previews.keys().next().value);
    return json(res, 200, { url: `/admin/preview/${token}` });
  }
  if (p === "/api/admin/photo" && m === "PUT") {
    const b = await readBody(req, 4e6);
    const mm = typeof b.dataUrl === "string" && b.dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
    if (!mm) return json(res, 400, { error: "Please upload a JPG, PNG or WebP image." });
    const buf = Buffer.from(mm[2], "base64");
    const sig = { "image/jpeg": [0xff, 0xd8, 0xff], "image/png": [0x89, 0x50, 0x4e, 0x47] }[mm[1]];
    const okSig = mm[1] === "image/webp" ? buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP" : sig.every((v, i) => buf[i] === v);
    if (!okSig) return json(res, 400, { error: "That file isn't a real image." });
    if (buf.length > 2.5e6) return json(res, 413, { error: "Image is too large (max 2.5 MB)." });
    await db.setMedia("profile", mm[1], buf.toString("base64"));
    clearCache();
    return json(res, 200, { ok: true });
  }
  if (p === "/api/admin/photo" && m === "DELETE") { await db.deleteMedia("profile"); clearCache(); return json(res, 200, { ok: true }); }
  if (p === "/api/admin/history" && m === "GET") return json(res, 200, { history: await db.listHistory() });
  const hm = p.match(/^\/api\/admin\/history\/(\d+)\/restore$/);
  if (hm && m === "POST") {
    const old = await db.getHistory(Number(hm[1]));
    if (!old) return json(res, 404, { error: "That version no longer exists." });
    await db.saveContent(normalize(old), (await content()).data); clearCache();
    return json(res, 200, { ok: true });
  }
  if (p === "/api/admin/reset" && m === "POST") { await db.saveContent(normalize(defaults), (await content()).data); clearCache(); return json(res, 200, { ok: true }); }

  if (p === "/api/admin/leads" && m === "GET") return json(res, 200, { leads: await db.listLeads(), statuses: STATUSES, savedInDb: db.usingDb() });
  if (p === "/api/admin/leads.csv" && m === "GET") {
    const rows = await db.listLeads();
    const head = ["Date (IST)", "Name", "Phone", "Email", "Service", "Budget", "Message", "Status", "Note"];
    const lines = [head.map(csvCell).join(",")].concat(rows.map((l) => [
      new Date(l.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), l.name, l.phone, l.email, l.service, l.budget, l.message, l.status, l.note,
    ].map(csvCell).join(",")));
    return send(res, 200, "﻿" + lines.join("\r\n"), { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" });
  }
  const lm = p.match(/^\/api\/admin\/leads\/(\d+)$/);
  if (lm && m === "PATCH") {
    const b = await readBody(req, 5e3);
    const status = STATUSES.includes(b.status) ? b.status : undefined;
    const note = typeof b.note === "string" ? b.note.slice(0, 1000) : undefined;
    const ok = await db.updateLead(Number(lm[1]), { status, note });
    return json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "Lead not found." });
  }
  if (lm && m === "DELETE") {
    const ok = await db.deleteLead(Number(lm[1]));
    return json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "Lead not found." });
  }
  return json(res, 404, { error: "Not found." });
}

// ---- Router ----
async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname, m = req.method;

  if (p === "/health") return json(res, 200, { ok: true });
  if (p.startsWith("/api/admin/")) return handleAdminApi(req, res, url);
  if (p === "/api/contact" && m === "POST") return handleContact(req, res);

  if (m !== "GET" && m !== "HEAD") return json(res, 405, { error: "Method not allowed." });

  if (p === "/" || p === "/index.html") {
    return send(res, 200, await pageHtml(req), { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
  }
  if (p === "/media/profile") {
    const m = await db.getMedia("profile").catch(() => null);
    if (!m) { res.writeHead(302, { Location: "/img/shubham.jpg" }); return res.end(); }
    const buf = Buffer.from(m.data, "base64");
    return send(res, 200, buf, { "Content-Type": m.mime, "Content-Length": buf.length, "Cache-Control": "public, max-age=31536000, immutable" });
  }
  if (p === "/favicon.ico") { res.writeHead(204, { "Cache-Control": "public, max-age=86400" }); return res.end(); }
  if (p === "/robots.txt") {
    return send(res, 200, `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl(req)}/sitemap.xml\n`, { "Content-Type": "text/plain; charset=utf-8" });
  }
  if (p === "/sitemap.xml") {
    const c = await content();
    const last = (c.updatedAt ? new Date(c.updatedAt) : new Date()).toISOString().slice(0, 10);
    return send(res, 200, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl(req)}/</loc><lastmod>${last}</lastmod></url></urlset>\n`, { "Content-Type": "application/xml; charset=utf-8" });
  }
  const pv = p.match(/^\/admin\/preview\/([A-Za-z0-9_-]{20,})$/);
  if (pv) {
    if (!(await auth.isAdmin(req))) { res.writeHead(302, { Location: "/admin/login" }); return res.end(); }
    const item = previews.get(pv[1]);
    if (!item) return send(res, 404, "This preview has expired. Click Preview again in your panel.", { "Content-Type": "text/plain; charset=utf-8" });
    return send(res, 200, item.html, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
  }
  if (p === "/contact.vcf" || p === "/shubham-gupta.vcf") {
    const c = await content();
    const host = baseUrl(req);
    const fname = (c.data.contact.name || "contact").replace(/[^A-Za-z0-9]+/g, "-");
    return send(res, 200, vcard(c.data, host), { "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": `inline; filename="${fname}.vcf"`, "Cache-Control": "no-cache" });
  }

  // Admin pages
  if (p === "/admin" || p === "/admin/") {
    if (!(await auth.isAdmin(req))) { res.writeHead(302, { ...ADMIN_HEADERS, Location: "/admin/login" }); return res.end(); }
    return serveFile(res, ADMIN, "/panel.html", ADMIN_HEADERS) || send(res, 404, "Not found");
  }
  if (p === "/admin/login") return serveFile(res, ADMIN, "/login.html", ADMIN_HEADERS) || send(res, 404, "Not found");
  if (p === "/admin/numbers.js") return serveFile(res, path.join(__dirname, "lib"), "/numbers.js", ADMIN_HEADERS) || send(res, 404, "Not found");
  if (/^\/admin\/[a-z-]+\.(css|js)$/.test(p)) return serveFile(res, ADMIN, p.slice("/admin".length), ADMIN_HEADERS) || send(res, 404, "Not found");

  // Old static copies of the page are no longer used; always serve the live page instead
  if (p.endsWith(".html")) { res.writeHead(302, { Location: "/" }); return res.end(); }
  if (serveFile(res, PUBLIC, p)) return;

  return send(res, 404, await pageHtml(req), { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    const status = e.status || 500;
    if (status === 500) console.error("Request failed:", req.method, req.url, e.message);
    if (!res.headersSent) json(res, status, { error: status === 413 ? "That's too large." : status === 400 ? "Bad request." : "Something went wrong." });
    else res.end();
  });
});

db.init()
  .catch((e) => console.error("Database setup failed:", e.message))
  .finally(() => {
    const prob = auth.setupProblem();
    if (prob) console.warn(prob);
    server.listen(PORT, () => console.log(`Portfolio running on port ${PORT}`));
  });

module.exports = server;
