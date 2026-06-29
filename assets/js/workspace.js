/* ===================================================================
   Hamed Mortgages — workspace.js
   Mortgage Workspace — Intake Gate handler (Journey 2).

   This is the single, reusable Intake Gate for the Mortgage Workspace.
   It captures the client, sends them to the CRM, remembers them locally
   so no tool ever asks twice, and opens the Workspace dashboard.

   TO CONNECT CRM / AUTOMATION:
   Paste your lead-capture endpoint below (Make.com webhook, or any URL
   that accepts a POST). The same endpoint powers the assessment intake.
   In Make, branch on data.journey === "Mortgage Workspace" to run the
   Workspace flow (create/update record → create Deal → WorkDrive folder
   → link everything) when those back-end pieces are enabled.
   =================================================================== */
(function () {
  "use strict";

  /* >>> CRM / Make webhook (shared with the assessment intake) <<< */
  var LEAD_ENDPOINT = "https://hook.us2.make.com/p2jg76wu1f19or87ibptgs9l6m8ortu7";
  var INTAKE_KEY = "hm_workspace_intake";

  var form = document.getElementById("workspace-form");
  var success = document.getElementById("workspace-success");
  var formCard = document.getElementById("ws-form-card");
  var intro = document.getElementById("ws-intro");
  if (!form || !success) { return; }

  var submitBtn = document.getElementById("submitBtn");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- helpers ---------- */
  function fieldOf(el) { return el.closest(".field"); }
  function clearError(el) { var f = fieldOf(el); if (f) { f.classList.remove("has-error"); } }
  function markError(el) { var f = fieldOf(el); if (f) { f.classList.add("has-error"); } }

  function param(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ""; } catch (e) { return ""; }
  }

  /* ---------- prefill (Assessment → Workspace bridge, or returning) ---------- */
  function prefill() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(INTAKE_KEY) || "{}"); } catch (e) {}
    function set(id, val) {
      var el = document.getElementById(id);
      if (el && val) { el.value = val; }
    }
    // URL params take priority (carried from the assessment), then saved values.
    set("firstName", param("firstName") || saved.firstName);
    set("lastName",  param("lastName")  || saved.lastName);
    set("email",     param("email")     || saved.email);
    set("phone",     param("phone")     || saved.phone);
    set("position",  param("position")  || saved.position);
  }
  prefill();

  form.addEventListener("input", function (e) {
    if (e.target.matches("input, select")) { clearError(e.target); }
  });

  function validate() {
    var firstBad = null;
    form.querySelectorAll("[required]").forEach(function (el) {
      var ok = !!String(el.value || "").trim();
      if (ok && el.type === "email") { ok = EMAIL_RE.test(el.value.trim()); }
      if (!ok) { markError(el); if (!firstBad) { firstBad = el; } }
      else { clearError(el); }
    });
    return firstBad;
  }

  /* ---------- payload ---------- */
  function buildPayload() {
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = (typeof v === "string") ? v.trim() : v; });
    delete data.company; // honeypot — never forward
    data.fullName = ((data.firstName || "") + " " + (data.lastName || "")).trim();
    data.journey = "Mortgage Workspace";
    data.source = "hamedmortgages.ca — Mortgage Workspace";
    data.language = (document.documentElement.lang || "en");
    data.pageUrl = window.location.href;
    data.submittedAt = new Date().toISOString();
    return data;
  }

  function saveIntake(data) {
    try {
      localStorage.setItem(INTAKE_KEY, JSON.stringify({
        firstName: data.firstName, lastName: data.lastName, fullName: data.fullName,
        email: data.email, phone: data.phone, position: data.position,
        journey: data.journey, createdAt: data.submittedAt
      }));
    } catch (e) {}
  }

  function sendToEndpoint(data) {
    // form-urlencoded + no-cors keeps delivery reliable from a static site.
    return fetch(LEAD_ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) });
  }

  function showSuccess(data) {
    if (formCard) { formCard.style.display = "none"; }
    if (intro) { intro.style.display = "none"; }
    var nameLine = document.getElementById("ws-success-name");
    if (nameLine && data.firstName) {
      nameLine.textContent = "Welcome aboard, " + data.firstName + ". We've started your file and Hamed will personally review it.";
    }
    // Carry identity to the dashboard so it can greet + (later) load the live file.
    var go = document.getElementById("ws-go-dashboard");
    if (go) {
      var qs = new URLSearchParams({ name: data.firstName || "", email: data.email || "" });
      go.setAttribute("href", "workspace-dashboard.html?" + qs.toString());
    }
    success.classList.add("is-visible");
    try { success.focus(); } catch (e) {}
    success.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.company && form.company.value) { showSuccess(buildPayload()); return; } // bot
    var bad = validate();
    if (bad) { bad.focus(); bad.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    var data = buildPayload();
    saveIntake(data);
    form.classList.add("is-submitting");
    if (submitBtn) { submitBtn.disabled = true; }

    sendToEndpoint(data)
      .then(function () { showSuccess(data); })
      .catch(function () { showSuccess(data); }); // intake is saved locally regardless
  });

})();
