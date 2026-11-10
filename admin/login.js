(() => {
  const $ = (id) => document.getElementById(id);
  const api = (url, body) =>
    fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", "X-Admin-Request": "1" }, body: JSON.stringify(body) })
      .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }));
  let loginId = "";

  fetch("/api/admin/status", { credentials: "same-origin" }).then((r) => r.json()).then((s) => {
    if (s.loggedIn) location.replace("/admin");
    if (s.setupProblem) { $("setup").textContent = s.setupProblem; $("setup").classList.remove("hidden"); }
  }).catch(() => {});

  $("step1").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("msg1").className = "msg"; $("msg1").textContent = "";
    $("btn1").disabled = true; $("btn1").textContent = "Sending code…";
    const { ok, data } = await api("/api/admin/login", { password: $("password").value }).catch(() => ({ ok: false, data: { error: "Network error. Try again." } }));
    $("btn1").disabled = false; $("btn1").textContent = "Continue →";
    if (!ok) { $("msg1").className = "msg err"; $("msg1").textContent = data.error || "Login failed."; return; }
    loginId = data.loginId;
    $("emailHint").textContent = data.email;
    $("step1").classList.add("hidden"); $("step2").classList.remove("hidden");
    $("password").value = "";
    $("code").focus();
  });

  $("code").addEventListener("input", () => {
    $("code").value = $("code").value.replace(/\D/g, "").slice(0, 6);
    if ($("code").value.length === 6) $("step2").requestSubmit();
  });

  $("step2").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("msg2").className = "msg"; $("msg2").textContent = "";
    $("btn2").disabled = true; $("btn2").textContent = "Checking…";
    const { ok, data } = await api("/api/admin/verify", { loginId, code: $("code").value }).catch(() => ({ ok: false, data: { error: "Network error. Try again." } }));
    $("btn2").disabled = false; $("btn2").textContent = "Log in";
    if (!ok) { $("msg2").className = "msg err"; $("msg2").textContent = data.error || "Wrong code."; $("code").value = ""; $("code").focus(); return; }
    $("msg2").className = "msg ok"; $("msg2").textContent = "Logged in! Opening your panel…";
    location.replace("/admin");
  });

  $("back").addEventListener("click", () => {
    $("step2").classList.add("hidden"); $("step1").classList.remove("hidden");
    $("code").value = ""; $("msg2").textContent = ""; $("password").focus();
  });
})();
