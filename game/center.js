(() => {
  'use strict';
  const C=CenterModel;
  let selected=null,touch=null,returnCenter=false;
  const trainer=()=>CAMP_ASSETS.trainers.find(t=>t.id===R?.trainer);
  const oldPersist=persist;
  persist=()=>{
    if(R&&S.screen==='center'){
      SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify({R,S:{screen:'center',msg:S.msg||'',shop:false,sel:null},V}));return;
    }oldPersist();
  };
  const oldLoad=continueSave;
  continueSave=()=>{oldLoad();if(R?.mode==='classic'&&R.inCenter&&['hub','center'].includes(S.screen)){S.screen='center';R.centerPosition=C.safePosition(R.centerPosition);R.centerArrival=String(R.centerArrival||'').replace('por ₽60','gratuitamente');selected=null;persist();}};
  ACT.center=()=>{
    if(R?.mode!=='classic'||S.screen!=='hub')return;
    R.inCenter=true;R.centerPosition=C.safePosition(R.centerPosition);R.centerArrival='Fale com a enfermeira para recuperar sua equipe gratuitamente. Abra o PC pelo terminal à esquerda.';
    S.screen='center';S.shop=false;selected=null;persist();
  };
  ACT.centerExit=()=>{
    if(S.screen!=='center')return;
    const p=CampWorld.position();if(p)R.centerPosition=C.safePosition(p);
    R.inCenter=false;selected=null;S.screen='hub';S.msg='Você saiu do Centro Pokémon.';persist();
  };
  ACT.centerNurse=()=>{if(S.screen==='center'){selected='nurse';S.msg='';}};
  ACT.centerMember=value=>{if(S.screen==='center'&&R.team[Number(value)]?.hp>0)selected=Number(value);};
  ACT.centerClose=()=>{selected=null;S.msg='';};
  ACT.centerHeal=()=>{
    if(S.screen!=='center'||selected!=='nurse'||!C.needsHealing(R))return;
    const before=JSON.parse(JSON.stringify({money:R.money,team:R.team}));
    R.team.forEach(m=>{m.hp=m.maxHp;m.ailment=null;m.stages={};m.choiceMove=null;m.guard=false;(m.learned||m.moves).forEach(id=>m.pp[id]=M[id]?.pp||20);});
    try{persist();CampWorld.destroy();document.getElementById('center-canvas').innerHTML='';mount();sfx('heal');S.msg='Sua equipe está recuperada. Boa jornada!';}
    catch(e){R.money=before.money;R.team.forEach((m,i)=>Object.assign(m,before.team[i]));S.msg='Não foi possível salvar. Tente novamente.';}
  };
  ACT.centerPC=()=>{
    if(S.screen!=='center')return;
    const p=CampWorld.position();if(p)R.centerPosition=C.safePosition(p);
    S.screen='hub';ACT.pc();returnCenter=true;persist();
  };
  const oldSubBack=ACT.subBack;
  ACT.subBack=()=>{oldSubBack();if(returnCenter&&R?.inCenter&&S.screen==='hub'){returnCenter=false;selected=null;S.screen='center';persist();}};
  ACT.journalBack=ACT.subBack;
  const oldCanReturn=window.desktopCanReturnTitle;
  window.desktopCanReturnTitle=()=>S.screen==='center'&&!EVOLVING||oldCanReturn();
  const oldMusic=screenMusic;
  screenMusic=()=>{
    if(S.screen==='center'){
      if(musicScreen!=='center'||musTrackId!=='pokeCenter'){musicScreen='center';musicStart('pokeCenter');}return;
    }oldMusic();
  };
  function teamHTML(){return R.team.map((m,i)=>`<button class="camp-team-member" data-act="centerMember" data-v="${i}"><img src="${SPRITE(SP[m.sp].dex)}" alt=""><span><strong>${esc(nm(m))}</strong><small>HP ${m.hp}/${m.maxHp} · Nv. ${m.lvl}</small></span></button>`).join('');}
  function panelHTML(){
    if(selected==='nurse')return `<p class="camp-eyebrow">ENFERMEIRA</p><h3>Bem-vindo ao Centro Pokémon!</h3><p>${C.needsHealing(R)?'Podemos recuperar HP e PP de toda a equipe, inclusive dos Pokémon desmaiados.':'Seus Pokémon estão recuperados. Cuide bem deles durante sua jornada!'}</p><button class="btn" data-act="centerHeal" ${!C.needsHealing(R)?'disabled':''}>Recuperar equipe · grátis</button><button class="btn alt" data-act="centerClose">Voltar a caminhar</button>`;
    if(typeof selected==='number'){const m=R.team[selected];return `<p class="camp-eyebrow">SEU COMPANHEIRO</p><h3>${esc(nm(m))}</h3><p>HP ${m.hp}/${m.maxHp} · Amizade ${m.friendship}/255</p><p>${m.moves.map(id=>`${esc(window.gameExpansion.moveName(id))} · PP ${m.pp[id]}/${M[id].pp}`).join('<br>')}</p><button class="btn alt" data-act="centerClose">Voltar a caminhar</button>`;}
    return `<p class="camp-eyebrow">MODO CLÁSSICO</p><h3>Um lugar para recomeçar</h3><p>${esc(R.centerArrival||'Sua equipe está pronta para continuar a jornada.')}</p><p>Aproxime-se da enfermeira ou do PC e pressione <kbd>E</kbd>. Você também pode clicar neles.</p><p class="camp-hint">Caminhe até o tapete da porta para sair. A etapa da jornada continua em ${R.battle+1}.</p>`;
  }
  function page(){return `<section class="camp-page center-page"><div class="camp-heading"><div><p class="camp-eyebrow">CUIDADO COM SEUS COMPANHEIROS</p><h2>Centro Pokémon</h2></div><button class="btn alt" data-act="centerExit">Sair para a jornada</button></div><div class="camp-layout"><div class="camp-world"><div class="camp-world-heading"><span>Centro Pokémon · Clássico</span><span>${esc(R.trainerName)} · ₽<span id="center-money">${R.money}</span></span></div><div id="center-canvas" tabindex="0" aria-label="Centro Pokémon. Use WASD ou setas para caminhar e E para falar com a enfermeira ou abrir o PC."></div><p id="center-loading" role="status">Abrindo o Centro Pokémon…</p><div class="camp-controls"><span><kbd>WASD</kbd> / setas · caminhar</span><span><kbd>E</kbd> · conversar / PC</span></div><div class="camp-touch"><button data-dir="up" aria-label="Andar para cima">↑</button><div><button data-dir="left" aria-label="Andar para esquerda">←</button><button data-dir="down" aria-label="Andar para baixo">↓</button><button data-dir="right" aria-label="Andar para direita">→</button></div></div></div><aside class="camp-sidebar"><div id="center-panel"></div><p id="center-notice" class="camp-notice" role="status"></p><div class="camp-party"><p class="camp-eyebrow">SUA EQUIPE</p><div id="center-team"></div></div></aside></div></section>`;}
  function update(){document.getElementById('center-panel').innerHTML=panelHTML();document.getElementById('center-notice').textContent=S.msg||'';document.getElementById('center-money').textContent=R.money;document.getElementById('center-team').innerHTML=teamHTML();}
  function mount(){
    const run=R;
    CampWorld.start({kind:'center',parent:'center-canvas',model:C,trainer:trainer(),position:C.safePosition(run.centerPosition),
      team:run.team.map((m,index)=>({index,name:nm(m),asset:CAMP_ASSETS.pokemon[SP[m.sp].dex]||{mode:'icon',sheet:SPRITE(SP[m.sp].dex)}})).filter(m=>run.team[m.index].hp>0),
      touch:()=>touch,isBlocked:()=>S.screen!=='center'||R!==run||selected!==null||$app.inert||!!document.querySelector('.profile-panel'),
      onSelect:i=>{ACT.centerMember(i);render();},onNurse:()=>{ACT.centerNurse();render();},onPC:()=>{ACT.centerPC();render();},onExit:()=>{ACT.centerExit();render();},
      onEscape:()=>{if(selected!==null)ACT.centerClose();else ACT.centerExit();render();},onHint:message=>{S.msg=message;update();},
      onReady:()=>{const el=document.getElementById('center-loading');if(el)el.hidden=true;},onError:message=>{const el=document.getElementById('center-loading');if(el){el.hidden=false;el.textContent=message;}},
      onPosition:p=>{run.centerPosition=C.safePosition(p);if(R===run&&S.screen==='center')try{persist();}catch(e){S.msg='Não foi possível salvar sua posição.';}}
    });
  }
  const oldRender=render;
  render=()=>{
    if(S.screen==='hub'&&R?.mode==='classic'&&R.inCenter)S.screen='center';
    if(S.screen!=='center'){oldRender();return;}
    if(!trainer()){S.screen='character';S.characterFor='existing';S.characterReturn='hub';oldRender();return;}
    screenMusic();
    if(!document.getElementById('center-canvas')){$app.innerHTML=head()+page();update();mount();window.scrollTo(0,0);}
    else {const header=$app.querySelector('header.top');if(header)header.outerHTML=head();update();}
    window.dispatchEvent(new Event('game-screen-changed'));
  };
  $app.addEventListener('pointerdown',e=>{if(S.screen!=='center')return;const el=e.target.closest('[data-dir]');if(!el)return;e.preventDefault();touch={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}[el.dataset.dir];});
  const release=()=>touch=null;window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);window.addEventListener('blur',release);
  window.addEventListener('beforeunload',()=>{if(S.screen==='center'){const p=CampWorld.position();if(p)R.centerPosition=C.safePosition(p);persist();}});
})();
