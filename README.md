# hamedmortgages.ca — Website

Bilingual public website for **Hamed Ashouri — Mortgage Broker & Mortgage Strategist**, operating under **Sherwood Mortgage Group**.

## Current source of truth

- Repository: `hamedmortgages-bot/hamedmortgages-website`
- Branch: `main`
- Live domain: https://hamedmortgages.ca
- Deployment contract: `CNAME` → `hamedmortgages.ca`
- Last repository audit: 2026-09-14

## Stack

This repository is intentionally lightweight:

- Static HTML
- Shared CSS design system
- Vanilla JavaScript
- No framework
- No package manager
- No backend or database in this repository
- No paid runtime dependency

This keeps routine content and presentation updates low-cost. Dynamic integrations must remain separated from the public shell.

## Website modules

- Language Gateway: `index.html`
- English routes: `en/`
- Persian RTL routes: `fa/`
- Shared styles: `assets/css/`
- Shared runtime: `assets/js/main.js`
- Mortgage calculator: `assets/js/calculator.js`
- Platform integration: `assets/js/platform-runtime.js`
- NILI integration: `assets/js/concierge.js`
- SEO integration: `assets/js/authority-seo.js`
- News and intelligence routes: `intelligence.html` and related content assets
- Verified architecture map: `docs/MODULE_MAP.md`

## Regulatory identity

The public footer must remain consistent with the current identity:

- Hamed Ashouri — Mortgage Broker
- Licence: M22004433
- Sherwood Mortgage Group — FSRA Brokerage Licence #12176
- Licensed in Ontario
- Information-only disclaimer and Privacy Policy

Never reintroduce historical Mortgage Alliance or FSRA #10530 details into public pages or documentation.

## Data boundaries

- Do not store client documents, personal information, credentials or secrets in GitHub.
- Website input/output documentation and approved assets are archived in the Website Google Drive folder.
- Zoho CRM, Zoho WorkDrive, forms and Mortgage Workspace remain external systems.
- The calculator is illustrative only and runs client-side.
- Dynamic publishing is not considered complete until it is verified end-to-end without requiring a full public-shell deployment.

## Release rule

For every completed stage:

1. Run quality and bilingual/compliance checks.
2. Commit the verified change to `main`.
3. Publish to the production domain.
4. Verify the live result.
5. Archive the source snapshot, release notes, commit SHA and live URL in the Website Google Drive folder.
6. Only then begin the next stage.

## Current known gaps

- News Engine exists in the source history but its independent runtime/publishing path requires verification.
- English and Persian pages require a full parity audit.
- Repository is static; independent dynamic content requires a low-cost external content boundary or generated content files.
- Asset inventory and all route links require final QA.

## Local preview

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/`.

