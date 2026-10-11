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

`site/start/` and `site/fa/start/` post the eight answers to a Make webhook (scenario "Lead Engine v1.2 — Website Funnel to Zoho"), which creates or updates a Lead in Zoho CRM. The submit code is in `site/app.js` (search for `hook.us2.make.com`).

## Content still in draft

- `site/knowledge/` and `site/fa/knowledge/` — awaiting review of the 22-entry knowledge sheet.
- `site/insights/new-build-hst-rebates-ontario/` (both languages) — held until the Ontario regulation is confirmed. Not linked from the index pages.

## The previous site

The site that was here until 2026-09-28 is kept on branch `archive/old-site-2026-09-28` and in the history of `main`.

## Publishing check

Git-connected publishing was set up and verified on 2026-10-11.
