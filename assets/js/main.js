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
    // Close menu when a link is tapped (mobile)
    nav.querySelectorAll(".nav__links a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- News nav link (site-wide, idempotent, lang-aware) ----------
     Adds a "News" item to the primary menu after "Resources" on any page
     that doesn't already include it. Index and the News pages already have
     it statically, so this only fills in the remaining interior pages. */
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

  /* ---------- FAQ accordion ---------- */
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

  /* ---------- Footer year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) { y.textContent = new Date().getFullYear(); }
})();
