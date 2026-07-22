/* AI Mortgage Concierge — production widget (Deliverable L + Voice)
   Owner: Hamed Ashouri (M22004433 · FSRA #10530). Track B — Lead Conversion / Marketing Engine.
   Data flow (same pattern as this site's existing strategy.html/assessment.js):
     browser -> S-BRAIN webhook (Claude reply + strict-JSON state; Whisper STT for voice)
     browser -> S-PERSIST webhook (idempotent CRM write) when state.persist === true
   No secret in client. No PII in URL/analytics/storage. Service-inquiry consent only; marketing disabled;
   acknowledgements are DRAFT ONLY (server side); audio retention OFF. */
(function () {
    "use strict";
    var CFG = {
          BRAIN: "https://hook.us2.make.com/xknigwjiuygegeej1arjp61kqmaciqju",
          PERSIST: "https://hook.us2.make.com/3i36t8eo6r99u1grq56589f2xfnawwph",
          DEFAULT_ON: true,
          consentVersion: "ontario_mortgage_concierge_v1.0",
          privacyUrl: "/en/contact.html",
          booking: {
                  phone: "https://blumortgage62-bluimplemen47.zohobookings.ca/portal-embed#/11850000000187029",
                  video: "https://blumortgage62-bluimplemen47.zohobookings.ca/portal-embed#/11850000000187087",
                  inperson: "https://blumortgage62-bluimplemen47.zohobookings.ca/portal-embed#/11850000000187013"
          }
    };
    var q = location.search || "";
    var forceOn = /[?&]concierge=1/.test(q), forceOff = /[?&]concierge=0/.test(q);
    if (forceOff) return;
    if (!CFG.DEFAULT_ON && !forceOn) return;
    var p = (location.pathname || "").toLowerCase();
    if (/(contact|assessment|workspace|login|sign-?in|upload|privacy|portal)/.test(p)) return;
    if (window.__cxConciergeLoaded) return;
    window.__cxConciergeLoaded = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/css/concierge.css";
    document.head.appendChild(link);
    var T = {
          en: {
                  launch: "Have a mortgage question? Let's talk.",
                  greet: "Hi, welcome. How can I help you today?",
                  title: "Mortgage Concierge",
                  sub: "AI assistant · not a live agent",
                  langBtn: "فارسی",
                  placeholder: "Type your message…",
                  book: "Book a consultation",
                  hamed: "Speak with Hamed",
                  disc: "AI assistant — general info only, not mortgage advice.",
                  voiceOn: "Voice: on",
                  voiceOff: "Voice: off",
                  cancel: "Cancel",
                  use: "Use",
                  privacy: 'By continuing you agree to our <a href="#" data-pv="1">privacy notice</a>.',
                  heard: function (t) { return 'I heard: "' + t + '". Is that right, or should I fix anything?'; },
                  booking: "Great — pick what works: ",
                  bphone: "📞 Phone",
                  bvideo: "🎥 Video",
                  binperson: "📍 In-person",
                  micDenied: "I couldn't access the mic. You can type instead — how can I help?",
                  retry: "Sorry — I'm having a brief hiccup. You can try again, or book a time with Hamed and he'll reach out."
          },
          fa: {
                  launch: "سؤال وام مسکن داری؟ با هم بررسی کنیم.",
                  greet: "سلام، خوش اومدید. چه کمکی می‌تونم بهتون بکنم؟",
                  title: "دستیار وام مسکن",
                  sub: "دستیار هوش مصنوعی · نه اپراتور زنده",
                  langBtn: "EN",
                  placeholder: "پیام خود را بنویسید…",
                  book: "رزرو مشاوره",
                  hamed: "صحبت با حامد",
                  disc: "دستیار هوش مصنوعی — فقط اطلاعات عمومی، نه مشاورهٔ وام.",
                  voiceOn: "صدا: روشن",
                  voiceOff: "صدا: خاموش",
                  cancel: "لغو",
                  use: "استفاده",
                  privacy: 'با ادامه دادن، با <a href="#" data-pv="1">اطلاعیهٔ حریم خصوصی</a> ما موافقت می‌کنی.',
                  heard: function (t) { return "این رو شنیدم: «" + t + "». درسته، یا چیزی رو اصلاح کنم؟"; },
                  booking: "عالیه — هرکدوم که راحت‌تری انتخاب کن: ",
                  bphone: "📞 تلفنی",
                  bvideo: "🎥 تصویری",
                  binperson: "📍 حضوری",
                  micDenied: "نتونستم به میکروفون دسترسی پیدا کنم. می‌تونی تایپ کنی — چطور کمکت کنم؟",
                  retry: "ببخشید — یه اختلال کوتاه پیش اومد. می‌تونی دوباره تلاش کنی، یا یه وقت با حامد رزرو کنی تا باهات تماس بگیره."
          }
    };
    function uuid() {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                  var r = (Math.random() * 16) | 0;
                  return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
          });
    }
    function zdt() {
          var d = new Date(), off = -d.getTimezoneOffset(), sg = off >= 0 ? "+" : "-", p = function (n) { return ("0" + n).slice(-2); };
          return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()) + sg + p(Math.floor(Math.abs(off) / 60)) + ":" + p(Math.abs(off) % 60);
    }
    var S = { id: uuid(), lang: null, chosen: false, voiceOn: true, messages: [], known_fields: {}, saveConfirmed: false, attribution: attr() };
    S.submission_id = "MAI-CONCIERGE::" + S.id;
    window.addEventListener("beforeunload", function () { S.messages = []; S.known_fields = {}; });
    function attr() {
          try {
                  var u = new URLSearchParams(location.search);
                  return { original_referrer: document.referrer || "", first_page: location.pathname || "", landing_page: (location.href || "").split("#")[0], utm_source: u.get("utm_source") || "", utm_medium: u.get("utm_medium") || "", utm_campaign: u.get("utm_campaign") || "", utm_term: u.get("utm_term") || "", utm_content: u.get("utm_content") || "", gclid: u.get("gclid") || "", meta_click_id: u.get("fbclid") || "" };
          } catch (e) { return {}; }
    }
    var root = document.createElement("div");
    root.className = "cxw";
    root.setAttribute("dir", "ltr");
    root.innerHTML =
          '<button class="cxw-launch" data-cx="launch" aria-label="Open mortgage concierge"><span class="cx-dot">✦</span><span data-cx="launchText">Have a mortgage question? Let\'s talk.</span></button>' +
          '<section class="cxw-panel" data-cx="panel" role="dialog" aria-label="AI Mortgage Concierge">' +
          '<header class="cx-head"><div class="cx-avatar">✦</div><div class="cx-title"><b data-cx="title">Mortgage Concierge</b><span data-cx="sub">AI assistant · not a live agent</span></div>' +
          '<button data-cx="lang" style="display:none;font-weight:700">فارسی</button><button class="cx-iconbtn" data-cx="min" aria-label="Minimize">—</button><button class="cx-iconbtn" data-cx="close" aria-label="Close">×</button></header>' +
          '<div class="cx-langsel" data-cx="langsel"><h2>Please choose your language<br><span dir="rtl">لطفاً زبان خود را انتخاب کنید</span></h2><p class="cx-sub">AI assistant · general info only, not mortgage advice</p>' +
          '<div class="cx-opts"><button data-lang="fa" dir="rtl">فارسی</button><button data-lang="en">English</button></div></div>' +
          '<div class="cx-body" data-cx="body" aria-live="polite"></div>' +
          '<div class="cx-quick" data-cx="quick"><button data-act="book" data-cx="qbook">Book a consultation</button><button data-act="hamed" data-cx="qhamed">Speak with Hamed</button></div>' +
          '<footer class="cx-foot" data-cx="foot"><div class="cx-recbar" data-cx="recbar"><span class="cx-rt" data-cx="rt">0:00</span><span class="cx-wave"></span><button class="cx-cancel" data-cx="rcancel">Cancel</button><button class="cx-use" data-cx="ruse">Use</button></div>' +
          '<div class="cx-composer"><textarea data-cx="input" rows="1" placeholder="Type your message…" aria-label="Message"></textarea><button class="cx-cbtn cx-mic" data-cx="mic" aria-label="Record a voice note">🎙️</button><button class="cx-cbtn cx-send" data-cx="send" aria-label="Send">➤</button></div>' +
          '<div class="cx-meta"><small data-cx="disc">AI assistant — general info only, not mortgage advice.</small><button class="cx-vtoggle" data-cx="vtoggle">Voice: on</button></div>' +
          '<div class="cx-privacy" data-cx="privacy"></div></footer></section>';
    document.body.appendChild(root);
    var $ = function (n) { return root.querySelector('[data-cx="' + n + '"]'); };
    var panel = $("panel"), launch = $("launch"), body = $("body"), input = $("input"), micBtn = $("mic"), foot = $("foot"), quick = $("quick"), langsel = $("langsel");
    function applyLang() {
          var t = T[S.lang] || T.en, rtl = S.lang === "fa";
          root.setAttribute("dir", rtl ? "rtl" : "ltr");
          $("launchText").textContent = t.launch;
          $("title").textContent = t.title;
          $("sub").textContent = t.sub;
          $("lang").textContent = t.langBtn;
          input.placeholder = t.placeholder;
          $("qbook").textContent = t.book;
          $("qhamed").textContent = t.hamed;
          $("disc").textContent = t.disc;
          micBtn.title = t.micTitle || "";
          $("vtoggle").textContent = S.voiceOn ? t.voiceOn : t.voiceOff;
          $("rcancel").textContent = t.cancel;
          $("ruse").textContent = t.use;
          $("privacy").innerHTML = t.privacy;
    }
    function addMsg(role, text, tts) {
          var w = document.createElement("div");
          w.className = "cx-msg " + (role === "user" ? "cx-user" : "cx-bot");
          var b = document.createElement("div");
          b.className = "cx-b";
          b.textContent = text;
          w.appendChild(b);
          if (role === "bot" && S.voiceOn && tts !== false) {
                  var p = document.createElement("button");
                  p.className = "cx-tts";
                  p.textContent = "🔊";
                  p.setAttribute("aria-label", "Play reply");
                  p.onclick = function () { speak(text); };
                  w.appendChild(p);
          }
          body.appendChild(w);
          body.scrollTop = body.scrollHeight;
          S.messages.push({ role: role, text: text });
    }
    function addBooking() {
          var t = T[S.lang];
          var w = document.createElement("div");
          w.className = "cx-msg cx-bot";
          var b = document.createElement("div");
          b.className = "cx-b";
          b.textContent = t.booking;
          [["phone", t.bphone], ["video", t.bvideo], ["inperson", t.binperson]].forEach(function (k) {
                  var a = document.createElement("a");
                  a.href = CFG.booking[k[0]];
                  a.target = "_blank";
                  a.rel = "noopener";
                  a.className = "cx-book";
                  a.textContent = k[1];
                  b.appendChild(a);
          });
          w.appendChild(b);
          body.appendChild(w);
          body.scrollTop = body.scrollHeight;
    }
    var typingEl = null;
    function typing(on) {
          if (on) {
                  typingEl = document.createElement("div");
                  typingEl.className = "cx-typing";
                  typingEl.innerHTML = "<i></i><i></i><i></i>";
                  body.appendChild(typingEl);
                  body.scrollTop = body.scrollHeight;
          } else if (typingEl) { typingEl.remove(); typingEl = null; }
    }
    function speak(text) {
          if (!S.voiceOn) return;
          try {
                  if ("speechSynthesis" in window) {
                            speechSynthesis.cancel();
                            var u = new SpeechSynthesisUtterance(text);
                            u.lang = S.lang === "fa" ? "fa-IR" : "en-CA";
                            speechSynthesis.speak(u);
                  }
          } catch (e) {}
    }
    function parseState(raw) {
          if (raw && typeof raw === "object") return raw;
          try {
                  var s = String(raw).trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
                  return JSON.parse(s);
          } catch (e) { return { reply: String(raw || "").slice(0, 600) }; }
    }
    function handleSend(text, viaVoice) {
          text = (text || "").trim();
          if (!text) return;
          addMsg("user", text);
          input.value = "";
          auto();
          typing(true);
          callBrain(text, !!viaVoice).then(function (st) {
                  typing(false);
                  addMsg("bot", st.reply || T[S.lang].retry);
                  if (st.booking_offer && st.booking_offer !== "none") addBooking();
                  if (st.persist === true && st.persist_payload) persist(st.persist_payload);
          }).catch(function () { typing(false); addMsg("bot", T[S.lang].retry); });
    }
    function callBrain(text, viaVoice) {
          var payload = { via_voice: viaVoice ? "1" : "0", text: text, form_language: S.lang === "fa" ? "Farsi" : "English", messages: S.messages.slice(-20), known_fields: S.known_fields, session_id: S.id, submission_id: S.submission_id, coarse_source: "Website AI Mortgage Concierge", attribution: S.attribution };
          return fetch(CFG.BRAIN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(function (r) { if (!r.ok) throw new Error("brain"); return r.text(); }).then(function (tx) { var st = parseState(tx); if (st.known_fields) S.known_fields = Object.assign(S.known_fields, st.known_fields); return st; });
    }
    function persist(pl) {
          var full = Object.assign({}, pl, { submission_id: S.submission_id, session_id: S.id, form_language: S.lang === "fa" ? "Farsi" : "English", coarse_source: "Website AI Mortgage Concierge", original_source: "Direct Website", latest_source: "Direct Website", referral_type: pl.referral_type || "None", do_not_contact: false, disclaimer_version: CFG.consentVersion, consent_source_form_id: "MAI-CONCIERGE::" + (pl.email || S.id) + "::" + CFG.consentVersion, consent_timestamp: zdt(), first_page: S.attribution.first_page, landing_page: S.attribution.landing_page, original_referrer: S.attribution.original_referrer, utm_source: S.attribution.utm_source, utm_medium: S.attribution.utm_medium, utm_campaign: S.attribution.utm_campaign, gclid: S.attribution.gclid, fbclid: S.attribution.meta_click_id, booking_status: "offered" });
          return fetch(CFG.PERSIST, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(full) }).then(function (r) { return r.text(); }).then(function (t) { if (/created|updated|alerted/.test(t)) S.saveConfirmed = true; }).catch(function () {});
    }
    var rec = null, chunks = [], timer = null, t0 = 0, pending = null;
    function startRec() {
          var t = T[S.lang];
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { addMsg("bot", t.micDenied); return; }
          navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
                  rec = new MediaRecorder(stream);
                  chunks = [];
                  rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
                  rec.start();
                  micBtn.classList.add("cx-rec");
                  $("recbar").classList.add("cx-show");
                  t0 = Date.now();
                  timer = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); $("rt").textContent = Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }, 250);
          }).catch(function () { addMsg("bot", t.micDenied); });
    }
    function stopRec(useIt) {
          if (!rec) return;
          clearInterval(timer);
          micBtn.classList.remove("cx-rec");
          $("recbar").classList.remove("cx-show");
          var fin = function () {
                  var blob = new Blob(chunks, { type: "audio/webm" });
                  try { rec.stream.getTracks().forEach(function (x) { x.stop(); }); } catch (e) {}
                  rec = null;
                  if (!useIt) return;
                  typing(true);
                  var fd = new FormData();
                  fd.append("audio", blob, "note.webm");
                  fd.append("via_voice", "1");
                  fd.append("session_id", S.id);
                  fd.append("submission_id", S.submission_id);
                  fetch(CFG.BRAIN, { method: "POST", body: fd }).then(function (r) { return r.text(); }).then(function (tx) { typing(false); var st = parseState(tx); var tr = st.transcript || ""; addMsg("bot", T[S.lang].heard(tr)); pending = tr; }).catch(function () { typing(false); addMsg("bot", T[S.lang].retry); });
          };
          if (rec.state !== "inactive") { rec.onstop = fin; rec.stop(); } else fin();
    }
    function auto() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 96) + "px"; }
    function choose(lg) {
          S.lang = lg; S.chosen = true; applyLang();
          langsel.style.display = "none"; body.classList.add("cx-show"); foot.classList.add("cx-show"); quick.classList.add("cx-show");
          $("lang").style.display = ""; addMsg("bot", T[lg].greet); input.focus();
    }
    function open() {
          panel.classList.add("cx-open"); launch.classList.add("cx-hidden");
          if (!S.chosen) { langsel.style.display = "flex"; body.classList.remove("cx-show"); foot.classList.remove("cx-show"); quick.classList.remove("cx-show"); }
    }
    function close() { panel.classList.remove("cx-open"); launch.classList.remove("cx-hidden"); }
    launch.onclick = open;
    $("close").onclick = close;
    $("min").onclick = close;
    langsel.addEventListener("click", function (e) { var b = e.target.closest("button[data-lang]"); if (b) choose(b.getAttribute("data-lang")); });
    $("lang").onclick = function () { S.lang = S.lang === "en" ? "fa" : "en"; applyLang(); };
    $("vtoggle").onclick = function () { S.voiceOn = !S.voiceOn; applyLang(); if (!S.voiceOn && "speechSynthesis" in window) speechSynthesis.cancel(); };
    $("send").onclick = function () { if (pending) { var t = pending; pending = null; handleSend(t, true); } else handleSend(input.value); };
    input.addEventListener("input", auto);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("send").onclick(); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("cx-open")) close(); });
    micBtn.onclick = function () { if (rec) stopRec(true); else startRec(); };
    $("rcancel").onclick = function () { stopRec(false); };
    $("ruse").onclick = function () { stopRec(true); };
    quick.addEventListener("click", function (e) {
          var a = e.target.closest("button");
          if (!a) return;
          if (a.getAttribute("data-act") === "book") { addMsg("user", T[S.lang].book); addBooking(); }
          else { handleSend(S.lang === "fa" ? "می‌خوام با حامد صحبت کنم" : "I want to speak with Hamed"); }
    });
    $("privacy").addEventListener("click", function (e) { if (e.target.getAttribute("data-pv")) { e.preventDefault(); window.open(CFG.privacyUrl, "_blank"); } });
    applyLang();
})();
