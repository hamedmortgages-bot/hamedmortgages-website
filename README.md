# hamedmortgages.ca — Website (v2)

Bilingual (English / Persian) static website for Hamed Ashouri, Mortgage Broker, Sherwood Mortgage Group.

## How it goes live

- This repository, branch `main`, is the source of truth.
- Vercel (team `hamed-27a7`) is connected to this repository. A push to `main` publishes to https://www.hamedmortgages.ca within a couple of minutes. A push to any other branch creates a preview address only.
- DNS is at GoDaddy and points to Vercel. It does not need to change for content updates.

## Layout

- `site/` — the website exactly as served. Static HTML, one `site.css`, one `app.js`, media in `site/assets/`. English at `/`, Persian (RTL) at `/fa/`.
- `vercel.json` — tells Vercel to serve `site/` with no build step, and redirects the old site's addresses (`/en/*.html`, `/fa/*.html`) to the matching new pages.
- `site/sitemap.xml`, `site/robots.txt` — search-engine files. Pages still awaiting Hamed's review carry `noindex` and are left out of the sitemap.
- `site/google0acff6827b529d97.html` — Google Search Console verification file. Do not remove.

## Start form

`site/start/` and `site/fa/start/` post the eight answers to a Make webhook (scenario 5728752 "[LIVE] Lead Engine v1.2 — Website Start form to Zoho"), which creates or updates a Lead in Zoho CRM (Lead_Source "Website Mortgage Strategy Funnel"). The submit code is in `site/app.js` (search for `hook.us2.make.com`). A Zoho workflow rule ("Website Start form - notify Hamed") then creates a same-day call task for Hamed with an email notification. Test submissions must use a name containing `[TEST-DELETE-OK]`.

## Insights

`site/insights/` is a curated news desk: rate strip (Bank of Canada policy rate and next decision date), a lead story, a dated list with a category filter, and one image plus headline number per post. A few analyses a month, each published only after Hamed approves it. The rate strip must be updated after every Bank of Canada decision.

## Other

- Privacy pages: `site/privacy/`, `site/fa/privacy/`.
- Tab titles start with "Hamed Ashouri |" (English) or "حامد آشوری |" (Persian). Tab icon: `site/favicon.ico`, `site/assets/favicon-32.png`, `site/assets/icon-192.png`, `site/apple-touch-icon.png` (Hamed's real light-suit cutout on a gold circle).
- Share tags (Open Graph, canonical) on every page; share image `site/assets/og.jpg`.
- Vercel Web Analytics is on (cookieless).
- Search Console: sitemap submitted on https://hamedmortgages.ca/ and https://www.hamedmortgages.ca/.

## The previous site

The site that was here until 2026-09-28 is kept on branch `archive/old-site-2026-09-28` and in the history of `main`.

## Locked baseline

Branch `locked/v2-2026-10-13` (commit 89b2fc1) is Hamed's approved, locked version of the site. See CLAUDE.md.
