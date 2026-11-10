(() => {
  "use strict";
  // ---------- Tiny DOM helper (never uses innerHTML for your data) ----------
  const h = (tag, props = {}, ...kids) => {
    const [name, ...cls] = tag.split(".");
    const el = document.createElement(name || "div");
    if (cls.length) el.className = cls.join(" ");
    for (const [k, v] of Object.entries(props || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "class") el.className += (el.className ? " " : "") + v;
      else if (k === "text") el.textContent = v;
      else if (k === "value") el.value = v;
      else if (k in el && typeof v !== "string") el[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : String(kid));
    return el;
  };
  const $ = (id) => document.getElementById(id);
  // replaceChildren that skips empty (null/false) parts
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k !== null && k !== undefined && k !== false));

  const api = async (method, url, body) => {
    const r = await fetch(url, {
      method, credentials: "same-origin",
      headers: { "X-Admin-Request": "1", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (r.status === 401) { if (S.dirty) saveDraft(); S.dirty = false; location.replace("/admin/login"); throw new Error("Logged out"); }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
    return data;
  };

  const S = { kind: "all", live: [], content: null, schema: null, tabs: [], defaults: null, dirty: false, tab: "leads", open: new Set(), leads: [], statuses: [], filter: "all", q: "", savedInDb: true };

  // Parts of the page that recalculate as you type (previews, calculated values)
  let liveTimer;
  const refreshLive = () => { clearTimeout(liveTimer); liveTimer = setTimeout(() => S.live.forEach((f) => { try { f(); } catch (e) { console.warn(e); } }), 150); };

  // ---------- Live preview (right side): your website with unsaved changes ----------
  const Live = (() => {
    const SECTION = { hire: "#hire", hero: "top", about: "#about", results: "#results", experience: "#experience", contact: "#contact", more: "#contact", numbers: "#stats", switches: "top", design: "top" };
    let timer, busy = false, again = false, front = "liveA", device = "desktop", lastUrl = "";
    const store = (k, v) => { try { v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch {} };
    const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
    const isOpen = () => document.body.classList.contains("live-on");
    const state = (txt, cls) => { const el = $("liveState"); if (!el) return; el.className = `live-state ${cls || ""}`; el.lastElementChild.textContent = txt; };
    function fit() {
      const stage = $("liveStage"), scr = $("liveScreen"); if (!stage || !scr) return;
      const w = device === "mobile" ? 390 : 1280;
      const avail = stage.clientWidth - (device === "mobile" ? 24 : 0);
      const scale = Math.min(1, avail / w);
      const h = stage.clientHeight / scale - (device === "mobile" ? 24 / scale : 0);
      scr.style.width = w + "px"; scr.style.height = h + "px";
      scr.style.transform = `scale(${scale})`;
      scr.style.left = Math.max(0, (stage.clientWidth - w * scale) / 2) + "px";
      scr.style.top = device === "mobile" ? "12px" : "0px";
      scr.dataset.device = device;
    }
    function frameScroll(f) { try { return f.contentWindow.scrollY || 0; } catch { return 0; } }
    async function update(force) {
      if (!isOpen() || !S.content) return;
      if (busy) { again = true; return; }
      busy = true; state("Updating…", "busy");
      try {
        const r = await api("POST", "/api/admin/preview", { content: S.content, live: true });
        const cur = $(front), next = $(front === "liveA" ? "liveB" : "liveA");
        const y = lastUrl ? frameScroll(cur) : null;
        await new Promise((ok) => { next.onload = ok; next.src = r.url; setTimeout(ok, 8000); });
        try { if (y !== null) next.contentWindow.scrollTo({ top: y, behavior: "instant" }); else jump(S.tab, next, true); } catch {}
        next.classList.add("front"); cur.classList.remove("front");
        front = next.id; lastUrl = r.url;
        state("Up to date", "ok");
      } catch (e) { state("Couldn't update", "err"); }
      busy = false;
      if (again) { again = false; update(); }
    }
    function schedule() { if (!isOpen()) return; state("Changes waiting…", "busy"); clearTimeout(timer); timer = setTimeout(update, 700); }
    function jump(tab, f, instant) {
      f = f || $(front); const sel = SECTION[tab]; if (!sel || !f) return;
      try {
        const w = f.contentWindow, d = f.contentDocument;
        if (sel === "top") return w.scrollTo({ top: 0, behavior: instant ? "instant" : "smooth" });
        const el = d.querySelector(sel); if (!el) return;
        w.scrollTo({ top: el.getBoundingClientRect().top + w.scrollY - 80, behavior: instant ? "instant" : "smooth" });
      } catch {}
    }
    function setOpen(on) {
      document.body.classList.toggle("live-on", on);
      $("liveBtn").classList.toggle("on", on);
      store("ds_live", on ? "1" : "0");
      if (on) { fit(); if (!lastUrl) update(); else schedule(); }
    }
    function init() {
      const saved = read("ds_live");
      $("liveBtn").onclick = () => setOpen(!isOpen());
      $("liveClose").onclick = () => setOpen(false);
      $("liveReload").onclick = () => update(true);
      document.querySelectorAll("#live .seg button").forEach((b) => b.onclick = () => {
        device = b.dataset.device; store("ds_live_device", device);
        document.querySelectorAll("#live .seg button").forEach((x) => x.classList.toggle("on", x === b));
        fit(); lastUrl = ""; update();
      });
      const dv = read("ds_live_device"); if (dv === "mobile") document.querySelector('#live .seg [data-device="mobile"]').click();
      addEventListener("resize", fit);
      setOpen(saved === null ? innerWidth >= 1200 : saved === "1");
    }
    return { schedule, update, jump, init, isOpen };
  })();

  // ---------- Flash message ----------
  let flashTimer;
  function flash(text, type = "ok", list = []) {
    const f = $("flash");
    fill(f, text, list.length ? h("ul", {}, list.slice(0, 6).map((x) => h("li", { text: x }))) : "");
    f.className = `flash show ${type}`;
    clearTimeout(flashTimer); flashTimer = setTimeout(() => f.classList.remove("show"), list.length ? 9000 : 3500);
  }

  // ---------- Unsaved-changes state ----------
  const DRAFT = "ds_admin_draft";
  let draftTimer;
  const saveDraft = () => { try { localStorage.setItem(DRAFT, JSON.stringify({ content: S.content, base: S.updatedAt, at: Date.now() })); } catch {} };
  const clearDraft = () => { clearTimeout(draftTimer); try { localStorage.removeItem(DRAFT); } catch {} };
  function setDirty(v) {
    S.dirty = v;
    if (v) Live.schedule();
    if (v) { clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 500); }
    $("saveState").classList.toggle("dirty", v);
    $("saveState").lastElementChild.textContent = v ? "Unsaved changes" : "All changes saved";
    $("saveBtn").disabled = !v;
    $("savebar").classList.toggle("show", v);
  }
  addEventListener("beforeunload", (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ""; } });
  addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (S.dirty) save(); } });

  // ---------- Reading / writing values by path ----------
  const get = (path) => path.reduce((o, k) => (o == null ? undefined : o[k]), S.content);
  function set(path, value) {
    let o = S.content;
    for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
    o[path[path.length - 1]] = value;
    setDirty(true);
  }
  function blank(node) {
    if (node.t === "group") { const o = {}; for (const k in node.fields) o[k] = blank(node.fields[k]); return o; }
    if (node.t === "list") return [];
    if (node.t === "toggle") return node.label === "Show this section" || node.label === "Show this card";
    if (node.t === "select") return node.options[0][0];
    if (node.t === "order") return node.options.map((o) => o[0]);
    if (node.t === "color") return "#2F5BFF";
    return "";
  }
  const plain = (v) => String(v ?? "").replace(/\*\*|\*|~/g, "");

  const CHECKS = {
    num: (v) => v === "" || /^-?\d+(\.\d+)?$/.test(v) || /^\{[a-zA-Z][a-zA-Z0-9_]{0,30}\}$/.test(v) || "A number (e.g. 97.71) or one tag like {cpl}. Put ₹, %, + in the boxes before/after.",
    key: (v) => v === "" || /^[a-zA-Z][a-zA-Z0-9_]{0,30}$/.test(v) || "Letters and numbers only, starting with a letter (e.g. cpl, reLeads)",
    numformula: (v) => v === "" || /^(=[0-9a-zA-Z_{}()+\-*\/., ]+|-?[0-9][0-9,]*(\.[0-9]+)?)$/.test(v) || "A number (e.g. 2856) or a formula starting with = (e.g. ={clicks}/{impressions}*100)",
    url: (v) => v === "" || /^https:\/\/\S+$/.test(v) || "Must start with https://",
    slug: (v) => /^[a-z0-9]*$/.test(v) || "Small letters and numbers only (e.g. googleads)",
    phone: (v) => v === "" || /^\+?[0-9 ]{6,20}$/.test(v) || "Use digits with country code, e.g. +917692058084",
    digits: (v) => v === "" || /^[0-9]{6,20}$/.test(v) || "Digits only, with country code, e.g. 917692058084",
    email: (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "That email doesn't look right",
    link: (v) => v === "" || /^(#[A-Za-z0-9_-]+|https?:\/\/\S+|mailto:\S+|tel:[+0-9]+)$/.test(v) || "Use #contact, #leadForm, https://…, mailto:… or tel:…",
  };

  // ---------- Field builders ----------
  function field(node, path, onChange) {
    const value = get(path);
    if (node.t === "toggle") {
      const input = h("input", { type: "checkbox", checked: !!value, onchange: (e) => { set(path, e.target.checked); onChange && onChange(); } });
      return h("label.tg", {}, h("span", { text: node.label }), input, h("i.sw"));
    }
    if (node.t === "group") return groupBlock(node, path, onChange, true);
    if (node.t === "list") return listBlock(node, path);
    if (node.t === "order") return orderBlock(node, path);
    if (node.t === "month") return monthField(node, path, onChange);
    const isTheme = path[0] === "theme";

    const wrap = h("div.f");
    const hint = h("span.hint", { text: node.help || "" });
    const check = CHECKS[node.pattern] || CHECKS[node.t];
    const validate = (v) => {
      const res = check ? check(v) : true;
      wrap.classList.toggle("bad", res !== true);
      hint.textContent = res === true ? node.help || "" : res;
    };
    let input;
    const onInput = (e) => {
      const v = e.target.value; set(path, v); validate(v.trim()); onChange && onChange();
      if (isTheme && path[1] === "preset") applyPreset(v);
    };
    if (node.t === "textarea") input = h("textarea", { value: value ?? "", maxLength: node.max || 3000, oninput: onInput });
    else if (node.t === "select") input = h("select", { onchange: onInput, "data-path": path.join(".") }, node.options.map(([v, l]) => h("option", { value: v, text: l, selected: v === value })));
    else if (node.t === "color") {
      const custom = () => { if (isTheme && path[1] !== "iconCustom" && S.content.theme.preset !== "custom") { S.content.theme.preset = "custom"; const sel = document.querySelector('[data-path="theme.preset"]'); if (sel) sel.value = "custom"; } };
      const text = h("input", { type: "text", value: value || "#2F5BFF", maxLength: 7, "data-path": path.join("."), oninput: (e) => { set(path, e.target.value); custom(); pick.value = /^#[0-9a-fA-F]{6}$/.test(e.target.value) ? e.target.value : pick.value; } });
      const pick = h("input", { type: "color", value: /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#2f5bff", oninput: (e) => { set(path, e.target.value.toUpperCase()); custom(); text.value = e.target.value.toUpperCase(); } });
      input = h("div.color-row", {}, pick, text);
    } else input = h("input", { type: "text", value: value ?? "", maxLength: node.max || 300, inputMode: node.t === "num" ? "decimal" : undefined, oninput: onInput });
    wrap.append(h("label.lbl", { text: node.label }), input, hint);
    if (node.t !== "select" && node.t !== "color") validate(String(value ?? ""));
    return wrap;
  }

  // Month & year picker (a calendar where the browser has one, otherwise two drop-downs)
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hasMonthInput = (() => { const i = document.createElement("input"); i.setAttribute("type", "month"); return i.type === "month"; })();
  function monthField(node, path, onChange) {
    const value = get(path) || "";
    const now = new Date();
    const maxV = `${now.getFullYear() + 1}-12`;
    const save = (v) => { set(path, v); onChange && onChange(); };
    let input;
    if (hasMonthInput) {
      input = h("input", { type: "month", value, min: "1990-01", max: maxV, onchange: (e) => save(e.target.value), oninput: (e) => save(e.target.value) });
    } else {
      const [y0, m0] = value ? value.split("-") : ["", ""];
      const mSel = h("select", {}, h("option", { value: "", text: "Month" }), MONTH_NAMES.map((n, i) => h("option", { value: String(i + 1).padStart(2, "0"), text: n, selected: m0 === String(i + 1).padStart(2, "0") })));
      const years = []; for (let y = now.getFullYear() + 1; y >= 1990; y--) years.push(y);
      const ySel = h("select", {}, h("option", { value: "", text: "Year" }), years.map((y) => h("option", { value: String(y), text: String(y), selected: y0 === String(y) })));
      const upd = () => save(mSel.value && ySel.value ? `${ySel.value}-${mSel.value}` : "");
      mSel.onchange = upd; ySel.onchange = upd;
      input = h("div.month-pick", {}, mSel, ySel);
    }
    return h("div.f", {}, h("label.lbl", { text: node.label }), input, node.help ? h("span.hint", { text: node.help }) : null);
  }

  // Picking a ready-made theme fills in its colours (you can still tweak them; that switches to "Custom")
  function applyPreset(key) {
    const p = S.presets && S.presets[key];
    if (!p) return;
    for (const k of ["bg", "bg2", "accent", "accent2", "text", "muted"]) {
      S.content.theme[k] = p[k];
      const t = document.querySelector(`[data-path="theme.${k}"]`);
      if (t) { t.value = p[k]; const pick = t.previousElementSibling; if (pick) pick.value = p[k].toLowerCase(); }
    }
    swatch();
  }
  function swatch() {
    const box = document.getElementById("themeSwatch");
    if (!box) return;
    const t = S.content.theme, p = t.preset !== "custom" && S.presets[t.preset] ? S.presets[t.preset] : t;
    box.style.background = p.bg; box.style.color = p.text; box.style.borderColor = p.bg2;
    box.querySelector(".sw-card").style.background = p.bg2;
    box.querySelector(".sw-btn").style.background = p.accent;
    box.querySelector(".sw-btn").style.color = luminance(p.accent) > 0.4 ? "#111" : "#fff";
    box.querySelector(".sw-blue").style.color = p.accent2;
    box.querySelector(".sw-muted").style.color = p.muted;
    box.querySelector(".sw-title").style.fontFamily = `"${t.headingFont}", sans-serif`;
  }
  function luminance(hex) {
    const n = parseInt(String(hex).replace("#", ""), 16) || 0;
    return [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  }

  // Section order: move sections up and down (nothing can be deleted here; hide sections with their own switch)
  function orderBlock(node, path) {
    const holder = h("div.list");
    const labels = Object.fromEntries(node.options);
    const draw = () => {
      const arr = get(path);
      const rows = arr.map((k, i) => h("div.item", {}, h("div.item-head.static", {},
        h("span.num", { text: i + 1 }), h("span.title", { text: labels[k] || k }),
        h("div.item-tools", {},
          h("button.btn.btn-sm.btn-icon", { title: "Move up", text: "↑", disabled: i === 0, onclick: () => { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setDirty(true); draw(); } }),
          h("button.btn.btn-sm.btn-icon", { title: "Move down", text: "↓", disabled: i === arr.length - 1, onclick: () => { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; setDirty(true); draw(); } })))));
      fill(holder, h("div.list-head", {}, h("label.lbl", { text: node.label })), h("div.items", {}, rows),
        h("p.hint", { text: "The top section always stays first. To hide a section, use its own “Show this section” switch." }));
    };
    draw();
    return holder;
  }

  function groupBlock(node, path, onChange, nested) {
    const keys = Object.keys(node.fields);
    const allToggles = keys.every((k) => node.fields[k].t === "toggle");
    const box = h(allToggles ? "div.toggles" : "div.fields");
    keys.forEach((k) => box.append(field(node.fields[k], path.concat(k), onChange)));
    if (nested && node.label) return h("div.sub-group", {}, h("div.lbl", { text: node.label }), box);
    return box;
  }

  function listBlock(node, path) {
    const holder = h("div.list");
    const draw = () => {
      let arr = get(path);
      if (!Array.isArray(arr)) { arr = []; set(path, arr); }
      const max = node.max || 60;
      const isGroup = node.of.t === "group";
      const items = h("div.items");
      const move = (i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; remapOpen(i, j); setDirty(true); draw(); };
      const remapOpen = (i, j) => { const a = key(i), b = key(j), ai = S.open.has(a), bi = S.open.has(b); S.open.delete(a); S.open.delete(b); if (ai) S.open.add(b); if (bi) S.open.add(a); };
      const key = (i) => path.concat(i).join(".");
      const shiftOpen = (from, d) => {
        const prefix = path.join(".") + ".";
        const moved = [...S.open].filter((k) => k.startsWith(prefix)).map((k) => [k, k.slice(prefix.length)]);
        moved.forEach(([k]) => S.open.delete(k));
        moved.forEach(([k, rest]) => {
          const [idx, ...tail] = rest.split("."); const n = Number(idx);
          if (d < 0 && n === from) return; // the deleted box
          const ni = n > from ? n + d : n; // boxes after the change move by one
          S.open.add([prefix + ni, ...tail].join("."));
        });
      };
      const tools = (i) => {
        const del = h("button.btn.btn-sm.btn-icon.btn-danger", { title: "Delete", text: "✕", onclick: (e) => {
          e.stopPropagation();
          if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Delete?"; del.classList.remove("btn-icon"); setTimeout(() => { del.classList.remove("confirm"); del.textContent = "✕"; del.classList.add("btn-icon"); }, 3000); return; }
          arr.splice(i, 1); shiftOpen(i, -1); setDirty(true); draw();
        } });
        return h("div.item-tools", {},
          h("button.btn.btn-sm.btn-icon", { title: "Move up", text: "↑", disabled: i === 0, onclick: (e) => { e.stopPropagation(); move(i, -1); } }),
          h("button.btn.btn-sm.btn-icon", { title: "Move down", text: "↓", disabled: i === arr.length - 1, onclick: (e) => { e.stopPropagation(); move(i, 1); } }),
          isGroup ? h("button.btn.btn-sm.btn-icon", { title: "Duplicate", text: "⧉", disabled: arr.length >= max, onclick: (e) => { e.stopPropagation(); shiftOpen(i, 1); arr.splice(i + 1, 0, JSON.parse(JSON.stringify(arr[i]))); setDirty(true); draw(); } }) : null,
          del);
      };
      arr.forEach((val, i) => {
        if (!isGroup) {
          const f = field(node.of, path.concat(i));
          const input = f.querySelector("input, textarea");
          items.append(h("div.prim-row", {}, h("div.f", { class: "grow" }, input, f.querySelector(".hint")), tools(i)));
          if (input) input.closest(".f").style.flex = "1";
          return;
        }
        const titleKey = node.of.title;
        const titleText = () => plain(titleKey ? val[titleKey] : "") || "(empty — click to edit)";
        const title = h("span.title", { text: titleText() });
        title.classList.toggle("empty", !plain(titleKey ? val[titleKey] : ""));
        const body = h("div.item-body");
        const meta = node.of.layout === "job" ? h("span.item-meta") : null;
        if (meta) S.live.push(() => { if (meta.isConnected) meta.textContent = jobSummary(val); });
        if (meta) meta.textContent = jobSummary(val);
        const item = h("div.item", {}, h("div.item-head", { onclick: () => toggle() }, h("span.num", { text: i + 1 }), title, meta, tools(i), h("span.chev", { text: "›" })), body);
        const onEdit = () => { title.textContent = titleText(); title.classList.toggle("empty", !plain(val[titleKey])); };
        const fillBody = () => { fill(body, node.of.layout === "job" ? jobBlock(node.of, path.concat(i), onEdit) : groupBlock(node.of, path.concat(i), onEdit, false)); };
        const toggle = () => { const k = key(i); if (S.open.has(k)) { S.open.delete(k); item.classList.remove("open"); } else { S.open.add(k); fillBody(); item.classList.add("open"); } };
        if (S.open.has(key(i))) { fillBody(); item.classList.add("open"); }
        items.append(item);
      });
      const add = h("button.btn.add-btn", { text: arr.length >= max ? `Maximum ${max} reached` : `+ Add ${isGroup ? "new box" : "item"}`, disabled: arr.length >= max, onclick: () => {
        arr.push(blank(node.of)); if (isGroup) S.open.add(key(arr.length - 1)); setDirty(true); draw();
        const last = holder.querySelector(".items > :last-child input, .items > :last-child textarea"); if (last) last.focus();
      } });
      fill(holder, h("div.list-head", {}, h("label.lbl", { text: node.label }), h("span.n", { text: `${arr.length} item${arr.length === 1 ? "" : "s"}` })), items, add);
    };
    draw();
    return holder;
  }

  // ---------- Pages ----------
  function contentPage(tab) {
    const main = $("main");
    fill(main, 
      h("h1.page-title", { text: `${tab.icon} ${tab.label}` }),
      h("p.page-sub", { text: "Edit anything below, then click “Save changes”. Your website updates instantly." }),
      tab.id === "switches" || tab.id === "numbers" ? null : h("div.tip", {}, "Text tips: ", h("code", { text: "*word*" }), " = yellow highlight · ", h("code", { text: "~word~" }), " = blue highlight · ", h("code", { text: "**word**" }), " = bold · ", h("code", { text: "{years}" }), " = a calculated number (see 🔢 Key numbers). Use ↑ ↓ to reorder boxes, ⧉ to copy one, ✕ to delete."),
    );
    if (tab.id === "numbers") main.append(numbersCard());
    else { const warn = tagWarnings(); if (warn) main.append(warn); }
    for (const key of tab.keys) {
      if (key === "experience") { experienceCards().forEach((cd) => main.append(cd)); continue; }
      if (key === "siteMode") { main.append(modeCard()); continue; }
      const node = S.schema.fields[key];
      const card = h("section.card", {}, h("h2", { text: node.label || key }), node.help ? h("p.help", { text: node.help }) : null);
      if (key === "theme") card.append(h("div.swatch", { id: "themeSwatch" },
        h("div.sw-card", {}, h("b.sw-title", { text: "Sample heading" }), h("p.sw-muted", { text: "This is how soft text looks." }), h("span.sw-blue", { text: "Second accent" })),
        h("span.sw-btn", { text: "Button" })), h("p.hint", { text: "Tip: use “Preview” (top right) to see the full website with your new look before saving." }));
      if (node.t === "list") card.append(h("div.fields", {}, listBlock(node, [key])));
      else card.append(groupBlock(node, [key], key === "theme" ? swatch : null, false));
      main.append(card);
    }
    if (tab.id === "design") main.append(photoCard());
    if (tab.id === "hire") main.append(resumeCard());

    swatch();
  }

  // ---------- Experience page: jobs with calendar dates, settings as clickable examples, live preview ----------
  const EXP = ["experience"];
  const expSet = () => S.content.experience.display;
  const DN = () => window.DSNumbers;
  // a job's short summary for its closed box, e.g. "Mar 2023 – Jan 2026 · 2 yrs 11 mos"
  function jobSummary(job) {
    if (!DN()) return "";
    const r = DN().readJob(job, DN().nowMonth(new Date()));
    if (!r) return job.date ? job.date : "no dates yet";
    const set = { ...expSet(), dateStyle: "datesDuration" };
    const t = DN().experience({ experience: { display: set, items: [{ ...job, hide: false, dateStyle: "main" }] } }).jobs[0].dateText;
    return [t, job.skip ? "not counted" : "", job.hide ? "hidden" : ""].filter(Boolean).join(" · ");
  }
  // the website result if one setting had a different value (for the examples on each option)
  function tryOption(key, value) {
    const c = JSON.parse(JSON.stringify(S.content));
    c.experience.display[key] = value;
    return { info: DN().experience(c), ctx: DN().compute(c) };
  }
  // a setting shown as clickable cards, each with a live example from your own jobs
  function tiles(key, title, help, example, notes = {}) {
    const node = S.schema.fields.experience.fields.display.fields[key];
    const grid = h("div.tiles");
    const draw = () => {
      const cur = expSet()[key];
      fill(grid, node.options.map(([v, name, desc]) => {
        let ex = ""; try { ex = example(v); } catch {}
        return h("button.tile", { type: "button", class: v === cur ? "on" : "", onclick: () => { set(EXP.concat("display", key), v); refreshLive(); } },
          h("span.tile-name", { text: name }),
          h("span.tile-ex", { text: ex || "—" }),
          desc ? h("span.tile-desc", { text: desc }) : null,
          notes[v] ? h("span.tile-note", { text: notes[v] }) : null);
      }));
    };
    S.live.push(() => { if (grid.isConnected) draw(); });
    draw();
    return h("div.setting", {}, h("div.setting-title", { text: title }), help ? h("p.hint", { text: help }) : null, grid);
  }
  function jobBlock(node, path, onEdit) {
    const F = node.fields;
    const wrap = h("div.job");
    const job = () => get(path);
    const status = h("div.job-status");
    const showStatus = () => {
      const j = job(); if (!DN()) return;
      const r = DN().readJob(j, DN().nowMonth(new Date()));
      let text = "", bad = false;
      if (!j.start && !r) { text = "Pick the month you started (and ended) to count this job."; bad = true; }
      else if (!j.start && r) { text = `No months picked yet, so “${j.date}” is counted as full years. Pick months above for an exact count.`; bad = true; }
      else if (r.issue === "noEnd") { text = "Pick the month you left, or switch on “I currently work here”."; bad = true; }
      else if (r.issue === "endBeforeStart") { text = "The end month is before the start month."; bad = true; }
      else if (r.issue === "future") { text = "The start month is in the future, so this job adds nothing yet."; bad = true; }
      else text = `✓ ${DN().duration(r.end - r.start, expSet().durationStyle) || "less than a month"}${j.skip ? " · not counted in your years" : ""}`;
      status.textContent = text; status.classList.toggle("bad", bad);
    };
    const changed = () => { onEdit && onEdit(); showStatus(); };
    const moreKey = path.join(".") + ".more";
    const draw = () => {
      const j = job();
      const more = h("details.job-more", { open: S.open.has(moreKey), ontoggle: (e) => (e.target.open ? S.open.add(moreKey) : S.open.delete(moreKey)) },
        h("summary", { text: "More options (custom text, date style, don't count, hide)" }),
        h("div.fields", {}, field(F.date, path.concat("date"), changed), field(F.dateStyle, path.concat("dateStyle"), changed)),
        h("div.toggles", {}, field(F.skip, path.concat("skip"), changed), field(F.hide, path.concat("hide"), changed)));
      fill(wrap,
        h("div.job-grid", {}, field(F.role, path.concat("role"), changed), field(F.company, path.concat("company"), changed)),
        h("div.job-when", {},
          h("div.setting-title", { text: "📅 When did you work here?" }),
          h("div.job-dates", {},
            field(F.start, path.concat("start"), changed),
            h("span.job-to", { text: "to" }),
            j.current ? h("div.f.job-now", {}, h("label.lbl", { text: "Ended" }), h("div.now-pill", { text: expSet().presentWord || "Present" })) : field(F.end, path.concat("end"), changed)),
          h("div.toggles", {}, field(F.current, path.concat("current"), () => { changed(); draw(); })),
          status),
        field(F.text, path.concat("text"), changed),
        more);
      showStatus();
    };
    draw();
    return wrap;
  }
  function experienceCards() {
    const E = S.schema.fields.experience.fields;
    const D = E.display.fields;
    const sample = (info) => { const j = info.jobs.find((x) => x.dateText) || info.jobs[0]; return j ? j.dateText : ""; };
    const gapNote = h("div");
    const yearsNow = h("div.big-result");
    S.live.push(() => {
      if (!DN()) return;
      const info = DN().experience(S.content), ctx = DN().compute(S.content);
      const st = expSet().dateStyle;
      const hides = st === "duration" || st === "hidden";
      fill(gapNote, info.gaps.length ? h(hides ? "div.ok-box" : "div.warn-box", {},
        h("b", { text: hides ? "✓ Gap hidden. " : "Heads-up: your dates show a gap. " }),
        info.gaps.map((g) => `${g.from === g.to ? g.from : `${g.from} – ${g.to}`} (${DN().duration(g.months, "short")})`).join(", ") + ". ",
        hides ? "Your website shows durations only, so nobody sees it." : "To keep it off the website, pick “Duration only” or “Hide dates” below.") : null);
      fill(yearsNow, h("span", { text: "Your website will say" }), h("b", { text: `${ctx.display.years}+ years` }),
        h("span", { text: `Total worked: ${info.text} · ${ctx.display.companies} companies` }));
    });
    const cards = [
      h("section.card", {}, h("h2", { text: "🎓 Experience section" }),
        h("div.fields", {}, field(E.show, EXP.concat("show")), field(E.navLabel, EXP.concat("navLabel")), field(E.title, EXP.concat("title"))),
        h("p.hint", { text: "{years} and {companies} in the heading are filled in automatically from your jobs below." })),
      h("section.card", {}, h("h2", { text: "① Your jobs" }),
        h("p.help", { text: "Add each job with the month you started and the month you left. Your years of experience are calculated from these dates." }),
        gapNote, listBlock(E.items, EXP.concat("items"))),
      h("section.card", {}, h("h2", { text: "② How dates look on your website" }),
        h("p.help", { text: "Click a card to choose it. Each card shows how your own latest job will look." }),
        tiles("dateStyle", "Job dates", "", (v) => sample(tryOption("dateStyle", v).info),
          { duration: "Hides gaps", hidden: "Hides gaps", asTyped: "Uses each job's custom text" }),
        tiles("durationStyle", "Duration style", "Used in durations and in {experience}.", (v) => tryOption("durationStyle", v).info.text),
        h("div.fields", {}, field(D.presentWord, EXP.concat("display", "presentWord"))),
        h("div.toggles", {}, field(D.currentBadge, EXP.concat("display", "currentBadge"))),
        tiles("sort", "Job order", "", (v) => { const j = tryOption("sort", v).info.jobs[0]; return j ? `First: ${j.role}` : ""; })),
      h("section.card", {}, h("h2", { text: "③ Your years of experience" }),
        yearsNow,
        tiles("countMode", "How years are counted", "", (v) => `${tryOption("countMode", v).info.text}`, { worked: "Gaps not counted", span: "Gaps counted" }),
        tiles("yearsRounding", "The {years} number", "Shown in your top stats, About text and Experience heading.", (v) => `${tryOption("yearsRounding", v).ctx.display.years}+ years`),
        h("div.toggles", {}, field(D.totalBadge, EXP.concat("display", "totalBadge"))),
        h("div.fields", {}, field(D.totalLabel, EXP.concat("display", "totalLabel")))),
      experiencePreview(),
    ];
    S.live.forEach((f) => f());
    return cards;
  }
  function experiencePreview() {
    const body = h("div.site-pv");
    const draw = () => {
      if (!DN()) return;
      const info = DN().experience(S.content);
      const set = expSet();
      const title = DN().fill(S.content.experience.title, DN().compute(S.content)).replace(/\*\*|\*|~/g, "");
      fill(body,
        h("div.pv-head", { text: title }),
        set.totalBadge && info.months ? h("div.pv-total", {}, `${set.totalLabel}${set.totalLabel ? ": " : ""}`, h("b", { text: info.text })) : null,
        info.jobs.length ? info.jobs.map((j) => h("div.pv-job", {},
          j.dateText || (j.ongoing && set.currentBadge) ? h("div.pv-date", {}, j.dateText, j.ongoing && set.currentBadge ? h("span.pv-badge", { text: "Current" }) : null) : null,
          h("div.pv-role", {}, j.role || "(no role)", j.company ? h("em", { text: ` · ${j.company}` }) : null),
          j.skip ? h("div.pv-note", { text: "Shown, but not counted in your years" }) : null)) : h("p.hint", { text: "No jobs to show." }));
    };
    S.live.push(() => { if (body.isConnected) draw(); });
    draw();
    return h("section.card", {}, h("h2", { text: "👀 Preview — how it looks on your website" }),
      h("p.help", { text: "Updates as you edit. Click “Save changes” to publish, or “Preview” (top) to see the full website." }), body);
  }

  // ---------- Key numbers: live table of every calculated value ----------
  function calc() { return window.DSNumbers ? DSNumbers.compute(S.content) : null; }
  function tagWarnings() {
    const ctx = calc(); if (!ctx) return null;
    const bad = DSNumbers.unknownTags(S.content, ctx);
    return bad.length ? h("div.warn-box", { text: `These tags don't exist yet, so they show as typed on the website: ${bad.map((b) => `{${b}}`).join(" ")}. Add them in 🔢 Key numbers or fix the spelling.` }) : null;
  }
  function numbersCard() {
    const body = h("div");
    const card = h("section.card", {}, h("h2", { text: "Calculated values (live)" }),
      h("p.help", { text: "Type a tag like {years} in any text or number box, anywhere in the panel, and the website shows the value below. Change a number here once and it updates everywhere. Click a tag to copy it." }), body);
    const draw = () => {
      const ctx = calc();
      if (!ctx) { fill(body, h("p.hint", { text: "Couldn't load the calculator. Refresh the page." })); return; }
      const defs = {}; (S.content.numbers || []).forEach((n) => { if (n && n.key && !defs[n.key]) defs[n.key] = n; });
      const rows = [...ctx.known].map((k) => {
        const auto = ctx.builtins[k];
        const how = auto || [defs[k].label, String(defs[k].value || "").startsWith("=") ? `formula ${defs[k].value}` : ""].filter(Boolean).join(" · ");
        const tag = h("button.chip-tag", { type: "button", text: `{${k}}`, title: "Copy", onclick: () => { navigator.clipboard && navigator.clipboard.writeText(`{${k}}`); flash(`Copied {${k}}`); } });
        return h("tr", {}, h("td", {}, tag), h("td.val", { text: ctx.display[k] }), h("td.how", { text: (auto ? "Auto · " : "") + how }));
      });
      fill(body,
        h("div.num-table-wrap", {}, h("table.num-table", {}, h("thead", {}, h("tr", {}, h("th", { text: "Tag" }), h("th", { text: "Value" }), h("th", { text: "Where it comes from" }))), h("tbody", {}, rows))),
        ctx.errors.length ? h("div.warn-box", {}, h("b", { text: "Please check: " }), ctx.errors.join(" ")) : null,
        tagWarnings(),
        h("p.hint", { text: "Auto numbers: years, months and experience come from your Experience dates — set how they're counted and shown in Experience & skills › How experience is shown · companies = different companies in Experience · budget = all industry budgets (Results) added up · leads = all industry leads added up. Funnel % and the budget bar are also calculated automatically." }));
    };
    S.live.push(() => { if (body.isConnected) draw(); });
    draw();
    return card;
  }

  // ---------- Website mode: business / portfolio / both ----------
  function modeCard() {
    const node = S.schema.fields.siteMode;
    const grid = h("div.tiles.mode-tiles");
    const summary = h("div.mode-sum");
    const ICON = { business: "🤝", portfolio: "💼", both: "✨" };
    const draw = () => {
      const cur = S.content.siteMode, H = S.content.hire;
      fill(grid, node.options.map(([v, name, desc]) => h("button.tile", { type: "button", class: v === cur ? "on" : "", onclick: () => { set(["siteMode"], v); draw(); refreshLive(); } },
        h("span.tile-name", { text: `${ICON[v]} ${name}` }), h("span.tile-desc", { text: desc }))));
      const lines = cur === "business"
        ? ["“Book a Call” button in the menu and top section", "Hire me section and Hire Me buttons are hidden", "Leads come from the client form"]
        : [cur === "portfolio" ? `“${H.buttonText || "Hire Me"}” is the main button (menu + top section)` : `“Book a Call” stays main; “${H.buttonText || "Hire Me"}” is added next to it`,
          cur === "portfolio" ? `Top badge shows: “${H.statusText || "—"}”` : "Top badge stays your normal availability text",
          H.show ? "Hire me section is shown (with its own form)" : "⚠ Hire me section is switched off below, so Hire Me buttons won't show",
          H.status === "closed" ? "⚠ Status is “Not looking”, so Hire Me buttons are hidden" : "Job offers arrive in 📥 Leads, marked 💼 Job offer"];
      fill(summary, h("b", { text: "What visitors will see:" }), h("ul", {}, lines.map((t) => h("li", { text: t }))));
    };
    S.live.push(() => { if (grid.isConnected) draw(); });
    draw();
    return h("section.card", {}, h("h2", { text: "Website mode" }),
      h("p.help", { text: "Switch your whole website between a business site for clients and a portfolio for jobs, any time. Your content stays; only the buttons and sections change." }),
      grid, summary);
  }
  function resumeCard() {
    const status = h("p.hint", { text: S.resume.url ? "✓ A resume PDF is uploaded. Visitors can open it from the Hire me section." : "No resume uploaded yet." });
    const input = h("input", { type: "file", accept: "application/pdf", class: "hidden", onchange: async (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 5e6) return flash("PDF is too large (max 5 MB).", "err");
      try {
        status.textContent = "Uploading…";
        const dataUrl = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(new Error("Couldn't read the file")); r.readAsDataURL(file); });
        await api("PUT", "/api/admin/resume", { dataUrl: dataUrl.replace(/^data:[^;]*;/, "data:application/pdf;") });
        await loadContent(true); flash("✓ Resume uploaded."); go("hire");
      } catch (err) { status.textContent = ""; flash(err.message, "err"); }
    } });
    const remove = h("button.btn.btn-sm", { text: "Remove resume", disabled: !S.resume.url, onclick: async () => {
      if (!remove.classList.contains("confirm")) { remove.classList.add("btn-danger", "confirm"); remove.textContent = "Sure? Click again"; setTimeout(() => { remove.classList.remove("btn-danger", "confirm"); remove.textContent = "Remove resume"; }, 3000); return; }
      try { await api("DELETE", "/api/admin/resume"); await loadContent(true); flash("Resume removed."); go("hire"); } catch (err) { flash(err.message, "err"); }
    } });
    return h("section.card", {}, h("h2", { text: "📄 Your resume (PDF)" }),
      h("p.help", { text: "Upload your latest resume. It's used by the resume button in the Hire me section (unless you add a Google Drive link above). It changes on the website immediately." }),
      h("div", {}, h("button.btn.btn-primary.btn-sm", { text: S.resume.url ? "Upload a new PDF" : "Upload PDF", onclick: () => input.click() }), " ",
        S.resume.url ? h("a.btn.btn-sm", { href: S.resume.url, target: "_blank", rel: "noopener", text: "Open current" }) : null, " ", remove, status, input));
  }

  function photoCard() {
    const img = h("img.photo-prev", { src: S.photo.url, alt: "Your current photo" });
    const status = h("p.hint", { text: S.photo.custom ? "You're using an uploaded photo." : "You're using the original photo." });
    const input = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", class: "hidden", onchange: async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        status.textContent = "Uploading…";
        const dataUrl = await shrink(file);
        await api("PUT", "/api/admin/photo", { dataUrl });
        await loadContent(true); flash("✓ Photo updated on your website.");
        go("design");
      } catch (err) { status.textContent = ""; flash(err.message, "err"); }
    } });
    const reset = h("button.btn.btn-sm", { text: "Use original photo", disabled: !S.photo.custom, onclick: async () => {
      if (!reset.classList.contains("confirm")) { reset.classList.add("btn-danger", "confirm"); reset.textContent = "Sure? Click again"; setTimeout(() => { reset.classList.remove("btn-danger", "confirm"); reset.textContent = "Use original photo"; }, 3000); return; }
      try { await api("DELETE", "/api/admin/photo"); await loadContent(true); flash("Original photo restored."); go("design"); } catch (err) { flash(err.message, "err"); }
    } });
    return h("section.card", {}, h("h2", { text: "Your photo" }),
      h("p.help", { text: "Shown on the top section and when your link is shared. A tall portrait photo (4:5) looks best. It changes on the website immediately, without clicking Save." }),
      h("div.photo-row", {}, img, h("div", {}, h("button.btn.btn-primary.btn-sm", { text: "Upload new photo", onclick: () => input.click() }), " ", reset, status, input)));
  }
  // Resize big phone photos in the browser before uploading (max 1000px, good quality)
  function shrink(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Please choose a JPG, PNG or WebP image."));
      if (file.size > 25e6) return reject(new Error("That image is too big (max 25 MB)."));
      const reader = new FileReader(); const im = new Image();
      im.onload = () => {
        const scale = Math.min(1, 1000 / Math.max(im.width, im.height));
        const cv = document.createElement("canvas"); cv.width = Math.round(im.width * scale); cv.height = Math.round(im.height * scale);
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
        resolve(cv.toDataURL("image/jpeg", 0.86));
      };
      im.onerror = () => reject(new Error("Couldn't read that image."));
      reader.onload = () => { im.src = reader.result; };
      reader.onerror = () => reject(new Error("Couldn't read that file."));
      reader.readAsDataURL(file);
    });
  }

  const fmtDate = (d) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  const waNum = (p) => { const d = String(p || "").replace(/\D/g, ""); return d.length === 10 ? "91" + d : d; };
  const STATUS_LABEL = { new: "🟡 New", contacted: "🔵 Contacted", converted: "🟢 Converted", "not-interested": "⚪ Not interested", spam: "🚫 Spam" };

  async function loadLeads() {
    const d = await api("GET", "/api/admin/leads");
    S.leads = d.leads; S.statuses = d.statuses; S.savedInDb = d.savedInDb;
    updateCounts();
  }
  function updateCounts() {
    const n = S.leads.filter((l) => l.status === "new").length;
    document.querySelectorAll("[data-count-for=leads]").forEach((el) => { el.textContent = n; el.classList.toggle("hidden", !n); });
  }

  function leadsPage() {
    const main = $("main");
    const count = (s) => S.leads.filter((l) => l.status === s).length;
    const list = h("div.leads");
    const draw = () => {
      const q = S.q.toLowerCase();
      const rows = S.leads.filter((l) => (S.filter === "all" || l.status === S.filter) && (S.kind === "all" || (l.kind || "client") === S.kind) &&
        (!q || [l.name, l.company, l.phone, l.email, l.service, l.message, l.note].join(" ").toLowerCase().includes(q)));
      fill(list, ...(rows.length ? rows.map(leadCard) : [h("div.empty-state", { text: S.leads.length ? "No leads match this filter." : "No leads yet. When someone fills in your website form, they'll appear here." })]));
    };
    const chips = h("div.chips", {}, ["all", ...S.statuses].map((s) => h("button.chip", {
      class: S.filter === s ? "active" : "", onclick: () => { S.filter = s; leadsPage(); },
    }, s === "all" ? "All" : STATUS_LABEL[s] || s, h("span.c", { text: s === "all" ? S.leads.length : count(s) }))));
    const kinds = h("div.chips", {}, [["all", "All types"], ["client", "🤝 Clients"], ["hire", "💼 Job offers"]].map(([k, t]) => h("button.chip", {
      class: S.kind === k ? "active" : "", onclick: () => { S.kind = k; leadsPage(); },
    }, t, h("span.c", { text: k === "all" ? S.leads.length : S.leads.filter((l) => (l.kind || "client") === k).length }))));
    const search = h("input.input.search", { type: "search", placeholder: "Search name, phone, message…", value: S.q, oninput: (e) => { S.q = e.target.value; draw(); } });
    fill(main, 
      h("h1.page-title", { text: "📥 Leads" }),
      h("p.page-sub", { text: "Everyone who filled in your website form. Update the status as you follow up." }),
      S.savedInDb ? null : h("div.notice", { text: "Database not connected: leads are only kept until the server restarts. Add DATABASE_URL on Render." }),
      h("div.stat-row", {},
        h("div.stat-box", {}, h("b", { text: S.leads.length }), h("span", { text: "Total leads" })),
        h("div.stat-box", {}, h("b", { text: count("new") }), h("span", { text: "New (not contacted)" })),
        h("div.stat-box", {}, h("b", { text: count("contacted") }), h("span", { text: "Contacted" })),
        h("div.stat-box", {}, h("b", { text: count("converted") }), h("span", { text: "Converted" }))),
      h("div.lead-tools", {}, kinds, chips, search,
        h("button.btn.btn-sm", { text: "↻ Refresh", onclick: async () => { await loadLeads(); leadsPage(); flash("Leads refreshed"); } }),
        h("a.btn.btn-sm", { href: "/api/admin/leads.csv", text: "⬇ Download Excel (CSV)" })),
      list);
    draw();
  }

  function leadCard(l) {
    const patch = async (body) => {
      try { await api("PATCH", `/api/admin/leads/${l.id}`, body); Object.assign(l, body); updateCounts(); return true; }
      catch (e) { flash(e.message, "err"); return false; }
    };
    const status = h("select", { onchange: async (e) => { if (await patch({ status: e.target.value })) { card.className = `lead st-${l.status}`; flash("Status updated"); } } },
      S.statuses.map((s) => h("option", { value: s, text: STATUS_LABEL[s] || s, selected: s === l.status })));
    const del = h("button.btn.btn-sm.btn-danger", { text: "Delete", onclick: async () => {
      if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Sure? Click again"; setTimeout(() => { del.classList.remove("confirm"); del.textContent = "Delete"; }, 3000); return; }
      try { await api("DELETE", `/api/admin/leads/${l.id}`); S.leads = S.leads.filter((x) => x !== l); card.remove(); updateCounts(); flash("Lead deleted"); } catch (e) { flash(e.message, "err"); }
    } });
    const note = h("input", { type: "text", placeholder: "Add a private note (press Enter to save)…", value: l.note || "", maxLength: 1000,
      onkeydown: (e) => { if (e.key === "Enter") e.target.blur(); },
      onchange: async (e) => { if (await patch({ note: e.target.value })) flash("Note saved"); } });
    const card = h("article", { class: `lead st-${l.status}` },
      h("div", {},
        h("h3", {}, l.name, l.company ? h("span.lead-co", { text: ` · ${l.company}` }) : null,
          h("span", { class: `kind-badge ${l.kind === "hire" ? "hire" : "client"}`, text: l.kind === "hire" ? "💼 Job offer" : "🤝 Client" })),
        h("div.meta", {},
          h("span", { text: fmtDate(l.created_at) }),
          l.phone ? h("a", { href: `tel:${l.phone.replace(/[^+\d]/g, "")}`, text: `📞 ${l.phone}` }) : null,
          l.phone ? h("a", { href: `https://wa.me/${waNum(l.phone)}`, target: "_blank", rel: "noopener", text: "💬 WhatsApp" }) : null,
          l.email ? h("a", { href: `mailto:${l.email}`, text: `✉️ ${l.email}` }) : null),
        h("div.meta", {}, l.service ? h("span.tag", { text: l.kind === "hire" ? `Role: ${l.service}` : l.service }) : null, l.budget ? h("span.tag", { text: l.kind === "hire" ? l.budget : `Budget: ${l.budget}` }) : null)),
      h("div.side-tools", {}, status, del),
      l.message ? h("div.msgtext", { text: l.message }) : null,
      h("div.note", {}, note));
    return card;
  }

  async function versionsPage() {
    const main = $("main");
    fill(main, h("h1.page-title", { text: "🕘 Versions & undo" }), h("p.page-sub", { text: "Every time you save, the previous version is kept (last 30). Restore one if something goes wrong." }), h("p.page-sub", { text: "Loading…" }));
    let list = [];
    try { list = (await api("GET", "/api/admin/history")).history; } catch (e) { flash(e.message, "err"); }
    const confirmBtn = (label, run) => {
      const b = h("button.btn.btn-sm", { text: label, onclick: async () => {
        if (S.dirty) return flash("Save or discard your current changes first.", "err");
        if (!b.classList.contains("confirm")) { b.classList.add("btn-danger", "confirm"); b.textContent = "Sure? Click again"; setTimeout(() => { b.classList.remove("btn-danger", "confirm"); b.textContent = label; }, 3000); return; }
        try { await run(); await loadContent(); clearDraft(); flash("Done! Your website has been updated."); versionsPage(); } catch (e) { flash(e.message, "err"); }
      } });
      return b;
    };
    fill(main, 
      h("h1.page-title", { text: "🕘 Versions & undo" }),
      h("p.page-sub", { text: "Every time you save, the previous version is kept (last 30). Restore one if something goes wrong." }),
      list.length ? h("div.versions", {}, list.map((v, i) => h("div.version", {}, h("div", {}, h("span", { text: fmtDate(v.saved_at) }), h("small", { text: i === 0 ? "the version before your last save" : "" })),
        confirmBtn("Restore this version", () => api("POST", `/api/admin/history/${v.id}/restore`)))))
        : h("div.empty-state", { text: "No older versions yet. They appear after you save changes." }),
      h("section.card", { class: "danger-zone" }, h("h2", { text: "Start over" }), h("p.help", { text: "Puts every text, number and switch back to the original website content. Your current version is kept above, so you can undo this too." }),
        confirmBtn("Reset to original content", () => api("POST", "/api/admin/reset"))));
  }

  // ---------- Navigation ----------
  function pages() {
    return [{ id: "leads", label: "Leads", icon: "📥" }, ...S.tabs, { id: "versions", label: "Versions & undo", icon: "🕘" }];
  }
  function buildNav() {
    const side = $("side"), mob = $("mobileTabs");
    side.replaceChildren(); mob.replaceChildren();
    pages().forEach((p, i) => {
      if (i === 1 || p.id === "versions") side.append(h("hr"));
      side.append(h("button", { "data-tab": p.id, onclick: () => go(p.id) }, h("span.ico", { text: p.icon }), p.label, p.id === "leads" ? h("span.count.hidden", { "data-count-for": "leads" }) : null));
      mob.append(h("option", { value: p.id, text: `${p.icon} ${p.label}` }));
    });
    mob.onchange = (e) => go(e.target.value);
  }
  function go(id) {
    S.live = [];
    const page = pages().find((p) => p.id === id) || pages()[0];
    S.tab = page.id;
    history.replaceState(null, "", `#${page.id}`);
    document.querySelectorAll(".side button").forEach((b) => b.classList.toggle("active", b.dataset.tab === page.id));
    $("mobileTabs").value = page.id;
    if (page.id === "leads") leadsPage();
    else if (page.id === "versions") versionsPage();
    else contentPage(page);
    updateCounts();
    window.scrollTo({ top: 0 });
    Live.jump(page.id);
  }

  // ---------- Save ----------
  async function save() {
    $("saveBtn").disabled = true; $("saveBtn2").disabled = true;
    $("saveBtn").textContent = "Saving…";
    try {
      const r = await api("PUT", "/api/admin/content", { content: S.content });
      S.content = r.content; S.updatedAt = r.updatedAt || S.updatedAt;
      setDirty(false); clearDraft();
      if (r.warnings && r.warnings.length) flash("Saved, but some values weren't valid and were kept as before:", "err", r.warnings);
      else flash("✓ Saved! Your website is updated.");
      Live.schedule();
      if (S.tab !== "leads" && S.tab !== "versions") go(S.tab);
    } catch (e) {
      flash(`Couldn't save: ${e.message}`, "err");
      $("saveBtn").disabled = false;
    } finally {
      $("saveBtn").textContent = "Save changes"; $("saveBtn2").disabled = false;
    }
  }

  async function loadContent(quiet) {
    const d = await api("GET", "/api/admin/content");
    const keepDirty = quiet && S.dirty;
    if (!keepDirty) S.content = d.content;
    S.schema = d.schema; S.tabs = d.tabs; S.defaults = d.defaults; S.presets = d.presets; S.photo = d.photo; S.resume = d.resume || { url: "" }; S.updatedAt = d.updatedAt;
    if (!d.savedInDb && !quiet) flash("Database not connected: changes won't survive a restart. Add DATABASE_URL on Render.", "err");
    if (!keepDirty) setDirty(false);
    Live.schedule();
  }

  async function preview() {
    const win = window.open("about:blank", "_blank"); // opened first so pop-up blockers allow it
    try {
      const r = await api("POST", "/api/admin/preview", { content: S.content });
      if (win) win.location.href = r.url; else location.href = r.url;
    } catch (e) { if (win) win.close(); flash(`Preview failed: ${e.message}`, "err"); }
  }

  // Offer to bring back unsaved work from last time (e.g. after the login expired)
  function draftBanner() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch {}
    if (!d || !d.content || JSON.stringify(d.content) === JSON.stringify(S.content)) { clearDraft(); return; }
    const when = new Date(d.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
    const older = d.base !== S.updatedAt;
    const bar = h("div.notice.draft", {}, h("b", { text: `You have unsaved changes from ${when}. ` }),
      older ? "The website was saved after that, so restoring will replace those newer changes. " : "",
      h("button.btn.btn-primary.btn-sm", { text: "Restore them", onclick: () => { S.content = d.content; setDirty(true); bar.remove(); go(S.tab); flash("Unsaved changes restored. Click Save to publish them."); } }), " ",
      h("button.btn.btn-sm", { text: "Discard", onclick: () => { clearDraft(); bar.remove(); } }));
    document.querySelector(".layout").before(bar);
  }

  // ---------- Start ----------
  $("saveBtn").onclick = save; $("saveBtn2").onclick = save;
  ["input", "change", "click"].forEach((ev) => $("main").addEventListener(ev, refreshLive));
  $("previewBtn").onclick = preview; $("previewBtn2").onclick = preview;
  addEventListener("hashchange", () => { const id = location.hash.slice(1); if (S.content && id && id !== S.tab) go(id); });
  $("menuBtn").onclick = (e) => { e.stopPropagation(); $("menuList").classList.toggle("hidden"); };
  document.addEventListener("click", () => $("menuList").classList.add("hidden"));
  const leave = async (url) => { if (S.dirty && !confirm("You have unsaved changes. Log out anyway?")) return; S.dirty = false; await api("POST", url).catch(() => {}); location.replace("/admin/login"); };
  $("logout").onclick = () => leave("/api/admin/logout");
  $("logoutAll").onclick = () => leave("/api/admin/logout-all");

  (async () => {
    try {
      await Promise.all([loadContent(), loadLeads()]);
      buildNav();
      Live.init();
      go(location.hash.slice(1) || "leads");
      draftBanner();
    } catch (e) {
      if (e.message !== "Logged out") fill($("main"), h("div.notice", { text: `Couldn't load the panel: ${e.message}` }));
    }
  })();
})();
