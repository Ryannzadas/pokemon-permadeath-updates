/* Journey bag presentation. Item rules stay in the engine: an item is usable here only when
   the engine's own bag markup offers it (data-act="sel"), so each mode keeps its rules. */
(() => {
 'use strict';
 const I=window.InventoryModel;
 const order=['healing','balls','battle','held','evolution','tm','general','relics'];
 const labels={all:'Todos',healing:'Cura',balls:'Pokébolas',battle:'Itens de batalha',held:'Equipáveis',evolution:'Evolução',tm:'TM/HM',general:'Outros',relics:'Relíquias'};
 const hints={balls:'Use durante a batalha',battle:'Use durante a batalha',held:'Equipe pelo sumário do Pokémon',evolution:'Use pelo sumário do Pokémon',tm:'Ensine pelo sumário do Pokémon',general:'',relics:'Efeito passivo nesta jornada',healing:''};
 function category(id){
  if(id.startsWith('tm:'))return 'tm';
  if(JourneyStrategy.items[id])return 'held';
  if(I.items[id])return I.items[id].category;
  if(I.custom.has(id))return 'general';
  return 'evolution';
 }
 function entries(){
  const list=Object.keys(R.bag).filter(id=>(R.bag[id]||0)>0&&ITEMS[id]&&!(R.mode==='classic'&&I.custom.has(id))).map(id=>{
   const tm=id.startsWith('tm:'),move=tm?id.slice(3):null;
   return {id,cat:category(id),qty:R.bag[id],
    name:tm?window.gameExpansion.moveName(move):ITEMS[id].n,
    desc:tm?`TM/HM · ${TYPES[M[move]?.t]?.[0]||'Golpe'}`:ITEMS[id].d||'',
    ico:tm?itemSprite('tm-'+M[move]?.t):ITEMS[id].ico||''};
  });
  if(R.mode!=='classic')for(const [id,qty]of Object.entries(R.relics||{}))if(qty>0&&RELICS[id])list.push({id:'relic:'+id,cat:'relics',qty,name:RELICS[id].n,desc:RELICS[id].d||'',ico:RELICS[id].ico||''});
  return list.sort((a,b)=>order.indexOf(a.cat)-order.indexOf(b.cat)||a.name.localeCompare(b.name,'pt-BR'));
 }
 function card(e,usable){
  const selected=S.sel===e.id;
  const action=usable.has(e.id)?`<button class="btn ${selected?'':'alt'} bag-item-use" data-act="sel" data-v="${esc(e.id)}" aria-pressed="${selected}">${selected?'Cancelar':'Usar'}</button>`:hints[e.cat]?`<small class="bag-item-hint">${hints[e.cat]}</small>`:'';
  return `<article class="bag-item${selected?' selected':''}"><div class="bag-item-art">${e.ico}</div><div class="bag-item-info"><strong>${esc(e.name)}</strong>${e.desc?`<small>${esc(e.desc)}</small>`:''}</div><span class="bag-item-qty">×${e.qty}</span>${action}</article>`;
 }
 function html(engineBag){
  const usable=new Set([...engineBag.matchAll(/data-act="sel" data-v="([^"]+)"/g)].map(m=>m[1]));
  const all=entries(),cats=order.filter(c=>all.some(e=>e.cat===c));
  const tab=cats.includes(S.bagTab)?S.bagTab:'all',shown=tab==='all'?all:all.filter(e=>e.cat===tab);
  const count=c=>all.filter(e=>c==='all'||e.cat===c).length;
  const tabs=cats.length>1?`<nav class="bag-tabs" aria-label="Categorias da mochila">${['all',...cats].map(c=>`<button class="btn ${c===tab?'':'alt'}" data-act="bagTab" data-v="${c}" aria-pressed="${c===tab}">${labels[c]}<span>${count(c)}</span></button>`).join('')}</nav>`:'';
  const body=all.length?`<div class="bag-grid">${shown.map(e=>card(e,usable)).join('')}</div>`:`<div class="bag-empty"><p>Sua mochila está vazia.</p><button class="btn alt" data-act="shop">Ir à Loja</button></div>`;
  const total=all.reduce((n,e)=>n+e.qty,0);
  return `<section class="panel bag-view"><header class="bag-head"><h2>Mochila</h2><small>${total} ${total===1?'item':'itens'}</small></header>${tabs}${body}</section>`;
 }
 ACT.bagTab=c=>{if(order.includes(c)||c==='all')S.bagTab=c;};
 // Reopening the bag starts on "Todos", like the shop starts on its first category.
 const openBag=ACT.visualBag;ACT.visualBag=(...args)=>{S.bagTab='all';return openBag(...args);};
 window.BagView=Object.freeze({html});
})();
