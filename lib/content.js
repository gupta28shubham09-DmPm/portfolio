// Cleans and validates website content against the schema, filling gaps from the defaults.
const defaults = require("./defaults");
const { schema, blank } = require("./schema");
const { upgrade } = require("./upgrade");

const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const PATTERNS = {
  phone: /^\+?[0-9 ]{6,20}$/,
  digits: /^[0-9]{6,20}$/,
  email: /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/,
  link: /^(#[A-Za-z0-9_-]+|https?:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+|tel:[+0-9]+)$/,
  key: /^[a-zA-Z][a-zA-Z0-9_]{0,30}$/,
  numformula: /^(=[0-9a-zA-Z_{}()+\-*\/., ]+|-?[0-9][0-9,]*(\.[0-9]+)?)$/,
};

function sanitize(value, node, fallback) {
  switch (node.t) {
    case "group": {
      const src = value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const fb = fallback && typeof fallback === "object" ? fallback : {};
      const out = {};
      for (const k of Object.keys(node.fields)) out[k] = sanitize(src[k], node.fields[k], fb[k] !== undefined ? fb[k] : blank(node.fields[k]));
      return out;
    }
    case "list": {
      if (!Array.isArray(value)) return Array.isArray(fallback) ? fallback : [];
      // an invalid value inside a box falls back to that box's previous value
      const items = value.slice(0, node.max || 60).map((item, i) =>
        sanitize(item, node.of, Array.isArray(fallback) && fallback[i] !== undefined ? fallback[i] : blank(node.of)));
      // empty single-line items (e.g. a blank tag) are dropped so they don't show as empty boxes
      return node.of.t === "group" ? items : items.filter((v) => v !== "");
    }
    case "toggle":
      return typeof value === "boolean" ? value : !!fallback;
    case "num": {
      if (typeof value === "number" && isFinite(value)) value = String(value);
      if (typeof value !== "string") return fallback ?? "";
      const v = value.trim();
      return v === "" || /^-?\d+(\.\d+)?$/.test(v) || /^\{[a-zA-Z][a-zA-Z0-9_]{0,30}\}$/.test(v) ? v : fallback ?? "";
    }
    case "month": {
      if (typeof value !== "string") return fallback ?? "";
      const v = value.trim();
      return v === "" || /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : fallback ?? "";
    }
    case "url": {
      if (typeof value !== "string") return fallback ?? "";
      const v = value.trim();
      return v === "" || /^https:\/\/[^\s"'<>]+$/.test(v) ? v.slice(0, 300) : fallback ?? "";
    }
    case "color":
      return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : fallback || "#2F5BFF";
    case "slug":
      return typeof value === "string" && /^[a-z0-9]{0,40}$/.test(value.trim()) ? value.trim() : fallback ?? "";
    case "order": {
      // every section exactly once: your order first, anything missing added at the end
      const allowed = node.options.map((o) => o[0]);
      const src = Array.isArray(value) ? value : Array.isArray(fallback) ? fallback : allowed;
      const out = [];
      for (const k of src) if (allowed.includes(k) && !out.includes(k)) out.push(k);
      for (const k of allowed) if (!out.includes(k)) out.push(k);
      return out;
    }
    case "select":
      return node.options.some((o) => o[0] === value) ? value : fallback ?? node.options[0][0];
    default: {
      // text / textarea
      if (typeof value !== "string") return typeof fallback === "string" ? fallback : "";
      const v = value.replace(CTRL, "").trim().slice(0, node.max || (node.t === "textarea" ? 3000 : 300));
      if (node.pattern && v !== "" && !PATTERNS[node.pattern].test(v)) return typeof fallback === "string" ? fallback : "";
      return v;
    }
  }
}

// Saved content merged over the defaults (or over the previous version when saving), always in a valid shape
const normalize = (saved, previous) => sanitize(upgrade(saved) || {}, schema, previous || defaults);

// Explains what was rejected, so the panel can warn instead of silently dropping it
function problems(input) {
  const out = [];
  const walk = (value, node, path) => {
    if (value === undefined || value === null) return;
    if (node.t === "group") return Object.keys(node.fields).forEach((k) => walk(value[k], node.fields[k], path.concat(k)));
    if (node.t === "list") return Array.isArray(value) && value.forEach((v, i) => walk(v, node.of, path.concat(i)));
    if (node.t === "order") return;
    const clean = sanitize(value, node, "\u0000invalid");
    if (clean === "\u0000invalid") out.push(`${path.join(" › ")}: “${String(value).slice(0, 40)}” is not valid (${node.label})`);
  };
  walk(input, schema, []);
  return out;
}

module.exports = { normalize, problems, defaults };
