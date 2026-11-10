// Number engine: one source for every number on the website.
// - Built-in numbers are calculated from your content (years, companies, budget, leads).
// - "Key numbers" are numbers you type once (or a formula) and reuse anywhere with {name}.
// Runs on the server (website) and in the admin panel (live preview of the values).
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DSNumbers = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const BUILTINS = {
    years: "Years of experience — counted from the earliest year in your Experience list",
    companies: "Companies — how many different companies are in your Experience list",
    budget: "Total ad budget in lakhs — all industry budgets added together",
    leads: "Total leads — all industry leads added together",
  };
  const KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,30}$/;
  const TAG_RE = /\{([a-zA-Z][a-zA-Z0-9_]{0,30})\}/g;
  const parseNum = (v) => { const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : NaN; };

  // ---- safe formula reader: numbers, {names}, + - * / ( ) and round/floor/ceil/min/max/abs ----
  function evaluate(expr, get) {
    const src = String(expr);
    let i = 0;
    const peek = () => { while (src[i] === " ") i++; return src[i]; };
    const fail = (m) => { throw new Error(m); };
    function primary() {
      const ch = peek();
      if (ch === "(") { i++; const v = sum(); if (peek() !== ")") fail("missing )"); i++; return v; }
      if (ch === "-") { i++; return -primary(); }
      if (ch === "+") { i++; return primary(); }
      if (ch === "{") {
        const end = src.indexOf("}", i);
        if (end < 0) fail("missing }");
        const name = src.slice(i + 1, end); i = end + 1;
        if (!KEY_RE.test(name)) fail(`bad name {${name}}`);
        return get(name);
      }
      const num = /^[0-9][0-9,]*(\.[0-9]+)?/.exec(src.slice(i));
      if (num) { i += num[0].length; return parseFloat(num[0].replace(/,/g, "")); }
      const fn = /^(round|floor|ceil|min|max|abs)\s*\(/.exec(src.slice(i));
      if (fn) {
        i += fn[0].length; const args = [sum()];
        while (peek() === ",") { i++; args.push(sum()); }
        if (peek() !== ")") fail("missing )"); i++;
        const f = fn[1];
        if (f === "round") return args.length > 1 ? Math.round(args[0] * 10 ** args[1]) / 10 ** args[1] : Math.round(args[0]);
        return Math[f](...args);
      }
      fail(`can't read “${src.slice(i, i + 8)}”`);
    }
    function product() { let v = primary(); for (;;) { const c = peek(); if (c === "*") { i++; v *= primary(); } else if (c === "/") { i++; const d = primary(); v = d === 0 ? NaN : v / d; } else return v; } }
    function sum() { let v = product(); for (;;) { const c = peek(); if (c === "+") { i++; v += product(); } else if (c === "-") { i++; v -= product(); } else return v; } }
    const out = sum();
    if (peek() !== undefined) fail(`unexpected “${src.slice(i, i + 8)}”`);
    return out;
  }

  // ---- formatting ----
  function fmt(n, decimals) {
    if (!isFinite(n)) return "?";
    const d = decimals === "" || decimals === "auto" || decimals == null ? null : Number(decimals);
    return d === null
      ? Number(n.toFixed(2)).toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function raw(n, decimals) {
    if (!isFinite(n)) return "";
    const d = decimals === "" || decimals === "auto" || decimals == null ? null : Number(decimals);
    return d === null ? String(Number(n.toFixed(2))) : n.toFixed(d);
  }
  // percentage between two funnel steps: 1.41 · 13.1 · 29.2
  function pct(part, whole) {
    if (!isFinite(part) || !isFinite(whole) || whole === 0) return "";
    const v = (part / whole) * 100;
    return String(Number(v.toFixed(v < 10 ? 2 : 1)));
  }
  // budget in lakhs → ₹9L / ₹1.2Cr
  function money(lakh) {
    if (!isFinite(lakh)) return "";
    return lakh >= 100 ? `₹${Number((lakh / 100).toFixed(2))}Cr` : `₹${Number(lakh.toFixed(2))}L`;
  }

  // ---- work out every number ----
  function compute(c, now = new Date()) {
    const list = Array.isArray(c.numbers) ? c.numbers : [];
    const defs = {};
    const errors = [];
    for (const n of list) {
      if (!n || !KEY_RE.test(n.key || "")) continue;
      if (BUILTINS[n.key]) { errors.push(`{${n.key}} is calculated automatically, so your own “${n.key}” is ignored.`); continue; }
      if (defs[n.key]) { errors.push(`{${n.key}} is listed twice; the first one is used.`); continue; }
      defs[n.key] = n;
    }
    const values = {}, stack = new Set();

    function get(key) {
      if (key in values) return values[key];
      if (stack.has(key)) throw new Error(`{${key}} depends on itself`);
      stack.add(key);
      let v;
      try {
        if (key === "years") {
          const ys = (c.experience?.items || []).flatMap((e) => (String(e.date || "").match(/\b(19|20)\d{2}\b/g) || []).map(Number));
          v = ys.length ? Math.max(0, now.getFullYear() - Math.min(...ys)) : 0;
        } else if (key === "companies") {
          v = new Set((c.experience?.items || []).map((e) => String(e.company || "").trim().toLowerCase()).filter(Boolean)).size;
        } else if (key === "budget" || key === "leads") {
          const field = key === "budget" ? "budgetLakh" : "leads";
          v = (c.results?.industries || []).reduce((s, d) => { const x = num(d[field]); return s + (isFinite(x) ? x : 0); }, 0);
        } else if (defs[key]) {
          const val = String(defs[key].value ?? "").trim();
          v = val.startsWith("=") ? evaluate(val.slice(1), get) : parseNum(val);
        } else throw new Error(`{${key}} doesn't exist`);
      } finally { stack.delete(key); }
      values[key] = v;
      return v;
    }
    // a number field can be a plain number or a single {name}
    function num(v) {
      const s = String(v ?? "").trim();
      const m = /^\{([a-zA-Z][a-zA-Z0-9_]*)\}$/.exec(s);
      if (m) { try { return get(m[1]); } catch { return NaN; } }
      return parseNum(s);
    }

    const all = {};
    for (const key of [...Object.keys(BUILTINS), ...Object.keys(defs)]) {
      try { const v = get(key); all[key] = v; if (!isFinite(v)) errors.push(`{${key}} isn't a valid number — check its value or formula.`); }
      catch (e) { all[key] = NaN; errors.push(`{${key}}: ${e.message}`); }
    }
    const decimals = {};
    for (const k in defs) decimals[k] = defs[k].decimals;
    const display = {}, rawv = {};
    for (const k in all) { display[k] = fmt(all[k], decimals[k]); rawv[k] = raw(all[k], decimals[k]); }
    return { values: all, display, raw: rawv, errors, num, builtins: BUILTINS, known: new Set(Object.keys(all)) };
  }

  // Replace {name} in every text. A field that is exactly one {name} gets the plain number (for counters).
  function fill(obj, ctx) {
    if (typeof obj === "string") {
      const exact = /^\{([a-zA-Z][a-zA-Z0-9_]*)\}$/.exec(obj.trim());
      if (exact && exact[1] in ctx.raw) return ctx.raw[exact[1]];
      return obj.replace(TAG_RE, (m, k) => (k in ctx.display ? ctx.display[k] : m));
    }
    if (Array.isArray(obj)) return obj.map((x) => fill(x, ctx));
    if (obj && typeof obj === "object") { const o = {}; for (const k in obj) o[k] = k === "numbers" ? obj[k] : fill(obj[k], ctx); return o; }
    return obj;
  }

  // Every {name} used in the content that doesn't exist (shown as a warning in the panel)
  function unknownTags(c, ctx) {
    const found = new Set();
    const walk = (v) => {
      if (typeof v === "string") { for (const m of v.matchAll(TAG_RE)) if (!ctx.known.has(m[1])) found.add(m[1]); }
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") for (const k in v) if (k !== "numbers") walk(v[k]);
    };
    walk(c);
    return [...found];
  }

  return { compute, fill, fmt, raw, pct, money, parseNum, evaluate, unknownTags, BUILTINS, KEY_RE };
});
