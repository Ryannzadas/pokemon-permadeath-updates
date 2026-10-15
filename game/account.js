(() => {
  const api=window.desktopAPI,box=document.getElementById('desktop-account');
  if(!api||!box)return;
  let state={},waiting=false,opened=false,draft=null,notice='';
  let saveTimer,lastSaved,saveReady=false;
  const saveIndicator=document.createElement('div');
  saveIndicator.className='autosave-indicator';
  saveIndicator.setAttribute('role','status');
  saveIndicator.setAttribute('aria-live','polite');
  saveIndicator.title='Progresso salvo';
  document.body.appendChild(saveIndicator);
  function trackSave(value){
    const changed=saveReady && value.updatedAt && value.updatedAt!==lastSaved;
    lastSaved=value.updatedAt;saveReady=true;
    if(!changed)return;
    clearTimeout(saveTimer);
    saveIndicator.innerHTML='<span aria-hidden="true">💾</span><span>Progresso salvo</span>';
    saveIndicator.classList.add('visible');
    saveTimer=setTimeout(()=>{saveIndicator.classList.remove('visible');setTimeout(()=>{if(!saveIndicator.classList.contains('visible'))saveIndicator.textContent='';},250);},2200);
  }
  const avatars=()=>window.desktopProfileRewards?.().avatars||[25];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sprite=id=>`assets/sprites/${avatars().includes(Number(id))?Number(id):25}-f.png`;
  const profile=()=>window.desktopGetProfile?.()||{};
  const button=(action,label,disabled=false)=>`<button class="btn alt tiny" data-account="${action}" ${disabled?'disabled':''}>${label}</button>`;
  function updatePanel(){
    const u=state.update;if(!u)return '';
    const working=['checking','downloading','installing'].includes(u.phase);
    return `<div class="profile-updates"><strong>Atualizações · v${esc(u.currentVersion)}</strong><p class="tiny" role="status">${esc(u.message)}${u.phase==='downloading'?` ${u.percent}%`:''}</p>${u.phase==='downloading'?`<progress max="100" value="${u.percent}" aria-label="Download da atualização"></progress>`:''}<div class="account-controls">${button('checkUpdates','Verificar atualizações',working||u.phase==='ready'||waiting||state.busy)}${u.phase==='available'?button('downloadUpdate',`Baixar v${esc(u.version)}`,waiting||state.busy):''}${u.phase==='ready'?button('installUpdate','Reiniciar e instalar',waiting||state.busy||state.syncing||!window.desktopCanManage?.()):''}</div></div>`;
  }
  let closing=false;
  function close(){if(closing)return;closing=true;const finish=()=>{opened=false;draft=null;closing=false;draw();box.querySelector('.profile-toggle')?.focus({preventScroll:true});};if(window.InterfaceUI)window.InterfaceUI.exitDialog(box.querySelector('.profile-panel'),finish);else finish();}
  const updateToast=document.createElement('aside');updateToast.className='update-toast';updateToast.setAttribute('role','status');document.body.appendChild(updateToast);let dismissed='';
  function updateNotice(){
    const u=state.update,key=u?.version+':'+u?.phase;
    if(!u||!['available','downloading','ready','error'].includes(u.phase)||dismissed===key){updateToast.hidden=true;return;}
    updateToast.hidden=false;const ready=u.phase==='ready',down=u.phase==='downloading',error=u.phase==='error';
    const installSafe=!!window.desktopCanReturnTitle?.()||!!window.desktopCanManage?.();
    updateToast.innerHTML=`<button class="update-toast-close" data-update="close" aria-label="Dispensar aviso">×</button><p>${error?'Não foi possível atualizar.':down?`Baixando atualização · ${u.percent||0}%`:ready?'Atualização pronta!':`Atualização disponível · v${esc(u.version)}`}</p>${down?`<progress value="${u.percent||0}" max="100" aria-label="Download da atualização"></progress>`:`<button class="btn" data-update="${error?'checkUpdates':ready?'installUpdate':'downloadUpdate'}" ${waiting||state.busy||state.syncing||ready&&!installSafe?'disabled':''}>${error?'Tentar novamente':ready?'Reiniciar e instalar':'Baixar'}</button>`}${ready&&!installSafe?'<small>Conclua a batalha para instalar.</small>':''}`;
  }
  updateToast.addEventListener('click',async e=>{const action=e.target.closest('[data-update]')?.dataset.update;if(!action||e.target.disabled)return;if(action==='close'){dismissed=state.update?.version+':'+state.update?.phase;updateNotice();return;}waiting=true;updateNotice();try{if(action==='installUpdate'&&!window.desktopCanManage?.()){window.desktopReturnTitle?.();}const response=await api[action]();if(response.ok)state=response.value||state;else notice=response.error;}catch{notice='Não foi possível concluir a atualização.';}finally{waiting=false;draw();}});
  function draw(){
    updateNotice();
    const panelScroll=box.querySelector('.profile-panel')?.scrollTop||0;
    const pageScroll=window.scrollY;
    const accessOpen=box.querySelector('.access-help')?.open||false;
    const focus=box.contains(document.activeElement)?document.activeElement:null;
    const wasName=focus?.id==='profile-name',selection=wasName?[focus.selectionStart,focus.selectionEnd,focus.selectionDirection]:null;
    document.getElementById('app').inert=!!(opened||waiting||state.busy);
    const locked=waiting||state.busy||state.syncing||!window.desktopCanManage?.();
    const p=profile(),name=p.name||state.user?.name||'Treinador';
    const sub=state.user?(state.conflict?'Conflito de progresso':state.syncing?'Sincronizando…':state.syncError?'Não foi possível sincronizar':state.dirty?'Salvo no PC · aguardando envio':'Progresso sincronizado'):'Progresso salvo neste computador';
    box.innerHTML=`<button class="profile-toggle" data-account="toggle" aria-label="Abrir perfil e sincronização" aria-expanded="${opened}" title="${esc(name)} · ${esc(sub)}"><img src="${sprite(p.avatar)}" alt=""><span class="profile-dot ${state.conflict||state.syncError?'conflict':state.syncing||state.dirty?'pending':''}"></span></button>${opened?`<div class="profile-shade" data-account="close"></div><section class="profile-panel" role="dialog" aria-modal="true" aria-labelledby="profile-heading"><div class="profile-heading"><h2 id="profile-heading">Meu perfil</h2>${button('close','Fechar')}</div><div class="profile-identity"><img src="${sprite(draft?.avatar||p.avatar)}" alt="Avatar"><div><strong>${esc(name)}</strong><span class="account-status">${esc(p.title||'Treinador')}</span><span class="account-status">${esc(state.user?.email||'Convidado')}</span></div></div><form id="profile-form"><label for="profile-name">Apelido no jogo</label><input id="profile-name" name="name" maxlength="24" required autocomplete="nickname" value="${esc(draft?.name??p.name??state.user?.name??'Treinador')}"><label for="profile-title">Título</label><select id="profile-title"><option value="">Treinador</option>${(window.desktopProfileRewards?.().titles||[]).map(t=>`<option value="${esc(t)}" ${t===(draft?.title??p.title)?'selected':''}>${esc(t)}</option>`).join('')}</select><p class="tiny">Escolha seu avatar · conquistas liberam novas opções.</p><div class="profile-avatars">${avatars().map(id=>`<button type="button" data-avatar="${id}" aria-label="Avatar Pokémon ${id}" aria-pressed="${id===Number(draft?.avatar||p.avatar||25)}"><img src="${sprite(id)}" alt=""></button>`).join('')}</div><button class="btn gold" type="submit" ${waiting||state.busy?'disabled':''}>Salvar perfil</button></form><div class="profile-sync"><strong>${esc(sub)}</strong><p class="account-message" role="status">${esc(notice||state.message||'')}</p></div>${!window.desktopCanManage?.()?`<p class="tiny">Para gerenciar a conta e sincronizar manualmente, volte à tela inicial.</p>${window.desktopCanReturnTitle?.()?button('title','Ir para a tela inicial'):''}`:''}<div class="account-controls">${state.user?button('sync','Sincronizar agora',locked)+button('logout','Sair da conta',locked):button('login','Entrar na conta',locked||!state.configured)+button('signup','Criar conta',locked||!state.configured)}${button('resetPassword','Esqueci minha senha',locked||!state.configured)}${state.user&&(!state.user.providers||state.user.providers.includes('google.com'))?button('linkPassword','Adicionar / alterar senha via Google',locked):''}${!state.configured?button('configure','Configurar Firebase',locked):''}${button('exportSave','Exportar save',locked)}${button('importSave','Importar save',locked)}${state.user&&state.canImportGuest?button('importGuest','Importar progresso local',locked):''}</div><details class="access-help"><summary>Ajuda de acesso</summary><p class="tiny">Esqueceu a senha? Use “Esqueci minha senha” e confira também o spam.</p><p class="tiny">Esqueceu o e-mail? Se já usava Google, escolha “Entrar na conta” e “Entrar com Google”. Se ainda estiver conectado, seu e-mail aparece acima. Sem acesso à caixa de entrada, recupere o acesso pelo provedor do e-mail.</p><p class="tiny">Já joga com Google? Use “Adicionar / alterar senha via Google” para manter o mesmo progresso. Contas diferentes têm saves separados.</p></details>${updatePanel()}${state.conflict?`<div class="account-conflict">Existe outro progresso na nuvem. ${button('resolveLocal','Manter deste PC',locked)}${button('resolveCloud','Usar da nuvem',locked)}</div>`:''}</section>`:''}`;
    if(opened){if(wasName){const input=box.querySelector('#profile-name');input.focus({preventScroll:true});input.setSelectionRange(...selection);}else if(!box.contains(document.activeElement))box.querySelector('[data-account="close"]:not(.profile-shade)')?.focus({preventScroll:true});const panel=box.querySelector('.profile-panel');if(panel)panel.scrollTop=panelScroll;const help=box.querySelector('.access-help');if(help)help.open=accessOpen;}window.scrollTo(0,pageScroll);
  }
  box.addEventListener('input',e=>{if(e.target.id==='profile-name'){draft=draft||{...profile()};draft.name=e.target.value;}});
  box.addEventListener('change',e=>{if(e.target.id==='profile-title')draft={...profile(),...draft,title:e.target.value};});
  box.addEventListener('submit',e=>{if(e.target.id!=='profile-form')return;e.preventDefault();if(waiting||state.busy)return;window.desktopMenuSound?.();try{const name=box.querySelector('#profile-name').value.trim();if(!name){notice='Digite um apelido.';draw();return;}window.desktopSaveProfile({name,avatar:Number(draft?.avatar||profile().avatar||25),title:box.querySelector('#profile-title').value});notice='Perfil salvo. Ele acompanha o progresso da sua conta.';draft=null;}catch{notice='Não foi possível salvar o perfil. Tente novamente.';}draw();});
  box.addEventListener('click',async e=>{
    const avatar=e.target.closest('[data-avatar]');if(avatar){window.desktopMenuSound?.();draft={...profile(),...draft,avatar:Number(avatar.dataset.avatar)};draw();box.querySelector(`[data-avatar="${draft.avatar}"]`)?.focus();return;}
    const b=e.target.closest('[data-account]');if(!b||b.disabled)return;const action=b.dataset.account;window.desktopMenuSound?.();
    if(action==='toggle'){opened?close():(opened=true,notice='',draw());return;}
    if(action==='close'){close();return;}
    if(action==='title'){window.desktopReturnTitle?.();draw();return;}
    waiting=true;notice='';draw();
    try{const response=action==='resolveLocal'?await api.resolve('local'):action==='resolveCloud'?await api.resolve('cloud'):await api[action]();if(response.ok)state=response.value||state;else notice=response.error;}catch{notice='Não foi possível concluir a operação. Seu save local continua disponível.';}finally{waiting=false;draw();}
  });
  document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=[...box.querySelectorAll('.profile-panel button:not(:disabled),.profile-panel input:not(:disabled),.profile-panel select:not(:disabled),.profile-panel summary')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
  api.onStatus(value=>{trackSave(value);state=value;draw();});window.addEventListener('game-screen-changed',draw);
  api.status().then(r=>{if(r.ok){state=r.value;if(!saveReady){lastSaved=state.updatedAt;saveReady=true;}}draw();});
})();
