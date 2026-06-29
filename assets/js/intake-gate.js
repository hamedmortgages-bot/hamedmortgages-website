/* ============================================================
   Hamed Ashouri — UNIVERSAL INTAKE ENGINE
   ------------------------------------------------------------
   ONE engine. Every page/tool is a JOURNEY, not a workflow.

        Client
          ↓
        Universal Intake Engine      (this file)
          ↓  identity resolution (session) + ONE standard event
        Journey Router               (single Make scenario)
          ↓
        Mortgage AI OS               (CRM / WorkDrive / Sign / automations)

   A page never contains journey-specific submission logic. It just
   declares its journey and calls one method:

       IntakeEngine.emit({
         journey: "Mortgage Workspace",   // WHICH journey
         feature: "Workspace Intake",     // WHAT was used
         source:  "Website — Mortgage Workspace",
         action:  "create_workspace",     // WHAT happened
         stage:   "Workspace",            // current stage
         details: { ... }                 // optional journey extras
       });

   The engine attaches identity (contact, email, phone, position) from
   the ONE shared session and POSTs a single STANDARD EVENT to the ONE
   router endpoint. The router (Make) resolves identity
   (Contact → Borrower → Deal → Mortgage → Workspace; update, never
   duplicate) and decides what happens next based on `journey`.

   FUTURE-PROOF: adding a tool NEVER means a new engine — it means a new
   `journey` value. Ten new AI tools next year = ten new journey strings.

   PUBLIC API
   ----------
   - window.IntakeEngine : identity + emit + journey registry
   - window.IntakeGate   : gating UI (modal/locks) — thin layer on the engine
   - window.HM_AUTH      : auth seam (Phase 2 plugs in here, no redesign)
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.HM_INTAKE || {};

  /* ---------- the ONE router endpoint (single Make scenario) ---------- */
  var ENDPOINT = (CFG.endpoint) || "https://hook.us2.make.com/p2jg76wu1f19or87ibptgs9l6m8ortu7";
  var EVENT_VERSION = "1";

  var STORE = "hm_intake_v1";   // canonical identity (localStorage)
  var COOKIE = "hm_intake";     // canonical identity (shared cookie)
  var LEGACY = ["hm_workspace_intake"];

  /* ---------- journey registry (add a value = support a new tool) ---------- */
  var JOURNEYS = {
    ASSESSMENT:      "Quick Assessment",
    WORKSPACE:       "Mortgage Workspace",
    CMHC_CALCULATOR: "CMHC Calculator",
    CALCULATOR:      "Mortgage Calculator",
    BUILDER_PROGRAM: "Builder Program",
    RENEWAL:         "Renewal",
    INVESTMENT:      "Investment",
    AI_ASSISTANT:    "AI Assistant",
    DOCUMENT_UPLOAD: "Document Upload",
    INTAKE_GATE:     "Intake Gate"
  };

  function lang() {
    var l = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
    return l.indexOf("fa") === 0 ? "fa" : "en";
  }

  /* ---------- ONE canonical position list (EN value + localized label) ---------- */
  var POSITIONS = [
    { v: "Home Buyer",        en: "Home Buyer",        fa: "خریدار خانه" },
    { v: "Home Owner",        en: "Home Owner",        fa: "صاحب‌خانه" },
    { v: "Investor",          en: "Investor",          fa: "سرمایه‌گذار" },
    { v: "Builder",           en: "Builder",           fa: "سازنده" },
    { v: "Real Estate Agent", en: "Real Estate Agent", fa: "مشاور املاک" },
    { v: "Mortgage Broker",   en: "Mortgage Broker",   fa: "کارگزار وام مسکن" },
    { v: "Business Owner",    en: "Business Owner",    fa: "صاحب کسب‌وکار" },
    { v: "Accountant",        en: "Accountant",        fa: "حسابدار" },
    { v: "Lawyer",            en: "Lawyer",            fa: "وکیل" },
    { v: "Financial Planner", en: "Financial Planner", fa: "برنامه‌ریز مالی" },
    { v: "Other",             en: "Other",             fa: "سایر" }
  ];

  var T = {
    en: {
      title: "Quick intake before you continue",
      sub: "Tell us who you are and you'll get instant access — and any report or file stays tied to your record.",
      first: "First name", last: "Last name", email: "Email", phone: "Phone",
      pos: "I am a…", choose: "Choose one…",
      submit: "Get access", cancel: "Cancel",
      locked: "Complete a quick intake to use this tool",
      unlock: "Unlock the tool",
      sending: "Setting up your access…",
      err: "Please fill in your name, a valid email, phone, and your role.",
      privacy: "Your details go to Hamed Ashouri (Mortgage Advisory, Ontario) so he can follow up. No spam."
    },
    fa: {
      title: "ثبت‌نام سریع پیش از ادامه",
      sub: "بگویید چه کسی هستید تا فوراً دسترسی پیدا کنید — و هر گزارش یا پرونده به سابقه‌ی شما متصل می‌ماند.",
      first: "نام", last: "نام خانوادگی", email: "ایمیل", phone: "تلفن",
      pos: "من … هستم", choose: "یکی را انتخاب کنید…",
      submit: "دریافت دسترسی", cancel: "انصراف",
      locked: "برای استفاده از این ابزار، ثبت‌نام سریع را کامل کنید",
      unlock: "باز کردن ابزار",
      sending: "در حال آماده‌سازی دسترسی شما…",
      err: "لطفاً نام، یک ایمیل معتبر، تلفن و نقش خود را وارد کنید.",
      privacy: "اطلاعات شما برای پیگیری به حامد عاشوری (مشاوره وام مسکن، انتاریو) ارسال می‌شود. بدون هرزنامه."
    }
  };
  function t(k) { return (T[lang()] || T.en)[k]; }
  function posLabel(p) { return lang() === "fa" ? p.fa : p.en; }

  /* ================= IDENTITY (the ONE shared session) ================= */
  function read() {
    try { var v = localStorage.getItem(STORE); if (v) return JSON.parse(v); } catch (e) {}
    var m = document.cookie.match(/(?:^|;\s*)hm_intake=([^;]+)/);
    if (m) { try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) {} }
    for (var i = 0; i < LEGACY.length; i++) {
      try {
        var lv = localStorage.getItem(LEGACY[i]);
        if (lv) {
          var o = JSON.parse(lv);
          var norm = {
            first: o.first || o.firstName || "", last: o.last || o.lastName || "",
            email: o.email || "", phone: o.phone || "", position: o.position || "",
            source: o.source || o.journey || "", ts: o.ts || Date.now()
          };
          if (norm.email) { write(norm); return norm; }
        }
      } catch (e) {}
    }
    return null;
  }
  function write(o) {
    try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) {}
    var exp = new Date(Date.now() + 180 * 864e5).toUTCString();
    var shared = location.hostname.indexOf("hamedmortgages.ca") >= 0 ? "; domain=.hamedmortgages.ca" : "";
    document.cookie = COOKIE + "=" + encodeURIComponent(JSON.stringify(o)) + "; expires=" + exp + "; path=/" + shared + "; SameSite=Lax";
  }
  function identified() { var i = read(); return !!(i && i.email); }
  function get() { return read() || null; }
  function identify(d) {
    d = d || {};
    var cur = read() || {};
    var merged = {
      first: d.first || d.firstName || cur.first || "",
      last:  d.last  || d.lastName  || cur.last  || "",
      email: d.email || cur.email || "",
      phone: d.phone || cur.phone || "",
      position: d.position || cur.position || "",
      source: d.source || cur.source || "",
      ts: Date.now()
    };
    write(merged);
    return merged;
  }

  /* ================= THE STANDARD EVENT (one shape for every journey) ===== */
  function buildEvent(e) {
    e = e || {};
    var id = read() || {};
    // identity can be supplied inline (form submit) or come from the session
    var first = e.firstName || e.first || id.first || "";
    var last  = e.lastName  || e.last  || id.last  || "";
    var fullName = (e.fullName || (first + " " + last)).trim();

    // 1) journey-specific extras go in FIRST (so the standard envelope wins on collisions)
    var event = {};
    if (e.details) { Object.keys(e.details).forEach(function (k) { event[k] = e.details[k]; }); }

    // 2) the STANDARD ENVELOPE — identical shape for every journey
    event.event_version = EVENT_VERSION;
    event.journey       = e.journey  || "Intake Gate";
    event.feature       = e.feature  || (CFG.tool || document.title || "");
    event.source        = e.source   || ("Website — " + (e.journey || "Intake Gate"));
    event.action        = e.action   || "intake";
    event.timestamp     = new Date().toISOString();
    event.currentStage  = e.stage || e.currentStage || "Lead";
    event.position      = e.position || id.position || "";
    event.contact       = fullName || last || "-";
    event.fullName      = fullName || last || "-";
    event.firstName     = first;
    event.lastName      = last || "-";
    event.email         = e.email || id.email || "";
    event.phone         = e.phone || id.phone || "";
    event.language      = lang();
    event.pageUrl       = location.href;
    return event;
  }

  // POST one standard event to the single router endpoint.
  function emit(e) {
    var event = buildEvent(e);
    return new Promise(function (resolve) {
      var done = false;
      function finish() { if (done) return; done = true; resolve(event); }
      try {
        fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: new URLSearchParams(event) })
          .then(finish).catch(finish);
      } catch (err) { finish(); }
      setTimeout(finish, 2600);
    });
  }

  /* ================= GATING UI (modal + locks) — thin layer ============== */
  function css() {
    if (document.getElementById("hmGateCSS")) return;
    var s = document.createElement("style");
    s.id = "hmGateCSS";
    s.textContent =
      ".hmg-ov{position:fixed;inset:0;background:rgba(11,42,32,.55);backdrop-filter:blur(2px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px}" +
      ".hmg-card{background:#fff;width:100%;max-width:440px;border-radius:16px;box-shadow:0 24px 60px rgba(11,42,32,.35);overflow:hidden;font-family:'Manrope','Vazirmatn',Tahoma,Arial,sans-serif}" +
      ".hmg-card[dir=rtl]{font-family:'Vazirmatn',Tahoma,Arial,sans-serif}" +
      ".hmg-hd{background:#0F3D2E;color:#fff;padding:18px 22px}.hmg-hd h3{margin:0;font-size:18px}.hmg-hd p{margin:6px 0 0;color:#A9BCB2;font-size:13px;line-height:1.5}" +
      ".hmg-bd{padding:18px 22px}" +
      ".hmg-row{display:flex;gap:10px}.hmg-row>*{flex:1}" +
      ".hmg-f{margin-bottom:11px}" +
      ".hmg-bd label{display:block;font-size:12px;font-weight:700;color:#222826;margin-bottom:3px}" +
      ".hmg-bd input,.hmg-bd select{width:100%;padding:10px;border:1px solid #E4E8E5;border-radius:8px;font-size:15px;font-family:inherit;color:#222826;background:#fff}" +
      ".hmg-bd input:focus,.hmg-bd select:focus{outline:none;border-color:#1C6B50;box-shadow:0 0 0 3px rgba(28,107,80,.14)}" +
      ".hmg-err{color:#B5462F;font-size:12.5px;margin:2px 0 8px;display:none}" +
      ".hmg-btn{width:100%;background:#C5A249;color:#0F3D2E;border:2px solid #C5A249;border-radius:8px;padding:12px;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;margin-top:4px}" +
      ".hmg-btn:hover{background:#D8BE7E;border-color:#D8BE7E}.hmg-btn[disabled]{opacity:.6;cursor:default}" +
      ".hmg-cancel{display:block;width:100%;background:none;border:0;color:#7A857F;font-size:12.5px;margin-top:9px;cursor:pointer;font-family:inherit}" +
      ".hmg-priv{font-size:11px;color:#7A857F;margin-top:10px;line-height:1.5}" +
      ".hmg-lock{position:absolute;inset:0;background:rgba(245,247,245,.78);backdrop-filter:blur(3px);z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;border-radius:inherit}" +
      ".hmg-lock .ic{font-size:30px;margin-bottom:8px}.hmg-lock p{margin:0 0 14px;color:#15523E;font-weight:700;max-width:320px}" +
      ".hmg-lock button{background:#0F3D2E;color:#fff;border:0;border-radius:9px;padding:12px 20px;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}" +
      ".hmg-lock button:hover{background:#15523E}";
    document.head.appendChild(s);
  }

  // modal(feature, onDone): completes intake for a gated feature.
  // The gate is itself a journey: journey="Intake Gate", feature=<tool>.
  function modal(feature, onDone) {
    css();
    var rtl = lang() === "fa";
    var ov = document.createElement("div");
    ov.className = "hmg-ov";
    var opts = POSITIONS.map(function (p) { return '<option value="' + p.v + '">' + posLabel(p) + "</option>"; }).join("");
    ov.innerHTML =
      '<div class="hmg-card" dir="' + (rtl ? "rtl" : "ltr") + '">' +
        '<div class="hmg-hd"><h3>' + t("title") + "</h3><p>" + t("sub") + "</p></div>" +
        '<div class="hmg-bd">' +
          '<div class="hmg-row"><div class="hmg-f"><label>' + t("first") + '</label><input id="hmg-first" autocomplete="given-name"></div>' +
          '<div class="hmg-f"><label>' + t("last") + '</label><input id="hmg-last" autocomplete="family-name"></div></div>' +
          '<div class="hmg-f"><label>' + t("email") + '</label><input id="hmg-email" type="email" autocomplete="email"></div>' +
          '<div class="hmg-f"><label>' + t("phone") + '</label><input id="hmg-phone" type="tel" autocomplete="tel"></div>' +
          '<div class="hmg-f"><label>' + t("pos") + '</label><select id="hmg-pos"><option value="">' + t("choose") + "</option>" + opts + "</select></div>" +
          '<div class="hmg-err" id="hmg-err">' + t("err") + "</div>" +
          '<button class="hmg-btn" id="hmg-go">' + t("submit") + "</button>" +
          '<button class="hmg-cancel" id="hmg-x">' + t("cancel") + "</button>" +
          '<div class="hmg-priv">' + t("privacy") + "</div>" +
        "</div></div>";
    document.body.appendChild(ov);
    document.documentElement.style.overflow = "hidden";
    function close() { ov.remove(); document.documentElement.style.overflow = ""; }
    ov.querySelector("#hmg-x").onclick = close;
    ov.querySelector("#hmg-first").focus();
    ov.querySelector("#hmg-go").onclick = function () {
      var d = {
        first: ov.querySelector("#hmg-first").value.trim(),
        last: ov.querySelector("#hmg-last").value.trim(),
        email: ov.querySelector("#hmg-email").value.trim(),
        phone: ov.querySelector("#hmg-phone").value.trim(),
        position: ov.querySelector("#hmg-pos").value
      };
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email);
      if (!d.first || !d.last || !okEmail || !d.phone || !d.position) {
        ov.querySelector("#hmg-err").style.display = "block"; return;
      }
      var btn = ov.querySelector("#hmg-go");
      btn.disabled = true; btn.textContent = t("sending");
      var source = (CFG.source || ("Website — Intake Gate"));
      identify({ first: d.first, last: d.last, email: d.email, phone: d.phone, position: d.position, source: source });
      emit({
        journey: JOURNEYS.INTAKE_GATE, feature: feature || CFG.tool || "Gated tool",
        source: source, action: "unlock_feature", stage: "Lead"
      }).then(function () { close(); onDone && onDone(); });
    };
  }

  function lockEl(el) {
    css();
    if (el.querySelector(":scope > .hmg-lock")) return;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.setAttribute("data-gate-locked", "1");
    var lock = document.createElement("div");
    lock.className = "hmg-lock";
    var feature = el.getAttribute("data-gate-lock") || CFG.tool || "this tool";
    lock.innerHTML = '<div class="ic">🔒</div><p>' + t("locked") + '</p><button type="button">' + t("unlock") + "</button>";
    lock.querySelector("button").onclick = function () { modal(feature, function () { unlockAll(); }); };
    el.appendChild(lock);
  }
  function unlockAll() {
    [].forEach.call(document.querySelectorAll(".hmg-lock"), function (l) { l.remove(); });
    [].forEach.call(document.querySelectorAll("[data-gate-locked]"), function (e) { e.removeAttribute("data-gate-locked"); });
  }
  function applyLocks() {
    if (identified()) return;
    [].forEach.call(document.querySelectorAll("[data-gate-lock]"), lockEl);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-gate]");
    if (!el || identified()) return;
    e.preventDefault(); e.stopPropagation();
    var feature = el.getAttribute("data-gate") || el.textContent.trim();
    modal(feature, function () {
      if (el.tagName === "A" && el.getAttribute("href")) { window.location.href = el.href; }
      else { el.click(); }
    });
  }, true);

  /* ================= PUBLIC API ================= */
  window.IntakeEngine = {
    VERSION: EVENT_VERSION,
    ENDPOINT: ENDPOINT,
    JOURNEYS: JOURNEYS,
    positions: POSITIONS,
    registerJourney: function (key, label) { JOURNEYS[key] = label; return label; },
    // identity
    isIdentified: identified,
    get: get,
    identify: identify,
    // the one thing every page calls
    emit: emit,
    // require intake for a feature, then proceed
    require: function (feature, proceed) { identified() ? (proceed && proceed()) : modal(feature, proceed); },
    open: function (feature, proceed) { modal(feature, proceed); },
    reset: function () {
      try { localStorage.removeItem(STORE); } catch (e) {}
      LEGACY.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
      document.cookie = "hm_intake=; Max-Age=0; path=/; domain=.hamedmortgages.ca";
      document.cookie = "hm_intake=; Max-Age=0; path=/";
      applyLocks();
    }
  };

  /* Back-compat: existing pages call window.IntakeGate.* — keep it working
     as a thin alias over the engine. */
  window.IntakeGate = {
    positions: POSITIONS,
    isIdentified: identified,
    get: get,
    set: identify,
    submitLead: function (identity, opts) {
      opts = opts || {};
      identify(identity);
      return emit({
        journey: opts.journey || JOURNEYS.INTAKE_GATE,
        feature: opts.tool || opts.feature || "Gated tool",
        source: opts.source, action: opts.action || "intake", stage: opts.stage
      });
    },
    require: window.IntakeEngine.require,
    open: window.IntakeEngine.open,
    reset: window.IntakeEngine.reset
  };

  /* ================= AUTH SEAM (Phase 2 plugs in here) ================= */
  window.HM_AUTH = window.HM_AUTH || {
    mode: "intake-only",
    isIdentified: identified,
    isAuthenticated: function () { return false; },
    canLoadLiveData: function () { return this.isAuthenticated(); },
    getClient: function () { return get(); },
    fetchClientFile: function () { return Promise.resolve(null); }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyLocks);
  else applyLocks();
})();
