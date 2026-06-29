/* ===================================================================
   Hamed Mortgages — workspace.js
   Mortgage Workspace — Intake handler (Journey 2).

   This page IS the platform's single Intake Gate, rendered full-page.
   It writes to the ONE shared session (window.IntakeGate) so the
   client is recognized everywhere and never asked twice, and it
   submits to CRM through the centralized lead pipe with a DEDICATED
   Workspace Lead Source — fully separate from the Assessment
   automation (different Source, different follow-up).

   Requires intake-gate.js to be loaded first (it provides the
   shared session + CRM submit).
   =================================================================== */
(function () {
  "use strict";

  var WORKSPACE_SOURCE = "Website — Mortgage Workspace";

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
    var identity = {
      first: d.firstName, last: d.lastName, email: d.email,
      phone: d.phone, position: d.position, source: WORKSPACE_SOURCE
    };

    // 1) Save to the ONE shared session immediately (so no tool re-asks, even offline).
    if (Gate && Gate.set) { Gate.set(identity); }

    form.classList.add("is-submitting");
    if (submitBtn) { submitBtn.disabled = true; }

    // 2) Submit to CRM via the centralized pipe with the dedicated Workspace Source.
    var done = function () { showSuccess(d); };
    if (Gate && Gate.submitLead) {
      Gate.submitLead(identity, { source: WORKSPACE_SOURCE, tool: "Mortgage Workspace" })
        .then(done).catch(done);
    } else {
      done(); // session is saved regardless; CRM pipe will pick up on the next gated action
    }
  });

})();
