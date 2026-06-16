# hamedmortgages.ca — Website V1

Static, bilingual (English / Persian) marketing site for **Hamed Ashouri — Mortgage Broker & Financial Strategist**. Built as the public front-end of a larger Mortgage AI Operating System.

Pure **HTML + CSS + vanilla JavaScript**. No frameworks, no build step, no backend, no paid dependencies. Hosts for **$0** on GitHub Pages or Cloudflare Pages.

## File structure

```
/
├── index.html            Language chooser + auto-redirect (EN/FA)
├── 404.html              Bilingual not-found page
├── CNAME                 Custom domain (hamedmortgages.ca) — for GitHub Pages
├── .nojekyll             Tells GitHub Pages to serve files as-is
├── robots.txt
├── sitemap.xml
├── en/                   English pages (LTR)
│   ├── index.html        Home
│   ├── solutions.html    Mortgage Solutions (7 anchored blocks)
│   ├── business-owners.html  Self-Employed & Business Owner
│   ├── refinance.html    Refinance & Debt Consolidation
│   ├── investment.html   Investment Property Financing
│   ├── about.html
│   ├── resources.html    Guides + Calculator + FAQ
│   └── contact.html      Booking / Apply / Assessment placeholders
├── fa/                   Persian pages (RTL) — same 8 files, hand-written Farsi
└── assets/
    ├── css/main.css      Design system + components
    ├── css/rtl.css       Persian/RTL overlay (loaded on /fa/ only)
    ├── js/main.js        Nav toggle, FAQ accordion, footer year
    ├── js/calculator.js  Client-side mortgage payment estimator
    ├── img/              (place logo, headshot, hero images here)
    └── fonts/            (optional: self-hosted fonts)
```

Fonts currently load from Google Fonts (Manrope for EN, Vazirmatn for FA). To remove the external dependency, download both into `assets/fonts/` and swap the `<link>` tags for local `@font-face` rules.

## What's a placeholder (intentionally not wired)

No client data touches this site. The following are styled placeholders only, ready to wire later:

- **AI Mortgage Assistant**, **Client Portal**, **Upload Documents** — disabled buttons
- **Apply Now** — for a future Zoho Form
- **Start Mortgage Assessment** — for a future Zoho Form → Make.com → Zoho CRM
- **Book a Consultation** — for a future Zoho Bookings embed (currently links to email)

Each placeholder is marked with an HTML comment (e.g. `<!-- ZOHO BOOKINGS EMBED PLACEHOLDER -->`) so the integration point is easy to find.

## Business details — already applied site-wide

- **Name:** Hamed Ashouri · **Title:** Mortgage Broker & Financial Strategist
- **Phone:** (416) 856-8148 · **Email:** hamedmortgages@gmail.com
- **License:** M22004433 · **Brokerage:** Mortgage Alliance Company of Canada · **FSRA:** 10530
- **Footer branding:** Powered by Keys & Capitals
- Compliant footer legal line + LocalBusiness/FinancialService schema with the above.

## Still to add before launch

1. **Logo file** — save the approved PNG as `assets/img/logo.png`. Every page, the
   splash, and the 404 already reference it (see `assets/img/README-LOGO.txt`). Until
   it's added, a clean text wordmark shows automatically — nothing looks broken.
2. **Headshot** — replace `[ Professional headshot placeholder ]` on About (`assets/img/`).
3. **Feature images** — optional `[ Image placeholder ... ]` blocks on interior pages.
4. **Final bio** — replace `[Placeholder bio ...]` on `en/about.html` and `fa/about.html`.
5. **Service regions** — replace `[add regions]` / `[مناطق را اضافه کنید]` with your areas.
6. **Optional:** `favicon.png` and `og-image.png` in `assets/img/` (ask to wire into `<head>`).

## Local preview

```bash
cd hamedmortgages-website
python3 -m http.server 8080
# open http://localhost:8080/
```

## Deploy — GitHub Pages (test on the temporary URL first)

No custom domain yet. Make sure there is **no `CNAME` file** in the repo so GitHub
Pages serves on its temporary URL.

**Recommended for clean paths:** name the repo `<username>.github.io` (a user/org
site). It deploys at `https://<username>.github.io/` — the site root — so every
link, including the splash redirect and the 404 page's absolute paths, works as-is.

1. Create the repo and push the contents of this folder to the root of `main`.
2. Settings → Pages → Source: **Deploy from a branch** → `main` / root → Save.
3. Wait ~1 minute, then open the URL GitHub shows (e.g. `https://<username>.github.io/`).
4. "Enforce HTTPS" is automatic on `github.io`.

> If you instead use a normal project repo, the site lives at
> `https://<username>.github.io/<repo>/`. Pages still work, but the 404 page and the
> root splash use root-absolute paths (`/en/`, `/assets/…`) that assume the domain
> root. For the temporary test, the user/org-site repo name above avoids that.

### Add the custom domain later (when ready)
1. Settings → Pages → Custom domain → enter `hamedmortgages.ca` (this recreates `CNAME`).
2. In GoDaddy DNS: A records for the apex to GitHub's IPs, plus a `www` CNAME to
   `<username>.github.io`.
3. Re-enable "Enforce HTTPS".

## Deploy — Cloudflare Pages (alternative)

1. Connect the repo in Cloudflare Pages. Framework preset: **None**. Build command:
   *(empty)*. Output directory: `/`. You get a `*.pages.dev` test URL immediately.
2. Add `hamedmortgages.ca` as a custom domain later (Cloudflare manages DNS + SSL).

## Compliance notes

Tone is advisory throughout. No rate guarantees, no "approval guaranteed" language; the calculator and any example rates carry explicit disclaimers. Update the footer legal line with your actual FSRA brokerage details before going live.
