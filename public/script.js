(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fine = matchMedia("(pointer: fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Preloader ----
  document.body.classList.add("loading");
  const finish = () => {
    $("#loader").classList.add("done");
    document.body.classList.remove("loading");
    document.body.classList.add("ready");
  };
  window.addEventListener("load", () => setTimeout(finish, 900));
  setTimeout(finish, 3500); // safety net

  $("#year").textContent = new Date().getFullYear();

  // ---- Rotating headline words ----
  const words = ["qualified leads", "real sales", "higher ROAS", "loyal customers", "brand growth"];
  const rot = $("#rotator");
  let wi = 0;
  if (!reduce) {
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
  const toasts = [
    ["Real Estate", "11 site visits booked", "1 in 4 qualified buyers visited in 3 weeks"],
    ["Real Estate", "13.1% click-to-lead rate", "2,856 clicks turned into 375 leads"],
    ["EdTech", "Lead at ₹1.75", "373 hiring leads at an average of ₹3.92"],
    ["Real Estate", "Cost per lead ₹97.71", "Custom & lookalike audiences"],
    ["EdTech", "CPM just ₹2.49", "6.77L people reached on result posts"],
    ["Real Estate", "46 qualified buyers", "From 2L+ impressions at 1.41% CTR"],
    ["EdTech", "₹0.11 per video view", "16.6K full video plays"],
    ["All industries", "₹15.5L+ budget managed", "900+ leads generated so far"],
  ];
  const toast = $("#toast");
  if (toast) {
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
    const r = tl.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * 0.6 - r.top) / r.height, 0), 1);
    fill.style.height = `${p * 100}%`;
    let current = "";
    sections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id; });
    $$(".nav-links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${current}`));
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Mobile menu ----
  const burger = $("#burger"), links = $("#navLinks");
  burger.addEventListener("click", () => { burger.classList.toggle("open"); links.classList.toggle("open"); });
  $$("a", links).forEach((a) => a.addEventListener("click", () => { burger.classList.remove("open"); links.classList.remove("open"); }));

  // ---- Desktop-only pointer effects ----
  if (fine && !reduce) {
    const glow = $("#glow");
    addEventListener("pointermove", (e) => { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; });

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

  // ---- Work filters ----
  $$(".filter").forEach((f) =>
    f.addEventListener("click", () => {
      $$(".filter").forEach((x) => x.classList.remove("active"));
      f.classList.add("active");
      const cat = f.dataset.filter;
      $$(".work").forEach((w) => {
        const show = cat === "all" || w.dataset.cat === cat || w.dataset.cat === "all";
        w.classList.toggle("hidden", !show);
        if (show) { w.classList.remove("in"); requestAnimationFrame(() => w.classList.add("in")); }
      });
    })
  );

  // ---- "Book a Call" buttons: scroll to the form, pop it up and show a hint ----
  const leadForm = $("#leadForm"), hint = $("#formHint");
  $$(".js-book").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      leadForm.classList.add("in");
      leadForm.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      setTimeout(() => {
        leadForm.classList.remove("pop"); void leadForm.offsetWidth; leadForm.classList.add("pop");
        hint.classList.add("show");
        leadForm.name.focus({ preventScroll: true });
      }, reduce ? 0 : 700);
      setTimeout(() => leadForm.classList.remove("pop"), 3200);
    })
  );

  // ---- Contact form -> /api/contact (Neon). Falls back to WhatsApp if the server is unreachable ----
  const form = $("#leadForm"), note = $("#formNote"), label = $(".btn-label", form);
  const waLink = (d) =>
    "https://wa.me/917692058084?text=" +
    encodeURIComponent(`Hi Shubham, I'm ${d.name}. I need help with ${d.service} (budget: ${d.budget}). ${d.message || ""}`);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    $$("input, textarea", form).forEach((i) => i.classList.remove("invalid"));
    if (!d.name.trim()) { form.name.classList.add("invalid"); note.className = "form-note err"; note.textContent = "Please enter your name."; return; }
    if (!d.email.trim() && !d.phone.trim()) {
      form.email.classList.add("invalid"); form.phone.classList.add("invalid");
      note.className = "form-note err"; note.textContent = "Please add an email or phone number so I can reach you."; return;
    }
    label.textContent = "Sending…"; note.textContent = "";
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || "Could not send");
      form.reset();
      note.className = "form-note ok";
      note.textContent = "Thank you! You're registered. I'll call you back within 24 hours.";
      hint.classList.remove("show");
    } catch (err) {
      note.className = "form-note err";
      note.innerHTML = `Couldn't send right now. <a href="${waLink(d)}" target="_blank" rel="noopener">Send it on WhatsApp instead →</a>`;
    } finally {
      label.textContent = "Send Message";
    }
  });
})();
