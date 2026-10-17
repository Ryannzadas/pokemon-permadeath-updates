/* 0.3.2: compact inventory, independent journeys and shared navigation. */
(() => {
 'use strict';
 const T=JourneyStrategy;
 const btn=(act,label,v="",cls="alt")=>`<button class="btn ${cls}" data-act="${act}" data-v="${esc(v)}">${label}</button>`;
 applyItemSprites();
 const machineMoves=[...new Set(Object.values(SP).flatMap(p=>(p.learn||[]).filter(x=>x.method==='machine').map(x=>x.id)))].sort();
 const moveName=id=>window.gameExpansion.moveName(id);
 machineMoves.forEach(id=>ITEMS['tm:'+id]={n:moveName(id),d:`${TYPES[M[id].t][0]} · ${M[id].cat===1?'Status':M[id].cat===3?'Especial':'Físico'} · PP ${M[id].pp}`,price:180,ico:window.itemSprite('tm-'+M[id].t),tm:id});
 const oldLanguage=ACT.moveLanguage;ACT.moveLanguage=()=>{oldLanguage();machineMoves.forEach(id=>ITEMS['tm:'+id].n=moveName(id));};
 const oldShop=genShop;
 genShop=()=>[...oldShop(),...machineMoves.map(id=>({kind:'item',id:'tm:'+id,price:180,once:false}))];
 const oldNew=newRun;newRun=id=>{oldNew(id);R.shop=null;R.shopVersion=3;R.exploration={stage:R.battle,used:0};persist();};
 const oldContinue=continueSave;
 continueSave=()=>{oldContinue();if(R&&S.screen!=='gameover'){if(R.shopVersion!==3){R.shop=null;R.shopVersion=3;}R.exploration=R.exploration||{stage:R.battle,used:0};persist();}};
 ACT.starterBack=()=>{if(S.screen==='starter'){S.screen='trainerName';S.characterFor='new';}};
 ACT.cont=()=>{const slots=ModeSaveStore.slots(),available=Object.keys(slots);if(available.length>1){S.screen='continueSelect';S.msg='';}else if(available.length){ModeSaveStore.select(available[0]);continueSave();}};
 ACT.contMode=mode=>{if(S.screen!=='continueSelect'||!ModeSaveStore.slots()[mode])return;ModeSaveStore.select(mode);continueSave();};
 window.rContinueChoice=()=>`<section class="panel"><p class="camp-eyebrow">CONTINUAR</p><h2>Escolha sua jornada</h2><div class="run-modes">${Object.entries(ModeSaveStore.slots()).map(([mode,{R:r}])=>`<button class="run-mode" data-act="contMode" data-v="${mode}"><strong>${ModeSaveStore.label(mode)}</strong><small>${esc(r.trainerName||'Treinador')} · etapa ${r.battle+1} · ${r.team.filter(m=>m.hp>0).length} Pokémon</small><span>Continuar →</span></button>`).join('')}</div><button class="btn alt" data-act="modeBack">Menu</button></section>`;
 // ACT.start uses hasSave after selecting the destination slot; preserve other mode.
 let doubleIntent=null,firstStarter=null;
 const oldStart=ACT.start,oldChoose=ACT.chooseMode,oldPick=ACT.pickStarter,oldPostgame=ACT.postgame;
 const unlocked=()=>!!META.champ||(META.championTeams||[]).length>0;
 function clearDouble(){doubleIntent=null;firstStarter=null;}
 ACT.start=()=>{clearDouble();oldStart();};
 ACT.openDouble=()=>{if(!unlocked())return;clearDouble();S.screen='doubleChoice';S.msg='';};
 ACT.doubleNew=()=>{if(!unlocked()||S.screen!=='doubleChoice')return;doubleIntent='fresh';oldStart();};
 ACT.postgame=id=>{if(!(META.championTeams||[]).some(t=>t.id===id))return;doubleIntent=id;firstStarter=null;oldStart();};
 ACT.chooseMode=mode=>{
  if(S.screen!=='modeSelect'||!['classic','permadeath'].includes(mode))return;
  if(doubleIntent&&doubleIntent!=='fresh'){
   ModeSaveStore.select(mode,'double');
   if(hasSave()){S.msg='Já existe uma jornada em duplas neste modo. Continue ou encerre essa jornada antes de iniciar outra.';return;}
   S.pendingMode=mode;oldPostgame(doubleIntent);
   if(R?.postgame&&R.sourceTeam===doubleIntent)clearDouble();
  }else oldChoose(mode,doubleIntent?'double':'standard');
 };
 for(const name of ['modeBack','characterBack','accountTitle']){const old=ACT[name];ACT[name]=(...args)=>{clearDouble();old(...args);};}
 const oldConfirmTrainer=ACT.confirmTrainer;ACT.confirmTrainer=()=>{firstStarter=null;oldConfirmTrainer();};
 const oldStarterBack=ACT.starterBack;
 ACT.starterBack=()=>{if(firstStarter){firstStarter=null;S.msg='Escolha o primeiro Pokémon.';}else oldStarterBack();};
 ACT.pickStarter=id=>{
  if(doubleIntent!=='fresh'){oldPick(id);return;}
  const st=STARTERS.find(x=>x.id===id);if(S.screen!=='starter'||!st||(st.need&&META.best<st.need))return;
  if(!firstStarter){firstStarter=id;S.msg='Escolha o segundo Pokémon para as duplas.';return;}
  if(window.gameExpansion.beginDouble([mk(firstStarter,5),mk(id,5)])){clearDouble();S.msg='Sua jornada em dupla começou!';persist();}
 };
 const oldTitle=rTitle,oldStarter=rStarter;
 rTitle=()=>oldTitle().replace('</nav>',`${unlocked()?btn('openDouble','Pós-game em dupla','','gba-option'):''}</nav>`);
 rStarter=()=>oldStarter()+(doubleIntent==='fresh'?`<p class="panel" role="status">${firstStarter?'Segundo Pokémon':'Primeiro Pokémon'} · nova equipe para duplas</p>`:'');
 function doubleChoiceHTML(){return `<section class="panel"><h2>Pós-game em dupla</h2><p>Escolha sua equipe e depois o modo de jogo.</p>${btn('doubleNew','Nova equipe · dois iniciais','','gold')}<h3>Equipes campeãs</h3>${(META.championTeams||[]).map(t=>`<article class="journal-entry"><h3>${esc(new Date(t.date||Date.now()).toLocaleDateString('pt-BR'))}</h3><div class="journal-team">${t.team.map(m=>`<div><img src="${SPRITE(SP[m.sp].dex)}" alt="${esc(SP[m.sp].n)}"><span>${esc(SP[m.sp].n)}</span></div>`).join('')}</div>${btn('postgame','Usar equipe campeã',t.id)}</article>`).join('')||'<p>Nenhuma equipe campeã disponível.</p>'}<details><summary>Sobre as equipes</summary><p>Campeã: forma inicial e nível 5. Uma tentativa no Permadeath; reutilizável no Clássico. Nova: dois iniciais, sem consumir tentativas.</p><p>Clássico: desmaiados se recuperam no Centro Pokémon. Permadeath: morte permanente.</p></details></section>`;}
 ACT.shopTab=tab=>{if(S.screen==='hub'&&S.shop&&['general','balls','healing','battle','evolution','held','tm'].includes(tab)){S.shopTab=tab;S.shopPage=0;S.shopQuery='';}};
 ACT.shopPage=value=>{S.shopPage=Math.max(0,Number(value)||0);};
 const purchaseMax=item=>item.once?1:Math.min(999,Math.max(0,Math.floor(R.money/item.price)));
 const purchaseQuantity=(item,i)=>item.once?1:Number(S.shopQty?.[i]??1);
 ACT.buy=value=>{
  const item=R?.shop?.[Number(value)];if(!item||S.screen!=='hub'||!S.shop||item.sold||R.money<item.price)return;
  if(R.mode==='classic'&&(item.kind==='relic'||InventoryModel.custom.has(item.id)))return;
  const quantity=purchaseQuantity(item,Number(value));if(!Number.isInteger(quantity)||quantity<1||quantity>purchaseMax(item)){S.msg='Escolha uma quantidade que caiba no seu saldo.';return;}
  const before=JSON.parse(JSON.stringify(R));
  try{R.money-=item.price*quantity;if(item.kind==='relic')R.relics[item.id]=relic(item.id)+1;else R.bag[item.id]=(R.bag[item.id]||0)+quantity;if(item.once)item.sold=true;
   SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify({R,S,V}));sfx('buy');S.msg=`Comprou ${quantity} × ${(item.kind==='relic'?RELICS:ITEMS)[item.id].n}.`;S.shopQty={};
  }catch(e){R=before;S.msg='Não foi possível salvar a compra. Tente novamente.';}
 };
 const beforeTeach=ACT.teach;
 ACT.teach=id=>{const before=JSON.parse(JSON.stringify(R));try{beforeTeach(id);}catch(e){R=before;S.msg='Não foi possível salvar. O TM/HM foi preservado.';}};
 ACT.explore=()=>{
  if(S.screen!=='hub'||!nextIsBoss()||Math.floor(R.battle/5)>=8||EVOLVING)return;
  if(!R.exploration||R.exploration.stage!==R.battle)R.exploration={stage:R.battle,used:0};
  if(R.mode!=='classic'&&R.exploration.used>=3){S.msg='Você concluiu os três encontros extras deste ginásio.';return;}
  R.exploration.used++;S.exploring=true;startBattle(false);
 };
 const oldReward=rReward;
 rReward=()=>{let html=oldReward();if(V?.xp?.length)html=html.replace('<div class="mute">',`<ul class="xp-results">${V.xp.map(x=>`<li><span>${esc(SP[x.sp].n)}</span><strong>+${x.amount} XP${x.to>x.from?` · Nv. ${x.to}`:''}${x.capped?' · limite':''}</strong></li>`).join('')}</ul><details><summary>Detalhes da batalha</summary><div class="mute">`).replace('</div></section>','</div></details></section>');if(V?.exploration)html=html.replace('Treino não avança a jornada: o ginásio continua te esperando.','Sua equipe está pronta? O ginásio continua disponível.');return html;};
 window.journeySummaryPanel=m=>`<section class="summary-strategy"><h3>Habilidade</h3><strong>${esc(T.label(m))}</strong><details><summary>Detalhes</summary><p>${esc(T.description(m))}</p></details><h3>Item equipado</h3><div class="equipped-item">${m.heldItem?`${T.items[m.heldItem].ico}<strong>${T.items[m.heldItem].n}</strong><button class="btn alt" data-act="unequip" ${m.hp<=0?'disabled':''}>Remover</button>`:'Nenhum item equipado.'}</div><h3>Equipáveis da mochila</h3><div class="held-item-list">${Object.entries(T.items).filter(([id])=>R.bag[id]>0).map(([id,x])=>`<article><div class="inventory-name">${x.ico}<strong>${x.n} · ×${R.bag[id]}</strong></div><button class="btn" data-act="equip" data-v="${id}" ${m.hp<=0||m.heldItem===id?'disabled':''}>Equipar</button><details><summary>Detalhes</summary><p>${x.d}</p></details></article>`).join('')||'<p>Você não tem nenhum item equipável na mochila.</p>'}</div></section>`;
 function category(it){if(it.kind==='relic')return 'general';if(it.id.startsWith('tm:'))return 'tm';if(T.items[it.id])return 'held';if(ITEMS[it.id].d.includes('Evolui uma espécie'))return 'evolution';return R.mode==='classic'?InventoryModel.items[it.id]?.category||'general':'general';}
 function shopEntries(tab,query){return R.shop.map((it,i)=>({it,i,d:(()=>{let d=(it.kind==='relic'?RELICS:ITEMS)[it.id];if(R.mode==='classic'&&InventoryModel.items[it.id])d={...d,d:InventoryModel.items[it.id].d};return d.tm?{...d,n:moveName(d.tm)}:d;})()})).filter(x=>(R.mode!=='classic'||x.it.kind!=='relic'&&!InventoryModel.custom.has(x.it.id))&&category(x.it)===tab&&(!query||x.d.n.toLowerCase().includes(query)||x.it.id.includes(query)||x.d.tm&&M[x.d.tm].en.toLowerCase().includes(query)));}
 // Data for the Phaser shop scene: the same tabs (as the engine renders them for this mode), items and limits.
 ACT.shopQty=value=>{const [i,q]=String(value).split(':').map(Number),item=R?.shop?.[i];if(!S.shop||!item||item.once||!Number.isInteger(q))return;(S.shopQty??={})[i]=Math.max(1,Math.min(purchaseMax(item)||1,q));};
 window.ShopView=Object.freeze({data(){
  if(!R.shop)R.shop=genShop();const tab=S.shopTab||'general';
  const tabs=[...document.querySelectorAll('#app nav.shop-tabs [data-act="shopTab"]')].map(b=>({id:b.dataset.v,label:b.textContent.trim()}));
  const items=shopEntries(tab,(S.shopQuery||'').toLowerCase()).map(({it,i,d})=>{const max=purchaseMax(it),qty=Math.min(max||1,purchaseQuantity(it,i));return {i,id:it.id,name:d.n,desc:d.d||'',ico:d.ico||'',type:d.tm?M[d.tm].t:null,price:it.price,once:!!it.once,sold:!!it.sold,max,qty,canBuy:!it.sold&&R.money>=it.price*qty&&qty>=1&&qty<=max};});
  return {tab,tabs,items,money:R.money};
 }});
 function shopHTML(){
  if(!R.shop)R.shop=genShop();const tab=S.shopTab||'general',query=(S.shopQuery||'').toLowerCase();
  const entries=shopEntries(tab,query);
  for(const {it,i} of entries){if(S.shopQty?.[i]>purchaseMax(it))S.shopQty[i]=purchaseMax(it)||1;}
  const pages=Math.max(1,Math.ceil(entries.length/12)),page=Math.min(pages-1,Math.max(0,Number(S.shopPage)||0)),visible=entries.slice(page*12,page*12+12);
  return `<section class="panel shop-panel"><h2>Loja</h2>${msgBox()}<nav class="shop-tabs" aria-label="Categorias da loja">${[['general','Suprimentos'],['evolution','Evolução'],['held','Equipáveis'],['tm','TM/HM']].map(([id,name])=>`<button class="btn ${id===tab?'':'alt'}" data-act="shopTab" data-v="${id}" aria-pressed="${id===tab}">${name}</button>`).join('')}</nav>${tab==='tm'?`<label for="shop-search">Pesquisar golpe</label><input id="shop-search" type="search" placeholder="Nome do golpe" value="${esc(S.shopQuery||'')}">`:''}<div class="shop-grid">${visible.map(({it,i,d})=>`<article class="shop-item"><div class="inventory-name">${d.ico}<strong>${esc(d.n)}</strong></div>${d.tm?`<span class="tp" style="background:${TYPES[M[d.tm].t][1]}">${TYPES[M[d.tm].t][0]}</span>`:''}${!it.once?`<label class="shop-quantity">Quantidade<input type="number" data-shop-qty="${i}" aria-label="Quantidade de ${esc(d.n)}" min="1" max="${purchaseMax(it)}" step="1" value="${Math.min(purchaseMax(it)||1,purchaseQuantity(it,i))}" ${purchaseMax(it)<1?'disabled':''}></label>`:''}<button class="btn" data-act="buy" data-v="${i}" ${it.sold||R.money<it.price||!Number.isInteger(purchaseQuantity(it,i))||purchaseQuantity(it,i)<1?'disabled':''}>${it.sold?'Esgotado':`Comprar · ₽${it.price*Math.min(purchaseMax(it)||1,purchaseQuantity(it,i))}`}</button><details><summary>Detalhes</summary><p>${esc(d.d)}</p>${d.tm?`<p>Compatibilidade no sumário do Pokémon. Uso único; o golpe permanece aprendido.</p>`:''}</details></article>`).join('')||'<p>Nenhum item encontrado.</p>'}</div>${pages>1?`<nav class="pagination"><button class="btn alt" data-act="shopPage" data-v="${page-1}" ${!page?'disabled':''}>Anterior</button><span>${page+1}/${pages}</span><button class="btn alt" data-act="shopPage" data-v="${page+1}" ${page===pages-1?'disabled':''}>Próxima</button></nav>`:''}</section>`;
 }
 const oldHub=rHub;
 rHub=()=>{
  let html=oldHub();
  if(S.shop)return shopHTML();
  if(R.mode==='classic')html=html.replace(/<button[^>]*data-act="train"[\s\S]*?<\/button>/,'').replace(/<p class="gba-journey-tip">[\s\S]*?<\/p>/,'').replace('₽60 · recupera HP e PP dos vivos','Cura gratuita da equipe');
  else html=html.replace(/<p class="gba-journey-tip">[\s\S]*?<\/p>/,'<details class="gba-journey-tip"><summary>Sobre o treino</summary><p>3 tentativas por etapa. Sem captura; HP cheio ao terminar.</p></details>');
  if(nextIsBoss()&&Math.floor(R.battle/5)<8){const used=R.exploration?.stage===R.battle?R.exploration.used:0;html=html.replace('</nav>',`<button class="btn gba-option" data-act="explore" ${R.mode!=='classic'&&used>=3?'disabled':''}><span>Explorar a área${R.mode==='classic'?'':` (${Math.max(0,3-used)}/3)`}</span><small>Encontrar e capturar Pokémon</small></button></nav>`);}
  const team=`<div class="hub-team"><h3>Equipe</h3>${S.sel?`<p class="hub-team-hint">Clique num Pokémon para usar ${esc(ITEMS[S.sel].n)}.</p>`:''}<div class="hub-team-grid">${R.team.map((m,i)=>`<article class="card hub-mon${m.hp<=0?' dead':''}" data-act="card" data-v="${i}"><div class="hub-mon-identity">${art(m)}<div><strong>${esc(SP[m.sp].n)}${m.alpha?window.alphaBadge?.()||'Alfa':''}</strong><small>Nv. ${m.lvl}${i===R.active?' · ★':''}</small>${types(m)}</div></div>${hpBar(m)}<small class="hub-mon-health">${m.hp<=0?'Desmaiado':`HP ${m.hp}/${m.maxHp}`}</small><div class="hub-mon-actions">${btn('summary','Sumário',String(i))}${m.hp>0&&i!==R.active?btn('lead','Liderar',String(i)):''}</div></article>`).join('')}</div></div>`;
  html=html.replace(/<section class="panel"><h2>Equipe<\/h2>[\s\S]*?<\/section>/,'').replace(/<div class="gba-partner">[\s\S]*?<\/div><\/div>/,team);
  html=html.replace('<h3>Equipe</h3>',`<p class="hub-team-hint">Limite da etapa · Nv. ${JourneyLevelCap.current()}</p><h3>Equipe</h3>`);
  const machines=machineMoves.filter(id=>R.bag['tm:'+id]>0);
  if(machines.length)html=html.replace('<h2>Mochila</h2>',`<h2>Mochila</h2><details class="bag-machines"><summary>TM/HM · ${machines.length} golpes disponíveis</summary>${machines.map(id=>`<div class="inventory-name">${itemSprite('tm-'+M[id].t)}<strong>${esc(moveName(id))} · ×${R.bag['tm:'+id]}</strong></div>`).join('')}<p>Ensine pelo sumário do Pokémon.</p></details>`);
  return html;
 };
 const toolbar=document.createElement('nav');toolbar.id='game-toolbar';toolbar.setAttribute('aria-label','Navegação e áudio');document.body.appendChild(toolbar);
 const oldHead=head;head=()=>'<header class="top"><h1>Pokémon · Permadeath</h1></header>';
 let renderedKey=null,previousPage='title';const scrolls=new Map();
 const context=()=>S.screen+(S.screen==='hub'&&S.shop?':shop':'');
 function backDestination(){
  if(S.screen==='title')return null;
  if(S.screen==='doubleChoice')return ['modeBack','Menu'];
  if(S.screen==='battle')return null;
  if(S.screen==='intro')return B?.preview?['cancelTrainer','Jornada']:null;
  if(S.screen==='hub')return S.shop?['shop','Jornada']:['accountTitle','Menu'];
  if(S.screen==='camp')return ['campExit','Jornada'];if(S.screen==='center')return ['centerExit','Jornada'];
  if(['routes','missions','journeyEvent'].includes(S.screen))return ['journeyBack','Jornada'];
  if(S.screen==='starter')return ['starterBack','Nome'];
  if(S.screen==='trainerName')return ['trainerNameBack','Personagem'];
  if(S.screen==='character')return ['characterBack','Menu'];
  if(['modeSelect','continueSelect'].includes(S.screen))return ['modeBack','Menu'];
  if(['dex','journal','pc','summary'].includes(S.screen))return ['subBack',S.screen==='summary'&&S.summaryBox==='pc'?'PC':window.gameExpansion.subDestination()==='title'?'Menu':R?.inCenter?'Centro Pokémon':'Jornada'];
  if(S.screen==='reward')return V?.training||V?.exploration?['back','Jornada']:null;
  if(['gameover','win'].includes(S.screen))return ['accountTitle','Menu'];return null;
 }
 toolbar.addEventListener('click',e=>{const b=e.target.closest('[data-nav]');if(b&&!b.disabled&&!document.querySelector('.profile-panel')&&!$app.inert){menuActionSound(b.dataset.nav);ACT[b.dataset.nav]();render();}});
 const oldRender=render;
 render=()=>{
  const key=context(),y=window.scrollY;
  if(renderedKey)scrolls.set(renderedKey,y);
  if(renderedKey!==key&&['title','hub','center','camp','pc'].includes(renderedKey))previousPage=renderedKey;
  const search=document.getElementById('shop-search'),focused=search===document.activeElement,cursor=search?.selectionStart;
  if(S.screen==='doubleChoice'){CampWorld.destroy();screenMusic();$app.innerHTML=head()+doubleChoiceHTML();window.dispatchEvent(new Event('game-screen-changed'));}else oldRender();if(S.screen==='modeSelect'&&S.msg)$app.insertAdjacentHTML('beforeend',`<p class="panel" role="alert">${esc(S.msg)}</p>`);document.body.dataset.screen=S.screen;document.body.dataset.context=context();
  const showBalance=!!R&&!['title','doubleChoice','modeSelect','continueSelect','starter','character','trainerName','win','gameover'].includes(S.screen);
  document.body.dataset.journeyBalance=String(showBalance);
  const balance=showBalance?`<output class="journey-balance" aria-label="Dinheiro da jornada">₽ ${Number(R.money||0).toLocaleString('pt-BR')}</output>`:'';
  const back=backDestination();toolbar.innerHTML=`<span class="toolbar-brand">Pokémon</span><div class="toolbar-actions">${back?`<button class="nav-back" data-nav="${back[0]}" aria-label="Voltar para ${back[1]}">← ${back[1]}</button>`:''}<button class="audio-toggle" data-nav="snd" aria-label="${CFG.sound?'Silenciar som':'Ativar som'}" title="Som">${CFG.sound?'♫':'♫ ×'}</button><button class="audio-toggle" data-nav="mus" aria-label="${CFG.music?'Desligar música':'Ativar música'}" title="Música">${CFG.music?'♪':'♪ ×'}</button></div>${balance}`;
  document.querySelectorAll('img').forEach(img=>img.draggable=false);
  if(S.screen==='summary'){document.querySelectorAll('.move-entry').forEach(el=>{if(el.querySelector('[data-act="teach"]')){const id=el.querySelector('[data-act="teach"]').dataset.v;el.insertAdjacentHTML('afterbegin',itemSprite('tm-'+M[id].t));}});}
  if(focused&&S.shop){const input=document.getElementById('shop-search');input?.focus({preventScroll:true});try{input?.setSelectionRange(cursor,cursor);}catch{}}
  window.scrollTo(0,scrolls.get(context())||0);renderedKey=context();
 };
 $app.addEventListener('input',e=>{if(e.target.matches('[data-shop-qty]')){const i=Number(e.target.dataset.shopQty),item=R?.shop?.[i];if(!item)return;const q=Number(e.target.value);(S.shopQty??={})[i]=q;const button=e.target.closest('.shop-item').querySelector('[data-act=buy]');button.disabled=!Number.isInteger(q)||q<1||q>purchaseMax(item)||item.sold;button.textContent=`Comprar · ₽${Number.isInteger(q)&&q>0?item.price*q:0}`;return;}if(e.target.id==='shop-search'){S.shopQuery=e.target.value;S.shopPage=0;render();}});
 document.addEventListener('dragstart',e=>{if(e.target.tagName==='IMG')e.preventDefault();});
 render();
})();
