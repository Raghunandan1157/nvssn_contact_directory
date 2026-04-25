# nvssn_contact_directory

Static HTML/CSS/JS employee directory for NVSSN. Reads from Supabase table `nvssn_employees` via PostgREST + anon key (RLS: public read).

## Stack
- Plain HTML/CSS/JS (no build step)
- Supabase (Postgres + PostgREST)
- GitHub Pages (deploy)

## Run locally
Open `index.html` in a browser, or:
```
python3 -m http.server 8080
```

## Files
- `index.html` — markup
- `styles.css` — styling
- `config.js` — Supabase URL + public anon key
- `app.js` — fetch, filter, render

## Data source
Excel `Employee 2026-04-25.xlsx` → seeded into `public.nvssn_employees`.

## Security
RLS enabled. Only `SELECT` allowed for `anon`/`authenticated`. No write paths exposed.
