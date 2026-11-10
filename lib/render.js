// Builds the public website HTML from the (validated) content.
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
// *yellow*  ~blue~  **bold**  (applied after escaping, so it can't inject HTML)
const fmt = (v) => esc(v)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\*(.+?)\*/g, '<span class="hl">$1</span>')
  .replace(/~(.+?)~/g, '<span class="hl-blue">$1</span>');
const plain = (v) => String(v ?? "").replace(/\*\*|\*|~/g, "");
const theme = require("./theme");
const N = require("./numbers");
const ASSET_V = "26";

function counter(n) {
  if (n.value === "" || n.value == null) return esc(n.prefix) + esc(n.suffix);
  const dec = (String(n.value).split(".")[1] || "").length;
  const shown = dec ? n.value : Number(n.value).toLocaleString("en-IN");
  return `${esc(n.prefix)}<span data-count="${esc(n.value)}"${dec ? ` data-dec="${dec}"` : ""}>${esc(shown)}</span>${esc(n.suffix)}`;
}

const ICONS = {
  meta: '<path d="M3 12c0-3 2-5 4.5-5S12 12 12 12s2 5 4.5 5S21 15 21 12s-2-5-4.5-5S12 12 12 12s-2 5-4.5 5S3 15 3 12z"/>',
  google: '<path d="M4 18l6-11 3 5 3-4 4 10z"/>',
  seo: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  funnel: '<path d="M3 4h18l-7 8v7l-4 2v-9z"/>',
  social: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="16.5" cy="7.5" r=".8"/>',
  creative: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
  ai: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
};
const ADD_CONTACT = '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M19 8v6M16 11h6"/></svg>';
const BUBBLE = '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>';
// WhatsApp-style icon drawn in code, so it takes any icon colour (no outside image needed)
const WA_ICON = '<svg class="wa-ico" viewBox="0 0 24 24"><path d="M3.6 20.4l1.4-4.1A8.6 8.6 0 1 1 8 19.2z"/><path class="fill" d="M9 7.9c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.7l-.6.7c.6 1.2 1.5 2.1 2.7 2.7l.7-.6c.2-.2.5-.2.7-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.7.4-1.9.5-3.5-.3a8.6 8.6 0 0 1-3.6-3.6c-.8-1.6-.7-2.8-.3-3.5z"/></svg>';
const SI = (slug) => `https://cdn.jsdelivr.net/npm/simple-icons@16.17.0/icons/${slug}.svg`;

const filled = (o, keys) => keys.some((k) => String(o[k] ?? "").trim() !== "");
function prepare(src) {
  // 1) work out every number, 2) put them into every {tag} on the page
  const ctx = N.compute(src);
  const expInfo = N.experience(src);
  const c = N.fill(JSON.parse(JSON.stringify(src)), ctx);
  c.stats.items = c.stats.items.filter((x) => filled(x, ["value", "label", "prefix"]));
  c.services.items = c.services.items.filter((x) => filled(x, ["title", "text"]));
  c.process.steps = c.process.steps.filter((x) => filled(x, ["title", "text"]));
  c.logos.items = c.logos.items.filter((x) => filled(x, ["name"]));
  c.ticker.items = c.ticker.items.filter((x) => filled(x, ["bold", "text"]));
  c.toasts.items = c.toasts.items.filter((x) => filled(x, ["title", "text"]));
  // jobs in website order, with their date text in your chosen style (hidden jobs left out)
  c.experience.items = N.fill(expInfo.jobs, ctx).filter((x) => filled(x, ["role", "company", "text"]));
  c.experience.total = expInfo.text;
  c.experience.months = expInfo.months;
  c.skills.skills = c.skills.skills.filter((x) => filled(x, ["name"]));
  c.hero.chips = c.hero.chips.filter((x) => x.items.length);
  c.customSections.forEach((x) => { x.cards = x.cards.filter((cd) => filled(cd, ["title", "text"])); });
  c.services.items.forEach((x) => { x.points = x.points.filter((p) => filled(p, ["title", "text"])); });
  const inds = (c.results.industries = c.results.industries.filter((x) => filled(x, ["tab"])));
  inds.forEach((d) => {
    d.kpis = d.kpis.filter((x) => filled(x, ["value", "label", "prefix"]));
    d.funnel = d.funnel.filter((x) => filled(x, ["label", "value"]));
    d.bars = d.bars.filter((x) => filled(x, ["label", "value"]));
    d.points = d.points.filter((x) => filled(x, ["title", "text"]));
  });
  // budget per industry → label, legend, bar share and the total (all calculated)
  const budgets = inds.map((d) => Math.max(0, N.parseNum(d.budgetLakh) || 0));
  const sum = budgets.reduce((a, b) => a + b, 0);
  inds.forEach((d, i) => {
    const name = String(d.tab).replace(/^[^A-Za-z0-9]+/, "").trim();
    d.budget = budgets[i] ? N.money(budgets[i]) + "+" : "";
    d.legend = budgets[i] ? `${name} ${N.money(budgets[i])}` : name;
    d.share = sum ? Math.round((budgets[i] / sum) * 1000) / 10 : Math.round(1000 / inds.length) / 10;
    // funnel: numbers shown Indian-style, % between steps calculated
    const vals = d.funnel.map((f) => (/^-?[0-9][0-9,]*(\.[0-9]+)?$/.test(String(f.value).trim()) ? N.parseNum(f.value) : NaN));
    d.funnel.forEach((f, j) => {
      if (isFinite(vals[j])) f.value = vals[j].toLocaleString("en-IN", { maximumFractionDigits: 2 });
      const p = j < vals.length - 1 ? N.pct(vals[j + 1], vals[j]) : "";
      f.rate = p ? `${p}% ${f.rateLabel || ""}`.trim() : "";
    });
  });
  const tl = N.money(sum).match(/^₹([0-9.]+)(L|Cr)$/);
  c.results.total = tl ? { prefix: "₹", value: tl[1], suffix: tl[2] + "+" } : { prefix: "", value: "", suffix: "" };
  c.results.showTotal = sum > 0;
  return c;
}

function render(src, opts = {}) {
  const c = prepare(src);
  const s = c.switches, ct = c.contact, L = c.layout, T = c.theme;
  const base = opts.base || "";
  const photo = "/" + String(opts.photoUrl || "img/shubham.jpg").replace(/^\//, "");
  const hasPhone = !!ct.phone, hasWa = !!ct.whatsapp, hasEmail = !!ct.email;
  const wa = (msg) => `https://wa.me/${esc(ct.whatsapp)}?text=${encodeURIComponent(msg || ct.whatsappMessage)}`;
  const tel = `tel:${esc(ct.phone.replace(/\s/g, ""))}`;
  const formOn = c.contactSection.show;
  const book = (cls, label) => formOn
    ? `<a href="#leadForm" class="${cls} js-book">${label}</a>`
    : hasPhone ? `<a href="${tel}" class="${cls}">${label}</a>` : "";
  const saveOn = s.saveContact;

  // Website mode: business (clients) · portfolio (jobs) · both
  const H = c.hire, mode = c.siteMode;
  const hireSec = mode !== "business" && H.show;
  const hireBtns = hireSec && H.status !== "closed";
  const hireBtn = (cls, label) => `<a href="#hireForm" class="${cls} js-hire">${label}</a>`;
  const portfolio = mode === "portfolio";
  const resumeHref = H.resumeLink || opts.resumeUrl || "";
  const STATUS = { open: "Open to work", selective: "Open to the right offer", freelance: "Freelance / contract only", closed: "Not looking right now" };

  const customs = c.customSections.map((x, i) => ({ ...x, id: `more-${i + 1}` })).filter((x) => x.show);
  // menu follows your section order; a section is listed only if it's shown and has a menu name
  const navFor = {
    about: c.about.show && [["about", c.about.navLabel]],
    services: c.services.show && [["services", c.services.navLabel]],
    process: c.process.show && c.process.steps.length && [["process", c.process.navLabel]],
    results: c.results.show && [["results", c.results.navLabel]],
    experience: c.experience.show && [["experience", c.experience.navLabel]],
    hire: hireSec && [["hire", H.navLabel]],
    skills: c.skills.show && [["skills", c.skills.navLabel]],
    custom: customs.filter((x) => x.inNav).map((x) => [x.id, x.navLabel]),
    contact: formOn && [["contact", c.contactSection.navLabel]],
  };
  const nav = L.order.flatMap((k) => navFor[k] || []).filter((x) => x && String(x[1] || "").trim());

  const logoItem = (l) => `<span class="lg"><i class="lg-ico${l.slug ? "" : " no-img"}" style="--c:${esc(l.color)}${l.slug ? `;--src:url(${SI(esc(l.slug))})` : ""}">${l.slug ? `<span class="lg-mask"></span><img src="${SI(esc(l.slug))}" alt="" loading="lazy" onerror="this.parentNode.classList.add('no-img');this.remove()">` : ""}<b>${esc(l.initials)}</b></i>${esc(l.name)}</span>`;
  const logos = c.logos.items.map(logoItem).join("");
  const marquee = c.marquee.items.map((m) => `<span>${esc(m)}</span><span>★</span>`).join("");
  const ticker = c.ticker.items.map((t) => `<span><b>${esc(t.bold)}</b> ${esc(t.text)}</span>`).join("");

  const service = (sv) => {
    const ico = `<div class="svc-ico${sv.featured ? " svc-ico-ai" : ""}"><svg viewBox="0 0 24 24">${ICONS[sv.icon] || ICONS.star}</svg></div>`;
    const badge = sv.badge ? `<span class="new-badge">${esc(sv.badge)}</span>` : "";
    const tag = sv.tag ? `<span class="svc-tag">${esc(sv.tag)}</span>` : "";
    if (sv.featured) {
      const pts = sv.points.length ? `<ul class="ai-list">${sv.points.map((p) => `<li><b>${esc(p.title)}</b><span>${esc(p.text)}</span></li>`).join("")}</ul>` : "";
      return `<article class="card service service-wide reveal tilt">${badge}<div class="svc-wide-grid"><div>${ico}<h3>${esc(sv.title)}</h3><p>${esc(sv.text)}</p></div>${pts}</div>${tag}</article>`;
    }
    return `<article class="card service reveal tilt">${badge}${ico}<h3>${esc(sv.title)}</h3><p>${esc(sv.text)}</p>${tag}</article>`;
  };

  const inds = c.results.industries;
  const industryPanel = (ind, i) => {
    const kpis = ind.kpis.map((k) => `<div class="kpi"><b>${counter(k)}</b><p>${esc(k.label)}</p></div>`).join("");
    const n = ind.funnel.length;
    const funnel = n ? `<div class="funnel">${ind.funnel.map((f, j) => {
      const w = n === 1 ? 100 : Math.round(100 - (60 * j) / (n - 1));
      const row = `<div class="f-row${j === n - 1 ? " hot" : ""}" style="--w:${w}%"><span>${esc(f.label)}</span><b>${esc(f.value)}</b></div>`;
      const rate = j < n - 1 && f.rate ? `<div class="f-rate${j === n - 2 ? " hot-rate" : ""}">↓ ${esc(f.rate)}</div>` : "";
      return row + rate;
    }).join("")}</div>` : "";
    const nums = ind.bars.map((b) => parseFloat(String(b.value).replace(/[^0-9.]/g, "")) || 0);
    const max = Math.max(...nums, 0);
    const bars = ind.bars.length ? `<div class="bars">${ind.bars.map((b, j) => `<div class="bar"><span>${esc(b.label)}</span><i style="--w:${max ? Math.max(3, Math.round((nums[j] / max) * 100)) : 3}%"></i><b>${esc(b.value)}</b></div>`).join("")}</div>` : "";
    const pts = ind.points.length ? `<ul class="learn">${ind.points.map((p) => `<li><b>${esc(p.title)}</b> ${esc(p.text)}</li>`).join("")}</ul>` : "";
    const cta = ind.ctaText && (formOn || hasPhone) ? `<a href="${formOn ? "#contact" : tel}" class="btn btn-primary btn-sm magnetic" style="margin-top:22px">${esc(ind.ctaText)}</a>` : "";
    return `
        <div class="panel${i === 0 ? " active" : ""}" data-panel="ind${i}">
          <div class="panel-grid">
            <div>
              ${ind.budget ? `<div class="panel-budget"><small>Budget managed</small><b>${esc(ind.budget)}</b><small>${esc(ind.budgetNote)}</small></div>` : ""}
              <div class="kpis${ind.kpis.length === 3 ? " kpis-3" : ""}">${kpis}</div>
            </div>
            <div>
              ${ind.rightTitle ? `<h4 class="panel-h">${esc(ind.rightTitle)}</h4>` : ""}
              ${funnel}${bars}${pts}${cta}
            </div>
          </div>
        </div>`;
  };

  const site = {
    words: c.hero.words,
    toasts: s.toasts ? c.toasts.items : [],
    contact: { name: ct.name, phone: ct.phone.replace(/\s/g, ""), email: ct.email, company: ct.company, jobTitle: ct.jobTitle, whatsapp: ct.whatsapp },
    submitText: c.contactSection.submitText, successText: c.contactSection.successText, hireSuccessText: c.hire.successText,
  };
  const siteJson = JSON.stringify(site).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16));

  const blocks = {
    stats: c.stats.show && c.stats.items.length ? `    <section class="stats" id="stats">
      <div class="wrap stats-grid" style="--cols:${Math.min(c.stats.items.length, 4)}">
        ${c.stats.items.map((n) => `<div class="stat reveal"><div class="num">${counter(n)}</div><p>${esc(n.label)}</p></div>`).join("\n        ")}
      </div>
    </section>` : "",
    marquee: s.marquee && marquee ? `    <div class="marquee-wrap"><div class="marquee" aria-hidden="true">
      <div class="marquee-track">${marquee}${marquee}</div>
    </div></div>` : "",
    about: c.about.show ? `    <section class="section" id="about">
      <div class="wrap about-grid">
        <div><h2 class="h2 reveal">${fmt(c.about.title)}</h2></div>
        <div class="about-copy">
          ${c.about.paragraphs.map((p) => `<p class="reveal">${fmt(p)}</p>`).join("\n          ")}
          ${c.about.pills.length ? `<div class="pill-row reveal">${c.about.pills.map((p) => `<span class="pill">${esc(p)}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    </section>` : "",
    services: c.services.show ? `    <section class="section section-alt" id="services">
      <div class="wrap">
        <div class="section-head"><h2 class="h2 reveal">${fmt(c.services.title)}</h2></div>
        <div class="services-grid">
          ${c.services.items.map(service).join("\n          ")}
        </div>
      </div>
    </section>` : "",
    process: c.process.show && c.process.steps.length ? `    <section class="section" id="process">
      <div class="wrap">
        <div class="section-head"><h2 class="h2 reveal">${fmt(c.process.title)}</h2></div>
        <ol class="process" style="--steps:${Math.min(c.process.steps.length, 5)}">
          ${c.process.steps.map((st, i) => `<li class="reveal"><b>${String(i + 1).padStart(2, "0")}</b><h4>${esc(st.title)}</h4><p>${esc(st.text)}</p></li>`).join("\n          ")}
        </ol>
      </div>
    </section>` : "",
    logoStrip: s.logoStrip && logos ? `    <div class="logo-band" aria-label="Tools I work with">
      <div class="logo-track">${logos}<span aria-hidden="true" class="dup">${logos}</span></div>
    </div>` : "",
    results: c.results.show ? `    <section class="section section-alt" id="results">
      <div class="wrap">
        <div class="section-head">
          <h2 class="h2 reveal">${fmt(c.results.title)}</h2>
          ${c.results.subtitle ? `<p class="section-sub reveal">${fmt(c.results.subtitle)}</p>` : ""}
        </div>
        ${inds.length ? `${c.results.showTotal ? `<div class="split card reveal">
          <div class="split-top">
            <div><small>${esc(c.results.totalLabel)}</small><b>${counter(c.results.total)}</b></div>
            <div class="split-legend">${inds.map((d, i) => (c.results.showTotal && !d.budget ? "" : `<span><i class="c${(i % 5) + 1}"></i>${esc(d.legend)}</span>`)).join("")}</div>
          </div>
          <div class="split-bar">${inds.map((d, i) => `<i class="c${(i % 5) + 1}" style="--w:${esc(d.share || 0)}%"></i>`).join("")}</div>
        </div>` : ""}
        <div class="tabs reveal" role="tablist">
          ${inds.map((d, i) => `<button class="tab${i === 0 ? " active" : ""}" data-tab="ind${i}" role="tab">${esc(d.tab)}</button>`).join("\n          ")}
        </div>
        ${inds.map(industryPanel).join("")}` : ""}
        ${c.results.industriesList.length ? `<div class="industries reveal"><span>Industries:</span>${c.results.industriesList.map((x) => `<b>${esc(x)}</b>`).join("")}</div>` : ""}
      </div>
    </section>` : "",
    ticker: s.ticker && ticker ? `    <div class="ticker" aria-hidden="true"><div class="ticker-track">${ticker}${ticker}</div></div>` : "",
    saveCard: saveOn && c.saveCard.show ? `    <section class="save-band">
      <div class="wrap">
        <div class="save-card reveal">
          <div class="save-ico">${ADD_CONTACT}</div>
          <div class="save-copy"><h3>${esc(c.saveCard.title)}</h3><p>${esc(c.saveCard.text)}</p></div>
          <a href="/contact.vcf" class="btn btn-primary magnetic js-save-contact">${esc(c.saveCard.button)} <span class="arrow">+</span></a>
        </div>
      </div>
    </section>` : "",
    hire: hireSec ? `    <section class="section hire-sec" id="hire">
      <div class="wrap hire-grid">
        <div class="hire-copy">
          <p class="hire-status st-${esc(H.status)} reveal"><span class="dot"></span> ${esc(STATUS[H.status])}</p>
          ${H.eyebrow ? `<p class="hire-eyebrow reveal">${esc(H.eyebrow)}</p>` : ""}
          <h2 class="h2 reveal">${fmt(H.title)}</h2>
          ${H.intro ? `<p class="section-sub reveal">${fmt(H.intro)}</p>` : ""}
          ${H.roles.length ? `<div class="hire-roles reveal"><small>Roles I'm looking for</small><div>${H.roles.map((r) => `<span>${esc(r)}</span>`).join("")}</div></div>` : ""}
          ${H.facts.length ? `<dl class="hire-facts reveal">${H.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${fmt(f.value)}</dd></div>`).join("")}</dl>` : ""}
          ${H.why.length ? `<ul class="hire-why">${H.why.map((w) => `<li class="reveal"><i>✓</i><div><b>${fmt(w.title)}</b>${w.text ? `<p>${fmt(w.text)}</p>` : ""}</div></li>`).join("")}</ul>` : ""}
          <div class="hire-actions reveal">
            ${H.resumeButton && resumeHref ? `<a href="${esc(resumeHref)}" target="_blank" rel="noopener" class="btn btn-primary magnetic">📄 ${esc(H.resumeButton)}</a>` : ""}
            ${H.linkedinButton && ct.linkedin ? `<a href="${esc(ct.linkedin)}" target="_blank" rel="noopener" class="btn btn-ghost magnetic">in&nbsp; LinkedIn profile</a>` : ""}
          </div>
        </div>
        <form class="form card reveal js-lead-form" id="hireForm" data-kind="hire" novalidate>
          <div class="form-hint" role="status"><span class="fh-ico">💼</span><div><b>Share the role details</b><small>I reply to every job enquiry within 24 hours.</small></div></div>
          <h3>${esc(H.formTitle)}</h3>
          <div class="row">
            <label><span>Company name *</span><input name="company" required autocomplete="organization" maxlength="120" /></label>
            <label><span>Your name *</span><input name="name" required autocomplete="name" maxlength="120" /></label>
          </div>
          <div class="row">
            <label><span>Work email</span><input name="email" type="email" autocomplete="email" maxlength="160" /></label>
            <label><span>Phone / WhatsApp</span><input name="phone" type="tel" autocomplete="tel" maxlength="30" /></label>
          </div>
          <div class="row">
            <label><span>Role / position</span><input name="service" maxlength="80" placeholder="e.g. Performance Marketing Manager" /></label>
            <label><span>Job type</span><select name="budget">${H.jobTypes.map((o) => `<option>${esc(o)}</option>`).join("")}</select></label>
          </div>
          <label><span>Location, salary range or anything else</span><textarea name="message" rows="4" maxlength="2000" placeholder="Location, team size, salary range, start date…"></textarea></label>
          <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <button class="btn btn-primary full magnetic" type="submit"><span class="btn-label">${esc(H.submitText)}</span> <span class="arrow">→</span></button>
          <p class="form-note" role="status"></p>
        </form>
      </div>
    </section>` : "",
    experience: c.experience.show ? `    <section class="section" id="experience">
      <div class="wrap">
        <div class="section-head"><h2 class="h2 reveal">${fmt(c.experience.title)}</h2>${c.experience.display.totalBadge && c.experience.months ? `<p class="exp-total reveal">${esc(c.experience.display.totalLabel)}${c.experience.display.totalLabel ? ": " : ""}<b>${esc(c.experience.total)}</b></p>` : ""}</div>
        <div class="timeline" id="timeline">
          <div class="tl-line"><i id="tlFill"></i></div>
          ${c.experience.items.map((e) => `<div class="tl-item reveal"><span class="tl-dot"></span>${e.dateText || (e.ongoing && c.experience.display.currentBadge) ? `<div class="tl-date">${esc(e.dateText)}${e.ongoing && c.experience.display.currentBadge ? `<span class="tl-badge">Current</span>` : ""}</div>` : ""}<h4>${esc(e.role)}${e.company ? ` · <em>${esc(e.company)}</em>` : ""}</h4><p>${esc(e.text)}</p></div>`).join("\n          ")}
        </div>
      </div>
    </section>` : "",
    skills: c.skills.show ? `    <section class="section section-alt" id="skills">
      <div class="wrap skills-grid">
        <div>
          <h2 class="h2 reveal">${fmt(c.skills.toolsTitle)}</h2>
          <div class="tools reveal">${c.skills.tools.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          ${c.skills.skills.length ? `<h3 class="skills-h reveal">${fmt(c.skills.skillsTitle)}</h3>
          <div class="skill-pills reveal">${c.skills.skills.map((k) => `<span>${k.icon ? `<i>${esc(k.icon)}</i>` : ""}${esc(k.name)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="creds">
          ${c.skills.certs.length ? `<div class="cred-block reveal"><h4>${esc(c.skills.certTitle)}</h4><ul>${c.skills.certs.map((x) => `<li>${fmt(x)}</li>`).join("")}</ul></div>` : ""}
          ${c.skills.education.length ? `<div class="cred-block reveal"><h4>${esc(c.skills.eduTitle)}</h4><ul>${c.skills.education.map((x) => `<li>${fmt(x).replace(/<strong>/g, "<b>").replace(/<\/strong>/g, "</b>")}</li>`).join("")}</ul></div>` : ""}
        </div>
      </div>
    </section>` : "",
    custom: customs.map((x, i) => `    <section class="section${i % 2 ? " section-alt" : ""} custom-section" id="${x.id}">
      <div class="wrap">
        <div class="section-head">
          <h2 class="h2 reveal">${fmt(x.title)}</h2>
          ${x.text ? `<p class="section-sub reveal">${fmt(x.text)}</p>` : ""}
        </div>
        ${x.cards.length ? `<div class="services-grid">${x.cards.map((cd) => `<article class="card service reveal tilt">${cd.icon ? `<div class="svc-ico custom-ico">${esc(cd.icon)}</div>` : ""}<h3>${esc(cd.title)}</h3><p>${fmt(cd.text)}</p></article>`).join("")}</div>` : ""}
        ${x.buttonText && x.buttonLink ? `<a href="${esc(x.buttonLink)}" class="btn btn-primary magnetic${x.buttonLink === "#leadForm" && formOn ? " js-book" : ""}" style="margin-top:30px"${/^https?:/.test(x.buttonLink) ? ' target="_blank" rel="noopener"' : ""}>${esc(x.buttonText)} <span class="arrow">→</span></a>` : ""}
      </div>
    </section>`).join("\n"),
    contact: formOn ? `    <section class="section contact" id="contact">
      <div class="orb orb-c"></div>
      <div class="wrap contact-grid">
        <div class="contact-copy">
          <h2 class="h2 big reveal">${fmt(c.contactSection.title)}</h2>
          <p class="reveal">${fmt(c.contactSection.text)}</p>
          <div class="contact-links reveal">
            ${hasPhone ? `<a href="${tel}" class="c-link magnetic"><span>📞</span><div><small>Call / Book a call</small>${esc(ct.phoneDisplay || ct.phone)}</div></a>` : ""}
            ${hasWa ? `<a href="${wa()}" target="_blank" rel="noopener" class="c-link magnetic"><span>💬</span><div><small>WhatsApp</small>Chat with me</div></a>` : ""}
            ${hasEmail ? `<a href="mailto:${esc(ct.email)}" class="c-link magnetic"><span>✉️</span><div><small>Email</small>${esc(ct.email)}</div></a>` : ""}
            ${ct.linkedin ? `<a href="${esc(ct.linkedin)}" target="_blank" rel="noopener" class="c-link magnetic"><span>in</span><div><small>LinkedIn</small>${esc(ct.linkedinLabel)}</div></a>` : ""}
          </div>
        </div>

        <form class="form card reveal js-lead-form" id="leadForm" data-kind="client" novalidate>
          <div class="form-hint" id="formHint" role="status"><span class="fh-ico">📝</span><div><b>${esc(c.contactSection.hintTitle)}</b><small>${esc(c.contactSection.hintText)}</small></div></div>
          <h3>${esc(c.contactSection.formTitle)}</h3>
          <div class="row">
            <label><span>Your name *</span><input name="name" required autocomplete="name" maxlength="120" /></label>
            <label><span>Phone / WhatsApp</span><input name="phone" type="tel" autocomplete="tel" maxlength="30" /></label>
          </div>
          <label><span>Email</span><input name="email" type="email" autocomplete="email" maxlength="160" /></label>
          <div class="row">
            <label><span>I need help with</span>
              <select name="service">${c.contactSection.services.map((o) => `<option>${esc(o)}</option>`).join("")}</select>
            </label>
            <label><span>Monthly ad budget</span>
              <select name="budget">${c.contactSection.budgets.map((o) => `<option>${esc(o)}</option>`).join("")}</select>
            </label>
          </div>
          <label><span>About your business</span><textarea name="message" rows="4" maxlength="2000" placeholder="What do you sell, and what result do you want?"></textarea></label>
          <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <button class="btn btn-primary full magnetic" type="submit"><span class="btn-label">${esc(c.contactSection.submitText)}</span> <span class="arrow">→</span></button>
          <p class="form-note" id="formNote" role="status"></p>
        </form>
      </div>
    </section>` : "",
  };
  const body = c.layout.order.map((k) => blocks[k] || "").filter(Boolean).join("\n\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(portfolio && H.pageTitle ? H.pageTitle : c.site.title)}</title>
  <meta name="description" content="${esc(c.site.description)}" />
  <meta name="theme-color" content="${esc(theme.themeColor(T))}" />
  ${base ? `<link rel="canonical" href="${esc(base)}/" />` : ""}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(c.site.ogTitle)}" />
  <meta property="og:description" content="${esc(c.site.ogDescription)}" />
  <meta property="og:image" content="${esc(base + "/" + photo.replace(/^\//, ""))}" />
  ${base ? `<meta property="og:url" content="${esc(base)}/" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${esc(theme.fontsUrl(T))}" rel="stylesheet" />
  <link rel="icon" href="${favicon(c)}" />
  <link rel="stylesheet" href="/style.css?v=${ASSET_V}" />
  <style>${theme.css(T)}</style>
  <script type="application/ld+json">${ldJson(c, base, photo)}</script>
</head>
<body data-anim="${esc(T.animation)}" data-corners="${esc(T.corners)}" data-buttons="${esc(T.buttons)}" data-spacing="${esc(T.spacing)}" data-text="${esc(T.textSize)}" data-photo="${esc(L.photoSide)}">
${s.loader ? `  <div class="loader" id="loader" aria-hidden="true">
    <div class="loader-mark"><span>${esc(c.brand.first)}</span><span>${esc(c.brand.second)}</span></div>
    <div class="loader-bar"><i></i></div>
  </div>` : ""}
${s.cursorGlow ? '  <div class="cursor-glow" id="glow" aria-hidden="true"></div>' : ""}
  <div class="progress" id="progress" aria-hidden="true"></div>

  <header class="nav" id="nav">
    <a href="#top" class="logo" aria-label="${esc(c.brand.first + " " + c.brand.second)} home">${esc(c.brand.first)}<span>${esc(c.brand.second)}</span></a>
    <nav class="nav-links" id="navLinks">
      ${nav.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join("\n      ")}
    </nav>
    ${portfolio
      ? `${s.bookCall ? book("btn btn-ghost btn-sm magnetic nav-second", esc(L.navButton || "Book a Call")) : ""}${hireBtns && H.headerButton ? hireBtn("btn btn-primary btn-sm magnetic", esc(H.buttonText || "Hire Me")) : ""}`
      : `${hireBtns && H.headerButton ? hireBtn("btn btn-ghost btn-sm magnetic nav-second", esc(H.buttonText || "Hire Me")) : ""}${s.bookCall ? book("btn btn-primary btn-sm magnetic", esc(L.navButton || "Book a Call")) : ""}`}
    ${nav.length ? '<button class="burger" id="burger" aria-label="Open menu"><span></span><span></span></button>' : ""}
  </header>

  <main id="top">
    <section class="hero">
      <div class="orb orb-a"></div><div class="orb orb-b"></div>
      <div class="grid-bg"></div>
      <div class="wrap hero-inner${s.photo ? "" : " no-photo"}">
        <div class="hero-copy">
          ${portfolio && hireSec && H.statusText ? `<p class="eyebrow reveal st-${esc(H.status)}"><span class="dot"></span> ${esc(H.statusText)}</p>`
            : s.availability && c.hero.badge ? `<p class="eyebrow reveal"><span class="dot"></span> ${esc(c.hero.badge)}</p>` : ""}
          <h1 class="hero-title">
            <span class="line"><span>${esc(c.hero.line1)}</span></span>
            ${c.hero.words.length ? `<span class="line rot-line"><span><em class="rotator" id="rotator">${esc(c.hero.words[0])}</em><i class="rot-dot">.</i></span></span>` : ""}
          </h1>
          <p class="hero-sub reveal">${fmt(c.hero.sub)}</p>
          <div class="hero-cta reveal">
            ${portfolio && hireBtns && H.heroButton ? hireBtn("btn btn-primary magnetic", `${esc(H.buttonText || "Hire Me")} <span class="arrow">→</span>`) : ""}
            ${s.bookCall ? book(`btn ${portfolio && hireBtns && H.heroButton ? "btn-ghost" : "btn-primary"} magnetic`, `${esc(c.hero.ctaPrimary)}${portfolio ? "" : ' <span class="arrow">→</span>'}`) : ""}
            ${!portfolio && hireBtns && H.heroButton ? hireBtn("btn btn-ghost btn-hire magnetic", `💼 ${esc(H.buttonText || "Hire Me")}`) : ""}
            ${c.results.show && c.hero.ctaSecondary ? `<a href="#results" class="btn btn-ghost magnetic">${esc(c.hero.ctaSecondary)}</a>` : ""}
          </div>
          ${s.heroSocial ? `<div class="hero-social reveal">
            ${ct.linkedin ? `<a href="${esc(ct.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn"><span class="soc-in">in</span></a>` : ""}
            ${hasWa ? `<a href="${wa()}" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp">${WA_ICON}</a>` : ""}
            ${hasEmail ? `<a href="mailto:${esc(ct.email)}" aria-label="Email" title="Email"><svg viewBox="0 0 24 24">${ICONS.mail}</svg></a>` : ""}
            ${hasPhone ? `<a href="${tel}" aria-label="Call" title="Call"><svg viewBox="0 0 24 24"><path d="M6.6 3.5h2.9l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v2.9a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg></a>` : ""}
            ${saveOn ? `<a href="/contact.vcf" class="soc-save js-save-contact" aria-label="Save my number to your contacts" title="Save my number">${ADD_CONTACT}</a>` : ""}
          </div>` : ""}
          ${c.hero.trust.length ? `<div class="hero-trust reveal">${c.hero.trust.map((t) => `<div><b>${esc(t)}</b></div>`).join("<i></i>")}</div>` : ""}
        </div>

        ${s.photo ? `<div class="hero-visual reveal">
          <div class="photo-frame tilt">
            <img src="${esc(photo)}" alt="${esc(ct.name)}, performance marketer" width="900" height="1182" />
            <div class="photo-shine"></div>
          </div>
          ${(portfolio && hireSec && H.ringText ? H.ringText : c.hero.ringText) ? `<svg class="ring" viewBox="0 0 200 200" aria-hidden="true">
            <defs><path id="circle" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" /></defs>
            <text><textPath href="#circle">${esc((portfolio && hireSec && H.ringText ? H.ringText : c.hero.ringText))}</textPath></text>
          </svg>` : ""}
          ${c.hero.chips.slice(0, 3).map((ch, i) => ch.items.length ? `<div class="chip chip-${i + 1}"><span class="chip-ico">${esc(ch.icon)}</span> ${ch.items.length > 1 ? `<span class="cycle" data-items="${esc(ch.items.join("|"))}">${esc(ch.items[0])}</span>` : esc(ch.items[0])}</div>` : "").join("\n          ")}
        </div>` : ""}
      </div>
      ${s.scrollHint && body ? '<a href="#after-hero" class="scroll-hint" aria-label="Scroll down"><span></span></a>' : ""}
    </section>
    <div id="after-hero"></div>

${body}
  </main>

${s.toasts && c.toasts.items.length ? `  <div class="toast" id="toast" aria-live="off">
    <div class="toast-ico">✓</div>
    <div><small id="toastTag">Result highlight</small><b id="toastTitle"></b><p id="toastText"></p></div>
    <span class="toast-stamp">Converted</span>
  </div>` : ""}

  <footer class="footer">
    <div class="wrap footer-inner">
      <a href="#top" class="logo">${esc(c.brand.first)}<span>${esc(c.brand.second)}</span></a>
      <p>© <span id="year">${new Date().getFullYear()}</span> ${esc(c.footer.text)}</p>
      ${saveOn ? `<a href="/contact.vcf" class="footer-save js-save-contact">${ADD_CONTACT} ${esc(c.footer.saveText)}</a>` : ""}
      <a href="#top" class="to-top">Back to top ↑</a>
    </div>
  </footer>

${s.callFloat && hasPhone ? `  <a class="call-float${s.whatsappFloat && hasWa ? "" : " solo"}" href="${tel}" aria-label="Call ${esc(ct.name)}"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg><span>Call Now</span></a>` : ""}
${s.whatsappFloat && hasWa ? `  <a class="wa-float${s.callFloat && hasPhone ? "" : " solo"}" href="${wa()}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${WA_ICON}</a>` : ""}

  <script>window.SITE = ${siteJson};</script>
  <script src="/script.js?v=${ASSET_V}"></script>
</body>
</html>
`;
}

function favicon(c) {
  const p = theme.palette(c.theme);
  const ini = ((c.brand.first[0] || "") + (c.brand.second[0] || "")).toUpperCase().replace(/[^A-Z0-9]/g, "") || "•";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${p.bg}"/><text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="900" font-size="30" fill="${p.yellow}">${ini}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function ldJson(c, base, photo) {
  const ct = c.contact;
  const data = {
    "@context": "https://schema.org", "@type": "Person", name: ct.name, jobTitle: ct.jobTitle || undefined,
    worksFor: ct.company ? { "@type": "Organization", name: ct.company } : undefined,
    url: base ? base + "/" : undefined, image: base ? base + "/" + photo.replace(/^\//, "") : undefined,
    email: ct.email ? "mailto:" + ct.email : undefined, telephone: ct.phone || undefined,
    sameAs: ct.linkedin ? [ct.linkedin] : undefined, description: c.site.description,
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Contact card file for "Save my number"
function vcard(c, siteUrl) {
  const ct = c.contact;
  const v = (s) => String(s || "").replace(/[\\;,]/g, (m) => "\\" + m).replace(/\r?\n/g, " ");
  const parts = ct.name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : "";
  return ["BEGIN:VCARD", "VERSION:3.0", `N:${v(last)};${v(parts.join(" "))};;;`, `FN:${v(ct.name)}`,
    ct.company && `ORG:${v(ct.company)}`, ct.jobTitle && `TITLE:${v(ct.jobTitle)}`,
    `TEL;TYPE=CELL,VOICE:${v(ct.phone.replace(/\s/g, ""))}`, ct.email && `EMAIL;TYPE=INTERNET:${v(ct.email)}`,
    siteUrl && `URL:${siteUrl}`, "END:VCARD"].filter(Boolean).join("\r\n") + "\r\n";
}

module.exports = { render, vcard, plain, prepare };
