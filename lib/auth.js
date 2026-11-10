// Admin login: password + 6-digit code emailed to you, then a secure session cookie.
const crypto = require("crypto");
const db = require("./db");
const { mail } = require("./mail");

const COOKIE = "ds_admin";
const SESSION_DAYS = 7;
const CODE_MINUTES = 10;
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

const adminEmail = () => process.env.ADMIN_EMAIL || process.env.LEAD_EMAIL_TO || "";
const password = () => process.env.ADMIN_PASSWORD || "";

function setupProblem() {
  if (password().length < 10) return "Admin login is switched off: set ADMIN_PASSWORD on Render (at least 10 characters).";
  if (!mail.configured() || !adminEmail()) return "Admin login is switched off: set RESEND_API_KEY and ADMIN_EMAIL on Render so the login code can be emailed.";
  return null;
}

// ---- Rate limiting (memory) ----
const buckets = new Map();
function hit(key, limit, windowMs) {
  const now = Date.now();
  const list = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now); buckets.set(key, list);
  return list.length > limit;
}
function blocked(key, limit, windowMs) {
  const now = Date.now();
  return (buckets.get(key) || []).filter((t) => now - t < windowMs).length >= limit;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of buckets) if (!v.some((t) => now - t < 3600e3)) buckets.delete(k); }, 600e3).unref();

const FAIL_WINDOW = 15 * 60e3;
const pending = new Map(); // loginId -> { codeHash, expires, attempts, ip }
setInterval(() => { const now = Date.now(); for (const [k, v] of pending) if (v.expires < now) pending.delete(k); }, 60e3).unref();

function samePassword(input) {
  const a = Buffer.from(sha(input)), b = Buffer.from(sha(password()));
  return crypto.timingSafeEqual(a, b);
}

const maskEmail = (e) => e.replace(/^(.{2})[^@]*(@.*)$/, (_, a, b) => a + "•••" + b);

async function startLogin(input, ip) {
  const problem = setupProblem();
  if (problem) return { status: 503, error: problem };
  if (blocked(`fail:${ip}`, 5, FAIL_WINDOW) || blocked("fail:all", 30, FAIL_WINDOW))
    return { status: 429, error: "Too many wrong attempts. Login is locked for 15 minutes." };
  if (typeof input !== "string" || !input || !samePassword(input)) {
    hit(`fail:${ip}`, 5, FAIL_WINDOW); hit("fail:all", 30, FAIL_WINDOW);
    return { status: 401, error: "Wrong password." };
  }
  if (hit(`code:${ip}`, 5, 60 * 60e3)) return { status: 429, error: "Too many codes requested. Try again in an hour." };
  const loginId = crypto.randomBytes(24).toString("base64url");
  const code = String(crypto.randomInt(0, 1e6)).padStart(6, "0");
  pending.set(loginId, { codeHash: sha(loginId + code), expires: Date.now() + CODE_MINUTES * 60e3, attempts: 0, ip });
  try { await mail.loginCode(adminEmail(), code); }
  catch (e) { pending.delete(loginId); console.error("Login code email failed:", e.message); return { status: 502, error: "Couldn't send the login code email. Check RESEND_API_KEY on Render." }; }
  return { status: 200, loginId, email: maskEmail(adminEmail()) };
}

async function verifyCode(loginId, code, ip, ua) {
  const p = typeof loginId === "string" && pending.get(loginId);
  if (!p || p.expires < Date.now()) return { status: 401, error: "This code has expired. Please log in again." };
  if (++p.attempts > 5) { pending.delete(loginId); return { status: 429, error: "Too many wrong codes. Please log in again." }; }
  const ok = typeof code === "string" && /^\d{6}$/.test(code.trim()) &&
    crypto.timingSafeEqual(Buffer.from(sha(loginId + code.trim())), Buffer.from(p.codeHash));
  if (!ok) return { status: 401, error: `Wrong code. ${6 - p.attempts} tries left.` };
  pending.delete(loginId);
  const token = crypto.randomBytes(32).toString("base64url");
  await db.createSession(sha(token), new Date(Date.now() + SESSION_DAYS * 864e5), ip, String(ua || "").slice(0, 300));
  mail.loginNotice(adminEmail(), ip, ua);
  return { status: 200, token };
}

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
}

async function isAdmin(req) {
  const token = readCookie(req, COOKIE);
  if (!token || token.length > 100) return false;
  try { return !!(await db.findSession(sha(token))); } catch (e) { console.error("Session check failed:", e.message); return false; }
}

function cookieHeader(req, token, maxAgeSec) {
  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`;
}
const loginCookie = (req, token) => cookieHeader(req, token, SESSION_DAYS * 86400);
const clearCookie = (req) => cookieHeader(req, "", 0);

async function logout(req) {
  const token = readCookie(req, COOKIE);
  if (token) await db.deleteSession(sha(token));
}

module.exports = { setupProblem, startLogin, verifyCode, isAdmin, loginCookie, clearCookie, logout, hit };
