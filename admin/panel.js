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
    if (r.status === 401) { S.dirty = false; location.replace("/admin/login"); throw new Error("Logged out"); }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
    return data;
  };

  const S = { content: null, schema: null, tabs: [], defaults: null, dirty: false, tab: "leads", open: new Set(), leads: [], statuses: [], filter: "all", q: "", savedInDb: true };

  // ---------- Flash message ----------
  let flashTimer;
  function flash(text, type = "ok", list = []) {
    const f = $("flash");
    fill(f, text, list.length ? h("ul", {}, list.slice(0, 6).map((x) => h("li", { text: x }))) : "");
    f.className = `flash show ${type}`;
    clearTimeout(flashTimer); flashTimer = setTimeout(() => f.classList.remove("show"), list.length ? 9000 : 3500);
  }

  // ---------- Unsaved-changes state ----------
  function setDirty(v) {
    S.dirty = v;
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
    if (node.t === "color") return "#2F5BFF";
    return "";
  }
  const plain = (v) => String(v ?? "").replace(/\*\*|\*|~/g, "");

  const CHECKS = {
    num: (v) => v === "" || /^-?\d+(\.\d+)?$/.test(v) || "Numbers only (e.g. 97.71). Put ₹, %, + in the boxes before/after.",
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

    const wrap = h("div.f");
    const hint = h("span.hint", { text: node.help || "" });
    const check = CHECKS[node.pattern] || CHECKS[node.t];
    const validate = (v) => {
      const res = check ? check(v) : true;
      wrap.classList.toggle("bad", res !== true);
      hint.textContent = res === true ? node.help || "" : res;
    };
    let input;
    const onInput = (e) => { const v = e.target.value; set(path, v); validate(v.trim()); onChange && onChange(); };
    if (node.t === "textarea") input = h("textarea", { value: value ?? "", maxLength: node.max || 3000, oninput: onInput });
    else if (node.t === "select") input = h("select", { onchange: onInput }, node.options.map(([v, l]) => h("option", { value: v, text: l, selected: v === value })));
    else if (node.t === "color") {
      const text = h("input", { type: "text", value: value || "#2F5BFF", maxLength: 7, oninput: (e) => { set(path, e.target.value); pick.value = /^#[0-9a-fA-F]{6}$/.test(e.target.value) ? e.target.value : pick.value; } });
      const pick = h("input", { type: "color", value: /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#2f5bff", oninput: (e) => { set(path, e.target.value.toUpperCase()); text.value = e.target.value.toUpperCase(); } });
      input = h("div.color-row", {}, pick, text);
    } else input = h("input", { type: "text", value: value ?? "", maxLength: node.max || 300, inputMode: node.t === "num" ? "decimal" : undefined, oninput: onInput });
    wrap.append(h("label.lbl", { text: node.label }), input, hint);
    if (node.t !== "select" && node.t !== "color") validate(String(value ?? ""));
    return wrap;
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
      const tools = (i) => {
        const del = h("button.btn.btn-sm.btn-icon.btn-danger", { title: "Delete", text: "✕", onclick: (e) => {
          e.stopPropagation();
          if (!del.classList.contains("confirm")) { del.classList.add("confirm"); del.textContent = "Delete?"; del.classList.remove("btn-icon"); setTimeout(() => { del.classList.remove("confirm"); del.textContent = "✕"; del.classList.add("btn-icon"); }, 3000); return; }
          arr.splice(i, 1); S.open.delete(key(i)); setDirty(true); draw();
        } });
        return h("div.item-tools", {},
          h("button.btn.btn-sm.btn-icon", { title: "Move up", text: "↑", disabled: i === 0, onclick: (e) => { e.stopPropagation(); move(i, -1); } }),
          h("button.btn.btn-sm.btn-icon", { title: "Move down", text: "↓", disabled: i === arr.length - 1, onclick: (e) => { e.stopPropagation(); move(i, 1); } }),
          isGroup ? h("button.btn.btn-sm.btn-icon", { title: "Duplicate", text: "⧉", disabled: arr.length >= max, onclick: (e) => { e.stopPropagation(); arr.splice(i + 1, 0, JSON.parse(JSON.stringify(arr[i]))); setDirty(true); draw(); } }) : null,
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
        const item = h("div.item", {}, h("div.item-head", { onclick: () => toggle() }, h("span.num", { text: i + 1 }), title, tools(i), h("span.chev", { text: "›" })), body);
        const fillBody = () => { fill(body, groupBlock(node.of, path.concat(i), () => { title.textContent = titleText(); title.classList.toggle("empty", !plain(val[titleKey])); }, false)); };
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
      tab.id === "switches" ? null : h("div.tip", {}, "Text tips: ", h("code", { text: "*word*" }), " = yellow highlight · ", h("code", { text: "~word~" }), " = blue highlight · ", h("code", { text: "**word**" }), " = bold. Use ↑ ↓ to reorder boxes, ⧉ to copy one, ✕ to delete."),
    );
    for (const key of tab.keys) {
      const node = S.schema.fields[key];
      const card = h("section.card", {}, h("h2", { text: node.label || key }), node.help ? h("p.help", { text: node.help }) : null);
      if (node.t === "list") card.append(h("div.fields", {}, listBlock(node, [key])));
      else card.append(groupBlock(node, [key], null, false));
      main.append(card);
    }
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
      const rows = S.leads.filter((l) => (S.filter === "all" || l.status === S.filter) &&
        (!q || [l.name, l.phone, l.email, l.service, l.message, l.note].join(" ").toLowerCase().includes(q)));
      fill(list, ...(rows.length ? rows.map(leadCard) : [h("div.empty-state", { text: S.leads.length ? "No leads match this filter." : "No leads yet. When someone fills in your website form, they'll appear here." })]));
    };
    const chips = h("div.chips", {}, ["all", ...S.statuses].map((s) => h("button.chip", {
      class: S.filter === s ? "active" : "", onclick: () => { S.filter = s; leadsPage(); },
    }, s === "all" ? "All" : STATUS_LABEL[s] || s, h("span.c", { text: s === "all" ? S.leads.length : count(s) }))));
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
      h("div.lead-tools", {}, chips, search,
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
        h("h3", { text: l.name }),
        h("div.meta", {},
          h("span", { text: fmtDate(l.created_at) }),
          l.phone ? h("a", { href: `tel:${l.phone.replace(/[^+\d]/g, "")}`, text: `📞 ${l.phone}` }) : null,
          l.phone ? h("a", { href: `https://wa.me/${waNum(l.phone)}`, target: "_blank", rel: "noopener", text: "💬 WhatsApp" }) : null,
          l.email ? h("a", { href: `mailto:${l.email}`, text: `✉️ ${l.email}` }) : null),
        h("div.meta", {}, l.service ? h("span.tag", { text: l.service }) : null, l.budget ? h("span.tag", { text: `Budget: ${l.budget}` }) : null)),
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
        try { await run(); await loadContent(); flash("Done! Your website has been updated."); versionsPage(); } catch (e) { flash(e.message, "err"); }
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
  }

  // ---------- Save ----------
  async function save() {
    $("saveBtn").disabled = true; $("saveBtn2").disabled = true;
    $("saveBtn").textContent = "Saving…";
    try {
      const r = await api("PUT", "/api/admin/content", { content: S.content });
      S.content = r.content;
      setDirty(false);
      if (r.warnings && r.warnings.length) flash("Saved, but some values weren't valid and were kept as before:", "err", r.warnings);
      else flash("✓ Saved! Your website is updated.");
      if (S.tab !== "leads" && S.tab !== "versions") go(S.tab);
    } catch (e) {
      flash(`Couldn't save: ${e.message}`, "err");
      $("saveBtn").disabled = false;
    } finally {
      $("saveBtn").textContent = "Save changes"; $("saveBtn2").disabled = false;
    }
  }

  async function loadContent() {
    const d = await api("GET", "/api/admin/content");
    S.content = d.content; S.schema = d.schema; S.tabs = d.tabs; S.defaults = d.defaults;
    if (!d.savedInDb) flash("Database not connected: changes won't survive a restart. Add DATABASE_URL on Render.", "err");
    setDirty(false);
  }

  // ---------- Start ----------
  $("saveBtn").onclick = save; $("saveBtn2").onclick = save;
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
      go(location.hash.slice(1) || "leads");
    } catch (e) {
      if (e.message !== "Logged out") fill($("main"), h("div.notice", { text: `Couldn't load the panel: ${e.message}` }));
    }
  })();
})();
