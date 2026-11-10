// Email + WhatsApp alerts. Email goes through Resend's HTTPS API (works on Render's free plan).
const esc = (v) => String(v ?? "-").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const istNow = () => new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

const mail = {
  configured: () => !!process.env.RESEND_API_KEY,

  // Replaceable in tests
  async send({ to, subject, html, replyTo }) {
    const key = process.env.RESEND_API_KEY;
    if (!key || !to) throw new Error("Email is not configured (RESEND_API_KEY missing)");
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.LEAD_EMAIL_FROM || "Digital Shubham <onboarding@resend.dev>", to: [to], subject, html, reply_to: replyTo || undefined }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error(`Resend HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  },

  shell(title, body) {
    return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
      <div style="background:#06080f;color:#fff;padding:20px 22px;border-radius:12px 12px 0 0">
        <div style="font-size:13px;color:#ffc83d;font-weight:700;letter-spacing:1px">DIGITAL SHUBHAM</div>
        <div style="font-size:22px;font-weight:800;margin-top:4px">${title}</div>
      </div>
      <div style="background:#fff;border:1px solid #eee;padding:18px 22px;border-radius:0 0 12px 12px;color:#111">${body}</div></div>`;
  },

  async leadAlert(lead) {
    const to = process.env.LEAD_EMAIL_TO;
    if (!mail.configured() || !to) return;
    const row = (k, v) => `<tr><td style="padding:9px 0;color:#6b7280;font-weight:600;width:100px;vertical-align:top">${k}</td><td style="padding:9px 0">${v}</td></tr>`;
    const phone = lead.phone ? `<a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>` : "-";
    const hire = lead.kind === "hire";
    const html = mail.shell(hire ? "💼 New job enquiry (Hire me)" : "🔔 New website lead", `<table style="width:100%;border-collapse:collapse">
      ${row("Name", esc(lead.name))}${hire ? row("Company", esc(lead.company)) : ""}${row("Phone", phone)}${row("Email", esc(lead.email))}${row(hire ? "Role" : "Service", esc(lead.service))}
      ${row(hire ? "Job type" : "Budget", esc(lead.budget))}${row("Message", esc(lead.message))}${row("Time", esc(istNow()))}</table>
      <p style="color:#6b7280;font-size:12px">Open your admin panel → Leads to update its status.</p>`);
    try { await mail.send({ to, subject: hire ? `💼 Job enquiry: ${lead.company || lead.name} · ${lead.service || "Role"}` : `New lead: ${lead.name} · ${lead.service || "Enquiry"}`, html, replyTo: lead.email }); console.log("Email alert sent"); }
    catch (e) { console.error("Email alert failed:", e.message); }
  },

  async loginCode(to, code) {
    const html = mail.shell("🔐 Your admin login code", `
      <p style="margin:0 0 14px">Use this code to finish logging in to your website admin panel:</p>
      <div style="font-size:34px;font-weight:800;letter-spacing:8px;background:#fff7dd;border:1px solid #ffc83d;border-radius:10px;padding:14px;text-align:center">${esc(code)}</div>
      <p style="color:#6b7280;font-size:13px;margin-top:14px">It expires in 10 minutes. If you didn't try to log in, someone knows your password: change <b>ADMIN_PASSWORD</b> on Render now.</p>`);
    await mail.send({ to, subject: `${code} is your Digital Shubham admin code`, html });
  },

  async loginNotice(to, ip, ua) {
    const html = mail.shell("✅ New admin login", `<p style="margin:0">Someone just logged in to your admin panel.</p>
      <p style="color:#6b7280;font-size:13px">Time: ${esc(istNow())}<br>IP: ${esc(ip)}<br>Device: ${esc(String(ua).slice(0, 160))}</p>
      <p style="color:#6b7280;font-size:13px">Not you? Change <b>ADMIN_PASSWORD</b> on Render and use “Log out everywhere” in the panel.</p>`);
    try { await mail.send({ to, subject: "New login to your website admin panel", html }); } catch (e) { console.error("Login notice failed:", e.message); }
  },
};

// Optional WhatsApp alert via CallMeBot (set WHATSAPP_PHONE and CALLMEBOT_APIKEY)
async function whatsappAlert(lead) {
  const phone = process.env.WHATSAPP_PHONE, apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) return;
  const text = ["🔔 *New Website Lead*", "", `👤 *Name:* ${lead.name}`, `📞 *Phone:* ${lead.phone || "-"}`, `✉️ *Email:* ${lead.email || "-"}`,
    `🛠 *Service:* ${lead.service || "-"}`, `💰 *Budget:* ${lead.budget || "-"}`, `💬 *Message:* ${lead.message || "-"}`, "", `🕒 ${istNow()}`].join("\n");
  try {
    const r = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`, { signal: AbortSignal.timeout(15000) });
    console.log(r.ok ? "WhatsApp alert sent" : `WhatsApp alert failed: HTTP ${r.status}`);
  } catch (e) { console.error("WhatsApp alert failed:", e.message); }
}

module.exports = { mail, whatsappAlert, esc };
