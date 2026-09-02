/* ===================================================================
   Hamed Ashouri Digital Mortgage Authority Platform — Runtime v1.0
   Agents connected in this slice:
     Agent 11 — Lead Intake
     Agent 12 — Lead Qualification (preliminary triage only; NOT underwriting)
     Agent 13 — CRM Routing contract

   This runtime is deliberately additive. It does not replace the current
   delivery endpoint. It enriches every Universal Intake Engine event with
   the canonical contracts required by the new platform architecture.
   Zoho CRM remains the operational source of truth.
   =================================================================== */
(function () {
  "use strict";

  if (window.__hmPlatformRuntime) return;
  window.__hmPlatformRuntime = true;

  var RUNTIME_VERSION = "1.0";
  var LEAD_SCHEMA_VERSION = "1.0";
  var QUALIFICATION_VERSION = "1.0";
  var CRM_ROUTING_VERSION = "1.0";

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : ((r & 3) | 8)).toString(16);
    });
  }

  function clean(v) {
    return (v === null || v === undefined) ? "" : String(v).trim();
  }

  function firstPresent(obj, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (obj && clean(obj[keys[i]])) return clean(obj[keys[i]]);
    }
    return "";
  }

  function normalizeTimeline(v) {
    var s = clean(v).toLowerCase();
    if (!s) return "UNKNOWN";
    if (s.indexOf("as soon") > -1 || s.indexOf("immediate") > -1 || s.indexOf("urgent") > -1 || s.indexOf("فوری") > -1) return "ASAP";
    if (s.indexOf("1–3") > -1 || s.indexOf("1-3") > -1 || s.indexOf("1 to 3") > -1) return "1_3_MONTHS";
    if (s.indexOf("3–6") > -1 || s.indexOf("3-6") > -1 || s.indexOf("3 to 6") > -1) return "3_6_MONTHS";
    if (s.indexOf("6–12") > -1 || s.indexOf("6-12") > -1 || s.indexOf("6 to 12") > -1) return "6_12_MONTHS";
    if (s.indexOf("explor") > -1 || s.indexOf("بررسی") > -1) return "EXPLORING";
    return "OTHER";
  }

  /* Agent 11 — Standard Lead Payload */
  function buildLeadPayload(event) {
    event = event || {};
    var details = event.details || event;
    var first = firstPresent(event, ["firstName", "first"]);
    var last = firstPresent(event, ["lastName", "last"]);
    var full = firstPresent(event, ["fullName", "contact"]);
    if (!full) full = (first + " " + last).trim();

    var eventId = firstPresent(event, ["platform_event_id", "submission_id", "submissionId"]);
    if (!eventId) eventId = "WEB-" + uuid();

    return {
      schema_version: LEAD_SCHEMA_VERSION,
      event_id: eventId,
      correlation_id: firstPresent(event, ["correlation_id"]) || eventId,
      captured_at: firstPresent(event, ["timestamp", "submittedAt"]) || new Date().toISOString(),
      source: firstPresent(event, ["source"]) || "hamedmortgages.ca",
      journey: firstPresent(event, ["journey"]),
      feature: firstPresent(event, ["feature"]),
      action: firstPresent(event, ["action"]),
      language: firstPresent(event, ["language"]) || ((document.documentElement.lang || "en").slice(0, 2)),
      page_url: firstPresent(event, ["pageUrl"]) || location.href,
      contact: {
        first_name: first,
        last_name: last,
        full_name: full,
        email: firstPresent(event, ["email"]),
        phone: firstPresent(event, ["phone"]),
        position: firstPresent(event, ["position"])
      },
      mortgage_context: {
        purpose: firstPresent(details, ["purpose"]),
        timeline: firstPresent(details, ["timeline"]),
        property_type: firstPresent(details, ["propertyType", "property_type"]),
        property_value: firstPresent(details, ["propertyValue", "property_value"]),
        down_payment_or_balance: firstPresent(details, ["downOrBalance", "down_payment_or_balance"]),
        employment: firstPresent(details, ["employment"]),
        annual_income: firstPresent(details, ["income", "annual_income"]),
        credit_range: firstPresent(details, ["creditScore", "credit_range"]),
        notes: firstPresent(details, ["notes"])
      },
      consent: {
        service_inquiry: true,
        marketing: false,
        basis: "USER_SUBMITTED_SERVICE_REQUEST",
        version: "website_service_inquiry_v1"
      },
      attribution: {
        original_referrer: document.referrer || "",
        utm_source: new URLSearchParams(location.search).get("utm_source") || "",
        utm_medium: new URLSearchParams(location.search).get("utm_medium") || "",
        utm_campaign: new URLSearchParams(location.search).get("utm_campaign") || "",
        gclid: new URLSearchParams(location.search).get("gclid") || "",
        fbclid: new URLSearchParams(location.search).get("fbclid") || ""
      }
    };
  }

  /* Agent 12 — preliminary triage only. Never presents itself as approval,
     underwriting, lender eligibility, or individualized financial advice. */
  function qualify(lead) {
    var c = lead.contact || {};
    var m = lead.mortgage_context || {};
    var reasons = [];
    var missing = [];

    if (!clean(c.first_name) && !clean(c.full_name)) missing.push("NAME");
    if (!clean(c.email)) missing.push("EMAIL");
    if (!clean(c.phone)) missing.push("PHONE");
    if (!clean(m.purpose)) missing.push("PURPOSE");

    var timeline = normalizeTimeline(m.timeline);
    var urgency = "NORMAL";
    if (timeline === "ASAP") urgency = "HIGH";
    else if (timeline === "1_3_MONTHS") urgency = "MEDIUM";
    else if (timeline === "EXPLORING" || timeline === "6_12_MONTHS") urgency = "LOW";

    var classification;
    if (missing.length) {
      classification = "NEEDS_MORE_INFO";
      reasons.push("REQUIRED_INTAKE_FIELDS_MISSING");
    } else if (timeline === "EXPLORING") {
      classification = "EARLY_STAGE";
      reasons.push("EXPLORATORY_TIMELINE");
    } else {
      classification = "READY_FOR_STRATEGY_REVIEW";
      reasons.push("CORE_INTAKE_PRESENT");
    }

    if (urgency === "HIGH") reasons.push("TIME_SENSITIVE");
    if (clean(m.employment)) reasons.push("EMPLOYMENT_CONTEXT_PROVIDED");
    if (clean(m.property_value) || clean(m.down_payment_or_balance)) reasons.push("PROPERTY_CONTEXT_PROVIDED");

    return {
      schema_version: QUALIFICATION_VERSION,
      classification: classification,
      urgency: urgency,
      reason_codes: reasons,
      missing_fields: missing,
      underwriting_decision: "NOT_PERFORMED",
      approval_status: "NOT_AN_APPROVAL",
      human_review_required: true
    };
  }

  /* Agent 13 — routing request. Backend performs actual match/dedupe/write. */
  function buildCrmRouting(lead, qualification) {
    return {
      schema_version: CRM_ROUTING_VERSION,
      source_of_truth: "ZOHO_CRM",
      requested_action: "MATCH_THEN_CREATE_OR_UPDATE",
      match_keys: ["email", "phone", "full_name"],
      idempotency_key: lead.event_id,
      destructive_overwrite_allowed: false,
      ambiguous_match_action: "HUMAN_REVIEW",
      qualification_class: qualification.classification,
      urgency: qualification.urgency,
      audit_required: true
    };
  }

  function enrichEvent(e) {
    e = e || {};
    var lead = buildLeadPayload(e);
    var qualification = qualify(lead);
    var crmRouting = buildCrmRouting(lead, qualification);

    var platformFields = {
      platform_runtime_version: RUNTIME_VERSION,
      platform_event_id: lead.event_id,
      standard_lead_payload_version: LEAD_SCHEMA_VERSION,
      standard_lead_payload: JSON.stringify(lead),
      qualification_version: QUALIFICATION_VERSION,
      qualification_class: qualification.classification,
      qualification_urgency: qualification.urgency,
      qualification_reason_codes: qualification.reason_codes.join("|"),
      qualification_missing_fields: qualification.missing_fields.join("|"),
      underwriting_decision: "NOT_PERFORMED",
      crm_routing_version: CRM_ROUTING_VERSION,
      crm_requested_action: crmRouting.requested_action,
      crm_source_of_truth: crmRouting.source_of_truth,
      crm_idempotency_key: crmRouting.idempotency_key,
      crm_ambiguous_match_action: crmRouting.ambiguous_match_action,
      crm_destructive_overwrite_allowed: "false",
      crm_audit_required: "true",
      service_inquiry_consent: "true",
      marketing_consent: "false"
    };

    Object.keys(platformFields).forEach(function (k) { e[k] = platformFields[k]; });

    /* IntakeEngine.buildEvent flattens e.details and intentionally rebuilds the
       standard envelope. Mirror the platform fields into details so they survive
       that normalization and actually reach the router endpoint. */
    if (!e.details || typeof e.details !== "object") e.details = {};
    Object.keys(platformFields).forEach(function (k) { e.details[k] = platformFields[k]; });

    return e;
  }

  function install() {
    var engine = window.IntakeEngine;
    if (!engine || typeof engine.emit !== "function") return false;
    if (engine.__platformWrapped) return true;

    var originalEmit = engine.emit;
    engine.emit = function (e) {
      return originalEmit.call(engine, enrichEvent(e || {}));
    };
    engine.__platformWrapped = true;
    engine.platformRuntimeVersion = RUNTIME_VERSION;
    return true;
  }

  window.PlatformAgents = {
    runtime_version: RUNTIME_VERSION,
    leadIntake: buildLeadPayload,
    qualify: qualify,
    crmRouting: buildCrmRouting,
    enrichEvent: enrichEvent,
    install: install
  };

  if (!install()) {
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (install() || tries >= 60) clearInterval(timer);
    }, 100);
  }
})();
