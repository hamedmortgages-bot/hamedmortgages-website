# Website Module Map — Hamed Ashouri Digital Mortgage Authority

**Repository:** hamedmortgages-bot/hamedmortgages-website  
**Branch:** main  
**Runtime:** Static HTML + CSS + Vanilla JavaScript  
**Deployment:** Custom domain via CNAME: hamedmortgages.ca  
**Last audited:** 2026-09-14

## 1. Architecture

The website is a static bilingual public frontend. It has no package manager, framework, backend, database, or server-side runtime in this repository.

```
User
  ↓
HTML route (/en or /fa)
  ↓
Shared CSS + Vanilla JS
  ↓
External systems where linked
  ├─ Zoho Forms
  ├─ Zoho CRM / WorkDrive
  ├─ Mortgage Workspace
  └─ CMHC calculator subdomain
```

## 2. Modules

| Module | Source location | Responsibility | Current status |
|---|---|---|---|
| Language Gateway | `index.html` | Route visitor to English/Persian experience | Confirmed |
| English Public Site | `en/*.html` | LTR public pages and conversion paths | Confirmed |
| Persian Public Site | `fa/*.html` | RTL public pages and Persian content | Confirmed |
| Shared Design System | `assets/css/authority-v1.css`, `assets/css/main.css` | Brand tokens, layout, responsive UI, compliance styling | Confirmed |
| RTL Overlay | `assets/css/rtl.css` | Persian direction and language-specific layout | Confirmed |
| Shared Runtime | `assets/js/main.js` | Navigation, FAQ, year, runtime loaders | Confirmed |
| Mortgage Calculator | `assets/js/calculator.js` | Client-side illustrative payment calculation | Confirmed |
| Platform Runtime | `assets/js/platform-runtime.js` | Website-to-platform integration point | Present; integration needs verification |
| NILI Concierge | `assets/js/concierge.js` | AI assistant/widget integration point | Present; live behavior needs verification |
| SEO Runtime | `assets/js/authority-seo.js` | Shared SEO enhancement loading | Present; needs QA |
| Intelligence UI | `en/intelligence.html`, `fa/intelligence.html` | Market intelligence presentation | Present in source; publishing independence needs verification |
| News Engine | Recent commits and news route/assets | News/content update mechanism | Present; runtime and automation need verification |
| Compliance Footer | Shared page footers + disclosure CSS | Broker, brokerage, FSRA, disclaimer and privacy disclosure | Live confirmed |
| Asset Layer | `assets/img/`, `assets/fonts/` | Logos, headshot, imagery, fonts | Present; inventory needs verification |
| Deployment Contract | `CNAME`, static root | Custom-domain publishing contract | Confirmed |

## 3. Route groups

### English
- `/en/`
- `/en/strategy.html`
- `/en/intelligence.html`
- `/en/learn.html`
- `/en/tools.html`
- `/en/stories.html`
- `/en/about.html`
- `/en/start.html`
- `/en/privacy.html`

### Persian
- `/fa/`
- Equivalent Persian routes under `/fa/`

## 4. Data and publishing boundaries

- Public static content is compiled into HTML files.
- Calculator calculations run in the browser and do not require a deployment backend.
- Forms, CRM, WorkDrive and Workspace are external systems.
- Dynamic content is not yet proven to be independently publishable without a GitHub deployment.
- No secrets or client data should be stored in this repository.

## 5. Agent/Engine ownership map

| Engine | Website modules |
|---|---|
| Brand & Experience Engine | Design System, assets, EN/FA shell |
| Content & Education Engine | Learn, Stories, Resources |
| Market Intelligence Engine | Intelligence, News Engine |
| Decision & Calculator Engine | Tools, calculator.js |
| Lead Generation & Conversion Engine | Start, forms, CTA routes |
| CRM & Mortgage AI OS Engine | platform-runtime.js, concierge.js, external Workspace links |

## 6. Required next verification

1. Inspect every route for EN/FA parity.
2. Inspect News Engine source and update trigger.
3. Confirm whether Intelligence/News can publish through a content file/API without full site deployment.
4. Add a version manifest and release archive process.
5. Run route, link, mobile, compliance and bilingual QA before each production release.

## Status labels

- **Confirmed:** observed in repository or live site.
- **Present; needs verification:** source exists, behavior is not yet proven end-to-end.
- **Blocked:** requires missing credential, external system access, or owner-only action.
