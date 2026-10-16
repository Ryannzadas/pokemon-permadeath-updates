(() => {
 'use strict';
 const I=InventoryModel,aliases={super:'super-potion',candy:'rare-candy',ball:'poke-ball',great:'great-ball'},labels={general:'Outros',balls:'Pokébolas',healing:'Cura',battle:'Itens de batalha',held:'Equipáveis',evolution:'Evolução',tm:'TM/HM'};
 for(const [id,item]of Object.entries(I.items))if(!ITEMS[id])ITEMS[id]={...item,ico:itemSprite(aliases[id]||id)};
 ITEMS['ice-stone']={n:'Pedra de Gelo',price:180,d:'Evolui uma espécie compatível; veja o sumário',ico:itemSprite('ice-stone')};
 const category=id=>id.startsWith('tm:')?'tm':JourneyStrategy.items[id]?'held':I.items[id]?.category||'evolution';
 const oldShop=genShop;
 genShop=()=>{
  const stock=oldShop();if(R?.mode!=='classic')return stock;
  const ids=[...new Set([...stock.filter(x=>x.kind!=='relic'&&!I.custom.has(x.id)).map(x=>x.id),...Object.keys(I.items).filter(id=>id!=='master-ball'),'ice-stone'])];
  return ids.map(id=>({kind:'item',id,price:ITEMS[id].price,once:false}));
 };
 const oldApply=applyItem;
 applyItem=(id,m,options={})=>{
  if(R?.mode!=='classic')return oldApply(id,m);
  if(I.custom.has(id))return {ok:false,msg:'Item exclusivo do Permadeath.'};
  if(id==='candy'){if(!m||m.hp<=0||m.lvl>=JourneyLevelCap.current())return {ok:false,msg:'Não teria efeito.'};const notes=[];levelUp(m,1,notes);return {ok:true,msg:notes.join(' ')};}
  if(I.items[id]?.effect&&!I.items[id].effect.ball){
   m.ppMax=Object.fromEntries(m.moves.map(k=>[k,M[k].pp]));
   const x=I.items[id].effect;if(x.guard&&R.guardTurns>0)return {ok:false,msg:'Proteção já ativa.'};
   const result=I.apply(id,m,{battle:S.screen==='battle',move:options.move||S.itemMove,cap:JourneyLevelCap.current(),team:R.team});
   if(result.ok&&x.guard)R.guardTurns=5;return result;
  }
  return oldApply(id,m);
 };
 const button=(act,label,v='',disabled=false)=>`<button class="btn alt" data-act="${act}" data-v="${esc(v)}" ${disabled?'disabled':''}>${label}</button>`;
 function owned(cat){return Object.keys(ITEMS).filter(id=>(R.bag[id]||0)>0&&(!cat||category(id)===cat)&&!I.custom.has(id));}
 window.inventoryBattleHTML=(m,locked)=>{
  if(B.menu==='itemTarget')return `<p>Escolha o Pokémon.</p><div class="grid">${R.team.map((p,i)=>button('inventoryTarget',`${art(p)}${esc(nm(p))} · HP ${p.hp}/${p.maxHp}`,String(i),locked||(I.items[B.inventoryItem]?.effect.revive?p.hp>0:p.hp<=0))).join('')}</div>${button('menu','Voltar','bag')}`;
  if(B.menu==='itemMove'){const p=R.team[B.inventoryTarget];return `<p>Escolha o golpe.</p><div class="grid">${p.moves.map(id=>button('inventoryMove',`${esc(window.gameExpansion.moveName(id))} · PP ${p.pp[id]}/${M[id].pp}`,id,locked||p.pp[id]>=M[id].pp)).join('')}</div>${button('menu','Voltar','itemTarget')}`;}
  const cat=B.menu==='ball'?'balls':null,ids=owned(cat).filter(id=>cat||['healing','battle'].includes(category(id))&&!I.items[id]?.effect.partyRevive);
  return `<div class="grid">${ids.map(id=>button(cat?'ballUse':'inventorySelect',`${ITEMS[id].ico} ${esc(ITEMS[id].n)} ×${R.bag[id]}`,id,locked)).join('')||'<p>Nenhum item disponível.</p>'}</div>${button('menu','Voltar','moves')}`;
 };
 function queueItem(id,target,move){
  if(!B||B.lock||B.forced||S.screen!=='battle'||!R.bag[id])return;
  const actor=B.playerSlots[Math.min(B.commands.length,B.playerSlots.length-1)];
  if(B.commands.some(c=>c.item===id)&&R.bag[id]<=B.commands.filter(c=>c.item===id).length)return;
  const trial=JSON.parse(JSON.stringify(R.team[target]));if(!trial)return;
  trial.ppMax=Object.fromEntries(trial.moves.map(k=>[k,M[k].pp]));
  const ok=I.apply(id,trial,{battle:true,move,team:R.team.map(p=>({...p}))});if(!ok.ok){S.msg=ok.msg;return;}
  B.commands.push({side:'player',actor,item:id,itemTarget:target,itemMove:move,id:'quick-attack',target:0});B.menu='moves';
  // The expansion runs the complete queue through its existing battle executor.
  if(B.commands.length>=B.playerSlots.length)window.gameExpansion.runQueuedTurn();
 }
 ACT.inventorySelect=id=>{if(!B||B.lock||!R.bag[id]||!I.items[id]||I.items[id].effect.ball)return;B.inventoryItem=id;B.menu='itemTarget';};
 ACT.inventoryTarget=v=>{const i=Number(v);if(B?.menu!=='itemTarget'||!Number.isInteger(i)||!R.team[i])return;B.inventoryTarget=i;const id=B.inventoryItem;if(I.items[id].effect.pp&&!I.items[id].effect.all){B.menu='itemMove';return;}queueItem(id,i);};
 ACT.inventoryMove=id=>{if(B?.menu==='itemMove')queueItem(B.inventoryItem,B.inventoryTarget,id);};
 const oldBag=useBattleItem;
 useBattleItem=async id=>{if(R?.mode!=='classic')return oldBag(id);ACT.inventorySelect(id);render();};
 const oldThrow=throwBall;
 throwBall=async id=>{
  if(R?.mode!=='classic'&&id!=='master-ball')return oldThrow(id);
  if(!B||B.lock||B.forced||B.boss||B.train||B.double||!I.items[id]?.effect.ball||!R.bag[id])return;
  if(R.team.length>=6&&R.pc.length>=120){await say('Equipe e PC cheios.');return;}
  B.lock=true;R.bag[id]--;B.menu='moves';const e=B.enemy,p=active(),h=new Date().getHours();
  const factor=I.ballFactor(id,{enemy:e,player:p,turn:B.turn||0,caught:META.caught.includes(e.sp),night:h<6||h>=18,cave:R.journey?.route==='cave',underwater:B.underwater,fishing:B.fishing,baseSpeed:SP[e.sp].stats?.[5]||0,moonEvolution:SP[e.sp].evolution?.some(o=>o.item==='moon-stone')});
  const raw=(SP[e.sp].c||.3)*255,rate=id==='heavy-ball'?I.heavyRate(raw,window.POKEMON_WEIGHTS?.[e.sp]||0):raw;
  const chance=factor===Infinity?1:Math.min(.98,Math.max(.01,rate/255*factor*(1-.65*e.hp/e.maxHp)*(e.ailment==='sleep'||e.ailment==='freeze'?2.5:e.ailment?1.5:1)));
  sfx('throw');await say(`Você lançou ${ITEMS[id].n}!`);
  if(Math.random()<chance){const caught=JSON.parse(JSON.stringify(e));if(id==='heal-ball'){caught.hp=caught.maxHp;caught.ailment=null;caught.moves.forEach(k=>caught.pp[k]=M[k].pp);}if(id==='friend-ball')caught.friendship=200;if(id==='luxury-ball')caught.luxury=true;sfx('catch');await say(`Pegou ${nm(e)}!`);finishWin(caught);B.lock=false;render();}
  else{sfx('fail');await say(`${nm(e)} escapou!`);await enemyTurn();}
 };
 const oldHub=rHub;
 rHub=()=>{
  let html=oldHub();if(R.mode!=='classic')return html;
  if(S.shop){const nav=[...I.categories.filter(id=>id!=='general'),'general'].map(id=>button('shopTab',labels[id],id)).join('');html=html.replace(/<nav class="shop-tabs"[\s\S]*?<\/nav>/,`<nav class="shop-tabs" aria-label="Categorias da loja">${nav}</nav>`);return html;}
  const bag=`<section class="panel"><h2>Mochila</h2>${I.categories.filter(cat=>owned(cat).length).map(cat=>`<details><summary>${labels[cat]} · ${owned(cat).length}</summary><div class="grid">${owned(cat).map(id=>['healing','general'].includes(cat)?button('sel',`${ITEMS[id].ico} ${esc(ITEMS[id].n)} ×${R.bag[id]}`,id):`<div class="inventory-name">${ITEMS[id].ico}<span>${esc(ITEMS[id].n)} ×${R.bag[id]}</span></div>`).join('')}</div></details>`).join('')||'<p>Mochila vazia.</p>'}</section>`;
  html=html.replace(/<section class="panel"><h2>Mochila<\/h2>[\s\S]*?<\/section>/,bag).replace(/<section class="panel"><h2>Relíquias<\/h2>[\s\S]*?<\/section>/,'');return html;
 };
 const oldReward=rReward;
 rReward=()=>{const html=oldReward();if(R.mode!=='classic'||V.training||V.exploration)return html;return html.replace(/<section class="panel"><h2>Escolha 1 de 3<\/h2>[\s\S]*?<\/section>/,`<section class="panel">${button('back','Continuar')}</section>`);};
 // Ether move selection outside battle is shown before selecting the target card.
 const oldCard=ACT.card;ACT.card=v=>{const id=S.sel;if(R?.mode==='classic'&&I.items[id]?.effect.pp&&!I.items[id].effect.all&&!S.itemMove){S.itemTarget=Number(v);S.itemPicking=true;return;}oldCard(v);S.itemMove=null;};
 ACT.inventoryHubMove=id=>{const m=R.team[S.itemTarget];if(!m?.moves.includes(id)||!S.itemPicking)return;S.itemMove=id;S.itemPicking=false;ACT.card(String(S.itemTarget));};
 const oldRender=render;render=()=>{oldRender();if(R?.mode==='classic'&&S.itemPicking&&S.screen==='hub'&&!S.shop){const m=R.team[S.itemTarget];$app.insertAdjacentHTML('beforeend',`<section class="panel"><h3>Escolha o golpe</h3><div class="grid">${m.moves.map(id=>button('inventoryHubMove',`${esc(window.gameExpansion.moveName(id))} · ${m.pp[id]}/${M[id].pp}`,id)).join('')}</div></section>`);}};
 const oldNew=newRun,oldLoad=continueSave;newRun=id=>{oldNew(id);R.shop=null;Object.keys(I.items).forEach(id=>R.bag[id]??=0);persist();};continueSave=()=>{oldLoad();if(R){Object.keys(I.items).forEach(id=>R.bag[id]??=0);R.shop=null;persist();}};
 render();
})();
