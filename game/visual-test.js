/* Teste visual isolado: aparência nova sobre as regras e ações da 0.4.0. */
(() => {
'use strict';
const b=(act,label,value='',cls='alt')=>`<button class="btn ${cls}" data-act="${act}" data-v="${esc(value)}">${label}</button>`;
const labels={title:'Menu',hub:'Jornada',starter:'Escolha seu inicial',modeSelect:'Jogar',character:'Escolha seu treinador',trainerName:'Nome do treinador',continueSelect:'Continuar',dex:'Pokédex',journal:'Diário do treinador',summary:'Sumário do Pokémon',pc:'PC Pokémon',camp:'Acampamento',center:'Centro Pokémon',routes:'Explorar',missions:'Missões',social:'Social',teams:'Team Builder',teamEdit:'Team Builder',teamText:'Importar time',league:'Liga dos amigos',leagueCreate:'Criar liga',leagueEdit:'Editar liga',battle:'Batalha',multiplayer:'Batalha online',intro:'Próximo desafio',reward:'Resultado',daily:'Desafios',savedJourneys:'Jornadas clássicas',doubleChoice:'Pós-game em duplas',win:'Campeão',gameover:'Fim da jornada',routeWorld:'Explorar a área',journeyEvent:'Encontro no caminho'};
let titlePanel='',hubPanel='';
ACT.visualCollection=()=>{if(S.screen!=='title'&&S.screen!=='hub')return;if(S.screen==='title')titlePanel='collection';else hubPanel='collection';};
ACT.visualOptions=()=>{if(S.screen==='title')titlePanel='options';};
ACT.visualHome=()=>{titlePanel='';hubPanel='';S.shop=false;};
ACT.visualTeam=()=>{if(S.screen==='hub'){hubPanel='team';S.shop=false;}};
ACT.visualBag=()=>{if(S.screen==='hub'){hubPanel='bag';S.shop=false;}};
const titleStart=ACT.start;ACT.start=(...args)=>{titlePanel='';hubPanel='';return titleStart(...args);};
const titleBack=ACT.accountTitle;ACT.accountTitle=(...args)=>{titlePanel='';hubPanel='';return titleBack(...args);};
function collection(){return `<section class="panel visual-collection"><h2>Coleção</h2><div class="visual-collection-grid">${b('dex','<span>▤</span>Pokédex')}${b('journal','<span>▣</span>Diário do treinador','history')}${b('journal','<span>✦</span>Conquistas','achievements')}</div><div class="row visual-collection-extra">${b('daily','Desafios')}${b('savedJourneys','Jornadas clássicas')}${b('memorial','Memorial')}${b('teams','Team Builder')}</div></section>`;}
rTitle=()=>{
 if(titlePanel==='collection')return collection();
 if(titlePanel==='options')return `<div class="visual-options-scene"><section class="panel"><h2>Opções de jogo</h2><div class="settings">${b('spd',`Velocidade ×${CFG.speed}`)}${b('snd',`Som: ${CFG.sound?'ligado':'mudo'}`)}${b('mus',`Música: ${CFG.music?'ligada':'desligada'}`)}${b('moveLanguage',`Golpes: ${CFG.moveLanguage==='en'?'English':'Português'}`)}</div><p class="mute tiny">As alterações são salvas automaticamente.</p></section></div>`;
 return `<section class="visual-title"><div class="visual-title-panel"><div class="visual-emblem">◉</div><h2>POKÉMON</h2><h3>PERMADEATH</h3><nav aria-label="Menu principal">${b('start','<span>◉　Jogar</span><i>▸</i>','','')}${Object.keys(ModeSaveStore.slots()).length?b('cont','▤　Continuar'):''}${b('visualCollection','▣　Coleção')}${b('social','♟　Social')}${b('visualOptions','⚙　Configurações')}${META.champ||(META.championTeams||[]).length?b('openDouble','◇　Pós-game'):''}</nav><div class="visual-title-footer">UMA NOVA JORNADA</div></div><div class="visual-title-partner"><img src="${SPRITE(133)}" alt="Eevee"></div><small class="visual-test-label">VERSÃO ${window.GAME_VERSION||''}</small></section>`;
};
const oldHub=rHub;
function compact(m,i){return `<article class="card visual-mon${m.hp<=0?' dead':''}" data-act="summary" data-v="${i}">${art(m)}<div class="visual-mon-info"><strong>${esc(nm(m))}${m.alpha?window.alphaBadge?.()||'':''}</strong><small>Nv. ${m.lvl}${i===R.active?' · ★':''}</small>${types(m)}${hpBar(m)}<small>${m.hp} / ${m.maxHp}</small></div></article>`;}
rHub=()=>{
 const original=oldHub();if(S.shop)return original;
 if(hubPanel==='collection')return collection();
 if(hubPanel==='team')return `<section class="panel"><h2>Equipe</h2><div class="grid visual-team-full">${R.team.map(teamCard).join('')}</div></section>`;
 if(hubPanel==='bag'){const bag=original.match(/<section class="panel"><h2>Mochila<\/h2>[\s\S]*?<\/section>/)?.[0]||'<section class="panel"><h2>Mochila</h2><p>Mochila vazia.</p></section>';return `<div class="visual-bag">${window.BagView?BagView.html(bag):bag}${S.sel?`<section class="panel bag-target"><h3>Usar ${esc(ITEMS[S.sel]?.n||'item')} em qual Pokémon?</h3><div class="grid">${R.team.map(teamCard).join('')}</div></section>`:''}</div>`;}

 const boss=nextIsBoss(),next=nextBoss(),portrait=(CAMP_ASSETS.trainers.find(t=>t.id===R.trainer)||CAMP_ASSETS.trainers[0]).portrait;
 const buttons=b('go',boss?'⚔ Desafiar ginásio':'⚔ Batalhar','','gold')+b('routes','▧ Explorar')+b('camp','⌂ Acampamento');
 const extra=b('shop','Loja')+(R.mode==='classic'?b('center','Centro Pokémon'):b('rest','Recuperar · ₽60'))+b('pc','PC Pokémon')+b('trainerCard','Trainer Card')+b('missions','Missões')+(R.mode==='classic'?'':b('train',`Treino · ${trainingLeft()}/${TRAIN_LIMIT}`))+(boss&&Math.floor(R.battle/5)<8?b('explore','Explorar a área'):'')+(R.journey?.pending?b('eventOpen','Continuar evento'):'')+(R.leagueCleared&&!R.legendaryCompleted?b('legendary','Encontrar Mewtwo · Nv. 100'):'');
 return `${msgBox()}<section class="visual-journey"><div class="visual-journey-left"><div class="visual-map" aria-label="Seu acampamento"><img class="visual-map-trainer" src="${portrait}" alt="Seu treinador">${art(active())}</div><nav class="visual-main-actions">${buttons}</nav><section class="panel visual-next"><h3>Próximo desafio</h3><div class="row"><strong>${boss?esc(next.title):`Batalha ${R.battle+1}`}</strong><span class="mute">${boss?'Prepare sua equipe':'Caminho para a Liga'}</span></div>${gymPips()}</section><nav class="visual-extra-actions">${extra}</nav><details class="visual-more"><summary>Mais opções</summary><div class="row">${b('teams','Team Builder')}${b('social','Social')}${b('daily','Desafios')}${b('abandon','Abandonar jornada','','danger')}</div></details></div><section class="panel visual-team"><h2>Equipe</h2><div class="visual-team-grid">${R.team.map(compact).join('')}</div><small class="visual-levelcap">Limite da etapa · Nv. ${JourneyLevelCap.current()}</small></section></section>${evoPanel()}`;
};
// Shared with the Phaser battle scene, which draws the same arena backgrounds.
window.battleArenaName=()=>routeArena();
function routeArena(){if(S.screen==='multiplayer')return 'Estádio';if(B?.boss){let idx=Math.floor((R?.battle||0)/5);return ['Brock','Misty','Surge','Erika','Koga','Sabrina','Blaine','Giovanni'][idx]||'Estádio';}return ({forest:'Floresta',cave:'Caverna',lake:'Lago'})[R?.journey?.route]||'Floresta';}
const previousRender=render;
render=()=>{
 previousRender();const toolbar=document.getElementById('game-toolbar');const isTitle=S.screen==='title'&&!titlePanel;
 document.body.classList.toggle('visual-title-active',isTitle);document.body.dataset.visualPanel=S.screen==='title'?titlePanel:S.screen==='hub'?hubPanel:'';
 const title=S.screen==='title'?(titlePanel==='collection'?'Coleção':titlePanel==='options'?'Configurações':'Menu'):S.screen==='hub'?(S.shop?'Loja':hubPanel==='bag'?'Mochila':hubPanel==='team'?'Equipe':hubPanel==='collection'?'Coleção':'Jornada'):S.screen==='journal'&&S.journal==='achievements'?'Conquistas':labels[S.screen]||'Pokémon';
 const brand=toolbar?.querySelector('.toolbar-brand');if(brand)brand.textContent=title;
 else if(toolbar)toolbar.insertAdjacentHTML('afterbegin',`<span class="toolbar-brand">${esc(title)}</span>`);
 if((S.screen==='title'&&titlePanel)||(S.screen==='hub'&&hubPanel)){const actions=toolbar.querySelector('.toolbar-actions')||toolbar;actions.insertAdjacentHTML('afterbegin',b('visualHome','← Voltar'));}
 document.getElementById('visual-bottom-nav')?.remove();
 if(R&&['hub','summary','pc','dex','journal','camp','center','routes','missions'].includes(S.screen)){
  const nav=document.createElement('nav');nav.id='visual-bottom-nav';nav.setAttribute('aria-label','Atalhos da jornada');
  const inHub=S.screen==='hub';nav.innerHTML=`${inHub?b('visualTeam','◉ Equipe'):b('visualReturnHub','◉ Jornada')}${inHub?b('visualBag','♧ Mochila'):b('visualPC','▣ PC')}${b('dex','▤ Pokédex')}${b('journal','▣ Diário','history')}`;document.body.appendChild(nav);
 }
 const arena=$app.querySelector('.battle-classic,.handheld-arena');if(arena){arena.style.backgroundImage=`url("assets/visual/${routeArena()}.webp")`;arena.classList.add('visual-arena');}
 $app.querySelectorAll('.shop-item').forEach(card=>{const button=card.querySelector('[data-act="buy"]');if(!button)return;const item=R.shop?.[Number(button.dataset.v)];if(item&&!card.querySelector('.visual-shop-price')){const money=document.createElement('div');money.className='visual-shop-price';money.textContent='₽ '+item.price.toLocaleString('pt-BR');card.querySelector('.inventory-name')?.after(money);}});
};
ACT.visualPC=()=>{ACT.visualReturnHub();if(S.screen==='hub')ACT.pc();};
ACT.visualReturnHub=()=>{if(['dex','journal','summary','pc'].includes(S.screen))ACT.subBack();if(S.screen==='camp')ACT.campExit();else if(S.screen==='center')ACT.centerExit();else if(['routes','missions'].includes(S.screen))ACT.journeyBack();if(S.screen==='hub'){S.shop=false;S.sel=null;}hubPanel='';};
// Existing delegated actions on the app are reused by the fixed navigation.
document.addEventListener('click',async e=>{const el=e.target.closest('#visual-bottom-nav [data-act],#game-toolbar [data-act]');if(!el||el.disabled||$app.inert||document.querySelector('.profile-panel'))return;const fn=ACT[el.dataset.act];if(!fn)return;try{menuActionSound(el.dataset.act);await fn(el.dataset.v);render();}catch(error){console.error(error);}});
render();
})();
