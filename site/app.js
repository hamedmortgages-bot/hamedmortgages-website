(function(){"use strict";
var T={"copy":{"en":"Copy","fa":"کپی"},"copied":{"en":"Copied","fa":"کپی شد"},"lPrice":{"en":"Purchase price","fa":"قیمت خرید"},"lValue":{"en":"Estimated property value","fa":"ارزش تقریبی ملک"},"lDown":{"en":"Down payment","fa":"پیش‌پرداخت"},"lBal":{"en":"Current mortgage balance","fa":"مانده مورگیج فعلی"},"lClose":{"en":"Closing date","fa":"تاریخ کلوزینگ"},"lMat":{"en":"Maturity date","fa":"تاریخ سررسید"},"eReq":{"en":"Please complete every field and tick the consent box.","fa":"لطفاً همه قسمت‌ها را پر کنید و تیک موافقت را بزنید."},"eEmail":{"en":"That email address does not look right.","fa":"ایمیل واردشده درست به نظر نمی‌رسد."},"sample":{"en":"Example figures","fa":"عددهای نمونه"},"all":{"en":"All","fa":"همه"},"none":{"en":"Nothing matches that search.","fa":"چیزی با این جست‌وجو پیدا نشد."}};
var root=document.documentElement, lang=root.lang==="fa"?"fa":"en";
function tr(k){ return (T[k]||{})[lang]||k; }
function L(o){ return o[lang]; }
var $=function(id){return document.getElementById(id);};
var mm=function(q){ return !!(window.matchMedia&&matchMedia(q).matches); };
var still=mm("(prefers-reduced-motion: reduce)"), fine=mm("(hover:hover) and (pointer:fine)");
var all=function(s,r){ return [].slice.call((r||document).querySelectorAll(s)); };
/* ---------- ad attribution: keep UTM / click IDs from the landing URL for this visit ---------- */
var ATTR_KEYS=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid"];
var attr=(function(){ var a={}; try{ a=JSON.parse(sessionStorage.getItem("hm_attr")||"{}")||{}; }catch(e){ a={}; }
  var q=new URLSearchParams(location.search), hit=false;
  ATTR_KEYS.forEach(function(k){ var v=q.get(k); if(v){ a[k]=v.slice(0,200); hit=true; } });
  if(!a.original_referrer && document.referrer && document.referrer.indexOf(location.host)<0){ a.original_referrer=document.referrer.slice(0,300); hit=true; }
  if(hit){ try{ sessionStorage.setItem("hm_attr",JSON.stringify(a)); }catch(e){} }
  return a; })();

var cad=new Intl.NumberFormat("en-CA",{style:"currency",currency:"CAD",maximumFractionDigits:0});
function money(n){ return isFinite(n)?cad.format(Math.round(n)):"–"; }
function pct(n,d){ return n.toFixed(d==null?2:d)+"%"; }

/* ---------- mortgage math (Canadian: fixed rates compound semi-annually) ---------- */
function prate(r,ppy){ return Math.pow(1+r/200,2/ppy)-1; }
function pmt(P,r,years,ppy){ ppy=ppy||12; var i=prate(r,ppy),n=years*ppy; return i===0?P/n:P*i/(1-Math.pow(1+i,-n)); }
function pv(pay,r,years){ var i=prate(r,12),n=years*12; return i===0?pay*n:pay*(1-Math.pow(1+i,-n))/i; }
function termSim(P,r,pay,ppy,years){ var i=prate(r,ppy),b=P,int=0; for(var k=0;k<years*ppy&&b>0;k++){ var it=b*i; int+=it; b=Math.max(0,b+it-pay);} return {interest:int,balance:b}; }
function payoffYears(P,r,pay,ppy){ var i=prate(r,ppy),b=P,k=0; while(b>0.01&&k<ppy*80){ b=b*(1+i)-pay; k++; } return k/ppy; }
function minDown(p){ return p>=1500000?p*0.2:(p<=500000?p*0.05:25000+(p-500000)*0.10); }
function premRate(ltv){ if(ltv>95) return null; if(ltv>90) return 4.0; if(ltv>85) return 3.1; if(ltv>80) return 2.8; return 0; }
function bracketTax(p,br){ var t=0,prev=0; for(var i=0;i<br.length;i++){ var top=br[i][0],rate=br[i][1]; if(p>prev){ t+=(Math.min(p,top)-prev)*rate; } prev=top; } return t; }
var ON=[[55000,.005],[250000,.01],[400000,.015],[2000000,.02],[Infinity,.025]];
var TO=[[55000,.005],[250000,.01],[400000,.015],[2000000,.02],[3000000,.025],[4000000,.044],[5000000,.0545],[10000000,.065],[20000000,.0755],[Infinity,.086]];
var AM=[{v:25,en:"25 years",fa:"۲۵ سال"},{v:30,en:"30 years",fa:"۳۰ سال"},{v:20,en:"20 years",fa:"۲۰ سال"},{v:15,en:"15 years",fa:"۱۵ سال"}];
var CALCS=[
{id:"pay",name:{en:"Payment",fa:"قسط"},
 fields:[
  {k:"price",t:"num",d:850000,step:5000,l:{en:"Purchase price",fa:"قیمت خرید"}},
  {k:"down",t:"num",d:170000,step:5000,l:{en:"Down payment",fa:"پیش‌پرداخت"}},
  {k:"rate",t:"num",d:4.29,step:0.01,l:{en:"Interest rate (%)",fa:"نرخ بهره (٪)"}},
  {k:"am",t:"sel",d:25,o:AM,l:{en:"Amortization",fa:"دوره بازپرداخت"}},
  {k:"freq",t:"sel",d:"m",o:[{v:"m",en:"Monthly",fa:"ماهانه"},{v:"b",en:"Bi-weekly",fa:"دو هفته یک‌بار"},{v:"a",en:"Accelerated bi-weekly",fa:"دو هفته یک‌بار تسریع‌شده"}],l:{en:"Payment frequency",fa:"تناوب پرداخت"}}],
 run:function(v){
  var loan=Math.max(0,v.price-v.down), m=pmt(loan,v.rate,v.am,12), pay,ppy;
  if(v.freq==="m"){pay=m;ppy=12;} else if(v.freq==="b"){pay=pmt(loan,v.rate,v.am,26);ppy=26;} else {pay=m/2;ppy=26;}
  var sim=termSim(loan,v.rate,pay,ppy,5), yrs=payoffYears(loan,v.rate,pay,ppy);
  return {big:[{en:"Payment",fa:"مبلغ هر قسط"},money(pay)],rows:[
   [{en:"Mortgage amount",fa:"مبلغ مورگیج"},money(loan)],
   [{en:"Interest over a 5-year term",fa:"بهره در ترم ۵ ساله"},money(sim.interest)],
   [{en:"Balance after 5 years",fa:"مانده بعد از ۵ سال"},money(sim.balance)],
   [{en:"Time to pay off at this payment",fa:"زمان تسویه با این قسط"},yrs.toFixed(1)+(lang==="fa"?" سال":" years")]],
   note:{en:"Excludes default insurance, property tax and condo fees. Use the Down payment calculator if you are putting down less than 20%.",fa:"بیمه مورگیج، مالیات ملک و شارژ کاندو حساب نشده. اگر پیش‌پرداخت شما کمتر از ۲۰٪ است از ماشین‌حساب پیش‌پرداخت استفاده کنید."}};
 }},
{id:"afford",name:{en:"Affordability",fa:"توان خرید"},
 fields:[
  {k:"inc",t:"num",d:165000,step:1000,l:{en:"Household income per year, before tax",fa:"درآمد سالانه خانوار، قبل از مالیات"}},
  {k:"debts",t:"num",d:650,step:50,l:{en:"Monthly debt payments (car, loans, cards)",fa:"قسط ماهانه بدهی‌ها (ماشین، وام، کارت)"}},
  {k:"down",t:"num",d:150000,step:5000,l:{en:"Down payment",fa:"پیش‌پرداخت"}},
  {k:"rate",t:"num",d:4.29,step:0.01,l:{en:"Interest rate (%)",fa:"نرخ بهره (٪)"}},
  {k:"am",t:"sel",d:25,o:[AM[0],AM[1]],l:{en:"Amortization",fa:"دوره بازپرداخت"}},
  {k:"tax",t:"num",d:400,step:25,l:{en:"Property tax per month",fa:"مالیات ملک در ماه"}},
  {k:"heat",t:"num",d:150,step:10,l:{en:"Heating per month",fa:"هزینه گرمایش در ماه"}},
  {k:"condo",t:"num",d:0,step:25,l:{en:"Condo fee per month",fa:"شارژ کاندو در ماه"}}],
 run:function(v){
  var q=Math.max(v.rate+2,5.25), inc=v.inc/12, hous=v.tax+v.heat+0.5*v.condo;
  var g=0.39*inc-hous, t=0.44*inc-hous-v.debts, pi=Math.max(0,Math.min(g,t));
  var maxLoan=pv(pi,q,v.am), base=maxLoan, price=maxLoan+v.down, pr=0;
  if(price>0&&v.down/price<0.2){ pr=4; for(var i=0;i<8;i++){ base=maxLoan/(1+pr/100); price=base+v.down; var r=premRate(base/price*100); pr=(r==null?4:r)+(r&&v.am>25?0.2:0); } }
  var cap=v.down>=300000?v.down/0.2:(v.down<=25000?v.down/0.05:Math.min(1499999,500000+(v.down-25000)/0.10));
  var lim=t<g?{en:"Total debt ratio (TDS 44%)",fa:"نسبت کل بدهی (TDS ۴۴٪)"}:{en:"Housing cost ratio (GDS 39%)",fa:"نسبت هزینه مسکن (GDS ۳۹٪)"};
  if(cap<price){ price=cap; base=price-v.down; lim={en:"Minimum down payment rule",fa:"قانون حداقل پیش‌پرداخت"}; }
  return {big:[{en:"Estimated maximum price",fa:"حداکثر قیمت تقریبی"},money(price)],rows:[
   [{en:"Mortgage before insurance",fa:"مورگیج قبل از بیمه"},money(base)],
   [{en:"Qualifying (stress test) rate",fa:"نرخ استرس تست"},pct(q)],
   [{en:"Payment at your actual rate",fa:"قسط با نرخ واقعی"},money(pmt(base*(1+(v.down/price<0.2?pr:0)/100),v.rate,v.am,12))],
   [{en:"What limits you",fa:"عامل محدودکننده"},L(lim)]],
   note:{en:"Uses 39% GDS and 44% TDS, the limits for insured mortgages. Lenders set their own limits and may allow more or less. Half of the condo fee is counted.",fa:"با GDS ۳۹٪ و TDS ۴۴٪ حساب شده که سقف مورگیج‌های بیمه‌شده است. هر لندر سقف خودش را دارد. نصف شارژ کاندو حساب می‌شود."}};
 }},
{id:"down",name:{en:"Down payment",fa:"پیش‌پرداخت"},
 fields:[
  {k:"price",t:"num",d:780000,step:5000,l:{en:"Purchase price",fa:"قیمت خرید"}},
  {k:"down",t:"num",d:60000,step:1000,l:{en:"Down payment",fa:"پیش‌پرداخت"}},
  {k:"am30",t:"chk",d:false,l:{en:"30-year amortization (first-time buyer or new build)",fa:"بازپرداخت ۳۰ ساله (خریدار بار اول یا خانه نوساز)"}}],
 run:function(v){
  var md=minDown(v.price), base=Math.max(0,v.price-v.down), ltv=v.price>0?base/v.price*100:0, flag=null, pr=0;
  if(v.down<md) flag={en:"This is below the minimum down payment for this price.",fa:"این مبلغ از حداقل پیش‌پرداخت برای این قیمت کمتر است."};
  else if(v.price>=1500000) pr=0; else { var r=premRate(ltv); pr=(r||0)+(r&&v.am30?0.2:0); }
  var prem=base*pr/100;
  return {big:[{en:"Minimum down payment",fa:"حداقل پیش‌پرداخت"},money(md)],rows:[
   [{en:"Your down payment",fa:"پیش‌پرداخت شما"},money(v.down)+" ("+pct(v.price>0?v.down/v.price*100:0,1)+")"],
   [{en:"Loan to value",fa:"نسبت وام به ارزش (LTV)"},pct(ltv,1)],
   [{en:"Insurance premium rate",fa:"نرخ حق بیمه"},pr?pct(pr):(lang==="fa"?"ندارد":"None")],
   [{en:"Premium added to the mortgage",fa:"حق بیمه که به مورگیج اضافه می‌شود"},money(prem)],
   [{en:"Ontario sales tax on the premium, paid at closing",fa:"مالیات فروش انتاریو روی حق بیمه، نقد در کلوزینگ"},money(prem*0.08)],
   [{en:"Total mortgage",fa:"کل مورگیج"},money(base+prem)]],
   flag:flag,
   note:{en:"5% on the first $500,000 and 10% on the rest, up to $1,499,999. Homes at $1.5 million or more need 20% and cannot be insured.",fa:"۵٪ روی ۵۰۰ هزار دلار اول و ۱۰٪ روی بقیه، تا ۱٬۴۹۹٬۹۹۹ دلار. خانه‌های ۱٫۵ میلیون دلار و بالاتر ۲۰٪ پیش‌پرداخت می‌خواهند و بیمه نمی‌شوند."}};
 }},
{id:"close",name:{en:"Closing costs",fa:"هزینه‌های کلوزینگ"},
 fields:[
  {k:"price",t:"num",d:950000,step:5000,l:{en:"Purchase price",fa:"قیمت خرید"}},
  {k:"to",t:"chk",d:true,l:{en:"The property is in the City of Toronto",fa:"ملک در شهر تورنتو است"}},
  {k:"ftb",t:"chk",d:false,l:{en:"I am a first-time home buyer",fa:"خریدار بار اول هستم"}},
  {k:"other",t:"num",d:3500,step:100,l:{en:"Legal fees, title insurance, inspection (your estimate)",fa:"وکیل، بیمه تایتل، بازرسی (برآورد خودتان)"}}],
 run:function(v){
  var on=bracketTax(v.price,ON), to=v.to?bracketTax(v.price,TO):0;
  var rOn=v.ftb?Math.min(4000,on):0, rTo=v.ftb&&v.to?Math.min(4475,to):0, tot=on+to-rOn-rTo+v.other;
  return {big:[{en:"Estimated cash needed at closing",fa:"نقدینگی تقریبی لازم در کلوزینگ"},money(tot)],rows:[
   [{en:"Ontario land transfer tax",fa:"مالیات انتقال ملک انتاریو"},money(on)],
   [{en:"Toronto land transfer tax",fa:"مالیات انتقال ملک تورنتو"},money(to)],
   [{en:"First-time buyer rebates",fa:"تخفیف خریدار بار اول"},"− "+money(rOn+rTo)],
   [{en:"Legal, title, inspection",fa:"وکیل، تایتل، بازرسی"},money(v.other)]],
   note:{en:"Does not include your down payment, the sales tax on an insurance premium, or adjustments your lawyer calculates. Toronto rates are those for closings on or after April 1, 2026.",fa:"پیش‌پرداخت، مالیات فروش روی حق بیمه و تعدیل‌هایی که وکیل حساب می‌کند در این عدد نیست. نرخ‌های تورنتو برای کلوزینگ از اول آوریل ۲۰۲۶ به بعد است."}};
 }},
{id:"pen",name:{en:"Penalty",fa:"جریمه شکستن"},
 fields:[
  {k:"bal",t:"num",d:520000,step:5000,l:{en:"Mortgage balance",fa:"مانده مورگیج"}},
  {k:"rate",t:"num",d:5.49,step:0.01,l:{en:"Your rate (%)",fa:"نرخ شما (٪)"}},
  {k:"type",t:"sel",d:"f",o:[{v:"f",en:"Fixed",fa:"ثابت"},{v:"v",en:"Variable",fa:"متغیر"}],l:{en:"Rate type",fa:"نوع نرخ"}},
  {k:"mo",t:"num",d:22,step:1,l:{en:"Months left in the term",fa:"ماه‌های باقی‌مانده از ترم"}},
  {k:"cmp",t:"num",d:4.19,step:0.01,l:{en:"Lender's current rate for a similar remaining term (%)",fa:"نرخ فعلی لندر برای ترم مشابه باقی‌مانده (٪)"}}],
 run:function(v){
  var three=v.bal*v.rate/100*3/12, ird=v.type==="f"?Math.max(0,v.bal*(v.rate-v.cmp)/100*v.mo/12):0, p=Math.max(three,ird);
  return {big:[{en:"Estimated penalty",fa:"جریمه تقریبی"},money(p)],rows:[
   [{en:"Three months of interest",fa:"بهره سه ماه"},money(three)],
   [{en:"Interest rate differential",fa:"تفاوت نرخ بهره (IRD)"},v.type==="f"?money(ird):(lang==="fa"?"شامل نمی‌شود":"Does not apply")]],
   note:{en:"Fixed mortgages usually charge the greater of the two. Large banks often calculate the differential from posted rates, which can make the real penalty much higher. Ask your lender for a written figure.",fa:"در مورگیج ثابت معمولاً هر کدام بیشتر باشد حساب می‌شود. بانک‌های بزرگ اغلب IRD را از روی نرخ‌های اعلامی حساب می‌کنند و جریمه واقعی می‌تواند خیلی بیشتر باشد. عدد دقیق را کتبی از لندر بگیرید."}};
 }},
{id:"cmp",name:{en:"Refinance or renew",fa:"ریفاینانس یا تمدید"},
 fields:[
  {k:"bal",t:"num",d:480000,step:5000,l:{en:"Mortgage balance",fa:"مانده مورگیج"}},
  {k:"cur",t:"num",d:5.59,step:0.01,l:{en:"Current or offered rate (%)",fa:"نرخ فعلی یا پیشنهادی (٪)"}},
  {k:"nw",t:"num",d:4.24,step:0.01,l:{en:"Alternative rate (%)",fa:"نرخ جایگزین (٪)"}},
  {k:"am",t:"num",d:22,step:1,l:{en:"Years left on the amortization",fa:"سال‌های باقی‌مانده از بازپرداخت"}},
  {k:"term",t:"sel",d:5,o:[{v:5,en:"5-year term",fa:"ترم ۵ ساله"},{v:3,en:"3-year term",fa:"ترم ۳ ساله"},{v:2,en:"2-year term",fa:"ترم ۲ ساله"},{v:1,en:"1-year term",fa:"ترم ۱ ساله"}],l:{en:"Term to compare",fa:"ترم مقایسه"}},
  {k:"cost",t:"num",d:0,step:100,l:{en:"Cost to switch (penalty, legal, appraisal)",fa:"هزینه جابه‌جایی (جریمه، وکیل، ارزیابی)"}}],
 run:function(v){
  var am=Math.max(1,v.am), a=pmt(v.bal,v.cur,am,12), b=pmt(v.bal,v.nw,am,12);
  var ia=termSim(v.bal,v.cur,a,12,v.term).interest, ib=termSim(v.bal,v.nw,b,12,v.term).interest, save=ia-ib, net=save-v.cost;
  var be=save>0&&v.cost>0?Math.ceil(v.cost/(save/(v.term*12))):0;
  return {big:[{en:"Net saving over the term",fa:"صرفه‌جویی خالص در طول ترم"},money(net)],rows:[
   [{en:"Payment at the current rate",fa:"قسط با نرخ فعلی"},money(a)],
   [{en:"Payment at the alternative rate",fa:"قسط با نرخ جایگزین"},money(b)],
   [{en:"Interest saved over the term",fa:"بهره صرفه‌جویی‌شده در ترم"},money(save)],
   [{en:"Months to recover the cost",fa:"ماه‌های لازم برای جبران هزینه"},be?String(be):"–"]],
   note:{en:"Compares the same balance and amortization at two rates. It does not model taking out extra equity.",fa:"یک مانده و یک دوره بازپرداخت را با دو نرخ مقایسه می‌کند. برداشت اکوییتی اضافه در آن حساب نشده."}};
 }}
];
var state={}, cur="pay";
CALCS.forEach(function(c){ state[c.id]={}; c.fields.forEach(function(f){ state[c.id][f.k]=f.d; }); });

function renderPills(){
  var p=$("calcPills"); p.innerHTML="";
  CALCS.forEach(function(c){ var b=document.createElement("button"); b.type="button"; b.className="tab"; b.textContent=L(c.name); b.setAttribute("aria-pressed",c.id===cur); b.onclick=function(){ cur=c.id; renderPills(); renderFields(); }; p.appendChild(b); });
}
function renderFields(){
  var c=CALCS.filter(function(x){return x.id===cur;})[0], box=$("calcFields"); box.innerHTML="";
  var tag=document.createElement("span"); tag.className="sample"; tag.textContent=tr("sample"); box.appendChild(tag);
  c.fields.forEach(function(f){
    var id="c_"+c.id+"_"+f.k, w;
    if(f.t==="chk"){
      w=document.createElement("label"); w.className="check";
      var i=document.createElement("input"); i.type="checkbox"; i.id=id; i.checked=!!state[c.id][f.k];
      i.onchange=function(){ state[c.id][f.k]=i.checked; renderOut(); };
      var s=document.createElement("span"); s.textContent=L(f.l); w.appendChild(i); w.appendChild(s);
    } else {
      w=document.createElement("div"); w.className="f";
      var lb=document.createElement("label"); lb.htmlFor=id; lb.textContent=L(f.l); w.appendChild(lb);
      var el;
      if(f.t==="sel"){ el=document.createElement("select"); f.o.forEach(function(o){ var op=document.createElement("option"); op.value=o.v; op.textContent=L(o); el.appendChild(op); }); el.value=state[c.id][f.k];
        el.onchange=function(){ var raw=el.value; state[c.id][f.k]=isNaN(+raw)?raw:+raw; renderOut(); }; }
      else { el=document.createElement("input"); el.type="number"; el.min="0"; el.step=f.step; el.inputMode="decimal"; el.value=state[c.id][f.k];
        el.oninput=function(){ var n=parseFloat(el.value); state[c.id][f.k]=isFinite(n)&&n>=0?n:0; renderOut(); }; }
      el.id=id; w.appendChild(el);
    }
    box.appendChild(w);
  });
  renderOut();
}
function renderOut(){
  var c=CALCS.filter(function(x){return x.id===cur;})[0], r=c.run(state[c.id]), o=$("calcOut");
  var h='<div class="big"><span>'+L(r.big[0])+'</span><b class="num">'+r.big[1]+'</b></div>';
  r.rows.forEach(function(x){ h+='<div class="row"><span>'+L(x[0])+'</span><b class="num">'+x[1]+'</b></div>'; });
  if(r.flag) h+='<p class="flag">'+L(r.flag)+'</p>';
  h+='<p class="note">'+L(r.note)+'</p>';
  o.innerHTML=h;
}
/* ---------- calculators page ---------- */
if($("calcPills")){
  var pick=function(){ var h=(location.hash||"").slice(1); if(state[h]) cur=h; renderPills(); renderFields(); };
  pick(); window.addEventListener("hashchange",pick);
}
/* ---------- home: live payment teaser ---------- */
if($("mini")){
  var mo=$("mOut"), shown=0, goal=0, run=false;
  var step=function(){ shown+=(goal-shown)*0.2; if(Math.abs(goal-shown)<1){ shown=goal; run=false; } mo.textContent=money(shown); if(run) requestAnimationFrame(step); };
  var mini=function(){ var p=+$("mPrice").value||0, d=+$("mDown").value||0, r=+$("mRate").value||0; goal=pmt(Math.max(0,p-d),r,25,12); if(!isFinite(goal)) goal=0;
    if(still){ shown=goal; mo.textContent=money(goal); } else if(!run){ run=true; requestAnimationFrame(step); } };
  ["mPrice","mDown","mRate"].forEach(function(id){ $(id).addEventListener("input",mini); });
  if(still||!("IntersectionObserver" in window)) mini();
  else { var mio=new IntersectionObserver(function(es){ if(es[0].isIntersecting){ mini(); mio.disconnect(); } },{threshold:0.4}); mio.observe($("mini")); }
}
/* ---------- knowledge bank ---------- */
if($("kbList")){
var TOPICS=[["all",{en:"All",fa:"همه"}],["buying",{en:"Buying",fa:"خرید"}],["refinancing",{en:"Refinancing",fa:"ریفاینانس"}],["renewing",{en:"Renewing",fa:"تمدید"}],["complex",{en:"Self-employed & investors",fa:"خویش‌فرما و سرمایه‌گذار"}],["terms",{en:"Key terms",fa:"اصطلاحات"}]];
var KB=[
["buying",{en:["How much down payment do I need?","At least 5% of the first $500,000 and 10% of the amount above that, for homes under $1.5 million. Homes at $1.5 million or more need 20%. A property you will not live in generally needs 20% as well."],fa:["چقدر پیش‌پرداخت لازم دارم؟","حداقل ۵٪ از ۵۰۰ هزار دلار اول و ۱۰٪ از مبلغ بالاتر، برای خانه‌های زیر ۱٫۵ میلیون دلار. خانه‌های ۱٫۵ میلیون و بالاتر ۲۰٪ می‌خواهند. ملکی که خودتان در آن زندگی نمی‌کنید هم معمولاً ۲۰٪ لازم دارد."]}],
["buying",{en:["What is mortgage default insurance?","If you put down less than 20%, the lender must insure the mortgage through CMHC, Sagen or Canada Guaranty. The premium is 2.8% to 4% of the loan depending on your down payment and is added to the mortgage. In Ontario you pay 8% sales tax on the premium in cash at closing."],fa:["بیمه مورگیج چیست؟","اگر پیش‌پرداخت شما کمتر از ۲۰٪ باشد، لندر باید مورگیج را نزد CMHC، Sagen یا Canada Guaranty بیمه کند. حق بیمه بسته به پیش‌پرداخت ۲٫۸٪ تا ۴٪ مبلغ وام است و به مورگیج اضافه می‌شود. در انتاریو ۸٪ مالیات فروش روی حق بیمه را نقد در کلوزینگ می‌پردازید."]}],
["buying",{en:["Pre-qualification or pre-approval: what is the difference?","A pre-qualification is an estimate based on the information and documents you provide. A pre-approval comes from a lender after it reviews your file and credit, and usually holds a rate for a set period. Neither is a final approval, which also depends on the property."],fa:["پری‌کوالیفیکیشن با پری‌اپروال چه فرقی دارد؟","پری‌کوالیفیکیشن برآوردی است بر اساس اطلاعات و مدارکی که می‌دهید. پری‌اپروال را لندر بعد از بررسی پرونده و کردیت شما صادر می‌کند و معمولاً نرخ را برای مدت مشخصی نگه می‌دارد. هیچ‌کدام تأیید نهایی نیست، چون تأیید نهایی به خود ملک هم بستگی دارد."]}],
["buying",{en:["What help is there for first-time buyers?","The First Home Savings Account lets you contribute $8,000 a year up to $40,000, deduct it from income, and withdraw it tax-free for a first home. The Home Buyers' Plan lets you withdraw up to $60,000 from an RRSP and repay it over 15 years. Ontario refunds up to $4,000 of land transfer tax and Toronto up to $4,475."],fa:["خریدار بار اول چه کمک‌هایی دارد؟","حساب FHSA اجازه می‌دهد سالی ۸٬۰۰۰ دلار تا سقف ۴۰٬۰۰۰ دلار واریز کنید، آن را از درآمد کم کنید و برای خانه اول بدون مالیات برداشت کنید. طرح HBP اجازه می‌دهد تا ۶۰٬۰۰۰ دلار از RRSP بردارید و در ۱۵ سال برگردانید. انتاریو تا ۴٬۰۰۰ دلار و تورنتو تا ۴٬۴۷۵ دلار از مالیات انتقال ملک را برمی‌گرداند."]}],
["buying",{en:["Can I get a 30-year amortization?","With 20% down, most lenders offer 30 years. With less than 20% down, 30 years is available to first-time buyers and to anyone buying a newly built home, with a 0.20% higher insurance premium. Otherwise the insured maximum is 25 years."],fa:["می‌توانم بازپرداخت ۳۰ ساله بگیرم؟","با ۲۰٪ پیش‌پرداخت، بیشتر لندرها ۳۰ سال می‌دهند. با کمتر از ۲۰٪، بازپرداخت ۳۰ ساله برای خریدار بار اول و برای خرید خانه نوساز در دسترس است و حق بیمه ۰٫۲۰٪ بیشتر می‌شود. در غیر این صورت سقف مورگیج بیمه‌شده ۲۵ سال است."]}],
["buying",{en:["What are closing costs?","Budget roughly 1.5% to 4% of the price on top of your down payment. The largest item is land transfer tax, and Toronto buyers pay a second municipal tax. Add legal fees, title insurance, an inspection, and sales tax on any insurance premium."],fa:["هزینه‌های کلوزینگ چیست؟","حدود ۱٫۵٪ تا ۴٪ قیمت خانه را جدا از پیش‌پرداخت کنار بگذارید. بزرگ‌ترین قلم مالیات انتقال ملک است و خریداران تورنتو یک مالیات شهری دوم هم می‌پردازند. هزینه وکیل، بیمه تایتل، بازرسی و مالیات فروش روی حق بیمه را هم اضافه کنید."]}],
["buying",{en:["Which documents will I be asked for?","Usually government ID, a recent pay stub and employment letter, two years of T4s or Notices of Assessment, 90 days of statements showing your down payment, and the purchase agreement and listing once you have a property. Self-employed borrowers are asked for more."],fa:["چه مدارکی از من خواسته می‌شود؟","معمولاً مدرک شناسایی، آخرین فیش حقوقی و نامه کار، T4 یا NOA دو سال اخیر، صورت‌حساب ۹۰ روزه که پیش‌پرداخت را نشان بدهد، و بعد از پیدا کردن ملک، قرارداد خرید و لیستینگ. از افراد خویش‌فرما مدارک بیشتری خواسته می‌شود."]}],
["terms",{en:["What is the stress test?","Federally regulated lenders must check that you could still afford the payments at a higher rate: your contract rate plus 2%, or 5.25%, whichever is greater. It lowers the amount you qualify for, not the payment you actually make."],fa:["استرس تست چیست؟","لندرهای تحت نظارت فدرال باید بسنجند که با نرخ بالاتر هم از پس قسط برمی‌آیید: نرخ قرارداد به‌اضافه ۲٪، یا ۵٫۲۵٪، هر کدام بیشتر باشد. استرس تست مبلغی را که واجد شرایطش هستید کم می‌کند، نه قسط واقعی شما را."]}],
["terms",{en:["What are GDS and TDS?","Gross Debt Service is your housing cost (mortgage payment, property tax, heat and half of condo fees) as a share of gross income. Total Debt Service adds your other debt payments. For insured mortgages the limits are 39% and 44%."],fa:["GDS و TDS چیست؟","GDS سهم هزینه مسکن (قسط مورگیج، مالیات ملک، گرمایش و نصف شارژ کاندو) از درآمد ناخالص است. TDS قسط بدهی‌های دیگر را هم اضافه می‌کند. سقف این دو برای مورگیج بیمه‌شده ۳۹٪ و ۴۴٪ است."]}],
["terms",{en:["Term and amortization: what is the difference?","The amortization is the total time to pay the mortgage off, often 25 or 30 years. The term is the length of your current contract and rate, often 5 years. At the end of each term you renew, switch lenders or pay the balance."],fa:["ترم با دوره بازپرداخت چه فرقی دارد؟","دوره بازپرداخت (amortization) کل زمان تسویه مورگیج است، معمولاً ۲۵ یا ۳۰ سال. ترم طول قرارداد و نرخ فعلی شماست، معمولاً ۵ سال. آخر هر ترم یا تمدید می‌کنید، یا لندر را عوض می‌کنید، یا مانده را می‌پردازید."]}],
["terms",{en:["Fixed or variable rate?","A fixed rate and payment stay the same for the term. A variable rate moves with the lender's prime rate, so your cost can rise or fall. Variable mortgages usually have a smaller penalty to break: three months of interest."],fa:["نرخ ثابت یا متغیر؟","در نرخ ثابت، نرخ و قسط تا آخر ترم عوض نمی‌شود. نرخ متغیر با نرخ پرایم لندر بالا و پایین می‌رود و هزینه شما می‌تواند کم یا زیاد شود. جریمه شکستن مورگیج متغیر معمولاً کمتر است: بهره سه ماه."]}],
["terms",{en:["What are A lenders, B lenders and private lenders?","A lenders are banks, credit unions and monoline lenders with the lowest rates and the strictest rules. B or alternative lenders accept income or credit that A lenders decline, at higher rates and usually with a fee. Private lenders lend mainly on the equity in the property, for short terms and at the highest cost."],fa:["لندر A، لندر B و لندر پرایوت یعنی چه؟","لندرهای A بانک‌ها، کردیت یونیون‌ها و لندرهای مونولاین هستند با کمترین نرخ و سخت‌ترین قوانین. لندرهای B یا آلترنتیو درآمد یا کردیتی را قبول می‌کنند که لندر A رد می‌کند، با نرخ بالاتر و معمولاً یک کارمزد. لندرهای پرایوت بیشتر بر اساس اکوییتی ملک وام می‌دهند، برای مدت کوتاه و با بیشترین هزینه."]}],
["terms",{en:["What are prepayment privileges?","Most closed mortgages let you pay extra each year without penalty, commonly 10% to 20% of the original balance, and raise your regular payment by a similar share. Using them shortens the amortization and lowers the interest you pay."],fa:["امتیاز پیش‌پرداخت اضافه چیست؟","بیشتر مورگیج‌های بسته اجازه می‌دهند هر سال بدون جریمه مبلغ اضافه بپردازید، معمولاً ۱۰٪ تا ۲۰٪ مبلغ اولیه وام، و قسط را هم به همین نسبت بالا ببرید. استفاده از این امتیاز دوره بازپرداخت را کوتاه و بهره را کم می‌کند."]}],
["refinancing",{en:["How much can I borrow when I refinance?","Up to 80% of the home's appraised value, minus what you still owe. A refinance cannot be insured, so it follows uninsured rates and rules, and you have to pass the stress test again."],fa:["در ریفاینانس چقدر می‌توانم وام بگیرم؟","تا ۸۰٪ ارزش ارزیابی‌شده خانه، منهای بدهی فعلی. ریفاینانس بیمه نمی‌شود، پس نرخ و قوانین مورگیج بیمه‌نشده را دارد و باید دوباره از استرس تست رد شوید."]}],
["refinancing",{en:["What does it cost to break my mortgage?","A variable mortgage usually costs three months of interest. A fixed mortgage costs the greater of three months of interest or the interest rate differential, which can be large when rates have fallen since you signed. Add a discharge fee, legal costs and sometimes an appraisal."],fa:["شکستن مورگیج چقدر هزینه دارد؟","مورگیج متغیر معمولاً بهره سه ماه جریمه دارد. در مورگیج ثابت، بین بهره سه ماه و تفاوت نرخ بهره (IRD) هر کدام بیشتر باشد حساب می‌شود، و اگر نرخ‌ها از زمان امضا پایین آمده باشند IRD می‌تواند بزرگ باشد. هزینه دیسچارج، وکیل و گاهی ارزیابی را هم اضافه کنید."]}],
["refinancing",{en:["Refinance or home equity line of credit?","A refinance gives you a lump sum at mortgage rates with a fixed repayment schedule. A HELOC is a revolving line you draw as needed, usually at a higher variable rate. The revolving portion is limited to 65% of the home's value, and the mortgage and HELOC together to 80%."],fa:["ریفاینانس یا خط اعتباری خانه (HELOC)؟","ریفاینانس مبلغ یک‌جا با نرخ مورگیج و برنامه بازپرداخت مشخص می‌دهد. HELOC خط اعتباری چرخشی است که هر وقت لازم شد برداشت می‌کنید، معمولاً با نرخ متغیر بالاتر. بخش چرخشی تا ۶۵٪ ارزش خانه و مجموع مورگیج و HELOC تا ۸۰٪ محدود است."]}],
["renewing",{en:["When should I start on my renewal?","Four to six months before the maturity date. Many lenders will hold a rate for 120 days, which gives you time to compare your lender's offer with others before you sign."],fa:["از کی باید سراغ تمدید بروم؟","چهار تا شش ماه قبل از تاریخ سررسید. خیلی از لندرها نرخ را ۱۲۰ روز نگه می‌دارند و این به شما وقت می‌دهد پیشنهاد لندر خودتان را قبل از امضا با بقیه مقایسه کنید."]}],
["renewing",{en:["Do I have to pass the stress test to switch lenders at renewal?","Not for a straight switch, where the balance and amortization stay the same. Insured mortgages were already exempt, and since November 21, 2024 federally regulated lenders no longer have to apply the test to uninsured straight switches. Adding money or extending the amortization brings the test back."],fa:["برای عوض کردن لندر در زمان تمدید باید استرس تست بدهم؟","برای جابه‌جایی ساده که مانده و دوره بازپرداخت عوض نمی‌شود، نه. مورگیج‌های بیمه‌شده از قبل معاف بودند و از ۲۱ نوامبر ۲۰۲۴ لندرهای فدرال دیگر مجبور نیستند برای جابه‌جایی ساده مورگیج بیمه‌نشده هم استرس تست بگیرند. اگر مبلغ اضافه بگیرید یا دوره را طولانی‌تر کنید، استرس تست برمی‌گردد."]}],
["renewing",{en:["Should I just sign my lender's renewal letter?","Compare first. The letter is an opening offer and is often not the lender's best rate. Renewal is also the one time you can change lender, term or payment schedule without a penalty."],fa:["نامه تمدید لندر را همین‌طوری امضا کنم؟","اول مقایسه کنید. این نامه پیشنهاد اول است و اغلب بهترین نرخ لندر نیست. تمدید تنها زمانی است که می‌توانید بدون جریمه لندر، ترم یا برنامه پرداخت را عوض کنید."]}],
["complex",{en:["How do lenders look at self-employed income?","A lenders usually average the income on your last two years of tax returns and Notices of Assessment, and may add back some business deductions. If your declared income is low, alternative lenders can use bank statements or a stated-income program, generally with a larger down payment and a higher rate."],fa:["لندرها درآمد خویش‌فرما را چطور حساب می‌کنند؟","لندرهای A معمولاً میانگین درآمد دو سال اخیر در اظهارنامه مالیاتی و NOA را می‌گیرند و ممکن است بعضی هزینه‌های بیزنسی را دوباره به درآمد اضافه کنند. اگر درآمد اظهاری پایین باشد، لندرهای آلترنتیو می‌توانند از صورت‌حساب بانکی یا برنامه درآمد اظهاری استفاده کنند، معمولاً با پیش‌پرداخت بیشتر و نرخ بالاتر."]}],
["complex",{en:["What changes when I buy a rental property?","A property you will not live in needs at least 20% down and cannot be insured. Lenders count only part of the rent, and each has its own method, so the same property can qualify with one lender and not with another."],fa:["برای خرید ملک اجاره‌ای چه چیزی فرق می‌کند؟","ملکی که خودتان در آن زندگی نمی‌کنید حداقل ۲۰٪ پیش‌پرداخت می‌خواهد و بیمه نمی‌شود. لندرها فقط بخشی از اجاره را حساب می‌کنند و هر کدام روش خودشان را دارند؛ برای همین یک ملک ممکن است با یک لندر تأیید شود و با لندر دیگر نه."]}],
["complex",{en:["My bank declined me. What now?","A decline at one lender is not a decline everywhere. The usual reasons are income that is hard to document, debt ratios, credit history or the property itself. Each has a different fix: another lender, a different structure, a co-applicant, or a short-term solution with a plan to move back to a lower rate."],fa:["بانک درخواستم را رد کرده. حالا چه کنم؟","رد شدن در یک لندر به معنی رد شدن در همه نیست. دلیل معمولاً یکی از این‌هاست: درآمدی که اثباتش سخت است، نسبت بدهی، سابقه کردیت یا خود ملک. هر کدام راه‌حل خودش را دارد: لندر دیگر، ساختار متفاوت، کو-اپلیکنت، یا یک راه‌حل کوتاه‌مدت با برنامه برگشت به نرخ پایین‌تر."]}]
];
var topic="all", query="";
function renderKbPills(){
  var p=$("kbPills"); p.innerHTML="";
  TOPICS.forEach(function(t){ var b=document.createElement("button"); b.type="button"; b.className="tab"; b.textContent=L(t[1]); b.setAttribute("aria-pressed",t[0]===topic); b.onclick=function(){ topic=t[0]; renderKbPills(); renderKb(); }; p.appendChild(b); });
}
function renderKb(){
  var box=$("kbList"), q=query.trim().toLowerCase(), names={}; TOPICS.forEach(function(t){names[t[0]]=L(t[1]);});
  var hit=KB.filter(function(e){ if(topic!=="all"&&e[0]!==topic) return false; if(!q) return true; return (e[1].en.join(" ")+" "+e[1].fa.join(" ")).toLowerCase().indexOf(q)>=0; });
  if(!hit.length){ box.innerHTML='<p class="empty">'+tr("none")+'</p>'; return; }
  box.innerHTML=""; hit.forEach(function(e){
    var d=document.createElement("details"), s=document.createElement("summary"), a=document.createElement("span"), i=document.createElement("i"), p=document.createElement("p");
    a.textContent=e[1][lang][0]; i.textContent=names[e[0]]; p.textContent=e[1][lang][1];
    s.appendChild(a); s.appendChild(i); d.appendChild(s); d.appendChild(p); box.appendChild(d);
  });
}
  $("kbSearch").addEventListener("input",function(){ query=this.value; renderKb(); });
  renderKbPills(); renderKb();
}
/* ---------- start form (unchanged from the approved draft) ---------- */
if($("intake")){
var NEED=[["purchase",{en:"Buy a home",fa:"خرید خانه"}],["refinance",{en:"Refinance",fa:"ریفاینانس"}],["renewal",{en:"Renew or switch lender",fa:"تمدید یا تغییر لندر"}],["equity",{en:"Take equity out",fa:"برداشت اکوییتی"}],["explore",{en:"Find out what I qualify for",fa:"می‌خواهم بدانم چقدر می‌توانم بگیرم"}]];
var TIME=[["offer",{en:"I have an accepted offer",fa:"آفر قبول‌شده دارم"}],["looking",{en:"I am actively looking",fa:"فعالانه دنبال خانه هستم"}],["norush",{en:"No rush",fa:"عجله‌ای ندارم"}]];
var TIME2=[["soon",{en:"Within 30 days",fa:"ظرف ۳۰ روز"}],["months",{en:"In 1 to 4 months",fa:"۱ تا ۴ ماه دیگر"}],["norush",{en:"No rush",fa:"عجله‌ای ندارم"}]];
var CREDIT=[["excellent",{en:"Excellent",fa:"عالی"}],["good",{en:"Good",fa:"خوب"}],["fair",{en:"Fair",fa:"متوسط"}],["weak",{en:"Weak",fa:"ضعیف"}]];
function fill(sel,list){ var keep=sel.value; sel.innerHTML=""; list.forEach(function(o){ var op=document.createElement("option"); op.value=o[0]; op.textContent=L(o[1]); sel.appendChild(op); }); if(list.some(function(o){return o[0]===keep;})) sel.value=keep; }
function syncForm(){
  var need=$("qNeed").value||"purchase", buy=need==="purchase"||need==="explore";
  fill($("qTime"),buy?TIME:TIME2);
  $("qValueL").textContent=tr(buy?"lPrice":"lValue");
  $("qDownL").textContent=tr(buy?"lDown":"lBal");
  var t=$("qTime").value, showDate=(buy&&t==="offer")||need==="renewal";
  $("dateWrap").hidden=!showDate; $("qDateL").textContent=tr(need==="renewal"?"lMat":"lClose");
}
$("qNeed").addEventListener("change",syncForm); $("qTime").addEventListener("change",syncForm);
$("intake").addEventListener("submit",function(ev){
  ev.preventDefault(); var err=$("formErr"), ok=true;
  ["qName","qMobile","qEmail","qValue","qDown","qIncome"].forEach(function(id){ if(!$(id).value.trim()) ok=false; });
  if(!$("qConsent").checked) ok=false;
  if(!ok){ err.textContent=tr("eReq"); err.hidden=false; return; }
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($("qEmail").value.trim())){ err.textContent=tr("eEmail"); err.hidden=false; $("qEmail").focus(); return; }
  err.hidden=true;
  var f=this, btn=f.querySelector('[type="submit"]'); if(f.dataset.sending) return; f.dataset.sending="1"; if(btn) btn.disabled=true;
  var val=function(id){ return $(id)?$(id).value.trim():""; };
  var isFa=document.documentElement.lang==="fa"||location.pathname.indexOf("/fa/")===0;
  var need=val("qNeed"), buy=need==="purchase"||need==="explore";
  var nm=val("qName").replace(/\s+/g," "), parts=nm.split(" ");
  var last=parts[parts.length-1], first=parts.length>1?parts.slice(0,-1).join(" "):"";
  var sid="WEB2-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
  var showDate=$("dateWrap")&&!$("dateWrap").hidden;
  var desc=["Website Start form (v2)","Need: "+need,"Timing: "+val("qTime"),
    (need==="renewal"?"Maturity date: ":"Closing date: ")+(showDate?val("qDate"):"-"),
    (buy?"Purchase price: ":"Property value: ")+val("qValue"),
    (buy?"Down payment: ":"Current mortgage balance: ")+val("qDown"),
    "Income: "+val("qIncome"),"Credit: "+val("qCredit"),"Referred by: "+(val("qRef")||"-"),
    "Form language: "+(isFa?"Farsi":"English"),"Consent to contact: yes (ticked on the form)"].join("\n");
  var p=new URLSearchParams();
  var put=function(k,v){ p.append(k,v); };
  put("event_version","1"); put("journey","Start form"); put("feature","Start form");
  put("source","Website v2 — Start form"); put("action","submit_start_form");
  put("timestamp",new Date().toISOString().replace(/\.\d{3}Z$/,"+00:00"));
  put("fullName",nm); put("firstName",first); put("lastName",last);
  put("email",val("qEmail")); put("phone",val("qMobile"));
  put("language",isFa?"fa":"en"); put("form_language",isFa?"Farsi":"English");
  put("pageUrl",location.origin+location.pathname);
  put("purpose",need); put("timeline",val("qTime")); put("description",desc);
  put("platform_runtime_version","2.0"); put("platform_event_id",sid); put("submission_id",sid);
  put("crm_idempotency_key",sid); put("crm_requested_action","MATCH_THEN_CREATE_OR_UPDATE");
  ATTR_KEYS.concat(["original_referrer"]).forEach(function(k){ if(attr[k]) put(k,attr[k]); });
  put("qualification_class","NOT_ASSESSED"); put("qualification_urgency","NOT_ASSESSED");
  put("underwriting_decision","NOT_PERFORMED"); put("service_inquiry_consent","true");
  fetch("https://hook.us2.make.com/9qpdbyg38vosk57dqrdm4eomajt1x8rr",{method:"POST",mode:"no-cors",body:p}).then(function(){
    if(window.fbq) fbq("track","Lead",{},{eventID:sid});
    f.hidden=true; $("done").hidden=false; $("done").scrollIntoView({block:"center"});
  }).catch(function(){
    delete f.dataset.sending; if(btn) btn.disabled=false;
    err.textContent=isFa?"ارسال نشد. لطفاً دوباره امتحان کنید یا با ‎(416) 856-8148 تماس بگیرید.":"This could not be sent. Please try again, or call (416) 856-8148.";
    err.hidden=false;
  });
});
$("intake").addEventListener("input",function(){ $("formErr").hidden=true; });
  fill($("qNeed"),NEED); fill($("qCredit"),CREDIT); $("qCredit").value="good"; syncForm();
}
/* ---------- copy buttons ---------- */
all("[data-copy]").forEach(function(b){ b.addEventListener("click",function(){
  var el=$(b.getAttribute("data-copy")), txt=el.textContent;
  var done=function(){ b.textContent=tr("copied"); setTimeout(function(){ b.textContent=tr("copy"); },1500); };
  var sel=function(){ var r=document.createRange(); r.selectNodeContents(el); var s=getSelection(); s.removeAllRanges(); s.addRange(r); };
  try{ navigator.clipboard.writeText(txt).then(done,sel); }catch(e){ sel(); }
}); });

/* ---------- header, menu, progress ---------- */
var topEl=$("top"), bar=$("bar");
function closeMenu(){ topEl.classList.remove("open"); $("burger").setAttribute("aria-expanded","false"); }
$("burger").addEventListener("click",function(){ var o=topEl.classList.toggle("open"); this.setAttribute("aria-expanded",o?"true":"false"); });
document.addEventListener("keydown",function(e){ if(e.key==="Escape") closeMenu(); });

/* ---------- hero: the portrait and the two doors stand at different depths ---------- */
var rig=$("rig"), stage=$("stage"), dz=all(".dz"), px=0, py=0, ticking=false;
function frame(){
  ticking=false;
  var y=window.pageYOffset||0, vh=window.innerHeight||800, max=Math.max(1,root.scrollHeight-vh);
  topEl.classList.toggle("solid",y>30);
  bar.style.transform="scaleX("+Math.min(1,y/max).toFixed(4)+")";
  if(still||!rig||y>vh*1.3) return;
  var p=y/vh;
  rig.style.transform="rotateX("+(py*-5+p*8).toFixed(2)+"deg) rotateY("+(px*8-p*10).toFixed(2)+"deg)";
  dz.forEach(function(f){ var z=+f.getAttribute("data-z"), s=+f.getAttribute("data-s"); f.style.transform="translate3d(0,"+(-y*0.12*s).toFixed(1)+"px,"+(z+p*z*1.2).toFixed(1)+"px)"; });
}
function ask(){ if(!ticking){ ticking=true; requestAnimationFrame(frame); } }
window.addEventListener("scroll",ask,{passive:true}); window.addEventListener("resize",ask);
if(rig&&!still&&fine){
  var hero=$("home");
  hero.addEventListener("pointermove",function(e){ var r=stage.getBoundingClientRect(); px=Math.max(-1,Math.min(1,(e.clientX-(r.left+r.width/2))/r.width)); py=Math.max(-1,Math.min(1,(e.clientY-(r.top+r.height/2))/r.height)); ask(); });
  hero.addEventListener("pointerleave",function(){ px=0; py=0; ask(); });
}
if(still) all(".hero-bg video").forEach(function(v){ v.removeAttribute("autoplay"); v.pause(); });

/* ---------- cards tilt toward the pointer; a card with a clip plays it ---------- */
function loadClip(v){ if(!v.getAttribute("src")){ v.src=v.getAttribute("data-src"); v.addEventListener("playing",function(){ v.classList.add("on"); },{once:true}); } }
function play(v){ if(still) return; loadClip(v); var p=v.play(); if(p&&p.catch) p.catch(function(){}); }
all("[data-tilt]").forEach(function(c){
  var v=c.querySelector("video[data-src]");
  if(fine&&!still){
    c.addEventListener("pointermove",function(e){ var r=c.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-0.5, y=(e.clientY-r.top)/r.height-0.5;
      c.style.transform="perspective(900px) rotateX("+(-y*7).toFixed(2)+"deg) rotateY("+(x*9).toFixed(2)+"deg) translateY(-4px)";
      c.style.setProperty("--mx",((x+0.5)*100).toFixed(1)+"%"); c.style.setProperty("--my",((y+0.5)*100).toFixed(1)+"%"); });
    c.addEventListener("pointerleave",function(){ c.style.transform=""; });
  }
  if(!v) return;
  if(fine&&!v.hasAttribute("data-auto")){
    c.addEventListener("pointerenter",function(){ play(v); });
    c.addEventListener("pointerleave",function(){ v.pause(); });
    c.addEventListener("focus",function(){ play(v); }); c.addEventListener("blur",function(){ v.pause(); });
  } else if("IntersectionObserver" in window){
    new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) play(v); else v.pause(); }); },{threshold:0.6}).observe(c);
  }
});

/* clips that sit outside a tilt card (the wide band on service pages) play when in view */
all("video[data-auto]").forEach(function(v){
  if(v.closest("[data-tilt]")||!("IntersectionObserver" in window)) return;
  new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) play(v); else v.pause(); }); },{threshold:0.3}).observe(v.parentNode);
});

/* ---------- sections rise in on scroll; numbers count up ---------- */
function countUp(b){ var to=+b.getAttribute("data-count"), t0=performance.now(); (function s(){ var k=Math.min(1,(performance.now()-t0)/900); b.textContent=Math.round(to*k); if(k<1) requestAnimationFrame(s); })(); }
(function(){
  if(still||!("IntersectionObserver" in window)) return;
  var io=new IntersectionObserver(function(es){ var n=0; es.forEach(function(e){ if(!e.isIntersecting) return;
    var el=e.target; el.style.transitionDelay=(n++*0.07).toFixed(2)+"s"; el.classList.remove("wait");
    setTimeout(function(){ el.style.transitionDelay=""; },1300);
    var c=el.querySelector("[data-count]"); if(c) countUp(c); io.unobserve(el); }); },{rootMargin:"0px 0px -8% 0px"});
  var vh=window.innerHeight||800;
  all(".rv").forEach(function(n){ if(n.getBoundingClientRect().top>vh*0.92){ n.classList.add("wait"); io.observe(n); } });
})();

/* ---------- soft page transitions ---------- */
root.classList.add("ready");
if(!still&&!("onpagereveal" in window)){
  document.addEventListener("click",function(e){
    var a=e.target.closest&&e.target.closest("a[href]"); if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    if(a.target==="_blank"||a.origin!==location.origin||a.hasAttribute("download")) return;
    if(a.pathname===location.pathname&&a.hash) return;
    e.preventDefault(); root.classList.add("leaving"); setTimeout(function(){ location.href=a.href; },170);
  });
  window.addEventListener("pageshow",function(){ root.classList.remove("leaving"); });
}
all("#nav a").forEach(function(a){ a.addEventListener("click",closeMenu); });
frame();

})();

/* insights filter */
(function(){ var f=document.getElementById("nFilter"), l=document.getElementById("nList"); if(!f||!l) return;
 f.addEventListener("click",function(e){ var b=e.target.closest("button[data-cat]"); if(!b) return; var c=b.getAttribute("data-cat");
  Array.prototype.forEach.call(f.querySelectorAll("button"),function(x){ x.setAttribute("aria-pressed",x===b?"true":"false"); });
  Array.prototype.forEach.call(l.children,function(li){ li.hidden=!(c==="all"||li.getAttribute("data-cat")===c); }); }); })();
