# Shubham Gupta · Portfolio

Dark, animated portfolio website. GitHub stores the code, Render hosts it, Neon saves contact-form leads.

## Files
- `server.js` – web server + `/api/contact` (saves leads into Neon)
- `public/index.html` – all page content (edit text here)
- `public/style.css` – design & colours
- `public/script.js` – animations & form
- `public/img/shubham.jpg` – profile photo

## Deploy (one time)
1. **GitHub** → open your `portfolio` repo → *Add file → Upload files* → drag in everything from this folder (keep the `public` folder structure) → *Commit changes*.
2. **Neon** → your project → *Connect* → copy the connection string (`postgresql://...`).
3. **Render** → *New → Web Service* → pick the `portfolio` repo, then set:
   - Name: `shubhamgupta` (your URL becomes `shubhamgupta.onrender.com`)
   - Region: Singapore · Runtime: Node
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free (or Starter to keep it always awake)
   - Environment variable: `DATABASE_URL` = the Neon string
   - Click *Deploy Web Service*.
4. Open the URL, submit a test enquiry, then check **Neon → Tables → leads**.

## Viewing leads
Neon console → *Tables* → `leads`, or run in the SQL Editor:
```sql
SELECT * FROM leads ORDER BY created_at DESC;
```

## Updating the site
Edit a file on GitHub (pencil icon) → Commit. Render redeploys automatically in ~1–2 minutes.
