/* ============================================================
   Hamed Ashouri — GLOBAL INTAKE GATE  (Intake-First architecture)
   Reusable, bilingual (EN/FA), client-side gate.
   No visitor may use a gated tool/calculator/report/download
   before completing Intake. Identity is remembered across
   hamedmortgages.ca and its subdomains via a shared cookie.

   USAGE
   -----
   1) (optional) set config before this script:
        <script>window.HM_INTAKE={tool:"CMHC Rental Calculator"};</script>
   2) include this file on any page:
        <script defer src="https://hamedmortgages.ca/assets/js/intake-gate.js"></script>
   3) mark anything that must be gated:
        - a whole tool/calculator panel:  <div class="calc" data-gate-lock> ... </div>
        - a single action (button/link):  <a data-gate="Mortgage Guide PDF" ...>
   Future tools are gated automatically just by adding those attributes.
   ============================================================ */
(function () {
  "use strict";
  var CFG = window.HM_INTAKE || {};
  var ZOHO = Object.assign({
    action: "https://crm.zohocloud.ca/crm/WebToLeadForm",
    xnQsjsdp: "15cbe3bc57ad44e16846b2404afaf7d96465a0ddc098813336880744594029eb",
    xmIwtLD: "fc7f370331ec16a19a7ec54bccbb030060ef404cae7152804648fe07124804f7aa51f7239c6f3f4e17a1690444a8d253",
    leadSource: "Web Download"
  }, CFG.zoho || {});
  var STORE = "hm_intake_v1";
  var COOKIE = "hm_intake";

  function lang() {
    var l = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
    return l.indexOf("fa") === 0 ? "fa" : "en";
  }
  var T = {
    en: {
      title: "Quick intake before you continue",
      sub: "Tell us who you are and you'll get instant access to the tools — and any report stays tied to your file.",
      first: "First name", last: "Last name", email: "Email", phone: "Phone",
      pos: "I am a…", choose: "Choose one…",
      submit: "Get access", cancel: "Cancel",
      locked: "Complete a quick intake to use this tool",
      unlock: "Unlock the tool",
      sending: "Setting up your access…",
      err: "Please fill in your name, a valid email, phone, and your role.",
      privacy: "Your details go to Hamed Ashouri (Mortgage Advisory, Ontario) so he can follow up. No spam.",
      positions: ["Builder", "Real Estate Agent", "Investor", "Mortgage Broker", "Home Buyer", "Home Owner", "Business Owner", "Other"]
    },
    fa: {
      title: "ثبت‌نام سریع پیش از ادامه",
      sub: "بگویید چه کسی هستید تا فوراً به ابزارها دسترسی پیدا کنید — و هر گزارش به پرونده‌ی شما متصل می‌ماند.",
      first: "نام", last: "نام خانوادگی", email: "ایمیل", phone: "تلفن",
      pos: "من … هستم", choose: "یکی را انتخاب کنید…",
      submit: "دریافت دسترسی", cancel: "انصراف",
      locked: "برای استفاده از این ابزار، ثبت‌نام سریع را کامل کنید",
      unlock: "باز کردن ابزار",
      sending: "در حال آماده‌سازی دسترسی شما…",
      err: "لطفاً نام، یک ایمیل معتبر، تلفن و نقش خود را وارد کنید.",
      privacy: "اطلاعات شما برای پیگیری به حامد عاشوری (مشاوره وام مسکن، انتاریو) ارسال می‌شود. بدون هرزنامه.",
      positions: ["سازنده", "مشاور املاک", "سرمایه‌گذار", "بروکر وام مسکن", "خریدار مسکن", "صاحب‌خانه", "صاحب بیزنس", "سایر"]
    }
  };
  function t(k) { return (T[lang()] || T.en)[k]; }

  /* ---------- identity ---------- */
  function read() {
    try { var v = localStorage.getItem(STORE); if (v) return JSON.parse(v); } catch (e) {}
    var m = document.cookie.match(/(?:^|;\s*)hm_intake=([^;]+)/);
    if (m) { try { return JSON.parse(decodeURIComponent(m[1])); } catch (e) {} }
    return null;
  }
  function write(o) {
    try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) {}
    var exp = new Date(Date.now() + 180 * 864e5).toUTCString();
    var shared = location.hostname.indexOf("hamedmortgages.ca") >= 0 ? "; domain=.hamedmortgages.ca" : "";
    document.cookie = COOKIE + "=" + encodeURIComponent(JSON.stringify(o)) + "; expires=" + exp + "; path=/" + shared + "; SameSite=Lax";
  }
  function identified() { var i = read(); return !!(i && i.email); }

  /* ---------- CRM submit (Zoho Web-to-Lead, fire-and-forget) ---------- */
  function toCRM(d, tool) {
    var p = new URLSearchParams();
    p.append("xnQsjsdp", ZOHO.xnQsjsdp);
    p.append("xmIwtLD", ZOHO.xmIwtLD);
    p.append("actionType", "TGVhZHM=");
    p.append("Last Name", (d.first + " " + d.last).trim() || d.last || "-");
    p.append("First Name", d.first || "");
    p.append("Email", d.email);
    p.append("Phone", d.phone || "");
    p.append("Lead Source", ZOHO.leadSource);
    p.append("Description",
      "--- INTAKE (Intake-First Gate) ---\n" +
      "Name: " + d.first + " " + d.last + "\n" +
      "Position / User type: " + d.position + "\n" +
      "Language: " + lang() + "\n" +
      "Source page: " + location.href + "\n" +
      "Tool requested: " + (tool || CFG.tool || document.title) + "\n" +
      "--- Source: Website — Intake Gate ---");
    return fetch(ZOHO.action, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: p.toString()
    }).catch(function () { /* no-cors: response is opaque; treat as sent */ });
  }

  /* ---------- styles ---------- */
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

  /* ---------- modal ---------- */
  function modal(tool, onDone) {
    css();
    var rtl = lang() === "fa";
    var ov = document.createElement("div");
    ov.className = "hmg-ov";
    var opts = t("positions").map(function (p) { return '<option value="' + p + '">' + p + "</option>"; }).join("");
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
      toCRM(d, tool).then(function () {
        write({ first: d.first, last: d.last, email: d.email, phone: d.phone, position: d.position, ts: Date.now() });
        close();
        onDone && onDone();
      });
    };
  }

  /* ---------- locks (whole-tool gating) ---------- */
  function lockEl(el) {
    if (el.querySelector(":scope > .hmg-lock")) return;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    el.setAttribute("data-gate-locked", "1");
    var lock = document.createElement("div");
    lock.className = "hmg-lock";
    lock.innerHTML = '<div class="ic">🔒</div><p>' + t("locked") + '</p><button type="button">' + t("unlock") + "</button>";
    lock.querySelector("button").onclick = function () {
      modal(CFG.tool, function () { unlockAll(); });
    };
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

  /* ---------- single-action gating (buttons/links/downloads) ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-gate]");
    if (!el || identified()) return;
    e.preventDefault(); e.stopPropagation();
    var tool = el.getAttribute("data-gate") || el.textContent.trim();
    modal(tool, function () {
      if (el.tagName === "A" && el.getAttribute("href")) { window.location.href = el.href; }
      else { el.click(); }
    });
  }, true);

  /* ---------- public API ---------- */
  window.IntakeGate = {
    isIdentified: identified,
    require: function (tool, proceed) { identified() ? (proceed && proceed()) : modal(tool, proceed); },
    open: function (tool, proceed) { modal(tool, proceed); },
    reset: function () {
      try { localStorage.removeItem(STORE); } catch (e) {}
      document.cookie = "hm_intake=; Max-Age=0; path=/; domain=.hamedmortgages.ca";
      document.cookie = "hm_intake=; Max-Age=0; path=/";
      applyLocks();
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyLocks);
  else applyLocks();
})();
