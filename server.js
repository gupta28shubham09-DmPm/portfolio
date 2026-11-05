// Portfolio server: serves the website and saves contact-form leads to Neon (Postgres).
const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

// ---- Database (Neon) ----
let pool = null;
if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  pool
    .query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        service TEXT,
        budget TEXT,
        message TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`)
    .then(() => console.log("Neon connected - leads table ready"))
    .catch((e) => console.error("Database setup failed:", e.message));
} else {
  console.warn("DATABASE_URL not set - contact form will not save leads.");
}

app.use(express.json({ limit: "20kb" }));
app.use(
  express.static(path.join(__dirname, "public"), {
    index: "index.html",
    setHeaders: (res, filePath) => {
      // HTML, CSS and JS always re-check for updates; images can be cached for a day
      if (filePath.endsWith(".vcf")) {
        // Contact card: phones open it straight in "Add contact"
        res.setHeader("Content-Type", "text/vcard; charset=utf-8");
        res.setHeader("Content-Disposition", 'inline; filename="Shubham-Gupta.vcf"');
        res.setHeader("Cache-Control", "no-cache");
        return;
      }
      if (/\.(html|css|js)$/.test(filePath)) res.setHeader("Cache-Control", "no-cache");
      else res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Simple in-memory rate limit: 5 submissions per IP per 10 minutes
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const clean = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

app.post("/api/contact", async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot: bots fill this hidden field

  const lead = {
    name: clean(b.name, 120),
    email: clean(b.email, 160),
    phone: clean(b.phone, 30),
    service: clean(b.service, 80),
    budget: clean(b.budget, 60),
    message: clean(b.message, 2000),
  };

  if (!lead.name || (!lead.email && !lead.phone)) {
    return res.status(400).json({ ok: false, error: "Please share your name and an email or phone number." });
  }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return res.status(400).json({ ok: false, error: "That email doesn't look right." });
  }
  if (rateLimited(req.ip)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again in a few minutes." });
  }
  if (!pool) return res.status(503).json({ ok: false, error: "Form is not connected yet." });

  try {
    await pool.query(
      "INSERT INTO leads (name, email, phone, service, budget, message) VALUES ($1,$2,$3,$4,$5,$6)",
      [lead.name, lead.email, lead.phone, lead.service, lead.budget, lead.message]
    );
    res.json({ ok: true });
    notifyEmail(lead); // background alerts; they never block or break the form
    notifyWhatsApp(lead);
  } catch (e) {
    console.error("Insert failed:", e.message);
    res.status(500).json({ ok: false, error: "Something went wrong. Please WhatsApp me instead." });
  }
});

// ---- Email alert via Resend (HTTPS API, works on Render free). Set RESEND_API_KEY and LEAD_EMAIL_TO. ----
const esc = (v) => String(v || "-").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
async function notifyEmail(lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO;
  if (!key || !to) return;
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  const row = (k, v) => `<tr><td style="padding:10px 14px;color:#6b7280;font-weight:600;border-bottom:1px solid #eee;width:110px">${k}</td><td style="padding:10px 14px;color:#111;border-bottom:1px solid #eee">${v}</td></tr>`;
  const phoneLink = lead.phone ? `<a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>` : "-";
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
    <div style="background:#06080f;color:#fff;padding:20px 22px;border-radius:12px 12px 0 0">
      <div style="font-size:13px;color:#ffc83d;font-weight:700;letter-spacing:1px">DIGITAL SHUBHAM</div>
      <div style="font-size:22px;font-weight:800;margin-top:4px">🔔 New website lead</div>
    </div>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee">
      ${row("Name", esc(lead.name))}${row("Phone", phoneLink)}${row("Email", esc(lead.email))}
      ${row("Service", esc(lead.service))}${row("Budget", esc(lead.budget))}${row("Message", esc(lead.message))}
      ${row("Time", esc(time))}
    </table>
    <p style="color:#6b7280;font-size:12px;margin-top:12px">Saved in your Neon database (leads table).</p>
  </div>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEAD_EMAIL_FROM || "Website Leads <onboarding@resend.dev>",
        to: [to],
        reply_to: lead.email || undefined,
        subject: `New lead: ${lead.name} · ${lead.service || "Enquiry"}`,
        html,
      }),
      signal: AbortSignal.timeout(15000),
    });
    console.log(r.ok ? "Email alert sent" : `Email alert failed: HTTP ${r.status} ${await r.text()}`);
  } catch (e) {
    console.error("Email alert failed:", e.message);
  }
}

// ---- WhatsApp alert via CallMeBot (free). Set WHATSAPP_PHONE and CALLMEBOT_APIKEY on Render. ----
async function notifyWhatsApp(lead) {
  const phone = process.env.WHATSAPP_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return;
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  const text = [
    "🔔 *New Website Lead*",
    "",
    `👤 *Name:* ${lead.name}`,
    `📞 *Phone:* ${lead.phone || "-"}`,
    `✉️ *Email:* ${lead.email || "-"}`,
    `🛠 *Service:* ${lead.service || "-"}`,
    `💰 *Budget:* ${lead.budget || "-"}`,
    `💬 *Message:* ${lead.message || "-"}`,
    "",
    `🕒 ${time}`,
  ].join("\n");
  const url =
    "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(phone) +
    "&text=" + encodeURIComponent(text) + "&apikey=" + encodeURIComponent(apikey);
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    console.log(r.ok ? "WhatsApp alert sent" : `WhatsApp alert failed: HTTP ${r.status}`);
  } catch (e) {
    console.error("WhatsApp alert failed:", e.message);
  }
}

app.use((_req, res) => res.status(404).sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Portfolio running on port ${PORT}`));
