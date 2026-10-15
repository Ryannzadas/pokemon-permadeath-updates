(() => {
  'use strict';
  const C=CampModel,trainers=CAMP_ASSETS.trainers;
  let selected=null,touch=null,lastScreen=null;
  const validTrainer=id=>trainers.find(t=>t.id===id);
  const originalPersist=persist;
  persist=()=>{
    if(R&&['camp','character','trainerName'].includes(S.screen)){
      const screen=['character','trainerName'].includes(S.screen)&&S.characterReturn==='reward'?'reward':'hub';
      SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify({R,S:{screen,msg:'',shop:false,sel:null},V}));return;
    }
    originalPersist();
  };
  const originalNewRun=newRun;
  newRun=id=>{
    const trainer=S.pendingTrainer,trainerName=S.pendingTrainerName,mode=S.pendingMode||ModeSaveStore.current();
    originalNewRun(id);R.mode=mode;R.trainer=validTrainer(trainer)?trainer:null;R.trainerName=trainerName||'';C.normalize(R);
    if(!R.trainer){S.screen='character';S.characterFor='existing';S.characterReturn='hub';}
    persist();
  };
  const originalLoad=continueSave;
  continueSave=()=>{
    originalLoad();if(!R||S.screen==='gameover')return;
    C.normalize(R);
    if(!validTrainer(R.trainer)){S.characterReturn=S.screen==='reward'?'reward':'hub';S.screen='character';S.characterFor='existing';}
    if(validTrainer(R.trainer)&&!R.trainerName){S.characterReturn=S.screen==='reward'?'reward':'hub';S.screen='trainerName';S.characterFor='existing';S.pendingTrainer=R.trainer;}
    persist();
  };
  const originalStart=ACT.start;
  ACT.start=()=>{S.screen='modeSelect';S.msg='';};
  ACT.chooseMode=(mode,kind='standard')=>{if(S.screen!=='modeSelect'||!['classic','permadeath'].includes(mode))return;ModeSaveStore.select(mode,kind);originalStart();if(S.screen==='starter'){R=null;S.screen='character';S.characterFor='new';S.pendingMode=mode;}};
  ACT.modeBack=()=>{S.screen='title';S.msg='';};
  ACT.changeMode=()=>{if(S.screen==='character'&&S.characterFor==='new')S.screen='modeSelect';};
  ACT.runMode=mode=>{if(S.screen==='character'&&S.characterFor==='new'&&['classic','permadeath'].includes(mode))S.pendingMode=mode;};
  ACT.pickTrainer=id=>{
    if(S.screen!=='character'||!validTrainer(id))return;
    S.pendingTrainer=id;S.screen='trainerName';S.msg='';
  };
  ACT.trainerNameBack=()=>{if(S.screen==='trainerName'){S.screen='character';S.msg='';}};
  ACT.confirmTrainer=()=>{
    if(S.screen!=='trainerName'||!validTrainer(S.pendingTrainer))return;
    const name=String(document.getElementById('trainer-name')?.value||'').trim().replace(/\s+/g,' ').slice(0,24);
    if(!name){S.msg='Digite o nome do seu treinador.';return;}
    const id=S.pendingTrainer;
    if(S.characterFor==='existing'&&R){R.trainer=id;R.trainerName=name;C.normalize(R);S.screen=S.characterReturn==='reward'?'reward':'hub';delete S.characterReturn;delete S.characterFor;persist();}
    else S={screen:'starter',pendingMode:S.pendingMode||'permadeath',pendingTrainer:id,pendingTrainerName:name,msg:'Escolha seu Pokémon inicial.',shop:false,sel:null};
  };
  $app.addEventListener('keydown',e=>{if(S.screen==='trainerName'&&e.target.id==='trainer-name'&&e.key==='Enter'){e.preventDefault();ACT.confirmTrainer();render();}});
  ACT.characterBack=()=>{if(R)persist();S.screen='title';};
  ACT.camp=()=>{
    if(S.screen!=='hub'||!R)return;
    if(!validTrainer(R.trainer)){S.screen='character';S.characterFor='existing';S.characterReturn='hub';return;}
    C.normalize(R);selected=null;touch=null;S.screen='camp';S.campNotice='';S.shop=false;persist();
  };
  ACT.campExit=()=>{
    if(S.screen!=='camp')return;
    const p=CampWorld.position();if(p)R.camp.position=C.safePosition(p);
    selected=null;touch=null;S.screen='hub';S.msg='Você voltou à jornada.';persist();
  };
  ACT.campClose=()=>{selected=null;S.campNotice='';};
  ACT.campMember=value=>{if(S.screen==='camp'&&R.team[Number(value)]?.hp>0){selected=Number(value);S.campNotice='';}};
  ACT.campInteract=kind=>{
    if(S.screen!=='camp'||selected===null)return;
    const before=JSON.parse(JSON.stringify({camp:R.camp,money:R.money,friendship:R.team[selected].friendship}));
    const result=C.interact(R,selected,kind);
    if(result.ok){
      try{persist();CampWorld.emote(selected);}catch(e){R.camp=before.camp;R.money=before.money;R.team[selected].friendship=before.friendship;S.campNotice='Não foi possível salvar. Tente novamente.';return;}
    }
    S.campNotice=result.message+(result.ok?` +${result.gain} de amizade.`:'');
  };
  const originalHub=rHub;
  rHub=()=>originalHub().replace('</nav>',`<button class="btn gba-option" data-act="camp"><span>Acampamento</span><small>Caminhar e cuidar da equipe</small></button></nav>`);
  function rCharacter(){
    const continuing=S.characterFor==='existing';
    return `<section class="panel camp-character"><p class="camp-eyebrow">${continuing?'SUA JORNADA CONTINUA':'UMA NOVA JORNADA'}</p><h2>Quem vai viajar com sua equipe?</h2><p>${continuing?'Escolha um treinador para a jornada que você já começou. Seus Pokémon e seu progresso continuam salvos.':'Escolha a aparência do seu treinador no acampamento. Cada jornada tem seu próprio personagem.'}</p><p>Modo escolhido: <strong>${(continuing?R?.mode:S.pendingMode)==='classic'?'Clássico':'Permadeath'}</strong> ${!continuing?'<button class="btn alt tiny" data-act="changeMode">Trocar modo</button>':''}</p><div class="camp-trainers">${trainers.map(t=>`<button class="camp-trainer" data-act="pickTrainer" data-v="${t.id}"><span class="camp-trainer-portrait"><img src="${t.portrait}" alt=""></span><strong>${esc(t.name)}</strong><small>Escolher treinador</small></button>`).join('')}</div><button class="btn alt" data-act="characterBack">Voltar ao início</button></section>`;
  }
  function rModeSelect(){
    return `<section class="panel camp-character"><p class="camp-eyebrow">JOGAR</p><h2>Escolha seu modo de jogo</h2><p>O modo vale para toda a jornada. Depois você escolhe o treinador e seu Pokémon inicial.</p><div class="run-modes" aria-label="Modos de jogo"><button class="run-mode" data-act="chooseMode" data-v="permadeath"><strong>Permadeath</strong><small>Morte permanente: Pokémon desmaiados não voltam. Perder toda a equipe encerra a jornada.</small><span>Jogar Permadeath →</span></button><button class="run-mode" data-act="chooseMode" data-v="classic"><strong>Clássico</strong><small>Ao perder a equipe, você volta ao Centro Pokémon, recupera HP e PP e perde 20% do dinheiro. A jornada continua.</small><span>Jogar Clássico →</span></button></div><button class="btn alt" data-act="modeBack">Voltar ao menu</button></section>`;
  }
  function rTrainerName(){
    const t=validTrainer(S.pendingTrainer)||validTrainer(R?.trainer);
    return `<section class="panel camp-character"><p class="camp-eyebrow">SEU PERSONAGEM</p><h2>Como seu treinador se chama?</h2><div class="trainer-name-portrait"><img src="${t.portrait}" alt="Aparência de ${esc(t.name)}"></div><p>Você escolheu a aparência de ${esc(t.name)}. Dê um nome próprio para este personagem.</p><label for="trainer-name">Nome do treinador</label><input id="trainer-name" maxlength="24" autocomplete="off" value="${esc((S.characterFor==='existing'?R?.trainerName:S.pendingTrainerName)||'')}" placeholder="Seu nome nesta jornada"><p class="camp-notice" role="status">${esc(S.msg||'')}</p><div class="row"><button class="btn" data-act="confirmTrainer">Confirmar nome</button><button class="btn alt" data-act="trainerNameBack">Trocar aparência</button></div><p class="tiny">Este nome pertence à jornada. O apelido da conta é editado no perfil.</p></section>`;
  }
  function teamHTML(){return R.team.map((m,i)=>m.hp>0?`<button class="camp-team-member ${selected===i?'selected':''}" data-act="campMember" data-v="${i}" aria-label="Conversar com ${esc(nm(m))}"><img src="${SPRITE(SP[m.sp].dex)}" alt=""><span><strong>${esc(nm(m))}</strong><small>Nv. ${m.lvl}</small></span></button>`:'').join('');}
  function panelHTML(){
    const m=selected===null?null:R.team[selected],remaining=C.LIMIT-R.camp.used;
    if(!m)return `<p class="camp-eyebrow">PAUSA NA JORNADA</p><h3>Sua equipe está por aqui</h3><p>Clique em um Pokémon ou aproxime-se e aperte <kbd>E</kbd> para interagir.</p><div class="camp-budget"><strong>${remaining}/${C.LIMIT}</strong><span>interações disponíveis<br><small>Renovam ao vencer uma batalha da jornada.</small></span></div><p class="camp-hint">O acampamento aumenta a amizade. HP e PP continuam sendo recuperados com os itens e o descanso da jornada.</p>`;
    return `<div class="camp-interaction-title"><img src="${SPRITE(SP[m.sp].dex)}" alt=""><div><p class="camp-eyebrow">SEU COMPANHEIRO</p><h3>${esc(nm(m))}</h3><small>Nv. ${m.lvl}</small></div><button class="camp-close" data-act="campClose" aria-label="Fechar interação">×</button></div><label class="camp-friendship">Amizade <strong>${m.friendship}/255</strong></label><progress class="camp-friendship-bar" max="255" value="${m.friendship}" aria-label="Amizade"></progress><div class="camp-actions"><button class="btn" data-act="campInteract" data-v="play" ${!remaining||m.friendship>=255?'disabled':''}>Brincar <small>+3 amizade</small></button><button class="btn alt" data-act="campInteract" data-v="feed" ${!remaining||R.money<15||m.friendship>=255?'disabled':''}>Oferecer lanche <small>₽15 · +5 amizade</small></button></div><p class="camp-hint">${remaining}/${C.LIMIT} interações nesta etapa · ₽${R.money}</p><button class="btn alt tiny" data-act="campClose">Voltar a caminhar</button>`;
  }
  function rCamp(){
    const trainer=validTrainer(R.trainer);
    return `<section class="camp-page"><div class="camp-heading"><div><p class="camp-eyebrow">UM RESPIRO ENTRE BATALHAS</p><h2>Acampamento</h2></div><button class="btn alt" data-act="campExit">Voltar à jornada</button></div><div class="camp-layout"><div class="camp-world"><div class="camp-world-heading"><span>🌿 Clareira da equipe</span><span>${esc(R.trainerName||trainer.name)} · ₽<span id="camp-money">${R.money}</span></span></div><div id="camp-canvas" tabindex="0" aria-label="Mapa do acampamento. Use WASD ou setas para andar e E para conversar com um Pokémon."></div><p id="camp-loading" role="status">Preparando a clareira…</p><div class="camp-controls"><span><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> caminhar</span><span><kbd>E</kbd> conversar · <kbd>Esc</kbd> voltar</span></div><div class="camp-touch" aria-label="Controles de caminhada"><button data-dir="up" aria-label="Andar para cima">↑</button><div><button data-dir="left" aria-label="Andar para esquerda">←</button><button data-dir="down" aria-label="Andar para baixo">↓</button><button data-dir="right" aria-label="Andar para direita">→</button></div></div></div><aside class="camp-sidebar"><div id="camp-panel"></div><p id="camp-notice" class="camp-notice" role="status"></p><div class="camp-party"><p class="camp-eyebrow">EQUIPE NO ACAMPAMENTO</p><div id="camp-team"></div></div></aside></div></section>`;
  }
  function updateCamp(){
    document.getElementById('camp-panel').innerHTML=panelHTML();document.getElementById('camp-team').innerHTML=teamHTML();document.getElementById('camp-notice').textContent=S.campNotice||'';document.getElementById('camp-money').textContent=R.money;
    const playlist=document.getElementById('camp-playlist');if(playlist)playlist.innerHTML=rPlaylist();
  }
  function mountCamp(){
    const run=R;
    CampWorld.start({trainer:validTrainer(run.trainer),position:run.camp.position,
      team:run.team.map((m,index)=>({index,name:nm(m),asset:CAMP_ASSETS.pokemon[SP[m.sp].dex]||{mode:'icon',sheet:SPRITE(SP[m.sp].dex)}})).filter(m=>run.team[m.index].hp>0),
      touch:()=>touch,isBlocked:()=>S.screen!=='camp'||R!==run||selected!==null||playlistOpen||window.journeyModalOpen||$app.inert||!!document.querySelector('.profile-panel'),
      onSelect:index=>{if(S.screen!=='camp'||playlistOpen||window.journeyModalOpen||document.querySelector('.profile-panel'))return;menuActionSound('campMember');selected=index;S.campNotice='';render();},
      onEscape:()=>{if(selected!==null)ACT.campClose();else ACT.campExit();render();},
      onHint:message=>{S.campNotice=message;updateCamp();},
      onReady:()=>{const el=document.getElementById('camp-loading');if(el)el.hidden=true;},
      onError:message=>{const el=document.getElementById('camp-loading');if(el){el.hidden=false;el.textContent=message;}},
      onPosition:p=>{
        const next=C.safePosition(p),old=run.camp.position;
        if(old.x===next.x&&old.y===next.y&&old.dir===next.dir)return;
        run.camp.position=next;
        if(R===run&&S.screen==='camp')try{persist();}catch(e){S.campNotice='Não foi possível salvar a posição.';}
      }
    });
  }
  const originalRender=render;
  render=()=>{
    if(S.screen!=='camp')CampWorld.destroy();
    if(!['camp','character','trainerName','modeSelect','continueSelect'].includes(S.screen)){originalRender();lastScreen=S.screen;return;}
    screenMusic();
    if(['character','trainerName','modeSelect','continueSelect'].includes(S.screen))$app.innerHTML=head()+(S.screen==='continueSelect'?window.rContinueChoice():S.screen==='character'?rCharacter():S.screen==='modeSelect'?rModeSelect():rTrainerName())+rPlaylist();
    else if(!document.getElementById('camp-canvas')){
      $app.innerHTML=head()+rCamp()+'<div id="camp-playlist"></div>';updateCamp();mountCamp();
    }else{
      // Sound toggles, profile saves and playlist changes must never recreate Phaser.
      const header=$app.querySelector('header.top');if(header)header.outerHTML=head();updateCamp();
    }
    if(lastScreen!==S.screen)window.scrollTo(0,0);
    lastScreen=S.screen;window.dispatchEvent(new Event('game-screen-changed'));
  };
  $app.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-dir]');if(!el)return;e.preventDefault();el.setPointerCapture(e.pointerId);touch={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}[el.dataset.dir];});
  const release=()=>{touch=null;};window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);
  window.addEventListener('beforeunload',()=>{if(S.screen==='camp'){const p=CampWorld.position();if(p)R.camp.position=C.safePosition(p);persist();}});
  window.desktopCanReturnTitle=()=>['hub','camp'].includes(S.screen)&&!EVOLVING;
  window.desktopReturnTitle=()=>{if(!window.desktopCanReturnTitle())return;if(S.screen==='camp')ACT.campExit();persist();S.screen='title';S.shop=false;render();};
})();
