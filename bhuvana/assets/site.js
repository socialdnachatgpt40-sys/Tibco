const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hdr=$('#hdr'),sticky=$('#sticky'),mnav=$('#mnav');

/* thin progress line along the top */
const prog=document.createElement('div');prog.className='sprog';prog.setAttribute('aria-hidden','true');document.body.append(prog);

/* header: light at the top, frosted once the page moves,
   tucks away while scrolling down and returns on the way up */
let lastY=scrollY;
function onScroll(){
  const y=scrollY,open=mnav.classList.contains('open');
  hdr.classList.toggle('solid',y>8||open);
  if(open||y<480||y<lastY-4)hdr.classList.remove('hide');
  else if(y>lastY+4&&!hdr.contains(document.activeElement))hdr.classList.add('hide');
  lastY=y;
  sticky.classList.toggle('show',y>innerHeight*.6);
  const h=document.documentElement.scrollHeight-innerHeight;prog.style.transform=`scaleX(${h>0?Math.min(1,y/h):0})`;
}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* mobile menu */
const burger=$('#burger');
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
    void tabs[cur].offsetWidth;tabs[cur].classList.add('on');
    const img=slides[cur].querySelector('img');if(img&&!first){img.style.animation='none';void img.offsetWidth;img.style.animation=''}
    arm();
  }
  tabs.forEach((t,i)=>t.onclick=()=>go(i));
  const ppSet=()=>pp.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');
  pp.onclick=()=>{paused=!paused;ppSet();hero.classList.toggle('stopped',paused);arm()};
  ppSet();hero.classList.toggle('stopped',paused);
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
$$('.thanks').forEach(t=>t.insertAdjacentHTML('afterbegin','<svg class="tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg>'));
$$('form.enqf').forEach(f=>f.addEventListener('submit',e=>{
  e.preventDefault();
  if(!f.checkValidity()){
    f.querySelectorAll(':invalid').forEach(i=>{i.classList.remove('shake');void i.offsetWidth;i.classList.add('shake')});
    f.reportValidity();return}
  const b=f.querySelector('[type=submit]');b.classList.add('loading');b.disabled=true;
  // no backend yet: POST new FormData(f) to CRM/webhook here, then show thanks
  setTimeout(()=>{b.classList.remove('loading');b.disabled=false;
    f.querySelector('.fields').hidden=true;f.querySelector('.thanks').hidden=false;f.reset()},900);
}));
$$('.enqf input').forEach(i=>i.addEventListener('animationend',()=>i.classList.remove('shake')));
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

/* ---------- motion ----------
   Lists match the ones in site.css (the CSS hides these until .in is added). */
const FADE='.eyebrow:not(.pill),main .stmt,main .lead-p,.more,.phead>p,.prh>p,.pc,.p-cta,.prin article,.people figure,.people .intro,.stats>div,.trust li,.facts dl>div,.pintro .body,.detail li,.club .ctx,.ghead .btn,.where .txt,.enqband .etx .txt,.enqband .panel>.enqf,.cgrid .info>div,.cgrid>.enqf,.next a,.visit .txt>:not(h2),.qcard,.homes .htxt>:not(h2)';
const IMG='.pc .pic,.prin .pic,.people .ph,.next .pic,figure>button[data-view],.ovimg,figure.plate,.ph-img,.visit .pic,.where .map';
const HEAD='.hero .d1,main .d2,.ph-t .d1,.ttop .d1';

/* wrap each word of a headline so it can rise out of its own mask */
function split(el){
  let i=0;
  const walk=n=>[...n.childNodes].forEach(c=>{
    if(c.nodeType===3){
      const frag=document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(w=>{
        if(!w)return;
        if(/^\s+$/.test(w)){frag.append(' ');return}
        const o=document.createElement('span'),s=document.createElement('span');
        o.className='w8';s.textContent=w;s.style.setProperty('--i',i++);o.append(s);frag.append(o);
      });
      c.replaceWith(frag);
    }else if(c.nodeType===1&&c.tagName!=='BR')walk(c);
  });
  walk(el);el.classList.add('sh');el.dataset.words=i;
}

/* numbers count up once they scroll into view */
function count(dd){
  const end=+dd.dataset.end,start=+dd.dataset.start,t0=performance.now(),D=1600;
  const step=t=>{const p=Math.min(1,(t-t0)/D);dd.textContent=Math.round(start+(end-start)*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step)};
  requestAnimationFrame(step);
}

if(!still&&'IntersectionObserver' in window){
  $$(HEAD).forEach(split);
  /* once every word has risen, drop the masks so shadows and italics are not clipped */
  const settle=el=>{if(el.classList.contains('sh'))setTimeout(()=>el.classList.add('done'),1300+el.dataset.words*55+(parseInt(el.style.getPropertyValue('--d'))||0))};
  $$('.stats dd').forEach(dd=>{const v=parseInt(dd.textContent,10);if(isNaN(v))return;
    dd.dataset.end=v;dd.dataset.start=v>1900?v-30:0;dd.setAttribute('aria-label',v);dd.textContent=dd.dataset.start});
  const io=new IntersectionObserver(es=>{
    let k=0;
    es.forEach(e=>{
      if(!e.isIntersecting)return;
      const t=e.target;
      t.style.setProperty('--d',Math.min(k++,6)*90+'ms'); // things arriving together fan out
      t.classList.add('in');io.unobserve(t);settle(t);
      const dd=t.matches('.stats>div')&&t.querySelector('dd[data-end]');if(dd)count(dd);
    });
  },{rootMargin:'0px 0px -10% 0px'});
  $$(`${FADE},${IMG},${HEAD}`).forEach(el=>{if(!el.closest('.hero'))io.observe(el)});
  const h1=$('.hero .d1');if(h1)requestAnimationFrame(()=>requestAnimationFrame(()=>{h1.classList.add('in');settle(h1)}));

  /* slow parallax on the large pictures */
  const px=$$('.band>img,.ph-img img,.visit .pic img');
  if(px.length){
    let busy=false;
    const move=()=>{busy=false;px.forEach(img=>{
      const r=img.parentElement.getBoundingClientRect();
      if(r.bottom<0||r.top>innerHeight)return;
      const p=(r.top+r.height/2-innerHeight/2)/(innerHeight+r.height);
      img.style.translate=`0 ${(-p*r.height*.14).toFixed(1)}px`;
    })};
    addEventListener('scroll',()=>{if(!busy){busy=true;requestAnimationFrame(move)}},{passive:true});
    addEventListener('resize',move);move();
  }
}
