// Presentation adapters preserve live game controls, models and delegated events.
// A screen is decorated only after its authoritative renderer has run.
const headings={starter:['PRIMEIRO PARCEIRO','Escolha seu inicial'],trainerName:['SEU PERSONAGEM','Como vamos te chamar?'],dex:['SUAS DESCOBERTAS','Pokédex'],journal:['SUAS HISTÓRIAS','Diário do treinador'],pc:['SEUS COMPANHEIROS','PC Pokémon'],routes:['NOVOS CAMINHOS','Escolha seu caminho'],missions:['DURANTE A JORNADA','Missões da jornada'],daily:['UM OBJETIVO POR DIA','Desafio diário'],memorial:['ESCOLHIDOS POR VOCÊ','Memorial'],savedJourneys:['CONTINUE A HISTÓRIA','Jornadas clássicas salvas'],doubleChoice:['DOIS PARCEIROS EM CAMPO','Pós-game em dupla'],teams:['PRONTO PARA BATALHAR','Team Builder'],teamEdit:['UMA EQUIPE DO SEU JEITO','Montar time'],teamText:['COMPARTILHE SUA COMPOSIÇÃO','Importar ou exportar time'],social:['SUA COMUNIDADE','Social'],friendMenu:['SEUS AMIGOS','Perfil do treinador'],inviteBattle:['BATALHA AMISTOSA','Convidar para batalha'],acceptBattle:['CONVITE RECEBIDO','Escolha sua equipe'],leagueCreate:['REGRAS CLARAS','Criar liga'],leagueEdit:['SUA COMPETIÇÃO','Editar liga'],league:['CADA RODADA CONTA','Liga Pokémon'],reward:['CADA BATALHA ENSINA','Resultado da batalha'],gameover:['UMA HISTÓRIA PARA RECORDAR','Fim da jornada'],win:['CAMPEÕES DE KANTO','Você venceu a Liga!'],leagueChoice:['A AVENTURA CONTINUA','Campeão de Kanto'],journeyEvent:['ENTRE BATALHAS','Um encontro no caminho']};
function heading(kicker,title){const h=document.createElement('div');h.className='game-screen-heading';const k=document.createElement('span');k.className='react-kicker';k.textContent=kicker;const t=document.createElement('h1');t.textContent=title;h.append(k,t);return h;}
function groupFormFields(panel){
 const labels=[...panel.children].filter(n=>n.tagName==='LABEL');if(labels.length<2)return;
 const form=document.createElement('div');form.className='game-form-grid';labels[0].before(form);labels.forEach(l=>form.append(l));
}
function decorateMoves(){
 for(const el of $app.querySelectorAll('.moves .mv,.builder-moves [data-act=teamToggleMove]')){
  const id=el.dataset.act==='teamToggleMove'?el.dataset.v:null,m=id?window.OnlineDex?.moves[id]:null;
  const color=m?TYPES[m.t]?.[1]:el.style.getPropertyValue('--move-color');if(!color)continue;
  const hex=color.replace('#',''),parts=hex.length===3?hex.split('').map(x=>parseInt(x+x,16)):hex.match(/.{2}/g)?.map(x=>parseInt(x,16));
  if(!parts)continue;const lum=parts.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  el.style.setProperty('--move-color',color);el.style.setProperty('--move-ink',lum>.179?'#14251b':'#ffffff');
 }
}
export function presentScreen(){
 document.body.dataset.gameScreen=S.screen;
 $app.classList.add('game-presentation');
 const h=headings[S.screen],panel=$app.querySelector(':scope>.panel');
 if(h&&panel&&!panel.classList.contains('trainer-intro')){
  const old=panel.querySelector(':scope>h2,:scope>.journal-heading');
  if(old){let title=old.querySelector?.('h2')?.textContent||old.textContent;
   // Keep functional journal tabs; remove only their duplicate heading.
   if(old.classList.contains('journal-heading'))old.querySelector('h2')?.remove();else old.remove();
   panel.before(heading(h[0],['league','friendMenu'].includes(S.screen)&&title.trim()?title.trim():h[1]));
  }
  panel.classList.add('game-screen-panel','screen-'+S.screen);
 }
 if(S.screen==='hub'&&S.shop){const p=$app.querySelector('.shop-panel');if(p){p.querySelector(':scope>h2')?.remove();p.before(heading('PREPARE SUA PRÓXIMA BATALHA','Loja'));p.classList.add('game-screen-panel');}}
 if(S.screen==='social'){
  const grid=document.createElement('div');grid.className='game-social-layout';
  const p=$app.querySelector('.screen-social');if(p){const sections=[...p.children].filter(el=>el.matches('details,section,.journal-grid'));if(sections.length>1){sections[0].before(grid);sections.forEach(el=>grid.append(el));}}
 }
 if(['leagueCreate','leagueEdit','inviteBattle','acceptBattle'].includes(S.screen)&&panel)groupFormFields(panel);
 if(S.screen==='teamEdit'){
  const p=$app.querySelector('.builder-editor');p?.classList.add('game-builder-columns');
  const moves=$app.querySelector('.builder-moves');moves?.setAttribute('aria-label','Golpes compatíveis');
 }
 if(S.screen==='starter'){
  $app.querySelectorAll('.starter-card').forEach(card=>card.classList.add('game-starter-card'));
 }
 if(S.screen==='dex')$app.querySelector('.journal-grid')?.classList.add('game-dex-grid');
 if(S.screen==='pc')$app.querySelectorAll('.journal-grid').forEach(el=>el.classList.add('game-pc-grid'));
 if(S.screen==='journal')$app.querySelectorAll('.journal-entry').forEach(el=>el.classList.add('game-history-card'));
 if(S.screen==='reward')$app.querySelectorAll('.panel').forEach((el,i)=>el.classList.add(i===0?'game-result-hero':'game-result-detail'));
 if(['win','leagueChoice','gameover'].includes(S.screen))$app.querySelector('.panel')?.classList.add('game-finale');
 decorateMoves();
}
export function captureSummary(){
 if(S.screen!=='summary')return null;
 const panel=$app.querySelector(':scope>.panel');if(!panel)return null;
 let evolution='',collect=false;
 for(const el of panel.children){if(el.tagName==='H3'&&el.textContent.trim()==='Evolução'){collect=true;continue;}if(el.matches('.summary-strategy')||el.tagName==='H3'&&el.textContent.includes('Golpes'))collect=false;if(collect)evolution+=el.outerHTML;}
 const trade=panel.querySelector('[data-act=tradePokemon]');if(trade)evolution+=trade.outerHTML;
 return {evolution,strategy:panel.querySelector('.summary-strategy')?.outerHTML||'',replace:panel.querySelector('.move-replace')?.outerHTML||''};
}
export function installPresentationActions(){
 ACT.presentationPCBox=box=>{if(S.screen==='pc'&&['run','champions'].includes(box))S.presentationPCBox=box;};
}
export function presentCompanions(){
 if(S.screen==='intro'&&B?.trainer){
  const panel=$app.querySelector('.trainer-intro');if(panel&&!panel.querySelector('.game-intro-party')){
   const teams=document.createElement('div');teams.className='game-intro-party';teams.setAttribute('aria-label','Equipe do próximo adversário');
   for(const m of B.enemies){const entry=document.createElement('article');entry.innerHTML=art(m)+`<strong>${esc(nm(m))}</strong><small>Nv. ${m.lvl}</small>`;teams.append(entry);}
   panel.querySelector('[data-act=beginTrainer]')?.before(teams);
  }
 }
 if(S.screen==='pc'){
  const p=$app.querySelector('.panel');if(!p)return;const heads=[...p.querySelectorAll(':scope>h3')],special=heads.find(h=>h.textContent.includes('campeões'));if(!special)return;
  const regular=document.createElement('div');regular.className='game-pc-run';const champs=document.createElement('div');champs.className='game-pc-champions';const children=[...p.children];let into=false;
  for(const node of children){if(node===special)into=true;if(into)champs.append(node);else if(node.tagName==='H3'||node.classList.contains('journal-grid'))regular.append(node);}
  const hasRun=regular.children.length>0,selected=hasRun?(S.presentationPCBox||'run'):'champions';
  const nav=document.createElement('nav');nav.className='game-page-tabs';nav.setAttribute('aria-label','Caixas do PC');nav.innerHTML=(hasRun?`<button class="btn ${selected==='run'?'':'alt'}" data-act="presentationPCBox" data-v="run" aria-pressed="${selected==='run'}">Caixa da jornada</button>`:'')+`<button class="btn ${selected==='champions'?'':'alt'}" data-act="presentationPCBox" data-v="champions" aria-pressed="${selected==='champions'}">Equipes campeãs</button>`;
  p.append(nav,regular,champs);regular.hidden=selected!=='run';champs.hidden=selected!=='champions';
 }
}
