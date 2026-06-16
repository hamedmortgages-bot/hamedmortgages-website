/* ===================================================================
   Hamed Mortgages — calculator.js
   Simple mortgage payment estimator. 100% client-side.
   NO data is stored, sent, or shared. For illustration only.
   Works for both /en/ and /fa/ pages (reads data-lang on <html>).
   =================================================================== */
(function () {
  "use strict";

  var form = document.querySelector("[data-calc]");
  if (!form) return;

  var lang = document.documentElement.getAttribute("lang") || "en";
  var isFa = lang === "fa";

  // Always use Latin (English) digits for numeric consistency across EN and FA.
  var locale = "en-CA";
  var fmtMoney = function (n) {
    return new Intl.NumberFormat(locale, {
      style: "currency", currency: "CAD", maximumFractionDigits: 0
    }).format(isFinite(n) ? n : 0);
  };

  var el = function (id) { return form.querySelector("[data-" + id + "]"); };
  var out = function (id) { return document.querySelector("[data-out-" + id + "]"); };

  function compute() {
    var price = parseFloat(el("price").value) || 0;
    var down = parseFloat(el("down").value) || 0;
    var rate = parseFloat(el("rate").value) || 0;
    var years = parseInt(el("amort").value, 10) || 25;

    var principal = Math.max(price - down, 0);
    var monthlyRate = rate / 100 / 12;
    var n = years * 12;

    var payment;
    if (monthlyRate === 0) {
      payment = n > 0 ? principal / n : 0;
    } else {
      payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) /
                (Math.pow(1 + monthlyRate, n) - 1);
    }

    var totalPaid = payment * n;
    var totalInterest = totalPaid - principal;

    if (out("payment")) out("payment").textContent = fmtMoney(payment);
    if (out("principal")) out("principal").textContent = fmtMoney(principal);
    if (out("interest")) out("interest").textContent = fmtMoney(totalInterest);
    if (out("total")) out("total").textContent = fmtMoney(totalPaid);
  }

  form.addEventListener("input", compute);
  form.addEventListener("submit", function (e) { e.preventDefault(); compute(); });
  compute(); // initial render with default values
})();
