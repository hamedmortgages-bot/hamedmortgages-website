/* ===================================================================
   Hamed Mortgages — main.js
   Vanilla JS only. No dependencies, no tracking, no network calls.
   Handles: mobile nav, News nav link, FAQ accordion, footer year.
   (Calculator is in calculator.js)
   =================================================================== */
(function () {
  "use strict";

  /* ---------- Mobile navigation toggle ---------- */
  var nav = document.querySelector("[data-nav]");
  var toggle = document.querySelector("[data-nav-toggle]");
  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var menu = document.getElementById("primary-menu");
  if (menu && !menu.querySelector('a[href="news.html"]')) {
    var lang = (document.documentElement.getAttribute("lang") || "en").slice(0, 2);
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = "news.html";
    a.textContent = lang === "fa" ? "اخبار" : "News";
    li.appendChild(a);
    var resLink = menu.querySelector('a[href="resources.html"]');
    if (resLink && resLink.parentElement && resLink.parentElement.parentElement === menu) {
      resLink.parentElement.insertAdjacentElement("afterend", li);
    } else {
      menu.appendChild(li);
    }
    if (nav && toggle) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    }
  }

  document.querySelectorAll("[data-faq-q]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      var panel = btn.nextElementSibling;
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (panel) panel.style.maxHeight = expanded ? null : panel.scrollHeight + "px";
    });
  });

  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Brokerage compliance identity ---------- */
  function replaceIdentityText(text) {
    return String(text || "")
      .replace(/Mortgage Alliance Company of Canada, FSRA Brokerage Licence #10530/g, "Sherwood Mortgage Group, Brokerage Licence #12176")
      .replace(/Mortgage Alliance Company of Canada, FSRA #10530/g, "Sherwood Mortgage Group, Brokerage Licence #12176")
      .replace(/Mortgage Alliance Company of Canada \(FSRA #10530\)/g, "Sherwood Mortgage Group (Brokerage Licence #12176)")
      .replace(/Mortgage Alliance Company of Canada/g, "Sherwood Mortgage Group")
      .replace(/https:\/\/www\.mortgagealliance\.com\/en\/mortgage-broker\/HamedAshourikisomi\/?/g, "https://sherwoodmortgagegroup.com/")
      .replace(/شماره مجوز بروکریج FSRA #10530/g, "شماره مجوز بروکریج #12176")
      .replace(/شماره FSRA #10530/g, "شماره مجوز بروکریج #12176")
      .replace(/FSRA Brokerage Licence #10530/g, "Brokerage Licence #12176")
      .replace(/FSRA #10530/g, "Brokerage Licence #12176")
      .replace(/#10530/g, "#12176");
  }

  function rewriteTextNodes(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var parent = node.parentNode && node.parentNode.nodeName;
      if (parent === "SCRIPT" || parent === "STYLE" || parent === "NOSCRIPT") continue;
      var next = replaceIdentityText(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  }

  function rewriteMetadataAndSchema() {
    document.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]').forEach(function (m) {
      var current = m.getAttribute("content") || "";
      var next = replaceIdentityText(current);
      if (next !== current) m.setAttribute("content", next);
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      var current = s.textContent || "";
      var next = replaceIdentityText(current);
      if (next !== current) s.textContent = next;
    });
  }

  function correctDataCollectionContradictions() {
    var p = location.pathname || "";
    if (!/(\/contact\.html$|\/index\.html$|\/(en|fa)\/$)/i.test(p)) return;
    var enOld = "No personal data is collected or stored on this website";
    var enNew = "Information you submit through forms or NILI may be processed and stored in our secure service systems, including Zoho CRM, for the purpose of responding to your mortgage inquiry.";
    var faOld = "هیچ داده‌ای از مشتری در این وب‌سایت جمع‌آوری یا ذخیره نمی‌شود";
    var faNew = "اطلاعاتی که از طریق فرم‌ها یا نیلی ارسال می‌کنید ممکن است برای پاسخ به درخواست وام مسکن شما در سیستم‌های امن خدماتی، از جمله Zoho CRM، پردازش و ذخیره شود";
    document.querySelectorAll("body *").forEach(function (el) {
      if (el.children.length) return;
      var txt = el.textContent || "";
      if (txt.indexOf(enOld) !== -1) el.textContent = txt.replace(enOld, enNew);
      if (txt.indexOf(faOld) !== -1) el.textContent = txt.replace(faOld, faNew);
    });
  }

  function applyComplianceIdentity() {
    document.querySelectorAll("footer, .footer-disclosure, .footer-legal, .legal").forEach(rewriteTextNodes);
    rewriteMetadataAndSchema();
    correctDataCollectionContradictions();
  }

  applyComplianceIdentity();
  window.addEventListener("load", applyComplianceIdentity, { once: true });
  var complianceObserver = new MutationObserver(function () { applyComplianceIdentity(); });
  complianceObserver.observe(document.documentElement, { childList: true, subtree: true });
})();

/* ---------- Platform runtime loader: Agents 11/12/13 ---------- */
(function () {
  try {
    var p = document.createElement("script");
    p.defer = true;
    p.src = "/assets/js/platform-runtime.js?v=20260902a";
    document.head.appendChild(p);
  } catch (e) {}
})();

/* ---------- NILI widget loader (Track B) ---------- */
(function () {
  try {
    var s = document.createElement("script");
    s.defer = true;
    s.src = "/assets/js/concierge.js?v=20260628a";
    document.head.appendChild(s);
  } catch (e) {}
})();
