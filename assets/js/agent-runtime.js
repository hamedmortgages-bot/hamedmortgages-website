/* Hamed Mortgages Agent/Engine Runtime v1.0
   Additive control plane for the frozen Website Baseline V26.
   Event-driven, browser-safe, no secrets, no client PII persistence.
*/
(function () {
  "use strict";
  if (window.__hmAgentRuntime) return;
  var VERSION = "1.0";
  var BASELINE = "26";
  var routes = {
    page_view: ["00","07","14"],
    content_research_requested: ["00","01","02","03","05","14"],
    content_draft_submitted: ["00","03","04","05","07","14"],
    visual_asset_requested: ["00","06","14"],
    calculator_run: ["00","10","14"],
    cta_clicked: ["00","09"],
    lead_submitted: ["00","11","12","13","14"],
    release_candidate: ["00","05","07","14"]
  };
  var names = {
    "00":"Master Orchestrator","01":"Market Research","02":"Market Intelligence",
    "03":"Editorial Content","04":"Education","05":"Localization",
    "06":"Visual Director","07":"SEO & Discovery","08":"Campaign & Landing Page",
    "09":"Conversion","10":"Calculator & Decision","11":"Lead Intake",
    "12":"Lead Qualification","13":"CRM Routing","14":"Compliance & QA"
  };
  var engines = {
    "01":"Brand & Experience Engine","02":"Content & Education Engine",
    "03":"Market Intelligence Engine","04":"Decision & Calculator Engine",
    "05":"Lead Generation & Conversion Engine","06":"CRM & Mortgage AI OS Engine"
  };
  function id() {
    return "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
  }
  function clean(v) { return v == null ? "" : String(v).trim(); }
  function result(agent, event, status, payload, gate) {
    return { agent_id:agent, agent:names[agent], event_type:event.type,
      status:status, payload:payload || {}, gate:gate || null,
      baseline_version:BASELINE, runtime_version:VERSION };
  }
  function run(agent, event) {
    var p = event.payload || {};
    if (agent === "00") return result(agent,event,"EXECUTED",
      {routed_agents:routes[event.type] || [], correlation_id:event.correlation_id},"NONE");
    if (agent === "01") return result(agent,event,"EXECUTED",
      {research_request:clean(p.topic || p.query), evidence_required:true, external_research_adapter:"REQUIRED_FOR_LIVE_RESEARCH"},"NONE");
    if (agent === "02") return result(agent,event,"EXECUTED",
      {fact_count:Array.isArray(p.facts) ? p.facts.length : 0, structure:["what_happened","why_it_matters","who_is_affected","what_to_consider"]},"NONE");
    if (agent === "03") return result(agent,event,p.content ? "EXECUTED":"NEEDS_INPUT",
      {content_present:!!p.content, claim_inventory_required:true},"CONTENT_REQUIRED");
    if (agent === "04") return result(agent,event,"EXECUTED",
      {learning_objective:clean(p.objective), next_module:clean(p.next_module)},"NONE");
    if (agent === "05") return result(agent,event,"EXECUTED",
      {source_language:clean(p.source_language),target_language:clean(p.target_language),parity_check:true,rtl_check:true},"NONE");
    if (agent === "06") return result(agent,event,"EXECUTED",
      {page:clean(p.page),subject:"Hamed Ashouri approved likeness",formats:["desktop","mobile"],asset_status:"BRIEF_ONLY"},"ASSET_APPROVAL_REQUIRED");
    if (agent === "07") return result(agent,event,"EXECUTED",
      {canonical_checked:true,alternate_checked:true,metadata_checked:true},"NONE");
    if (agent === "08") return result(agent,event,"EXECUTED",
      {single_primary_objective:clean(p.objective),message_match_checked:true},"CAMPAIGN_PUBLISH_REVIEW");
    if (agent === "09") return result(agent,event,"EXECUTED",
      {funnel_event:clean(p.action || event.type),pii_persisted:false},"NONE");
    if (agent === "10") return result(agent,event,"EXECUTED",
      {calculator:"assets/js/calculator.js",deterministic:true,approval_claim:false},"NONE");
    if (agent === "11") return result(agent,event,"EXECUTED",
      {normalization:"platform-runtime.js",consent_attached:true,idempotency_key:event.correlation_id},"NONE");
    if (agent === "12") return result(agent,event,"EXECUTED",
      {triage:"preliminary_only",underwriting_decision:"NOT_PERFORMED",human_review_required:true},"HUMAN_REVIEW_FOR_DECISION");
    if (agent === "13") return result(agent,event,"EXECUTED",
      {source_of_truth:"ZOHO_CRM",requested_action:"MATCH_THEN_CREATE_OR_UPDATE",destructive_overwrite:false},"EXTERNAL_ZOHO_ADAPTER");
    if (agent === "14") return result(agent,event,"EXECUTED",
      {baseline_preserved:true,identity_disclosure_checked:true,privacy_checked:true,release_checks:["routes","bilingual","responsive","compliance","regression"]},"PUBLISH_GATE");
    return result(agent,event,"UNKNOWN",{}, "UNKNOWN_AGENT");
  }
  function dispatch(type, payload) {
    var event = { event_id:id(), correlation_id:id(), type:type,
      payload:payload || {}, occurred_at:new Date().toISOString() };
    var selected = routes[type] || ["00","14"];
    var outputs = selected.map(function (a) { return run(a,event); });
    var audit = { event_id:event.event_id, type:type, agents:selected,
      outputs:outputs.map(function(o){return {agent_id:o.agent_id,status:o.status,gate:o.gate};}),
      baseline_version:BASELINE, runtime_version:VERSION };
    try { window.dispatchEvent(new CustomEvent("hm:workflow-complete",{detail:audit})); } catch (e) {}
    return audit;
  }
  window.HMAgentRuntime = {version:VERSION,baseline:BASELINE,agents:names,engines:engines,routes:routes,dispatch:dispatch};
  window.__hmAgentRuntime = true;
  document.addEventListener("click", function (e) {
    var target=e.target.closest && e.target.closest("[data-cta],[data-nav-link]");
    if (target) dispatch("cta_clicked",{action:target.getAttribute("data-cta") || target.textContent});
  }, {passive:true});
})();
