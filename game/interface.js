/* Incremental UI enhancements. Existing gameplay, saves and battle actions remain authoritative. */
(() => {
 'use strict';
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const motion=(el,frames,options={})=>{if(!el||reduced()||typeof el.animate!=='function')return null;return el.animate(frames,{duration:180,easing:'cubic-bezier(.2,.75,.25,1)',...options});};
 window.InterfaceUI={exitDialog(el,done){const a=motion(el,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(6px)'}],{duration:120});if(a)a.finished.then(done,done);else done();}};
 let previousContext='',lastPage='',modalKeys=new Set();const indicators=new Map();
 const tabSelectors='.shop-tabs,.journal-heading + .settings,[aria-label="Diário"]';
 const buttonKey=el=>el?.dataset.act?['act',el.dataset.act,el.dataset.v||'']:el?.dataset.nav?['nav',el.dataset.nav,'']:null;
 function focusButton(key){if(!key)return;const [kind,action,value]=key;const node=[...document.querySelectorAll(`[data-${kind}]`)].find(n=>n.dataset[kind]===action&&(kind==='nav'||(n.dataset.v||'')===value)&&!n.disabled);node?.focus({preventScroll:true});}
 function improveTabs(){
  for(const nav of $app.querySelectorAll(tabSelectors)){
   const tabs=[...nav.querySelectorAll(':scope > button[aria-pressed],:scope > button[data-act="shopTab"]')];if(!tabs.length)continue;
   nav.classList.add('ui-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label',nav.getAttribute('aria-label')||'Categorias');
   tabs.forEach(t=>{const selected=t.dataset.act==='shopTab'?t.dataset.v===(S.shopTab||'general'):t.getAttribute('aria-pressed')==='true';t.setAttribute('aria-pressed',String(selected));t.setAttribute('role','tab');t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;t.classList.toggle('ui-tab-active',selected);});
   const active=tabs.find(t=>t.getAttribute('aria-selected')==='true');if(!active)continue;
   const id=S.screen+':'+tabs[0].dataset.act,rect=active.getBoundingClientRect?.()||{left:0,width:0},base=nav.getBoundingClientRect?.()||{left:0,width:0};
   const now={left:rect.left-base.left,width:rect.width,value:active.dataset.v};const old=indicators.get(id);
   const bar=document.createElement('span');bar.className='ui-tab-indicator';bar.setAttribute('aria-hidden','true');bar.style.left=now.left+'px';bar.style.width=now.width+'px';bar.style.top=(rect.bottom-base.top+1)+'px';bar.style.bottom='auto';nav.appendChild(bar);
   if(old&&old.value!==now.value)motion(bar,[{transform:`translateX(${old.left-now.left}px)`,width:old.width+'px'},{transform:'translateX(0)',width:now.width+'px'}]);
   indicators.set(id,now);
  }
 }
 function enhance(){
  const panel=document.body.dataset.visualPanel||'';
  const context=[S.screen,panel,S.shop?'shop':'',S.shop?S.shopTab||'general':'',S.screen==='journal'?S.journal||'history':''].join(':');
  if(previousContext!==context&&!['battle','multiplayer','camp','center','routeWorld'].includes(S.screen)){
   const content=$app.querySelector('.visual-title-panel,.visual-options-scene > .panel,.panel,.visual-journey');content?.classList.add('ui-page-enter');
  }
  previousContext=context;if(S.shop)$app.querySelectorAll(".menu-sections").forEach(n=>n.remove());improveTabs();
  $app.querySelectorAll('.visual-mon[data-act]').forEach(el=>{el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','Ver sumário de '+el.querySelector('strong')?.textContent);});
  const options=$app.querySelector('.visual-options-scene');if(options){
   for(const [action,on,label] of [['snd',CFG.sound,'Som'],['mus',CFG.music,'Música']]){
    const el=options.querySelector(`[data-act="${action}"]`);if(!el)continue;el.setAttribute('aria-pressed',String(on));el.setAttribute('aria-label',label+': '+(on?'ligado':'desligado'));const toggle=document.createElement('span');toggle.className='ui-switch'+(on?' on':'');toggle.setAttribute('aria-hidden','true');el.appendChild(toggle);
   }
   const language=options.querySelector('[data-act="moveLanguage"]');language?.setAttribute('aria-pressed',String(CFG.moveLanguage==='en'));
  }
  const nav=document.getElementById('visual-bottom-nav');if(nav){
   const selected=S.screen==='dex'?'dex':S.screen==='journal'?'journal':S.screen==='pc'?'visualPC':panel==='bag'?'visualBag':['hub','summary'].includes(S.screen)?'visualTeam':'visualReturnHub';
   nav.querySelectorAll('button').forEach(b=>{if(b.dataset.act===selected)b.setAttribute('aria-current','page');});
  }
  for(const b of document.querySelectorAll('.audio-toggle')){const music=b.dataset.nav==='mus';b.textContent=music?'♪':'♫';b.setAttribute('aria-label',(music?'Música':'Som')+': '+((music?CFG.music:CFG.sound)?'ligado':'mudo'));b.setAttribute('aria-pressed',String(music?CFG.music:CFG.sound));}
 }
 const oldRender=render;
 render=()=>{
  const key=buttonKey(document.activeElement),samePage=lastPage===S.screen;
  oldRender();enhance();if(samePage&&key&&!document.querySelector('.profile-panel'))focusButton(key);lastPage=S.screen;
 };
 document.addEventListener('keydown',event=>{
  const el=event.target;
  if(el.matches?.('.ui-tabs [role="tab"]')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
   event.preventDefault();const tabs=[...el.closest('.ui-tabs').querySelectorAll('[role="tab"]')],i=tabs.indexOf(el),index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[index].focus({preventScroll:true});tabs[index].click();
  }else if(el.matches?.('.visual-mon[role="button"]')&&['Enter',' '].includes(event.key)){event.preventDefault();el.click();}
 });
 document.addEventListener('pointerdown',event=>{
  const el=event.target.closest?.('.btn:not(:disabled)');if(!el||reduced()||event.button!==0||['battle','multiplayer'].includes(S.screen))return;
  const rect=el.getBoundingClientRect(),dot=document.createElement('span');dot.className='ui-feedback';dot.setAttribute('aria-hidden','true');dot.style.left=(event.clientX-rect.left-6)+'px';dot.style.top=(event.clientY-rect.top-6)+'px';el.classList.add('ui-feedback-host');el.appendChild(dot);setTimeout(()=>dot.remove(),420);
 });
 function dialogs(){
  const now=new Set();
  document.querySelectorAll('.profile-panel,.trainer-card,.update-toast:not([hidden]),.battle-growth-notice').forEach(el=>{
   const key=el.classList.contains('profile-panel')?'profile':el.classList.contains('trainer-card')?'trainer-card':el.classList.contains('update-toast')?'update':'growth';now.add(key);
   if(!modalKeys.has(key))motion(el,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}]);
  });modalKeys=now;
 }
 window.addEventListener('resize',()=>{document.querySelectorAll('.ui-tabs').forEach(nav=>{const active=nav.querySelector('[aria-selected="true"]'),bar=nav.querySelector('.ui-tab-indicator');if(!active||!bar)return;const a=active.getBoundingClientRect(),r=nav.getBoundingClientRect();bar.style.left=(a.left-r.left)+'px';bar.style.width=a.width+'px';bar.style.top=(a.bottom-r.top+1)+'px';});});
 if(typeof MutationObserver!=='undefined')new MutationObserver(dialogs).observe(document.body,{childList:true,subtree:true});
 render();dialogs();
})();
