(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // Animation level comes from the admin panel: full | calm | off
  const anim = document.body.dataset.anim || "full";
  const fine = matchMedia("(pointer: fine)").matches && anim === "full";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || anim === "off";
  const SITE = window.SITE || {};
  const C = SITE.contact || {};

  // ---- Preloader ----
  const loader = $("#loader");
  if (loader) document.body.classList.add("loading");
  const finish = () => {
    if (loader) loader.classList.add("done");
    document.body.classList.remove("loading");
    document.body.classList.add("ready");
  };
  window.addEventListener("load", () => setTimeout(finish, loader ? 900 : 0));
  setTimeout(finish, 3500); // safety net

  if ($("#year")) $("#year").textContent = new Date().getFullYear();

  // ---- Rotating headline words ----
  const words = SITE.words || [];
  const rot = $("#rotator");
  let wi = 0;
  if (!reduce && rot && words.length > 1) {
    setInterval(() => {
      rot.classList.add("out");
      setTimeout(() => {
        wi = (wi + 1) % words.length;
        rot.textContent = words[wi];
        rot.classList.remove("out");
      }, 400);
    }, 2600);
  }

  // ---- Scroll reveal (with stagger) ----
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
    io.observe(el);
  });

  // ---- Count-up stats ----
  const countUp = (el) => {
    const end = +el.dataset.count, dec = +(el.dataset.dec || 0), dur = 1600, t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1), v = end * (1 - Math.pow(1 - p, 4));
      el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-IN");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const countIO = new IntersectionObserver((entries) =>
    entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); countIO.unobserve(e.target); } }), { threshold: 0.3 });
  $$("[data-count]").forEach((el) => { if (!reduce) { el.textContent = "0"; countIO.observe(el); } });

  // ---- Industry tabs (funnel + bars + counters replay on switch) ----
  const runPanel = (panel) => {
    panel.classList.remove("run"); void panel.offsetWidth; panel.classList.add("run");
    if (!reduce) $$("[data-count]", panel).forEach(countUp);
  };
  const panelIO = new IntersectionObserver((entries) =>
    entries.forEach((e) => { if (e.isIntersecting) { runPanel(e.target); panelIO.unobserve(e.target); } }), { threshold: 0.25 });
  const firstPanel = $(".panel.active"); if (firstPanel) panelIO.observe(firstPanel);
  $$(".tab").forEach((t) => t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
    $$(".panel").forEach((p) => {
      const on = p.dataset.panel === t.dataset.tab;
      p.classList.toggle("active", on);
      if (on) { panelIO.unobserve(p); runPanel(p); }
    });
  }));

  // ---- Cycling hero chips ----
  $$(".cycle").forEach((el, k) => {
    const items = el.dataset.items.split("|"); let i = 0;
    if (reduce) return;
    setTimeout(() => setInterval(() => {
      el.classList.add("out");
      setTimeout(() => { i = (i + 1) % items.length; el.textContent = items[i]; el.classList.remove("out"); }, 350);
    }, 3000), k * 1200);
  });

  // ---- Looping result toasts ----
  const toasts = (SITE.toasts || []).map((t) => [t.tag, t.title, t.text]);
  const toast = $("#toast");
  if (toast && toasts.length) {
    let ti = 0;
    const showToast = () => {
      const [tag, title, text] = toasts[ti++ % toasts.length];
      $("#toastTag").textContent = "Result · " + tag;
      $("#toastTitle").textContent = title;
      $("#toastText").textContent = text;
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 4200);
    };
    setTimeout(() => { showToast(); setInterval(showToast, 7000); }, 5000);
  }

  // ---- Scroll: progress bar, hide nav, timeline fill, active link ----
  const nav = $("#nav"), bar = $("#progress"), tl = $("#timeline"), fill = $("#tlFill");
  const sections = $$("main section[id]");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = `${(y / h) * 100}%`;
    nav.classList.toggle("scrolled", y > 30);
    lastY = y;
    if (tl && fill) {
      const r = tl.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * 0.6 - r.top) / r.height, 0), 1);
      fill.style.height = `${p * 100}%`;
    }
    let current = "";
    sections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    $$(".nav-links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Mobile menu ----
  const burger = $("#burger"), links = $("#navLinks");
  if (burger) {
    burger.addEventListener("click", () => { burger.classList.toggle("open"); links.classList.toggle("open"); });
    $$("a", links).forEach((a) => a.addEventListener("click", () => { burger.classList.remove("open"); links.classList.remove("open"); }));
  }

  // ---- Desktop-only pointer effects ----
  if (fine && !reduce) {
    const glow = $("#glow");
    if (glow) addEventListener("pointermove", (e) => { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; });

    // Magnetic buttons
    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });

    // 3D tilt + spotlight
    $$(".tilt").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg)`;
        c.style.setProperty("--mx", `${x * 100}%`);
        c.style.setProperty("--my", `${y * 100}%`);
      });
      c.addEventListener("pointerleave", () => (c.style.transform = ""));
    });
  }

  // ---- "Book a Call" / "Hire Me" buttons: scroll to the right form, pop it up and show a hint ----
  const popForm = (f) => {
    if (!f) return;
    const hint = $(".form-hint", f);
    f.classList.add("in");
    f.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    setTimeout(() => {
      f.classList.remove("pop"); void f.offsetWidth; f.classList.add("pop");
      if (hint) hint.classList.add("show");
      const first = f.querySelector("input:not(.hp)"); if (first) first.focus({ preventScroll: true });
    }, reduce ? 0 : 700);
    setTimeout(() => f.classList.remove("pop"), 3200);
  };
  $$(".js-book").forEach((btn) => btn.addEventListener("click", (e) => { const f = $("#leadForm"); if (f) { e.preventDefault(); popForm(f); } }));
  $$(".js-hire").forEach((btn) => btn.addEventListener("click", (e) => { const f = $("#hireForm"); if (f) { e.preventDefault(); popForm(f); } }));

  // ---- "Save my number": opens the phone's Add Contact screen pre-filled ----
  // Android (Chrome / Samsung Internet): native "New contact" screen via an intent, no file download.
  // iPhone: the .vcf link opens iOS's contact card directly ("Create New Contact").
  // Computers and in-app browsers: falls back to the .vcf file.
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const inApp = /; wv\)|FBAN|FBAV|Instagram|Line\//i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  const vcfUrl = new URL("/contact.vcf", location.href).href;
  const enc = encodeURIComponent;
  const contactIntent =
    "intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/raw_contact;" +
    "S.name=" + enc(C.name || "") + ";" +
    "S.phone=" + enc(C.phone || "") + ";i.phone_type=2;" +
    (C.email ? "S.email=" + enc(C.email) + ";" : "") +
    (C.company ? "S.company=" + enc(C.company) + ";" : "") +
    (C.jobTitle ? "S.job_title=" + enc(C.jobTitle) + ";" : "") +
    "S.browser_fallback_url=" + enc(vcfUrl) + ";end";
  $$(".js-save-contact").forEach((a) =>
    a.addEventListener("click", (e) => {
      if (isAndroid && !inApp && !isFirefox) {
        e.preventDefault();
        location.href = contactIntent;
      }
    })
  );

  // ---- Forms (clients + job offers) -> /api/contact (Neon). Fall back to WhatsApp if the server is unreachable ----
  const firstName = (C.name || "").split(" ")[0];
  $$(".js-lead-form").forEach((form) => {
    const kind = form.dataset.kind === "hire" ? "hire" : "client";
    const note = $(".form-note", form), label = $(".btn-label", form), hint = $(".form-hint", form);
    const submitText = label.textContent;
    const success = (kind === "hire" ? SITE.hireSuccessText : SITE.successText) || "Thank you! I'll get back to you soon.";
    const waLink = (d) => "https://wa.me/" + (C.whatsapp || "") + "?text=" + encodeURIComponent(kind === "hire"
      ? `Hi ${firstName}, I'm ${d.name} from ${d.company}. We'd like to talk to you about a ${d.budget} role: ${d.service || "marketing"}. ${d.message || ""}`
      : `Hi ${firstName}, I'm ${d.name}. I need help with ${d.service} (budget: ${d.budget}). ${d.message || ""}`);
    const bad = (field, msg) => { if (field) field.classList.add("invalid"); note.className = "form-note err"; note.textContent = msg; };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      d.kind = kind;
      $$("input, textarea", form).forEach((i) => i.classList.remove("invalid"));
      if (kind === "hire" && !String(d.company || "").trim()) return bad(form.company, "Please enter the company name.");
      if (!String(d.name || "").trim()) return bad(form.name, "Please enter your name.");
      if (!String(d.email || "").trim() && !String(d.phone || "").trim()) {
        form.phone.classList.add("invalid");
        return bad(form.email, "Please add an email or phone number so I can reach you.");
      }
      label.textContent = "Sending…"; note.textContent = "";
      try {
        const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.ok) throw new Error(out.error || "Could not send");
        form.reset();
        note.className = "form-note ok";
        note.textContent = success;
        if (hint) hint.classList.remove("show");
      } catch (err) {
        note.className = "form-note err";
        note.textContent = (err && err.message && err.message !== "Could not send" && err.message !== "Failed to fetch" ? err.message + " " : "Couldn't send right now. ");
        if (C.whatsapp) {
          const a = document.createElement("a");
          a.href = waLink(d); a.target = "_blank"; a.rel = "noopener"; a.textContent = "Send it on WhatsApp instead →";
          note.appendChild(a);
        }
      } finally {
        label.textContent = submitText;
      }
    });
  });
})();
