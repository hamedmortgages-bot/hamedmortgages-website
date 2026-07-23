/* ===================================================================
   Hamed Mortgages — news.js
   Mortgage News Engine renderer. Vanilla JS, no dependencies.
   Mirrors kb.js: self-resolves data path, reads <html lang>, renders
   from assets/data/news.json. Surfaces:
     [data-news-widget]   homepage latest/featured widget
     [data-news-list]     /news listing (+ ?category= filter)
     [data-news-article]  single article (?slug= or ?id=)
     [data-news-archive]  archive (older items grouped by month)
   Always cites source_url. Never reproduces source text (content is
   original summary + commentary authored upstream by the Import Engine).
   =================================================================== */
(function () {
  "use strict";

  var nodes = document.querySelectorAll("[data-news-widget],[data-news-list],[data-news-article],[data-news-archive]");
  if (!nodes.length) return;

  var lang = (document.documentElement.getAttribute("lang") || "en").slice(0, 2);
  var isFa = lang === "fa";
  var src = (document.currentScript && document.currentScript.src) || "";
  var dataUrl = src.replace(/js\/news\.js.*$/, "data/news.json");
  if (dataUrl === src || !dataUrl) dataUrl = "../assets/data/news.json";

  var T = {
    readMore: isFa ? "ادامه مطلب ←" : "Read More →",
    latest: isFa ? "آخرین اخبار" : "Latest News",
    featured: isFa ? "خبر ویژه" : "Featured",
    source: isFa ? "منبع" : "Source",
    all: isFa ? "همه" : "All",
    back: isFa ? "← بازگشت به اخبار" : "← Back to News",
    related: isFa ? "مرتبط با پرونده شما" : "Related to your file",
    notFound: isFa ? "خبر یافت نشد." : "Article not found.",
    archive: isFa ? "بایگانی اخبار" : "News Archive",
    published: isFa ? "منتشرشده" : "Published"
  };

  // Brand SVG placeholder shown until a real generated image is in place (no broken images).
  var PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="405" viewBox="0 0 720 405">' +
    '<rect width="720" height="405" fill="#0B2A4A"/>' +
    '<rect width="720" height="405" fill="url(#g)"/>' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#0B2A4A"/><stop offset="1" stop-color="#1c5a44"/></linearGradient></defs>' +
    '<text x="50%" y="48%" fill="#d9b46a" font-family="Manrope,Arial,sans-serif" font-size="34" font-weight="800" text-anchor="middle">Hamed Ashouri</text>' +
    '<text x="50%" y="60%" fill="#ffffff" font-family="Manrope,Arial,sans-serif" font-size="18" text-anchor="middle" opacity="0.85">Mortgage News</text></svg>');
  var ONERR = ' onerror="this.onerror=null;this.src=\'' + PLACEHOLDER + '\'"';

  function field(a, base) { return a[base + "_" + lang] || a[base + "_en"] || ""; }
  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  function fmtDate(d) {
    try { return new Date(d + "T00:00:00").toLocaleDateString(isFa ? "fa-IR" : "en-CA",
      { year: "numeric", month: "short", day: "numeric" }); } catch (e) { return d; }
  }
  function qparam(k) { return new URLSearchParams(location.search).get(k); }
  function visible(a){ return a.status === "published" || a.status === "sample"; }
  function byDateDesc(a,b){ return (b.published_date||"").localeCompare(a.published_date||""); }
  function catName(cats,id){ var c=(cats||[]).filter(function(x){return x.id===id;})[0]; return c?(c[lang]||c.en):id; }

  function card(a, cats) {
    var img = a.featured_image || "../assets/img/news/news-default.webp";
    return '' +
      '<article class="card card--news">' +
        '<a class="card__media" href="news-article.html?slug=' + encodeURIComponent(a.slug) + '">' +
          '<img src="' + esc(img) + '" alt="' + esc(field(a,"image_alt")) + '" loading="lazy" decoding="async" width="720" height="405"' + ONERR + '>' +
        '</a>' +
        '<div class="card__body">' +
          '<span class="tag-inline">' + esc(catName(cats,a.category)) + '</span>' +
          '<h3><a href="news-article.html?slug=' + encodeURIComponent(a.slug) + '">' + esc(field(a,"title")) + '</a></h3>' +
          '<p>' + esc(field(a,"summary")) + '</p>' +
          '<p class="card__meta"><time datetime="' + esc(a.published_date) + '">' + fmtDate(a.published_date) + '</time></p>' +
          '<a class="card__more" href="news-article.html?slug=' + encodeURIComponent(a.slug) + '">' + T.readMore + '</a>' +
        '</div>' +
      '</article>';
  }

  function renderWidget(el, data) {
    var limit = parseInt(el.getAttribute("data-news-limit"), 10) || 3;
    var items = data.articles.filter(visible).filter(function(a){return a.homepage;}).sort(byDateDesc).slice(0, limit);
    if (!items.length) return;
    el.innerHTML =
      '<div class="section-head"><p class="eyebrow">' + T.latest + '</p><h2>' + (isFa?"به‌روزرسانی‌های بازار وام مسکن":"Mortgage market updates") + '</h2></div>' +
      '<div class="grid grid--3">' + items.map(function(a){return card(a,data.categories);}).join("") + '</div>' +
      '<div class="btn-row" style="margin-top:1.5rem;"><a class="btn btn--ghost-light" href="news.html">' + (isFa?"همه اخبار":"All news") + ' →</a></div>';
  }

  function renderList(el, data) {
    var cat = qparam("category");
    var items = data.articles.filter(visible).sort(byDateDesc);
    if (cat) items = items.filter(function(a){return a.category===cat;});
    var nav = '<div class="news-cats"><a href="news.html" class="' + (!cat?"is-active":"") + '">' + T.all + '</a>' +
      (data.categories||[]).map(function(c){return '<a href="news.html?category='+c.id+'" class="'+(cat===c.id?"is-active":"")+'">'+esc(c[lang]||c.en)+'</a>';}).join("") + '</div>';
    var feat = items.filter(function(a){return a.featured;})[0];
    var featHtml = (feat && !cat) ? ('<div class="news-featured"><span class="tag">'+T.featured+'</span>'+card(feat,data.categories)+'</div>') : "";
    var rest = (feat && !cat) ? items.filter(function(a){return a.id!==feat.id;}) : items;
    el.innerHTML = nav + featHtml +
      '<div class="grid grid--3">' + rest.map(function(a){return card(a,data.categories);}).join("") + '</div>';
  }

  function setMeta(name, val, attr) {
    attr = attr || "name";
    var m = document.head.querySelector("meta[" + attr + "='" + name + "']");
    if (!m) { m = document.createElement("meta"); m.setAttribute(attr, name); document.head.appendChild(m); }
    m.setAttribute("content", val);
  }

  function renderArticle(el, data) {
    var key = qparam("slug"), idk = qparam("id");
    var a = data.articles.filter(function(x){return (key && x.slug===key) || (idk && x.id===idk);})[0];
    if (!a) { el.innerHTML = '<div class="container"><p>' + T.notFound + ' <a href="news.html">' + T.back + '</a></p></div>'; return; }

    // SEO / head
    document.title = a.seo_title || field(a,"title");
    setMeta("description", a.seo_description || field(a,"summary"));
    setMeta("keywords", (a.keywords||[]).join(", "));
    setMeta("og:title", a.seo_title || field(a,"title"), "property");
    setMeta("og:description", a.seo_description || field(a,"summary"), "property");
    setMeta("og:type", "article", "property");
    setMeta("og:image", (a.featured_image||"").replace("../",""), "property");
    setMeta("twitter:card", "summary_large_image");
    var canon = document.head.querySelector("link[rel=canonical]") || document.createElement("link");
    canon.setAttribute("rel","canonical");
    canon.setAttribute("href", location.origin + location.pathname + "?slug=" + encodeURIComponent(a.slug));
    document.head.appendChild(canon);
    var ld = {
      "@context":"https://schema.org","@type":"NewsArticle",
      "headline": field(a,"title"), "description": field(a,"summary"),
      "datePublished": a.published_date, "author": {"@type":"Person","name": a.author||"Hamed Ashouri"},
      "publisher": {"@type":"Organization","name":"Hamed Ashouri — Mortgage Broker"},
      "inLanguage": lang, "isBasedOn": a.source_url, "image": a.featured_image
    };
    var s = document.createElement("script"); s.type="application/ld+json"; s.textContent = JSON.stringify(ld); document.head.appendChild(s);

    var relLinks = [];
    (a.related_journeys||[]).forEach(function(j){
      var map={assessment:"assessment.html",workspace:"workspace.html",calculator:"resources.html#calculator",cmhc:"https://cmhc.hamedmortgages.ca"};
      if(map[j]) relLinks.push('<a class="btn btn--outline" href="'+map[j]+'">'+ (isFa?"":"") + (j.charAt(0).toUpperCase()+j.slice(1)) +'</a>');
    });

    el.innerHTML =
      '<article class="news-article">' +
        '<div class="container container--narrow">' +
          '<p class="eyebrow"><a href="news.html?category='+esc(a.category)+'">'+esc(catName(data.categories,a.category))+'</a></p>' +
          '<h1>' + esc(field(a,"title")) + '</h1>' +
          '<p class="news-article__meta"><time datetime="'+esc(a.published_date)+'">'+T.published+' '+fmtDate(a.published_date)+'</time></p>' +
        '</div>' +
        '<div class="container container--narrow">' +
          '<figure class="news-article__media"><img src="'+esc(a.featured_image)+'" alt="'+esc(field(a,"image_alt"))+'" width="1200" height="675" decoding="async"'+ONERR+'>' +
            '<figcaption>'+esc(field(a,"caption"))+'</figcaption></figure>' +
          '<p class="lead">' + esc(field(a,"summary")) + '</p>' +
          field(a,"analysis") +
          '<div class="news-source"><strong>'+T.source+':</strong> <a href="'+esc(a.source_url)+'" target="_blank" rel="noopener nofollow">'+esc(a.source_name)+'</a> — '+(isFa?"این مقاله خلاصه و تحلیل اصلی است؛ متن منبع بازتولید نشده است.":"original summary & analysis; source text not reproduced.")+'</div>' +
          (a.tags&&a.tags.length?('<p class="news-tags">'+a.tags.map(function(t){return '<span class="tag-inline">#'+esc(t)+'</span>';}).join(" ")+'</p>'):"") +
          (relLinks.length?('<div class="cta-band" style="margin-top:2rem;"><h2>'+T.related+'</h2><div class="btn-row">'+relLinks.join("")+'</div></div>'):"") +
          '<p style="margin-top:2rem;"><a href="news.html">'+T.back+'</a></p>' +
        '</div>' +
      '</article>';
  }

  function renderArchive(el, data) {
    var items = data.articles.filter(function(a){return a.status==="published"||a.status==="archived"||a.status==="sample";}).sort(byDateDesc);
    var groups = {};
    items.forEach(function(a){ var k=(a.published_date||"").slice(0,7); (groups[k]=groups[k]||[]).push(a); });
    var html = '<div class="section-head"><h2>'+T.archive+'</h2></div>';
    Object.keys(groups).sort().reverse().forEach(function(k){
      html += '<h3>'+k+'</h3><ul class="news-archive">'+groups[k].map(function(a){
        return '<li><a href="news-article.html?slug='+encodeURIComponent(a.slug)+'">'+esc(field(a,"title"))+'</a> <span>'+fmtDate(a.published_date)+'</span></li>';
      }).join("")+'</ul>';
    });
    el.innerHTML = html;
  }

  fetch(dataUrl, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      data.articles = data.articles || [];
      nodes.forEach(function (el) {
        if (el.hasAttribute("data-news-widget")) renderWidget(el, data);
        else if (el.hasAttribute("data-news-list")) renderList(el, data);
        else if (el.hasAttribute("data-news-article")) renderArticle(el, data);
        else if (el.hasAttribute("data-news-archive")) renderArchive(el, data);
      });
      document.dispatchEvent(new CustomEvent("news:loaded", { detail: { count: data.articles.length } }));
    })
    .catch(function () { /* offline / file:// — static fallback inside each mount stays */ });
})();
