const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hdr=$('#hdr'),sticky=$('#sticky');

/* header: light at the top, frosted once the page moves */
function onScroll(){
  hdr.classList.toggle('solid',scrollY>8||$('#mnav').classList.contains('open'));
  sticky.classList.toggle('show',scrollY>innerHeight*.6);
}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* mobile menu */
const burger=$('#burger'),mnav=$('#mnav');
burger.onclick=()=>{const o=mnav.classList.toggle('open');burger.setAttribute('aria-expanded',o);burger.textContent=o?'Close':'Menu';document.body.style.overflow=o?'hidden':'';onScroll()};

/* home carousel */
const hero=$('.hero');
if(hero){
  const slides=$$('.slide'),tabs=$$('.tab'),pp=$('#pp'),DUR=6500;
  hero.style.setProperty('--dur',DUR+'ms');
  let cur=0,timer,paused=still,hover=false,seen=true;
  const run=()=>!paused&&!hover&&seen&&!document.hidden;
  function arm(){clearTimeout(timer);hero.classList.toggle('paused',!run());if(run())timer=setTimeout(()=>go(cur+1),DUR)}
  function go(n,first){
    if(!first)hero.classList.remove('intro');
    cur=(n+slides.length)%slides.length;
    slides.forEach((s,i)=>{s.classList.toggle('on',i===cur);s.inert=i!==cur;s.setAttribute('aria-hidden',i!==cur)});
    tabs.forEach((t,i)=>{t.classList.remove('on');t.setAttribute('aria-current',i===cur)});
    void tabs[cur].offsetWidth;tabs[cur].classList.add('on');arm();
  }
  tabs.forEach((t,i)=>t.onclick=()=>go(i));
  pp.onclick=()=>{paused=!paused;pp.textContent=paused?'Play':'Pause';arm()};
  pp.textContent=paused?'Play':'Pause';
  hero.addEventListener('mouseenter',()=>{hover=true;arm()});hero.addEventListener('mouseleave',()=>{hover=false;arm()});
  let x0=null;hero.addEventListener('touchstart',e=>x0=e.touches[0].clientX,{passive:true});
  hero.addEventListener('touchend',e=>{if(x0==null)return;const d=e.changedTouches[0].clientX-x0;if(Math.abs(d)>50)go(cur+(d<0?1:-1));x0=null});
  hero.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(cur+1);if(e.key==='ArrowLeft')go(cur-1)});
  new IntersectionObserver(([e])=>{seen=e.isIntersecting;arm()}).observe(hero);
  document.addEventListener('visibilitychange',arm);
  go(0,true);
}

/* enquiry: modal + inline forms share one handler */
const lead=$('#lead');
const reset=f=>{f.querySelector('.fields').hidden=false;f.querySelector('.thanks').hidden=true};
$$('[data-lead]').forEach(b=>b.addEventListener('click',e=>{
  e.preventDefault();const f=lead.querySelector('form');reset(f);
  if(b.dataset.lead)f.project.value=b.dataset.lead;lead.showModal();
}));
$$('form.enqf').forEach(f=>f.addEventListener('submit',e=>{
  e.preventDefault();
  if(!f.checkValidity()){f.reportValidity();return}
  // no backend yet: POST new FormData(f) to CRM/webhook here
  f.querySelector('.fields').hidden=true;f.querySelector('.thanks').hidden=false;f.reset();
}));
$$('.again').forEach(b=>b.onclick=()=>reset(b.closest('form')));

/* lightbox: grouped images, prev/next, arrow keys, swipe */
const viewer=$('#viewer');let vlist=[],vi=0;
function show(n){vi=(n+vlist.length)%vlist.length;const b=vlist[vi];$('#vimg').src=b.dataset.full;$('#vimg').alt=b.dataset.view;
  $('#vcap').innerHTML=(vlist.length>1?`<span class="count">${vi+1} / ${vlist.length}</span>`:'')+b.dataset.view;
  viewer.querySelectorAll('.vn').forEach(x=>x.hidden=vlist.length<2)}
function openView(b){
  const seen=new Set();
  const gal=$$('#gallery [data-view]'),grp=b.dataset.group?$$(`[data-view][data-group="${b.dataset.group}"]`):[b];
  vlist=[...gal,...grp].filter(x=>!seen.has(x.dataset.full)&&seen.add(x.dataset.full)); // gallery order first
  show(Math.max(0,vlist.findIndex(x=>x.dataset.full===b.dataset.full)));if(!viewer.open)viewer.showModal()}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>openView(b)));
$$('[data-open]').forEach(b=>b.onclick=()=>openView($('#gallery [data-view]')));
viewer.querySelector('.prev').onclick=e=>{e.stopPropagation();show(vi-1)};
viewer.querySelector('.next').onclick=e=>{e.stopPropagation();show(vi+1)};
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight')show(vi+1);if(e.key==='ArrowLeft')show(vi-1)});
let vx=null;viewer.addEventListener('touchstart',e=>vx=e.touches[0].clientX,{passive:true});
viewer.addEventListener('touchend',e=>{if(vx==null)return;const d=e.changedTouches[0].clientX-vx;if(Math.abs(d)>50)show(vi+(d<0?1:-1));vx=null});

/* in-page nav: highlight the section in view */
const pl=$$('.pl a');
if(pl.length){
  const secs=pl.map(a=>$(a.getAttribute('href')));
  const mark=()=>{let cur=-1;secs.forEach((s,i)=>{if(s&&s.getBoundingClientRect().top<innerHeight*.4)cur=i});
    pl.forEach((a,i)=>a.classList.toggle('on',i===cur));
    if(cur>=0){const a=pl[cur],box=a.parentElement;box.scrollLeft=a.offsetLeft-box.clientWidth/2+a.clientWidth/2}};
  addEventListener('scroll',mark,{passive:true});mark();
}

$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-close]'))d.close()}));
$('#y').textContent=new Date().getFullYear();

/* gentle reveal as sections enter */
if(!still&&'IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
  $$('.rv').forEach(el=>io.observe(el));
}else $$('.rv').forEach(el=>el.classList.add('in'));
