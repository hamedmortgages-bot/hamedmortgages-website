/* Authority V1 canonical, language and organization metadata for GitHub Pages. */
(function () {
  "use strict";
  var path = location.pathname.replace(/\/index\.html$/, "/");
  var match = path.match(/^\/(en|fa)(?:\/([^/]+))?\/?$/);
  if (!match) return;
  var lang = match[1], page = (match[2] || "").replace(/\.html$/, "");
  var peer = lang === "en" ? "fa" : "en", base = "https://hamedmortgages.ca";
  var local = "/" + lang + "/" + (page ? page + ".html" : "");
  var alternate = "/" + peer + "/" + (page ? page + ".html" : "");
  function addLink(rel, href, hreflang) {
    var selector = 'link[rel="' + rel + '"]' + (hreflang ? '[hreflang="' + hreflang + '"]' : ':not([hreflang])');
    var node = document.querySelector(selector);
    if (!node) { node = document.createElement("link"); node.rel = rel; if (hreflang) node.hreflang = hreflang; document.head.appendChild(node); }
    node.href = href;
  }
  addLink("canonical", base + local);
  addLink("alternate", base + local, lang);
  addLink("alternate", base + alternate, peer);
  addLink("alternate", base + "/en/" + (page ? page + ".html" : ""), "x-default");
  if (!document.querySelector('meta[property="og:site_name"]')) {
    var og = document.createElement("meta"); og.setAttribute("property", "og:site_name"); og.content = "Hamed Ashouri — Mortgage Strategy"; document.head.appendChild(og);
  }
  if (!document.querySelector('script[data-authority-schema]')) {
    var schema = {"@context":"https://schema.org","@type":"FinancialService","name":"Hamed Ashouri — Mortgage Strategy","url":base + local,"areaServed":"Ontario, Canada","employee":{"@type":"Person","name":"Hamed Ashouri","jobTitle":"Mortgage Strategist / Mortgage Strategy Advisor","identifier":"M22004433"},"parentOrganization":{"@type":"Organization","name":"Sherwood Mortgage Group","identifier":"Brokerage Licence #12176"}};
    var json = document.createElement("script"); json.type = "application/ld+json"; json.dataset.authoritySchema = "true"; json.textContent = JSON.stringify(schema); document.head.appendChild(json);
  }
})();
