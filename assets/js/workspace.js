/* ===================================================================
   Hamed Mortgages — workspace.js
   Mortgage Workspace — Intake handler (Journey 2).

   This page IS the platform's single Intake Gate, rendered full-page.
   It writes to the ONE shared session (window.IntakeGate) so the client
   is recognized everywhere and never asked twice, and it delivers the
   lead to CRM through the proven webhook with a DEDICATED Workspace
   marker — a distinct journey + source, fully separated from the
   Assessment so the CRM/Make side can branch follow-up and emails.

   CRM ingress note:
   The webhook below reliably CREATES the CRM lead. The Workspace is
   tagged with journey="Mortgage Workspace" + source so the Make
   scenario can branch (set Lead Source, map Position, send the
   Workspace welcome email — NOT the Assessment email). That branching
   is a Make-side config step; lead creation works today.

   Requires intake-gate.js to be loaded first (shared session).
   =================================================================== */
(function () {
  "use strict";

  var LEAD_ENDPOINT = "https://hook.us2.make.com/p2jg76wu1f19or87ibptgs9l6m8ortu7";
  var WORKSPACE_SOURCE = "Website — Mortgage Workspace";
  var WORKSPACE_JOURNEY = "Mortgage Workspace";

  var form = document.getElementById("workspace-form");
  var success = document.getElementById("workspace-success");
  var formCard = document.getElementById("ws-form-card");
  var intro = document.getElementById("ws-intro");
  if (!form || !success) { return; }

  var submitBtn = document.getElementById("submitBtn");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var Gate = window.IntakeGate || null;

  function fieldOf(el) { return el.closest(".field"); }
  function clearError(el) { var f = fieldOf(el); if (f) { f.classList.remove("has-error"); } }
  function markError(el) { var f = fieldOf(el); if (f) { f.classList.add("has-error"); } }
  function param(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ""; } catch (e) { return ""; }
  }

  /* ---------- prefill from the shared session (or the bridge URL params) ---------- */
  function prefill() {
    var saved = (Gate && Gate.get && Gate.get()) || {};
    function set(id, val) { var el = document.getElementById(id); if (el && val) { el.value = val; } }
    set("firstName", param("firstName") || saved.first);
    set("lastName",  param("lastName")  || saved.last);
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

  function readForm() {
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = (typeof v === "string") ? v.trim() : v; });
    delete data.company; // honeypot
    return data;
  }

  function buildPayload(d) {
    return {
      firstName: d.firstName || "",
      lastName: d.lastName || "",
      fullName: ((d.firstName || "") + " " + (d.lastName || "")).trim(),
      email: d.email || "",
      phone: d.phone || "",
      position: d.position || "",
      journey: WORKSPACE_JOURNEY,
      source: WORKSPACE_SOURCE,
      language: (document.documentElement.lang || "en"),
      pageUrl: window.location.href,
      submittedAt: new Date().toISOString()
    };
  }

  function sendToCRM(payload) {
    // form-urlencoded + no-cors = reliable delivery from a static site.
    return fetch(LEAD_ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams(payload) });
  }

  function showSuccess(d) {
    if (formCard) { formCard.style.display = "none"; }
    if (intro) { intro.style.display = "none"; }
    var nameLine = document.getElementById("ws-success-name");
    if (nameLine && d.firstName) {
      var fa = (document.documentElement.lang || "en").indexOf("fa") === 0;
      nameLine.textContent = fa
        ? ("خوش آمدید، " + d.firstName + ". پرونده‌ی شما را آغاز کردیم و حامد شخصاً آن را بررسی می‌کند.")
        : ("Welcome aboard, " + d.firstName + ". We've started your file and Hamed will personally review it.");
    }
    var go = document.getElementById("ws-go-dashboard");
    if (go) {
      var qs = new URLSearchParams({ name: d.firstName || "", email: d.email || "" });
      go.setAttribute("href", "workspace-dashboard.html?" + qs.toString());
    }
    success.classList.add("is-visible");
    try { success.focus(); } catch (e) {}
    success.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.company && form.company.value) { showSuccess(readForm()); return; } // bot
    var bad = validate();
    if (bad) { bad.focus(); bad.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    var d = readForm();

    // 1) Save to the ONE shared session immediately (so no tool re-asks, even offline).
    if (Gate && Gate.set) {
      Gate.set({ first: d.firstName, last: d.lastName, email: d.email,
                 phone: d.phone, position: d.position, source: WORKSPACE_SOURCE });
    }

    form.classList.add("is-submitting");
    if (submitBtn) { submitBtn.disabled = true; }

    // 2) Deliver the lead to CRM (proven webhook) tagged as the Workspace journey.
    var payload = buildPayload(d);
    var done = function () { showSuccess(d); };
    sendToCRM(payload).then(done).catch(done); // session is saved regardless
  });

})();
