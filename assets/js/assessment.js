/* ===================================================================
   Hamed Mortgages — assessment.js
   Mortgage Assessment "Start Engine" v1 — intake form handler.
   Language-agnostic: all visible text lives in the HTML (EN + FA).

   TO CONNECT YOUR CRM / AUTOMATION:
   Paste your lead-capture endpoint below (Make.com webhook URL, or any
   URL that accepts a POST). When set, every submission is sent there
   automatically. Leave it empty to use the local fallback (the lead is
   saved in the browser and an email draft to Hamed is opened).
   =================================================================== */
(function () {
  "use strict";

  /* >>> PASTE YOUR MAKE.COM / ZOHO WEBHOOK URL HERE <<< */
  var LEAD_ENDPOINT = "https://hook.us2.make.com/p2jg76wu1f19or87ibptgs9l6m8ortu7";

  var FALLBACK_EMAIL = "hamedmortgages@gmail.com";

  var form = document.getElementById("assessment-form");
  var success = document.getElementById("assessment-success");
  if (!form || !success) { return; }

  var submitBtn = document.getElementById("submitBtn");

  /* ---------- helpers ---------- */
  function fieldOf(el) { return el.closest(".field"); }

  function clearError(el) {
    var f = fieldOf(el);
    if (f) { f.classList.remove("has-error"); }
  }
  function markError(el) {
    var f = fieldOf(el);
    if (f) { f.classList.add("has-error"); }
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate() {
    var firstBad = null;
    var required = form.querySelectorAll("[required]");
    required.forEach(function (el) {
      var ok = !!el.value.trim();
      if (ok && el.type === "email") { ok = EMAIL_RE.test(el.value.trim()); }
      if (!ok) { markError(el); if (!firstBad) { firstBad = el; } }
      else { clearError(el); }
    });
    return firstBad;
  }

  // Clear a field's error as soon as the user fixes it
  form.addEventListener("input", function (e) {
    if (e.target.matches("input, select, textarea")) { clearError(e.target); }
  });

  /* ---------- payload ---------- */
  function buildPayload() {
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function (v, k) { data[k] = (typeof v === "string") ? v.trim() : v; });
    delete data.company; // honeypot — never forward
    data.source = "hamedmortgages.ca — Mortgage Assessment";
    data.language = (document.documentElement.lang || "en");
    data.pageUrl = window.location.href;
    data.submittedAt = new Date().toISOString();
    data.requiredDocs = buildChecklist(data);
    return data;
  }

  /* ---------- Checklist Engine (MRD) ----------
     Maps the client's profile to the exact documents we need.
     Tune the lists below anytime your requirements change. */
  function buildChecklist(d) {
    var items = [];
    var purpose = (d.purpose || "").toLowerCase();
    var emp = (d.employment || "").toLowerCase();
    var isRefiLike = purpose.indexOf("refinance") > -1 || purpose.indexOf("renewal") > -1 ||
                     purpose.indexOf("equity") > -1 || purpose.indexOf("heloc") > -1;

    // Core (always)
    items.push("Government-issued photo ID");
    items.push(isRefiLike
      ? "Most recent mortgage statement"
      : "Proof of down payment + 90-day history of those funds (bank/investment statements)");

    // Income (by employment type)
    if (emp.indexOf("t4") > -1) {
      items.push("Letter of employment (current, on company letterhead)");
      items.push("Two most recent pay stubs");
      items.push("T4 slips for the last 2 years");
    } else if (emp.indexOf("incorporat") > -1) {
      items.push("T1 Generals + Notices of Assessment for the last 2 years");
      items.push("Company financial statements for the last 2 years");
      items.push("Articles of incorporation");
    } else if (emp.indexOf("self") > -1) {
      items.push("T1 Generals + Notices of Assessment (NOA) for the last 2 years");
      items.push("Business registration / licence");
    } else if (emp.indexOf("commission") > -1) {
      items.push("T4 slips + two recent pay stubs");
      items.push("Notices of Assessment for the last 2 years (commission history)");
    } else if (emp.indexOf("retired") > -1 || emp.indexOf("pension") > -1) {
      items.push("Pension / retirement income statements");
      items.push("T4A and Notices of Assessment for the last 2 years");
    } else {
      items.push("Most recent income documentation (we'll confirm the specifics with you)");
    }

    // Purpose-specific
    if (purpose.indexOf("purchase") > -1) {
      items.push("Accepted Agreement of Purchase and Sale (once you have an accepted offer)");
      items.push("Deposit confirmation");
    }
    if (isRefiLike || purpose.indexOf("investment") > -1) {
      items.push("Most recent property tax bill");
      items.push("Home insurance details");
    }
    if (purpose.indexOf("investment") > -1) {
      items.push("Lease agreement(s) and proof of rental income (T776 if already owned)");
    }

    return items.map(function (i) { return "• " + i; }).join("\n");
  }

  function saveLocalBackup(data) {
    try {
      var key = "hm_assessment_leads";
      var queue = JSON.parse(localStorage.getItem(key) || "[]");
      queue.push(data);
      localStorage.setItem(key, JSON.stringify(queue));
    } catch (err) { /* storage unavailable — ignore */ }
  }

  function sendToEndpoint(data) {
    // form-urlencoded keeps this a "simple" request (no CORS preflight);
    // no-cors makes delivery reliable from a static site. We treat a
    // resolved fetch as success (opaque response can't be read).
    var body = new URLSearchParams(data);
    return fetch(LEAD_ENDPOINT, { method: "POST", mode: "no-cors", body: body });
  }

  function openEmailFallback(data) {
    var lines = [];
    var order = ["fullName","email","phone","purpose","propertyType","propertyValue",
                 "downOrBalance","employment","income","creditScore","timeline","notes"];
    order.forEach(function (k) { if (data[k]) { lines.push(k + ": " + data[k]); } });
    var subject = "New Mortgage Assessment — " + (data.fullName || "");
    var bodyText = "New mortgage assessment submitted from the website:\n\n" + lines.join("\n") +
                   "\n\nLanguage: " + data.language + "\nSubmitted: " + data.submittedAt;
    var href = "mailto:" + FALLBACK_EMAIL +
               "?subject=" + encodeURIComponent(subject) +
               "&body=" + encodeURIComponent(bodyText);
    window.location.href = href;
  }

  function setWorkspaceBridge(data) {
    // Carry the client's details to the Workspace intake so nothing is re-asked.
    var link = document.getElementById("assessment-to-workspace");
    if (!link || !data) { return; }
    var full = (data.fullName || "").trim();
    var sp = full.indexOf(" ");
    var first = sp > -1 ? full.slice(0, sp) : full;
    var last = sp > -1 ? full.slice(sp + 1) : "";
    var qs = new URLSearchParams();
    if (first) qs.set("firstName", first);
    if (last) qs.set("lastName", last);
    if (data.email) qs.set("email", data.email);
    if (data.phone) qs.set("phone", data.phone);
    var q = qs.toString();
    link.setAttribute("href", "workspace.html" + (q ? "?" + q : ""));
  }

  function mirrorToSession(data) {
    // Write the client into the ONE shared session so completing an
    // Assessment also satisfies the global Intake Gate (store once,
    // reuse everywhere). The Assessment's own CRM/Make automation is
    // untouched — this only records identity locally.
    if (!data || !window.IntakeGate || !window.IntakeGate.set) { return; }
    var full = (data.fullName || "").trim();
    var sp = full.indexOf(" ");
    window.IntakeGate.set({
      first: sp > -1 ? full.slice(0, sp) : full,
      last:  sp > -1 ? full.slice(sp + 1) : "",
      email: data.email || "", phone: data.phone || "",
      position: data.position || "",
      source: "Website — Quick Assessment"
    });
  }

  function showConfirmation(data) {
    setWorkspaceBridge(data);
    mirrorToSession(data);
    form.style.display = "none";
    success.classList.add("is-visible");
    // Move focus + scroll so the user sees the confirmation
    try { success.focus(); } catch (e) {}
    success.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- submit: Assessment is a JOURNEY — hand off to the engine ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot: if a bot filled the hidden field, pretend success and stop.
    if (form.company && form.company.value) { showConfirmation(); return; }

    var bad = validate();
    if (bad) { bad.focus(); bad.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    var data = buildPayload();
    saveLocalBackup(data);

    form.classList.add("is-submitting");
    if (submitBtn) { submitBtn.disabled = true; }

    var Engine = window.IntakeEngine || null;
    if (Engine && Engine.emit) {
      // The engine attaches identity and emits the ONE standard event.
      // Assessment-specific answers ride along in `details` (flattened to
      // top level) so existing CRM field maps keep working unchanged.
      var first = "", last = "", full = (data.fullName || "").trim();
      var sp = full.indexOf(" "); first = sp > -1 ? full.slice(0, sp) : full; last = sp > -1 ? full.slice(sp + 1) : "";
      Engine.identify({ first: first, last: last, email: data.email, phone: data.phone,
                        position: data.position, source: "Website — Quick Assessment" });
      Engine.emit({
        journey: (Engine.JOURNEYS && Engine.JOURNEYS.ASSESSMENT) || "Quick Assessment",
        feature: "Mortgage Assessment",
        source: "Website — Quick Assessment",
        action: "submit_assessment",
        stage: "Assessment",
        firstName: first, lastName: last, fullName: data.fullName,
        email: data.email, phone: data.phone, position: data.position,
        details: data
      }).then(function () { showConfirmation(data); })
        .catch(function () { showConfirmation(data); });
    } else if (LEAD_ENDPOINT) {
      // Fallback if the engine didn't load: direct post (legacy path).
      sendToEndpoint(data)
        .then(function () { showConfirmation(data); })
        .catch(function () { openEmailFallback(data); showConfirmation(data); });
    } else {
      openEmailFallback(data);
      showConfirmation(data);
    }
  });

})();
