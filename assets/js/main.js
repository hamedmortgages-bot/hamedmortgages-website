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
                   if (panel) {
                              panel.style.maxHeight = expanded ? null : panel.scrollHeight + "px";
                   }
          });
   });

   var y = document.querySelector("[data-year]");
     if (y) { y.textContent = new Date().getFullYear(); }

   /* ---------- Brokerage compliance identity ---------- */
   function replaceIdentityText(text) {
          return String(text || "")
            .replace(/Mortgage Alliance Company of Canada, FSRA Brokerage Licence #10530/g, "Sherwood Mortgage Group, Brokerage Licence #12176")
            .replace(/Mortgage Alliance Company of Canada, FSRA #10530/g, "Sherwood Mortgage Group, Brokerage Licence #12176")
            .replace(/Mortgage Alliance Company of Canada/g, "Sherwood Mortgage Group")
            .replace(/شماره مجوز بروکریج FSRA #10530/g, "شماره مجوز بروکریج #12176")
            .replace(/FSRA Brokerage Licence #10530/g, "Brokerage Licence #12176")
            .replace(/FSRA #10530/g, "Brokerage Licence #12176");
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

   function applyComplianceIdentity() {
          document.querySelectorAll("footer, .footer-disclosure, .footer-legal").forEach(rewriteTextNodes);
          if (/\/privacy\.html$/i.test(location.pathname || "")) {
                 rewriteTextNodes(document.querySelector(".legal"));
                 document.querySelectorAll('meta[name="description"],meta[property="og:description"]').forEach(function (m) {
                        var next = replaceIdentityText(m.getAttribute("content") || "");
                        m.setAttribute("content", next);
                 });
          }
   }

   applyComplianceIdentity();
   window.addEventListener("load", applyComplianceIdentity, { once: true });
   var complianceObserver = new MutationObserver(function () { applyComplianceIdentity(); });
   complianceObserver.observe(document.documentElement, { childList: true, subtree: true });
})();

/* ---------- NILI widget loader (Track B) ---------- */
(function () { try { var s = document.createElement("script"); s.defer = true; s.src = "/assets/js/concierge.js?v=20260628a"; document.head.appendChild(s); } catch (e) {} })();
