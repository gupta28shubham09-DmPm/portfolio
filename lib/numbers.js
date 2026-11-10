// Number engine: one source for every number on the website.
// - Built-in numbers are calculated from your content (years, companies, budget, leads).
// - "Key numbers" are numbers you type once (or a formula) and reuse anywhere with {name}.
// Runs on the server (website) and in the admin panel (live preview of the values).
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DSNumbers = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const BUILTINS = {
    years: "Years of experience — from your Experience dates, counted and rounded the way you chose in Experience › How experience is shown",
    experience: "Experience as words, e.g. “4 yrs 11 mos” — uses your chosen duration style",
    months: "Total months of experience",
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

  // ---- experience: dates → months, totals and the text shown on the website ----
  const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // "Mar 2023" / "03/2023" / "2023" → { y, m } (m = null when only the year is written)
  function readPoint(txt) {
    const s = String(txt).toLowerCase();
    const y = /\b(19|20)\d{2}\b/.exec(s);
    if (!y) return null;
    let m = null;
    const name = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?![a-z])/.exec(s);
    if (name) m = MONTHS.indexOf(name[1]);
    else { const num = /\b(0?[1-9]|1[0-2])\s*[\/.-]\s*(19|20)\d{2}\b/.exec(s); if (num) m = Number(num[1]) - 1; }
    return { y: Number(y[0]), m };
  }
  const nowMonth = (now) => now.getFullYear() * 12 + now.getMonth() + 1;
  // one job's dates → { a, b, ongoing, start, end } with start/end in months ([start, end))
  function readRange(date, nowM) {
    // split "start – end": en/em dash, " - ", "2023-2024", "to", "till"
    const parts = String(date || "").split(/\s*(?:–|—|\s-\s|\bto\b|\btill\b)\s*|(?<=\d{4})\s*-\s*(?=[a-z]|\d{4}|\d{1,2}\s*[\/.])/i).filter((x) => x && x.trim());
    const a = parts.length ? readPoint(parts[0]) : null;
    if (!a) return null;
    const single = parts.length < 2;
    const endTxt = single ? parts[0] : parts[parts.length - 1];
    const ongoing = /present|now|current|till date|ongoing/i.test(endTxt);
    const b = ongoing || single ? null : readPoint(endTxt);
    const start = a.y * 12 + (a.m ?? 0);
    // the end month counts fully; a year without a month counts to the end of that year
    let end = ongoing ? nowM : b ? b.y * 12 + (b.m ?? 11) + 1 : start + (a.m === null ? 12 : 1);
    end = Math.min(end, nowM);
    return { a, b: single ? null : b, ongoing, start, end: Math.max(end, start) };
  }
  function mergeMonths(ranges) {
    const rs = ranges.filter((r) => r.end > r.start).map((r) => [r.start, r.end]).sort((p, q) => p[0] - q[0]);
    let total = 0, cur = null;
    for (const r of rs) {
      if (!cur || r[0] > cur[1]) { if (cur) total += cur[1] - cur[0]; cur = r.slice(); }
      else cur[1] = Math.max(cur[1], r[1]);
    }
    return cur ? total + cur[1] - cur[0] : total;
  }
  function workedMonths(items, now) {
    const nowM = nowMonth(now);
    return mergeMonths((items || []).map((e) => readRange(e.date, nowM)).filter(Boolean));
  }
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // months → "2 yrs 11 mos" in the chosen style
  function duration(months, style) {
    if (!isFinite(months) || months <= 0) return "";
    const y = Math.floor(months / 12), m = months % 12;
    const join = (yy, mm) => [y ? yy : "", m ? mm : ""].filter(Boolean).join(" ");
    switch (style) {
      case "long": return join(plural(y, "year", "years"), plural(m, "month", "months"));
      case "compact": return join(`${y}y`, `${m}m`);
      case "decimal": return y ? `${Number((months / 12).toFixed(1))} yrs` : plural(m, "mo", "mos");
      case "decimalLong": return y ? `${Number((months / 12).toFixed(1))} years` : plural(m, "month", "months");
      case "rounded": { const r = Math.round(months / 12); return r ? plural(r, "yr", "yrs") : plural(m, "mo", "mos"); }
      case "roundedLong": { const r = Math.round(months / 12); return r ? plural(r, "year", "years") : plural(m, "month", "months"); }
      case "plus": return y ? `${y}+ ${y === 1 ? "year" : "years"}` : plural(m, "month", "months");
      default: return join(plural(y, "yr", "yrs"), plural(m, "mo", "mos"));
    }
  }
  const pointText = (p, withMonth) => (withMonth && p.m !== null ? `${MON[p.m]} ${p.y}` : String(p.y));
  // the date line for one job, in the chosen style
  function jobDate(item, r, set) {
    const style = item.dateStyle && item.dateStyle !== "main" ? item.dateStyle : set.dateStyle || "asTyped";
    if (style === "hidden") return "";
    if (style === "asTyped" || !r) return style === "asTyped" ? String(item.date || "") : "";
    const present = set.presentWord || "Present";
    const range = (withMonth) => {
      const A = pointText(r.a, withMonth);
      if (r.ongoing) return `${A} – ${present}`;
      if (!r.b) return A;
      const B = pointText(r.b, withMonth);
      return A === B ? A : `${A} – ${B}`;
    };
    const dur = duration(r.end - r.start, set.durationStyle);
    switch (style) {
      case "monthYear": return range(true);
      case "years": return range(false);
      case "duration": return dur;
      case "datesDuration": return [range(true), dur].filter(Boolean).join(" · ");
      case "yearsDuration": return [range(false), dur].filter(Boolean).join(" · ");
      case "since": return r.ongoing ? `Since ${pointText(r.a, true)}` : range(false);
      case "durationSince": return r.ongoing ? [`Since ${pointText(r.a, true)}`, dur].filter(Boolean).join(" · ") : [range(false), dur].filter(Boolean).join(" · ");
      default: return String(item.date || "");
    }
  }
  // everything about the Experience list: totals + each job's date text, in website order
  function experience(c, now = new Date()) {
    const set = (c.experience && c.experience.display) || {};
    const nowM = nowMonth(now);
    const items = ((c.experience && c.experience.items) || []).map((e, i) => ({ e, i, r: readRange(e.date, nowM) }));
    const counted = items.filter((x) => x.r && !x.e.skip);
    const months = set.countMode === "span"
      ? (counted.length ? nowM - Math.min(...counted.map((x) => x.r.start)) : 0)
      : mergeMonths(counted.map((x) => x.r));
    const exact = months / 12;
    const round = set.yearsRounding || "floor";
    const years = round === "nearest" ? Math.round(exact) : round === "half" ? Math.floor(exact * 2) / 2 : round === "one" ? Math.floor(exact * 10) / 10 : Math.floor(exact);
    let shown = items.filter((x) => !x.e.hide);
    if (set.sort === "newest" || set.sort === "oldest") {
      const key = (x) => (x.r ? (x.r.ongoing ? 1e9 + x.r.start : x.r.end * 1e4 + x.r.start) : -1);
      shown = shown.slice().sort((p, q) => (set.sort === "newest" ? key(q) - key(p) : key(p) - key(q)));
    }
    return {
      months, years, exact,
      text: duration(months, set.durationStyle) || "0 months",
      jobs: shown.map((x) => ({ ...x.e, dateText: jobDate(x.e, x.r, set), ongoing: !!(x.r && x.r.ongoing), months: x.r ? x.r.end - x.r.start : 0 })),
    };
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
    let expCache = null;
    const exp = () => expCache || (expCache = experience(c, now));

    function get(key) {
      if (key in values) return values[key];
      if (stack.has(key)) throw new Error(`{${key}} depends on itself`);
      stack.add(key);
      let v;
      try {
        if (key === "years") {
          v = exp().years;
        } else if (key === "months") {
          v = exp().months;
        } else if (key === "experience") {
          v = exp().exact;
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
    display.experience = exp().text; // words, not a number
    const yr = c.experience?.display?.yearsRounding;
    if (yr === "half" || yr === "one") { display.years = fmt(all.years, "auto"); rawv.years = raw(all.years, "auto"); }
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

  return { compute, fill, workedMonths, experience, duration, fmt, raw, pct, money, parseNum, evaluate, unknownTags, BUILTINS, KEY_RE };
});
