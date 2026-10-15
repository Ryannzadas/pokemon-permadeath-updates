(() => {
 'use strict';const C=CollectionModel;C.normalize(META);
 window.alphaBadge=()=>'<span class="alpha-badge" title="Pokémon Alfa" aria-label="Alfa"><svg viewBox="0 0 24 20" aria-hidden="true"><path d="M2 3L6 1L12 9L18 1L22 3L18 10L23 16L18 19L12 13L6 19L1 16L6 10Z" fill="currentColor"/></svg> Alfa</span>';
 const button=(act,label,v='',disabled=false)=>`<button class="btn alt" data-act="${act}" data-v="${esc(v)}" ${disabled?'disabled':''}>${label}</button>`;
 const oldDex=dexRecord;dexRecord=(id,owned)=>{oldDex(id,owned);const d=C.daily(META);if(!d.observed.includes(id)&&SP[id]){d.observed.push(id);saveMeta();}};
 ACHIEVEMENTS.push({id:'complete-dex',name:'Pokédex completa',goal:'Obtenha todas as espécies disponíveis no jogo.',title:'Mestre da Pokédex',avatar:151,progress:()=>META.caught.filter(id=>SP[id]).length,target:Object.keys(SP).length});
 const oldPersist=persist;persist=()=>{oldPersist();if(R?.mode==='classic'&&R.leagueCleared&&!['battle','title'].includes(S.screen)){C.remember(META,R);saveMeta();}};
 const oldWin=winRun;winRun=()=>{
  if(!R)return;if(R.postgame){oldWin();return;}const first=!R.leagueCleared,previous=JSON.stringify(META),oldCount=R.bag['master-ball']||0;
  if(first){R.leagueCleared=true;R.bag['master-ball']=oldCount+1;}
  if(R.mode==='classic'){try{C.remember(META,R);SAVE_STORAGE.setItem(META_KEY,JSON.stringify(META));}catch(e){Object.assign(META,JSON.parse(previous));if(first){delete R.leagueCleared;R.bag['master-ball']=oldCount;}S.msg='Não foi possível guardar a jornada. Exporte o save ou remova uma cópia antiga antes de encerrar.';return;}}
  oldWin();if(R.mode==='classic'){C.remember(META,R);saveMeta();S.screen='leagueChoice';}
 };
 ACT.continueLeague=()=>{if(S.screen!=='leagueChoice'||R?.mode!=='classic')return;R.endless=true;S.screen='hub';S.shop=false;S.msg='A jornada continua. Ginásios e Liga agora usam equipes novas.';C.remember(META,R);persist();};
 ACT.endLeague=()=>{if(S.screen!=='leagueChoice')return;C.remember(META,R);saveMeta();S.screen='win';SAVE_STORAGE.removeItem(SAVE_KEY);};
 ACT.legendary=()=>{
  if(!R?.leagueCleared||R.legendaryCompleted||!['hub','win'].includes(S.screen)||!R.team.some(m=>m.hp>0))return;
  S.screen='hub';const pending=R.journey?.pending;if(R.journey)R.journey.pending=null;
  startBattle(false);if(R.journey)R.journey.pending=pending;
  if(!B)return;const e=window.gameExpansion.makeEnemy('mewtwo',100);B.enemies=[e];B.enemy=e;B.enemySlots=[0];B.boss=false;B.double=false;B.legendary=true;B.exploration=true;B.trainer=null;B.log=['Um Mewtwo de nível 100 apareceu!'];S.screen='battle';dexRecord('mewtwo');
 };
 const oldHub=rHub;rHub=()=>oldHub()+(R?.leagueCleared&&!R.legendaryCompleted?`<section class="panel">${button('legendary','Encontrar Mewtwo · Nv. 100')}</section>`:'');
 const oldWinScreen=rWin;rWin=()=>oldWinScreen()+(R?.leagueCleared&&!R.legendaryCompleted?button('legendary','Encontrar Mewtwo · Nv. 100'):'');
 ACT.savedJourneys=()=>{if(['title','hub'].includes(S.screen)){S.collectionReturn=S.screen;S.screen='savedJourneys';}};
 ACT.resumeCurrentClassic=()=>{if(S.screen!=='savedJourneys'||!ModeSaveStore.slots().classic)return;ModeSaveStore.select('classic');continueSave();};
 ACT.deleteJourney=id=>{if(S.screen!=='savedJourneys'||!confirm('Excluir esta cópia da jornada?'))return;META.classicRuns=META.classicRuns.filter(x=>x.R.id!==id);saveMeta();};
 ACT.resumeJourney=id=>{if(S.screen!=='savedJourneys')return;try{if(R?.mode==='classic')C.remember(META,R);const existing=ModeSaveStore.slots().classic;if(existing?.R)C.remember(META,existing.R);const entry=C.restore(META,id);SAVE_STORAGE.setItem(META_KEY,JSON.stringify(META));ModeSaveStore.select('classic',entry.R.postgame?'double':'standard');SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify(entry));continueSave();}catch(e){S.msg=e.message;}};
 const oldBack=ACT.back;ACT.back=()=>{oldBack();if(R?.mode==='classic'&&R.endless&&S.screen==='win'){S.screen='leagueChoice';C.remember(META,R);saveMeta();}};
 const oldTitle=rTitle;rTitle=()=>oldTitle().replace('</nav>',`${button('savedJourneys','Jornadas clássicas')}${button('daily','Desafios diários')}${button('memorial','Memorial')}</nav>`);
 ACT.daily=()=>{if(['title','hub'].includes(S.screen)){S.collectionReturn=S.screen;S.screen='daily';C.daily(META);}};
 ACT.claimDaily=id=>{if(S.screen!=='daily')return;const before=JSON.stringify(META);if(C.claim(META,id)){try{SAVE_STORAGE.setItem(META_KEY,JSON.stringify(META));S.msg='Título e avatar liberados!';}catch{Object.assign(META,JSON.parse(before));S.msg='Não foi possível salvar.';}}};
 ACT.memorial=()=>{if(['title','hub','gameover'].includes(S.screen)){S.collectionReturn=S.screen;S.screen='memorial';}};
 ACT.rememberPokemon=v=>{if(S.screen!=='memorial'||!R)return;const m=R.team[Number(v)];if(!m||R.mode!=='permadeath'||m.hp>0)return;try{C.memorial(META,m,R);SAVE_STORAGE.setItem(META_KEY,JSON.stringify(META));}catch(e){S.msg=e.message;}};
 ACT.removeMemorial=key=>{if(S.screen==='memorial'){META.memorial=META.memorial.filter(x=>x.key!==key);saveMeta();}};
 ACT.collectionBack=()=>{if(['daily','memorial','savedJourneys','leagueChoice'].includes(S.screen)){S.screen=S.collectionReturn||'title';S.msg='';}};
 const oldOver=rOver;rOver=()=>oldOver()+button('memorial','Escolher Pokémon para o memorial');
 const oldFinish=finishWin;finishWin=caught=>{const legendary=!!B?.legendary;oldFinish(caught);if(legendary){R.legendaryCompleted=true;persist();}if(!V?.training){const d=C.daily(META);d.wins++;saveMeta();}};
 const oldEvent=ACT.eventChoice;ACT.eventChoice=v=>{const pending=R?.journey?.pending;oldEvent(v);if(pending&&!R?.journey?.pending){C.daily(META).events++;saveMeta();}};
 const oldProfile=window.desktopProfileRewards;window.desktopProfileRewards=()=>{const p=oldProfile(),d=C.dailyGoals.filter(x=>(META.dailyRewards||[]).includes(x.id));return {avatars:[...new Set([...p.avatars,...d.map(x=>x.avatar)])],titles:[...new Set([...p.titles,...d.map(x=>x.title)])]};};
 function legacyClassicRecords(current){
  const full=new Set(META.classicRuns.map(x=>x.R.id));if(current)full.add(current.id);
  const postgames=new Set((META.postgameRecords||[]).map(x=>x.id)),records=new Map();
  for(const h of META.history||[])if(h.mode==='classic'&&h.outcome==='champion'&&!full.has(h.id)&&!postgames.has(h.id))records.set(h.id,{...h,name:h.trainerName||'Treinador',date:h.ended});
  for(const t of META.championTeams||[])if(t.mode==='classic'&&!full.has(t.id)){const h=records.get(t.id)||{};records.set(t.id,{...h,...t,name:h.name||t.trainerName||'Treinador',team:t.original||t.team});}
  return [...records.values()];
 }
 const oldRender=render;render=()=>{
  const page=S.screen;oldRender();let html='';
  if(page==='leagueChoice')html=`<section class="panel"><h2>Liga concluída!</h2><p>Você recebeu uma Master Ball.</p><div class="grid">${button('continueLeague','Continuar com a equipe')}${button('endLeague','Encerrar e guardar jornada')}</div></section>`;
  if(page==='savedJourneys'){const current=ModeSaveStore.slots().classic?.R,legacy=legacyClassicRecords(current);html=`<section class="panel"><h2>Jornadas clássicas</h2>${msgBox()}${current?`<article class="journal-entry"><h3>${esc(current.trainerName||'Jornada atual')}</h3><small>Etapa ${current.battle+1}</small>${button('resumeCurrentClassic','Continuar jornada atual')}</article>`:''}${!current&&!legacy.length&&!META.classicRuns.some(x=>x.R.leagueCleared)?'<p>Nenhuma jornada clássica salva.</p>':''}${META.classicRuns.filter(x=>x.R.leagueCleared).map(x=>`<article class="journal-entry"><h3>${esc(x.R.trainerName||'Treinador')}</h3><small>Clássico · ${x.R.won} vitórias</small><div class="journal-team">${x.R.team.map(m=>`<img src="${SPRITE(SP[m.sp].dex)}" alt="${esc(SP[m.sp].n)}">`).join('')}</div>${button('resumeJourney','Continuar',x.R.id)}<details><summary>Gerenciar</summary>${button('deleteJourney','Excluir cópia',x.R.id)}</details></article>`).join('')}${legacy.map(x=>`<article class="journal-entry legacy-classic-record"><h3>Liga concluída · Clássico</h3><small>${esc(x.date?new Date(x.date).toLocaleDateString('pt-BR'):x.name)}</small><div class="journal-team">${(x.team||[]).filter(m=>SP[m.sp]).map(m=>`<img src="${SPRITE(SP[m.sp].dex)}" alt="${esc(SP[m.sp].n)}">`).join('')}</div><p>Registro antigo · sem save completo para continuar.</p></article>`).join('')}</section>`;}
  if(page==='daily'){const d=C.daily(META);html=`<section class="panel"><h2>Desafios diários</h2>${msgBox()}<div class="grid">${C.dailyGoals.map(g=>{const progress=g.id==='observed'?d.observed.length:d[g.id];return `<article class="card"><h3>${g.n}</h3><p>${Math.min(progress,g.goal)}/${g.goal}</p>${button('claimDaily',d.claimed.includes(g.id)?'Recebido':'Receber',g.id,progress<g.goal||d.claimed.includes(g.id))}<details><summary>Recompensa</summary><p>Título: ${g.title} · avatar permanente.</p></details></article>`;}).join('')}</div></section>`;}
  if(page==='memorial')html=`<section class="panel"><h2>Memorial escolhido por você</h2>${msgBox()}${R?.mode==='permadeath'?`<div class="grid">${R.team.map((m,i)=>m.hp<=0?button('rememberPokemon',`${art(m)}Guardar ${esc(nm(m))}`,String(i)):'' ).join('')}</div>`:''}<div class="journal-grid">${META.memorial.map(m=>`<article class="journal-card"><img src="${SPRITE(SP[m.sp].dex)}" alt=""><strong>${esc(SP[m.sp].n)}</strong><small>Nv. ${m.lvl} · ${esc(m.trainer||'Treinador')}</small>${button('removeMemorial','Remover',m.key)}</article>`).join('')||'<p>Nenhum Pokémon escolhido ainda.</p>'}</div></section>`;
  if(html){CampWorld.destroy();screenMusic();$app.innerHTML=head()+html;const toolbar=document.getElementById('game-toolbar');if(toolbar&&page!=='leagueChoice')toolbar.innerHTML=button('collectionBack','← Voltar');window.dispatchEvent(new Event('game-screen-changed'));}
 };
 render();
})();
