(() => {
  'use strict';
  const J=JourneyModel,T=JourneyStrategy;
  window.journeyHeldItems=T.items;
  ACT.shopTab=tab=>{if(S.screen==='hub'&&S.shop&&['general','held'].includes(tab))S.shopTab=tab;};
  const pages=['routes','missions','journeyEvent'];
  let cardOpen=false,cardFocus=null,lastScreen=null;
  const button=(act,label,value='',disabled=false)=>`<button class="btn alt" data-act="${act}" data-v="${esc(value)}" ${disabled?'disabled':''}>${label}</button>`;
  const trainer=()=>CAMP_ASSETS.trainers.find(t=>t.id===R?.trainer);
  const header=title=>`<div class="journey-heading"><h2>${title}</h2>${button('journeyBack','Voltar à jornada')}</div>`;
  const oldPersist=persist;
  persist=()=>{
    if(R&&pages.includes(S.screen)){SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify({R,S:{screen:'hub',msg:'',shop:false,sel:null},V}));return;}
    oldPersist();
  };
  const oldRun=newRun,oldLoad=continueSave;
  newRun=id=>{oldRun(id);J.normalize(R);persist();};
  continueSave=()=>{oldLoad();if(R&&S.screen!=='gameover'){J.normalize(R);persist();if(S.screen==='hub'&&R.journey.pending)S.screen='journeyEvent';}};
  function showEvent(){if(R&&S.screen==='hub'&&J.normalize(R).pending){S.screen='journeyEvent';S.shop=false;persist();}}
  for(const action of ['reward','back','confirmTrainer']){
    const original=ACT[action];ACT[action]=v=>{original(v);showEvent();};
  }
  const originalBattle=startBattle;
  startBattle=train=>{if(!train&&R&&S.screen==='hub'&&J.normalize(R).pending){showEvent();return;}originalBattle(train);};
  ACT.routes=()=>{if(S.screen==='hub'&&R){J.normalize(R);S.screen='routes';S.shop=false;}};
  ACT.route=id=>{if(S.screen!=='routes'||!J.routes[id])return;J.normalize(R).route=id;S.msg=`Caminho escolhido: ${J.routes[id].name}.`;persist();};
  ACT.missions=()=>{if(['hub','camp'].includes(S.screen)&&R){if(S.screen==='camp')ACT.campExit();J.normalize(R);S.screen='missions';S.shop=false;}};
  ACT.journeyBack=()=>{if(pages.includes(S.screen)){S.screen='hub';S.shop=false;persist();}};
  ACT.eventOpen=()=>showEvent();
  function transact(operation){
    const previous=JSON.stringify(R);
    try{operation();persist();return true;}catch(e){R=JSON.parse(previous);S.msg='Não foi possível salvar. Sua escolha não foi aplicada.';return false;}
  }
  ACT.eventChoice=choice=>{
    if(S.screen!=='journeyEvent'||!['care','observe'].includes(choice))return;
    const j=J.normalize(R);if(!j.pending)return;
    const event=j.pending,route=J.routes[j.route],companion=R.team.find(m=>m.hp>0);
    if(choice==='care'&&event==='traveler'&&R.money<25)return;
    let notice='';
    if(!transact(()=>{
      if(event==='help'){
        if(choice==='care'&&companion){companion.friendship=Math.min(255,companion.friendship+5);notice=`${nm(companion)} ajudou um Pokémon e ganhou 5 de amizade.`;}
        else {J.observe(R,route.species);notice=`Você observou ${SP[route.species].n} sem precisar batalhar.`;}
      }else if(event==='traveler'){
        if(choice==='care'){R.money-=25;R.bag['oran-berry']=(R.bag['oran-berry']||0)+1;notice='Você comprou uma Oran Berry por ₽25.';}
        else {if(companion)companion.friendship=Math.min(255,companion.friendship+3);notice='Uma conversa tranquila com o viajante aproximou você da equipe: +3 de amizade para seu primeiro companheiro vivo.';}
      }else{
        if(choice==='care'){R.bag['oran-berry']=(R.bag['oran-berry']||0)+1;notice='Você encontrou uma Oran Berry no caminho.';}
        else {J.observe(R,route.species);notice=`Pela paisagem, você avistou ${SP[route.species].n}.`;}
      }
      j.pending=null;j.events++;j.log.push(notice);j.log=j.log.slice(-8);
    }))return;
    if(choice==='observe'&&['help','view'].includes(event))dexRecord(route.species);
    S.screen='hub';S.msg=notice;persist();
  };
  ACT.claimMission=id=>{
    if(S.screen!=='missions'||!R)return;
    const m=J.missions.find(m=>m.id===id);
    const rewards=META.journeyRewards||[];
    if(!m||rewards.includes(id)||J.progress(R,id)<m.goal)return;
    const previous=rewards.slice();META.journeyRewards=[...rewards,id];
    try{SAVE_STORAGE.setItem(META_KEY,JSON.stringify(META));S.msg=`Título “${m.title}” e avatar liberados no perfil!`;window.dispatchEvent(new Event('game-screen-changed'));}
    catch(e){META.journeyRewards=previous;S.msg='Não foi possível salvar a recompensa. Tente novamente.';}
  };
  const originalRewards=window.desktopProfileRewards;
  window.desktopProfileRewards=()=>{
    const base=originalRewards(),earned=J.missions.filter(m=>(META.journeyRewards||[]).includes(m.id));
    return {avatars:[...new Set([...base.avatars,...earned.map(m=>m.avatar)])],titles:[...new Set([...base.titles,...earned.map(m=>m.title)])]};
  };
  const originalJournal=rJournal;
  rJournal=()=>originalJournal()+(S.journal==='achievements'?`<section class="panel"><h3>Recompensas das missões</h3><p>Desbloqueadas durante uma jornada e mantidas na conta.</p><div class="journal-grid">${J.missions.map(m=>`<article class="journal-card"><img src="${SPRITE(m.avatar)}" alt=""><strong>${m.name}</strong><p>${m.description}</p><small>${(META.journeyRewards||[]).includes(m.id)?'✓ Recompensa permanente':'Complete e receba pela tela de missões da jornada.'}</small><p>Título: ${m.title}</p></article>`).join('')}</div></section>`:'');
  const originalArchive=archiveRun;
  archiveRun=(outcome,cause)=>{originalArchive(outcome,cause);const h=META.history.find(h=>h.id===R?.id);if(h){h.trainer=R.trainer;h.trainerName=R.trainerName;h.mode=R.mode;saveMeta();}};
  ACT.trainerCard=()=>{if(!R||!['hub','camp'].includes(S.screen))return;cardFocus=document.activeElement;cardOpen=true;window.journeyModalOpen=true;};
  ACT.closeTrainerCard=()=>{cardOpen=false;window.journeyModalOpen=false;document.getElementById('trainer-card-modal')?.remove();cardFocus?.focus?.();};
  function card(){
    const t=trainer(),j=J.normalize(R);
    return `<div class="trainer-card-overlay" id="trainer-card-modal"><div class="trainer-card-shade" data-act="closeTrainerCard"></div><section class="trainer-card panel" role="dialog" aria-modal="true" aria-labelledby="trainer-card-title"><div class="journey-heading"><p class="camp-eyebrow" id="trainer-card-title">TRAINER CARD</p>${button('closeTrainerCard','Fechar')}</div><div class="trainer-card-identity"><img src="${t?.portrait||''}" alt=""><div><h2>${esc(R.trainerName||t?.name||'Treinador')}</h2><p>${R.mode==='classic'?'Clássico':'Permadeath'} · ${R.postgame?'Pós-game em dupla':'Liga de Kanto'}</p><small>Aparência: ${esc(t?.name||'Treinador')}</small></div></div><div class="trainer-card-stats"><span>Vitórias<strong>${R.won||0}</strong></span><span>Capturas<strong>${R.caught||0}</strong></span><span>Espécies vistas<strong>${j.seen.length}</strong></span><span>Dinheiro<strong>₽ ${Number(R.money||0).toLocaleString('pt-BR')}</strong></span><span>Tempo de jogo<strong data-play-time>${window.JourneyClock?.format(R.playTimeMs)||'0h 00min'}</strong></span></div><p>Insígnias · ${Math.min(8,Math.floor(R.battle/5))}/8</p>${window.renderKantoBadges(Math.floor(R.battle/5))}<p class="tiny">Personagem desta jornada · ${R.team.filter(m=>m.hp>0).length} companheiros vivos · Caminho: ${j?J.routes[j.route].name:''}</p></section></div>`;
  }
  function rRoutes(){
    const j=J.normalize(R);
    return `<section class="panel">${header('Escolher caminho')}${msgBox()}<p>O caminho favorece tipos de encontros selvagens e muda a paisagem dos eventos. A Liga continua com as equipes dos líderes.</p><div class="route-grid">${Object.entries(J.routes).map(([id,r])=>`<article class="route-card route-${id}"><div class="route-scene" aria-hidden="true"><img src="${SPRITE(SP[r.species].dex)}" alt=""></div><h3>${r.name}</h3><p>${r.description}</p>${button('route',j.route===id?'✓ Caminho atual':'Escolher caminho',id,j.route===id)}</article>`).join('')}</div><p class="tiny">Você pode trocar o caminho entre batalhas. O treino mantém os encontros habituais.</p></section>`;
  }
  function rMissions(){
    return `<section class="panel">${header('Missões da jornada')}${msgBox()}<p>Faça durante sua jornada. As recompensas são permanentes na conta: títulos e avatares para o perfil. Uma recompensa só precisa ser desbloqueada uma vez.</p><div class="mission-list">${J.missions.map(m=>{const progress=J.progress(R,m.id),earned=(META.journeyRewards||[]).includes(m.id);return `<article class="mission-card"><img src="${SPRITE(m.avatar)}" alt=""><div><h3>${m.name}</h3><p>${m.description}</p><label>${Math.min(m.goal,progress)}/${m.goal}</label><progress value="${Math.min(m.goal,progress)}" max="${m.goal}"></progress><small>Recompensa: título ${m.title} + avatar</small>${button('claimMission',earned?'✓ Recompensa permanente':progress>=m.goal?'Receber recompensa':'Em andamento',m.id,earned||progress<m.goal)}</div></article>`;}).join('')}</div><p class="tiny">O progresso dos objetivos recomeça a cada jornada; os cosméticos já recebidos permanecem mesmo após uma derrota. Treinos não contam como novas observações.</p></section>`;
  }
  function rEvent(){
    const j=J.normalize(R),r=J.routes[j.route],type=j.pending;
    if(!type)return `<section class="panel">${header('Caminho')}Este evento já foi concluído.</section>`;
    const content={help:['Um pequeno pedido de ajuda','Um Pokémon parece hesitante em atravessar o caminho. Sua equipe pode ajudá-lo ou observar de longe.','Ajudar com a equipe · +5 amizade','Observar a espécie'],traveler:['Um viajante na trilha','Um treinador faz uma pausa. Ele oferece uma Berry e também tem histórias para compartilhar.','Comprar Oran Berry · ₽25','Conversar · +3 amizade'],view:['Uma pausa para olhar ao redor','Entre duas batalhas, a paisagem oferece uma pequena descoberta. O que você quer fazer?','Procurar uma Berry','Observar a paisagem']}[type];
    return `<section class="panel journey-event">${header('Entre batalhas')}<div class="route-scene route-${j.route} event-scene"><img src="${type==='traveler'?CAMP_ASSETS.trainers[0].portrait:SPRITE(SP[r.species].dex)}" alt="${type==='traveler'?'Viajante':SP[r.species].n}"></div><p class="camp-eyebrow">${r.name} · ETAPA ${R.battle}</p><h3>${content[0]}</h3><p>${content[1]}</p>${msgBox()}<div class="event-choices">${button('eventChoice',content[2],'care',type==='traveler'&&R.money<25)}${button('eventChoice',content[3],'observe')}</div><p class="tiny">A escolha fica salva. Não inicia uma batalha nem coloca sua equipe em risco.</p></section>`;
  }
  window.journeySummaryPanel=m=>`<section class="summary-strategy"><h3>Habilidade</h3><strong>${esc(T.label(m))}</strong><p>${esc(T.description(m))}</p><h3>Item equipado</h3><p>${m.heldItem?`${T.items[m.heldItem].ico} ${T.items[m.heldItem].n} · ${T.items[m.heldItem].d}`:'Nenhum item equipado.'}</p>${m.heldItem?button('unequip','Retirar e devolver à mochila','',m.hp<=0):''}<div class="held-item-list">${Object.entries(T.items).map(([id,x])=>`<article><strong>${x.ico} ${x.n} · ×${R.bag[id]||0}</strong><small>${x.d}</small>${button('equip','Equipar',id,m.hp<=0||!R.bag[id]||m.heldItem===id)}</article>`).join('')}</div><p class="tiny">Um item por Pokémon. Berries e Focus Sash são consumidos quando ativados nas batalhas, inclusive nos treinos. Os demais permanecem equipados. Pokémon desmaiados não são revividos por esses itens.</p></section>`;
  const summaryMon=()=>S.screen==='summary'?(S.summaryBox==='pc'?R?.pc:R?.team)?.[S.summary]:null;
  ACT.equip=id=>{
    const m=summaryMon();if(!m||m.hp<=0||!T.items[id]||!R.bag[id]||m.heldItem===id)return;
    transact(()=>{if(m.heldItem)R.bag[m.heldItem]=(R.bag[m.heldItem]||0)+1;R.bag[id]--;m.heldItem=id;});
  };
  ACT.unequip=()=>{const m=summaryMon();if(!m||m.hp<=0||!m.heldItem)return;transact(()=>{R.bag[m.heldItem]=(R.bag[m.heldItem]||0)+1;m.heldItem=null;});};
  const originalGameOver=gameOver;
  gameOver=why=>{
    if(R?.mode!=='classic'){originalGameOver(why);return;}
    musicStop();sfx('lose');const lost=Math.ceil(R.money*.2);R.money=Math.max(0,R.money-lost);R.defeats=(R.defeats||0)+1;
    R.team.forEach(m=>{m.hp=m.maxHp;m.ailment=null;m.stages={};m.guard=false;m.choiceMove=null;(m.learned||m.moves).forEach(id=>{m.pp=m.pp||{};m.pp[id]=M[id]?.pp||20;});});
    R.active=0;R.reward=null;R.inCenter=true;R.centerPosition={...CenterModel.spawn};B=null;V=null;S={screen:'center',shop:false,sel:null,msg:`${why==='left'?'A batalha foi interrompida.':'Sua equipe foi derrotada.'} Modo Clássico: HP e PP recuperados. Você perdeu ₽${lost} e pode tentar a mesma etapa.`};R.centerArrival=S.msg;persist();render();
  };
  const originalRest=ACT.rest;
  ACT.rest=()=>{
    if(R?.mode!=='classic'){originalRest();return;}
    ACT.center();
  };
  const originalPostgame=ACT.postgame;
  ACT.postgame=id=>{const team=(META.championTeams||[]).find(t=>t.id===id);S.pendingMode=S.pendingMode||team?.mode||ModeSaveStore.current();originalPostgame(id);delete S.pendingMode;};
  const originalHub=rHub;
  rHub=()=>originalHub().replace('Descansar',R.mode==='classic'?'Centro Pokémon':'Descansar').replace('SUA JORNADA',`SUA JORNADA · ${R.mode==='classic'?'CLÁSSICO':'PERMADEATH'}`).replace('</nav>',`${button('trainerCard','Trainer Card')}${button('routes',`Caminho: ${J.routes[J.normalize(R).route].name}`)}${button('missions','Missões da jornada')}${R.journey.pending?button('eventOpen','Continuar evento do caminho'):''}</nav>`);
  const originalRender=render;
  render=()=>{
    if(pages.includes(S.screen)){
      CampWorld.destroy();screenMusic();$app.innerHTML=head()+({routes:rRoutes,missions:rMissions,journeyEvent:rEvent}[S.screen])()+rPlaylist();
      if(lastScreen!==S.screen)window.scrollTo(0,0);window.dispatchEvent(new Event('game-screen-changed'));
    }else originalRender();
    lastScreen=S.screen;
    if(S.screen==='camp'&&!document.querySelector('[data-act="trainerCard"]'))document.querySelector('.camp-heading')?.insertAdjacentHTML('beforeend',button('trainerCard','Trainer Card'));
    if(cardOpen&&['camp','hub'].includes(S.screen)){
      const had=document.getElementById('trainer-card-modal');if(!had){$app.insertAdjacentHTML('beforeend',card());document.querySelector('#trainer-card-modal button')?.focus();}
    }else {cardOpen=false;window.journeyModalOpen=false;document.getElementById('trainer-card-modal')?.remove();}
  };
  window.addEventListener('keydown',e=>{
    if(!cardOpen)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();ACT.closeTrainerCard();render();}
    if(e.key==='Tab'){const close=document.querySelector('#trainer-card-modal button');if(close){e.preventDefault();close.focus();}}
  },true);
  render();
})();
