# Executable Agent and Engine Workflow Runtime

Baseline: Website Version 26
Authoritative production source: connected Sites Version 26
Runtime version: 1.0

## What is executable now

The repository now contains an additive browser runtime:

- Registry: `assets/data/agent-engine-registry.json`
- Dispatcher: `assets/js/agent-runtime.js`
- Existing intake/qualification/CRM contract: `assets/js/platform-runtime.js`
- Existing assistant adapter: `assets/js/concierge.js`
- Existing calculator: `assets/js/calculator.js`

The dispatcher accepts a typed event and returns a structured audit result:

`HMAgentRuntime.dispatch(event_type, payload)`

Every result contains the baseline version, runtime version, selected agents, status, and gate.

## Event workflow

| Event | Agents routed | Output |
|---|---|---|
| page_view | Orchestrator, SEO, Compliance | page and release checks |
| content_research_requested | Orchestrator, Research, Intelligence, Editorial, Localization, Compliance | evidence-to-draft handoff |
| content_draft_submitted | Orchestrator, Editorial, Education, Localization, SEO, Compliance | content QA result |
| visual_asset_requested | Orchestrator, Visual, Compliance | asset brief and approval gate |
| calculator_run | Orchestrator, Calculator, Compliance | deterministic calculator result |
| cta_clicked | Orchestrator, Conversion | funnel event |
| lead_submitted | Orchestrator, Intake, Qualification, CRM Routing, Compliance | normalized lead and Zoho handoff |
| release_candidate | Orchestrator, Localization, SEO, Compliance | release gate |

## Agent contract

Each Agent has:

- typed event input
- one responsibility
- structured output
- status
- gate
- correlation ID
- baseline version
- audit summary

The runtime never claims an underwriting approval. Lead Qualification is preliminary triage only. CRM Routing produces an auditable request; actual Zoho writes remain in the approved external adapter.

## Engine ownership

1. Brand & Experience: visual, SEO, localization
2. Content & Education: research, intelligence, editorial, education, localization
3. Market Intelligence: research, intelligence, editorial, localization, compliance
4. Decision & Calculator: calculator and compliance
5. Lead Generation & Conversion: campaign, conversion, intake, qualification
6. CRM & Mortgage AI OS: intake, qualification, CRM routing, compliance

## Important boundary

This implementation is an executable event-driven control plane inside the static website. It is not fifteen continuously running cloud services. Continuous schedules, server-side research, external Zoho writes, and independent news publication require their respective external adapters and scheduler. They are represented by explicit gates rather than falsely marked as complete.

## Release rule

No baseline files are overwritten. Future changes must be additive, tested, committed, and mapped to a new version. The current production Version 26 remains unchanged until a separately verified release is approved.
