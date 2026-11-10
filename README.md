# Digital Shubham · Website + Admin Panel

Your portfolio website, with a private admin panel at **/admin** where you can change
everything (text, numbers, boxes, on/off switches) and manage leads, without touching code.

## How it works
- **GitHub** stores the code. **Render** runs it. **Neon** stores your leads and your website content.
- When you click **Save** in the panel, the content is saved in Neon and the website updates instantly.
- Every save keeps the previous version (last 30), so you can undo from **Versions & undo**.

## Render settings (Environment)
| Key | Value | Needed for |
|---|---|---|
| `DATABASE_URL` | Your Neon connection string | Leads + panel changes |
| `ADMIN_PASSWORD` | A strong password, 10+ characters | Logging in to /admin |
| `ADMIN_EMAIL` | Your Gmail address | Where the login code is sent |
| `RESEND_API_KEY` | Your Resend key (`re_…`) | Login codes + lead emails |
| `LEAD_EMAIL_TO` | Your Gmail address | New-lead email alerts |

Admin login stays **switched off** until `ADMIN_PASSWORD`, `ADMIN_EMAIL` and `RESEND_API_KEY` are set.

## Logging in
1. Open `https://your-site/admin`
2. Enter your password, then the 6-digit code sent to your email (valid 10 minutes)
3. You stay logged in for 7 days on that device. You get an email for every new login.

Security: 5 wrong passwords lock login for 15 minutes · codes work once · only a scrambled
copy of your login is stored · "Log out everywhere" in the ⋯ menu signs out every device.

## What you can change in the panel
- **Switches**: turn buttons, strips, pop-ups, your photo and the scroll arrow on/off
- **Design & layout**: 7 colour themes (or your own colours), heading and body fonts, corner style,
  button shape, spacing, text size, animation level, section order, photo left/right, your photo
- **All content**: every text, number and box; add, copy, move or delete boxes; your own new sections
- **Leads**: status, notes, call/WhatsApp in one tap, download as Excel (CSV)
- **Preview** shows unsaved changes on the full website; **Versions & undo** keeps the last 30 saves
- Unsaved work is kept in your browser, so it can be restored if your login expires

## Text formatting inside the panel
`*word*` = yellow highlight · `~word~` = blue highlight · `**word**` = bold

## Numbers (🔢 Key numbers tab)
Every number is typed once and used anywhere with a tag like `{cpl}`. Change it once, the whole site updates.
- Calculated automatically: `{years}` (from the earliest year in Experience), `{companies}` (from Experience),
  `{budget}` (all industry budgets added up), `{leads}` (all industry leads added up)
- Your own numbers: a plain number (`2856`) or a formula (`={clicks}/{impressions}*100`)
- Also calculated: the budget bar, legend and total in Results, and every % between funnel steps

## Files
- `server.js` – web server, form, admin API
- `lib/defaults.js` – the original website content (used for "Reset to original")
- `lib/schema.js` – what the panel lets you edit
- `lib/theme.js` – colour themes and fonts
- `lib/render.js` – builds the website page from your content
- `lib/numbers.js` – the calculator for {tags}; `lib/upgrade.js` – updates older saved content
- `lib/auth.js`, `lib/db.js`, `lib/mail.js`, `lib/content.js` – login, database, emails, validation
- `admin/` – the admin panel pages
- `public/` – design (style.css), animations (script.js), photo
