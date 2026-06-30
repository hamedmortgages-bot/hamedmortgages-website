/* ============================================================
   Hamed Ashouri — LIVING KNOWLEDGE BASE (renderer + reuse API)
   ------------------------------------------------------------
   Educational content is DATA, not pages. One source of truth
   (assets/data/knowledge.json) is rendered anywhere via mount
   points and reused by the Workspace, the future AI Assistant,
   the Client Portal, the Academy, and Broker Training.

   USE ON A PAGE
   -------------
   <div data-kb data-kb-topic="refinance"></div>            <!-- whole topic -->
   <div data-kb data-kb-topic="*" data-kb-types="guide"></div> <!-- all guides -->
   <div data-kb data-kb-topic="refinance" data-kb-types="faq,mistake"></div>
   Optional: data-kb-lang="fa", data-kb-heading="false".

   REUSE FROM CODE (Workspace, AI grounding, etc.)
   ----------------------------------------------
   KB.ready(function(){
     var blocks = KB.blocks({ topic:"refinance", reuse:"ai" });  // ground answers
     var faqs   = KB.blocks({ types:["faq"] });
   });

   A page never hard-codes a guide again — it declares a mount and
   the content grows by editing the JSON. Pages are never "finished".
   ============================================================ */
(function () {
  "use strict";

  // Resolve the data file relative to THIS script (path-independent).
  function dataUrl() {
    var s = document.currentScript || (function () {
      var all = document.querySelectorAll('script[src*="kb.js"]');
      return all[all.length - 1];
    })();
    var src = (s && s.getAttribute("src")) || "../assets/js/kb.js";
    return src.replace(/[?#].*$/, "").replace(/js\/kb\.js$/, "data/knowledge.json");
  }

  function lang() {
    var l = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
    return l.indexOf("fa") === 0 ? "fa" : "en";
  }
  function rtl() { return lang() === "fa"; }
  function tx(field, lng) { // localized text helper
    if (field == null) return "";
    if (typeof field === "string") return field;
    lng = lng || lang();
    return field[lng] || field.en || field.fa || "";
  }

  var TYPE_ORDER = ["guide", "example", "case_study", "faq", "mistake", "lender_insight", "broker_tip", "download", "video", "ai_rec"];
  var TYPE_LABEL = {
    guide:          { en: "Guides", fa: "راهنماها" },
    example:        { en: "Examples", fa: "مثال‌ها" },
    case_study:     { en: "Case Studies", fa: "مطالعات موردی" },
    faq:            { en: "Frequently Asked Questions", fa: "پرسش‌های متداول" },
    mistake:        { en: "Common Mistakes", fa: "اشتباهات رایج" },
    lender_insight: { en: "Lender Insights", fa: "دیدگاه وام‌دهنده" },
    broker_tip:     { en: "Broker Tips", fa: "نکات بروکر" },
    download:       { en: "Downloadable Resources", fa: "منابع قابل دانلود" },
    video:          { en: "Videos", fa: "ویدیوها" },
    ai_rec:         { en: "AI Recommendations", fa: "پیشنهادهای هوش مصنوعی" }
  };
  var SOON = { en: "Coming soon", fa: "به‌زودی" };

  var DATA = null, READY = false, queue = [];

  function css() {
    if (document.getElementById("kbCSS")) return;
    var s = document.createElement("style");
    s.id = "kbCSS";
    s.textContent =
      ".kb-group{margin:0 0 2rem;}" +
      ".kb-group__head{font-size:.78rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--green-700,#1c6b50);margin:0 0 .9rem;display:flex;align-items:center;gap:.5rem;}" +
      ".kb-acc{display:grid;gap:.6rem;max-width:860px;}" +
      ".kb-item{border:1px solid var(--line,#e4e8e5);border-radius:var(--radius-sm,12px);background:#fff;overflow:hidden;}" +
      ".kb-q{width:100%;text-align:inherit;background:none;border:0;font:inherit;font-weight:700;color:var(--heading,#15233d);cursor:pointer;padding:1rem 1.2rem;display:flex;justify-content:space-between;gap:1rem;align-items:center;}" +
      ".kb-q:hover{color:var(--green-700,#1c6b50);}" +
      ".kb-q .kb-ic{flex:0 0 auto;transition:transform .2s;color:var(--green-600,#1c6b50);}" +
      ".kb-item.is-open .kb-q .kb-ic{transform:rotate(45deg);}" +
      ".kb-a{padding:0 1.2rem;max-height:0;overflow:hidden;transition:max-height .25s ease, padding .25s ease;}" +
      ".kb-item.is-open .kb-a{padding:0 1.2rem 1.1rem;max-height:2400px;}" +
      ".kb-a p{margin:0 0 .8rem;color:var(--text-muted,#5b6b63);}" +
      ".kb-a p strong{color:var(--heading,#15233d);}" +
      ".kb-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;}" +
      ".kb-card{border:1px solid var(--line,#e4e8e5);border-radius:var(--radius-sm,12px);background:#fff;padding:1.2rem 1.3rem;}" +
      ".kb-card h4{margin:0 0 .5rem;color:var(--heading,#15233d);font-size:1.02rem;}" +
      ".kb-card p{margin:0 0 .6rem;color:var(--text-muted,#5b6b63);}" +
      ".kb-callout{border:1px solid var(--line,#e4e8e5);border-inline-start:4px solid var(--green-600,#1c6b50);border-radius:var(--radius-sm,12px);background:var(--mist,#f4f7f5);padding:1rem 1.2rem;margin-bottom:.8rem;}" +
      ".kb-callout--tip{border-inline-start-color:var(--gold,#c5a249);}" +
      ".kb-callout h4{margin:0 0 .35rem;font-size:.98rem;color:var(--heading,#15233d);}" +
      ".kb-callout p{margin:0;color:var(--text-muted,#5b6b63);}" +
      ".kb-mistakes{list-style:none;padding:0;margin:0;display:grid;gap:.55rem;max-width:860px;}" +
      ".kb-mistakes li{position:relative;padding-inline-start:1.7rem;color:var(--text-muted,#5b6b63);}" +
      ".kb-mistakes li::before{content:'✗';position:absolute;inset-inline-start:0;top:0;color:#b3261e;font-weight:800;}" +
      ".kb-dl{display:flex;flex-wrap:wrap;gap:.7rem;}" +
      ".kb-dl a,.kb-dl span{display:inline-flex;align-items:center;gap:.5rem;border:1px solid var(--line,#e4e8e5);border-radius:999px;padding:.55rem 1rem;font-weight:700;font-size:.9rem;text-decoration:none;color:var(--green-800,#0f3d2e);background:#fff;}" +
      ".kb-dl a:hover{border-color:var(--green-600,#1c6b50);}" +
      ".kb-soon{opacity:.75;}" +
      ".kb-chip{display:inline-block;font-size:.7rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#9a6b00;background:#fff4e0;border:1px solid #f0d693;border-radius:999px;padding:.15rem .6rem;margin-inline-start:.5rem;}" +
      ".kb-empty{color:var(--text-muted,#5b6b63);font-size:.92rem;}";
    document.head.appendChild(s);
  }

  /* ---------- queries (reuse API) ---------- */
  function topicList() { return (DATA && DATA.topics) || []; }
  function getTopic(id) { return topicList().filter(function (t) { return t.id === id; })[0] || null; }
  function getBlocks(opts) {
    opts = opts || {};
    var lng = opts.lang || lang();
    var topics = opts.topic && opts.topic !== "*" ? topicList().filter(function (t) { return t.id === opts.topic; }) : topicList();
    var out = [];
    topics.forEach(function (t) {
      (t.blocks || []).forEach(function (b) {
        if (opts.types && opts.types.indexOf(b.type) === -1) return;
        if (opts.reuse && !(b.reuse && b.reuse.indexOf(opts.reuse) > -1)) return;
        out.push(Object.assign({ _topic: t.id, _topicTitle: tx(t.title, lng) }, b));
      });
    });
    return out;
  }

  /* ---------- rendering ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function accordionItem(b, lng) {
    var item = el("div", "kb-item");
    var btn = el("button", "kb-q");
    btn.type = "button";
    btn.innerHTML = "<span>" + tx(b.title, lng) + "</span><span class='kb-ic' aria-hidden='true'>＋</span>";
    var ans = el("div", "kb-a", tx(b.body, lng));
    btn.addEventListener("click", function () { item.classList.toggle("is-open"); });
    item.appendChild(btn); item.appendChild(ans);
    return item;
  }

  function renderGroup(type, blocks, lng) {
    var group = el("div", "kb-group");
    group.appendChild(el("p", "kb-group__head", tx(TYPE_LABEL[type], lng)));

    if (type === "guide" || type === "faq") {
      var acc = el("div", "kb-acc");
      blocks.forEach(function (b) { acc.appendChild(accordionItem(b, lng)); });
      group.appendChild(acc);
    } else if (type === "example" || type === "case_study") {
      var cards = el("div", "kb-cards");
      blocks.forEach(function (b) {
        var c = el("div", "kb-card");
        c.appendChild(el("h4", null, tx(b.title, lng)));
        c.appendChild(el("div", null, tx(b.body, lng)));
        cards.appendChild(c);
      });
      group.appendChild(cards);
    } else if (type === "mistake") {
      blocks.forEach(function (b) {
        var items = (b.items && (b.items[lng] || b.items.en)) || null;
        if (items) {
          var ul = el("ul", "kb-mistakes");
          items.forEach(function (m) { ul.appendChild(el("li", null, m)); });
          group.appendChild(ul);
        } else { group.appendChild(el("div", "kb-callout", "<p>" + tx(b.body, lng) + "</p>")); }
      });
    } else if (type === "lender_insight" || type === "broker_tip") {
      blocks.forEach(function (b) {
        var c = el("div", "kb-callout" + (type === "broker_tip" ? " kb-callout--tip" : ""));
        if (b.title) c.appendChild(el("h4", null, tx(b.title, lng)));
        c.appendChild(el("p", null, tx(b.body, lng)));
        group.appendChild(c);
      });
    } else if (type === "download") {
      var dl = el("div", "kb-dl");
      blocks.forEach(function (b) {
        if (b.status === "coming-soon" || !b.url) {
          dl.appendChild(el("span", "kb-soon", "⬇ " + tx(b.title, lng) + "<span class='kb-chip'>" + tx(SOON, lng) + "</span>"));
        } else {
          var a = el("a", null, "⬇ " + tx(b.title, lng)); a.href = b.url; a.setAttribute("download", ""); dl.appendChild(a);
        }
      });
      group.appendChild(dl);
    } else if (type === "video" || type === "ai_rec") {
      var cards2 = el("div", "kb-cards");
      blocks.forEach(function (b) {
        var c = el("div", "kb-card kb-soon");
        c.appendChild(el("h4", null, tx(b.title, lng) + "<span class='kb-chip'>" + tx(SOON, lng) + "</span>"));
        c.appendChild(el("p", null, tx(b.body, lng)));
        cards2.appendChild(c);
      });
      group.appendChild(cards2);
    }
    return group;
  }

  function renderInto(node) {
    css();
    var lng = node.getAttribute("data-kb-lang") || lang();
    var topic = node.getAttribute("data-kb-topic") || "*";
    var typesAttr = node.getAttribute("data-kb-types");
    var types = typesAttr ? typesAttr.split(",").map(function (s) { return s.trim(); }) : null;
    var blocks = getBlocks({ topic: topic, types: types, lang: lng });
    node.innerHTML = "";
    if (!blocks.length) { node.appendChild(el("p", "kb-empty", lng === "fa" ? "محتوای این بخش به‌زودی اضافه می‌شود." : "Content for this section is on the way.")); return; }
    // group by type, in canonical order
    TYPE_ORDER.forEach(function (type) {
      var ofType = blocks.filter(function (b) { return b.type === type; });
      if (ofType.length) { node.appendChild(renderGroup(type, ofType, lng)); }
    });
  }

  function mountAll() { [].forEach.call(document.querySelectorAll("[data-kb]"), renderInto); }

  /* ---------- boot ---------- */
  function ready(cb) { if (READY) cb(KB); else queue.push(cb); }
  function boot() {
    fetch(dataUrl(), { cache: "no-cache" })
      .then(function (r) { return r.json(); })
      .then(function (json) { DATA = json; READY = true; mountAll(); queue.forEach(function (cb) { try { cb(KB); } catch (e) {} }); queue = []; })
      .catch(function () { [].forEach.call(document.querySelectorAll("[data-kb]"), function (n) { n.innerHTML = ""; }); });
  }

  var KB = window.KB = {
    ready: ready,
    topics: topicList,
    topic: getTopic,
    blocks: getBlocks,           // reuse API for Workspace / AI / Portal / Academy
    render: renderInto,
    mountAll: mountAll,
    lang: lang,
    types: TYPE_ORDER.slice()
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
