// Database layer: Neon (Postgres) when DATABASE_URL is set, otherwise an in-memory store
// (the in-memory store is only for local testing - nothing survives a restart).
let Pool = null;
try { ({ Pool } = require("pg")); } catch { /* pg not installed - memory mode only */ }

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

const mem = { leads: [], content: null, contentUpdated: null, history: [], sessions: new Map(), media: new Map(), seq: 1, hseq: 1 };

async function init() {
  if (!DATABASE_URL || !Pool) {
    console.warn("DATABASE_URL not set - using temporary memory storage (leads and panel changes are NOT saved).");
    return false;
  }
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, service TEXT,
      budget TEXT, message TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'client';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '';
    CREATE TABLE IF NOT EXISTS site_content (
      id INT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS site_content_history (
      id SERIAL PRIMARY KEY, data JSONB NOT NULL, saved_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS site_media (
      key TEXT PRIMARY KEY, mime TEXT NOT NULL, data TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY, expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(), ip TEXT, user_agent TEXT);
  `);
  await pool.query("DELETE FROM admin_sessions WHERE expires_at < NOW()");
  console.log("Neon connected - tables ready");
  return true;
}

const usingDb = () => !!pool;

// ---- Leads ----
async function insertLead(l) {
  if (!pool) { mem.leads.unshift({ id: mem.seq++, kind: "client", company: "", ...l, status: "new", note: "", created_at: new Date().toISOString() }); return; }
  await pool.query("INSERT INTO leads (name, email, phone, service, budget, message, kind, company) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [l.name, l.email, l.phone, l.service, l.budget, l.message, l.kind || "client", l.company || ""]);
}
async function listLeads() {
  if (!pool) return mem.leads.slice();
  const r = await pool.query("SELECT id, name, email, phone, service, budget, message, COALESCE(status,'new') AS status, COALESCE(note,'') AS note, COALESCE(kind,'client') AS kind, COALESCE(company,'') AS company, created_at FROM leads ORDER BY created_at DESC LIMIT 5000");
  return r.rows;
}
async function updateLead(id, { status, note }) {
  if (!pool) { const l = mem.leads.find((x) => x.id === id); if (!l) return false; if (status) l.status = status; if (note !== undefined) l.note = note; return true; }
  const r = await pool.query("UPDATE leads SET status = COALESCE($2, status), note = COALESCE($3, note) WHERE id = $1", [id, status || null, note ?? null]);
  return r.rowCount > 0;
}
async function deleteLead(id) {
  if (!pool) { const n = mem.leads.length; mem.leads = mem.leads.filter((x) => x.id !== id); return mem.leads.length < n; }
  const r = await pool.query("DELETE FROM leads WHERE id = $1", [id]);
  return r.rowCount > 0;
}

// ---- Website content (+ last 30 versions for undo) ----
async function getContent() {
  if (!pool) return mem.content ? { data: mem.content, updated_at: mem.contentUpdated } : null;
  const r = await pool.query("SELECT data, updated_at FROM site_content WHERE id = 1");
  return r.rows[0] || null;
}
// "previous" is the version being replaced; it goes into history so it can be restored
async function saveContent(data, previous) {
  if (!pool) {
    if (previous) mem.history.unshift({ id: mem.hseq++, data: previous, saved_at: mem.contentUpdated || new Date().toISOString() });
    mem.history = mem.history.slice(0, 30);
    mem.content = data; mem.contentUpdated = new Date().toISOString();
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (previous) await client.query("INSERT INTO site_content_history (data, saved_at) VALUES ($1, COALESCE((SELECT updated_at FROM site_content WHERE id = 1), NOW()))", [previous]);
    await client.query("INSERT INTO site_content (id, data, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()", [data]);
    await client.query("DELETE FROM site_content_history WHERE id NOT IN (SELECT id FROM site_content_history ORDER BY saved_at DESC LIMIT 30)");
    await client.query("COMMIT");
  } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
}
async function listHistory() {
  if (!pool) return mem.history.map(({ id, saved_at }) => ({ id, saved_at }));
  const r = await pool.query("SELECT id, saved_at FROM site_content_history ORDER BY saved_at DESC LIMIT 30");
  return r.rows;
}
async function getHistory(id) {
  if (!pool) return (mem.history.find((h) => h.id === id) || {}).data || null;
  const r = await pool.query("SELECT data FROM site_content_history WHERE id = $1", [id]);
  return r.rows[0] ? r.rows[0].data : null;
}

// ---- Uploaded images (stored in the database because Render's free disk is wiped on restart) ----
async function getMedia(key, withData = true) {
  if (!pool) return mem.media.get(key) || null;
  const r = await pool.query(`SELECT mime, updated_at${withData ? ", data" : ""} FROM site_media WHERE key = $1`, [key]);
  return r.rows[0] || null;
}
async function setMedia(key, mime, data) {
  if (!pool) return void mem.media.set(key, { mime, data, updated_at: new Date().toISOString() });
  await pool.query("INSERT INTO site_media (key, mime, data, updated_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (key) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = NOW()", [key, mime, data]);
}
async function deleteMedia(key) {
  if (!pool) return void mem.media.delete(key);
  await pool.query("DELETE FROM site_media WHERE key = $1", [key]);
}

// ---- Admin sessions (only a hash of the token is stored) ----
async function createSession(hash, expires, ip, ua) {
  if (!pool) { mem.sessions.set(hash, { expires, ip, ua }); return; }
  await pool.query("INSERT INTO admin_sessions (token_hash, expires_at, ip, user_agent) VALUES ($1,$2,$3,$4)", [hash, expires, ip, ua]);
}
async function findSession(hash) {
  if (!pool) { const s = mem.sessions.get(hash); return s && s.expires > new Date() ? s : null; }
  const r = await pool.query("SELECT expires_at FROM admin_sessions WHERE token_hash = $1 AND expires_at > NOW()", [hash]);
  return r.rows[0] || null;
}
async function deleteSession(hash) {
  if (!pool) return void mem.sessions.delete(hash);
  await pool.query("DELETE FROM admin_sessions WHERE token_hash = $1", [hash]);
}
async function deleteAllSessions() {
  if (!pool) return void mem.sessions.clear();
  await pool.query("DELETE FROM admin_sessions");
}

module.exports = { getMedia, setMedia, deleteMedia, init, usingDb, insertLead, listLeads, updateLead, deleteLead, getContent, saveContent, listHistory, getHistory, createSession, findSession, deleteSession, deleteAllSessions };
