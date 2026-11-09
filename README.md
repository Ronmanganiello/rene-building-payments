# Cafe Building · Rene's payments

Tracks Rene's payments on the Cafe Building (sold at 0% interest, in Mexican pesos) and the 12-month bonus credit.

**Bonus rule:** a calendar month counts when Rene's payments dated in it add up to $20,000 MXN or more. After 12 counting months in a row, the 13th month gets a bonus credit of 1/12 of those 12 months' payments; that month is month 1 of the next run. A month below $20,000 starts the count over. Counting began June 2023.

## Access
- `EDIT_PASSWORD` — Ron and Ellen: add, edit and delete entries
- `VIEW_PASSWORD` — Rene: view only (the server refuses changes from this sign-in)
- `SESSION_SECRET` — signs the login cookie; changing it signs everyone out
- `DATABASE_URL` — Neon project `rene-building-payments`

Change a password in Vercel → Project → Settings → Environment Variables, then redeploy.

## Files
- `public/index.html` — the app (no build step)
- `api/data.js` — reads entries; editors add/update/delete
- `api/login.js`, `api/logout.js`, `api/_lib/auth.js` — two passwords, signed role cookie
