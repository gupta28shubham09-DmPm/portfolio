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
app.use(express.static(path.join(__dirname, "public"), { maxAge: "7d", index: "index.html" }));

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
  } catch (e) {
    console.error("Insert failed:", e.message);
    res.status(500).json({ ok: false, error: "Something went wrong. Please WhatsApp me instead." });
  }
});

app.use((_req, res) => res.status(404).sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Portfolio running on port ${PORT}`));
