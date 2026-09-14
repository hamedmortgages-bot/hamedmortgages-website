/* Market Intelligence Content Boundary v1.0
   Loads approved content without changing the public site shell.
   Empty state is intentional until approved intelligence items are published.
*/
(function () {
  "use strict";
  var root = document.querySelector("[data-intelligence-feed]");
  if (!root) return;
  var source = root.getAttribute("data-source") || "/content/market-intelligence.json";
  fetch(source, { headers: { "Accept": "application/json" } })
    .then(function (r) { if (!r.ok) throw new Error("content"); return r.json(); })
    .then(function (data) {
      var items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) return;
      root.innerHTML = "";
      items.forEach(function (item) {
        var article = document.createElement("article");
        article.className = "av1-card intelligence-item";
        var label = document.createElement("span");
        label.className = "num";
        label.textContent = item.type || "Insight";
        var h = document.createElement("h2");
        h.textContent = item.title || "";
        var p = document.createElement("p");
        p.textContent = item.summary || "";
        article.appendChild(label); article.appendChild(h); article.appendChild(p);
        if (item.source_url) {
          var a = document.createElement("a");
          a.href = item.source_url; a.target = "_blank"; a.rel = "noopener";
          a.textContent = document.documentElement.lang === "fa" ? "مشاهده منبع" : "View source";
          article.appendChild(a);
        }
        root.appendChild(article);
      });
    })
    .catch(function () {});
})();
