/* ===================================================================
   Hamed Mortgages — workspace.js
   Mortgage Workspace is NOT a workflow — it is a JOURNEY.

   This page declares its journey and hands off to the ONE Universal
   Intake Engine. It contains no submission/CRM logic of its own:
   the engine attaches identity and emits the single standard event;
   the Journey Router decides what happens next.

   Requires intake-gate.js (the Universal Intake Engine) loaded first.
   =================================================================== */
(function () {
  "use strict";

  var Engine = window.IntakeEngine || null;
  var SOURCE = "Website — Mortgage Workspace";

  var form = document.getElementById("workspace-form");
  var success = document.getElementById("workspace-success");
  var formCard = document.getElementById("ws-form-card");
  var intro = document.getElementById("ws-intro");
  if (!form || !success) { return; }

  var submitBtn = document.getElementById("submitBtn");
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var journey = (Engine && Engine.JOURNEYS && Engine.JOURNEYS.WORKSPACE) || "Mortgage Workspace";

  function fieldOf(el) { return el.closest(".field"); }
  function clearError(el) { var f = fieldOf(el); if (f) { f.classList.remove("has-error"); } }
  function markError(el) { var f = fieldOf(el); if (f) { f.classList.add("has-error"); } }
  function param(name) {
    try { return new URLSearchParams(window.location.search).get(name) || ""; } catch (e) { return ""; }
  }

  /* ---------- prefill from the shared session (or the bridge URL params) ---------- */
  function prefill() {
    var saved = (Engine && Engine.get && Engine.get()) || {};
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

  /* ---------- submit: declare the journey, hand off to the engine ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.company && form.company.value) { showSuccess(readForm()); return; } // bot
    var bad = validate();
    if (bad) { bad.focus(); bad.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    var d = readForm();
    var identity = {
      first: d.firstName, last: d.lastName, email: d.email,
      phone: d.phone, position: d.position, source: SOURCE
    };

    form.classList.add("is-submitting");
    if (submitBtn) { submitBtn.disabled = true; }

    var done = function () { showSuccess(d); };
    if (Engine && Engine.emit) {
      Engine.identify(identity); // ONE shared session — never asked twice
      Engine.emit({
        journey: journey,
        feature: "Mortgage Workspace Intake",
        source: SOURCE,
        action: "create_workspace",
        stage: "Workspace",
        firstName: d.firstName, lastName: d.lastName,
        email: d.email, phone: d.phone, position: d.position
      }).then(done).catch(done);
    } else {
      done(); // engine unavailable — UX still proceeds; session is local
    }
  });

})();
