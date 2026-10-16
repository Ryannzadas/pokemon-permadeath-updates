// FireRed-style presentation for every battle: journey singles and doubles, Social and league.
// The engine's own buttons are moved into the GBA-like frame, so actions, disabled states and
// battle rules stay in the journey engine or the online battle client.
const SCENE_W=360,SCENE_H=240;
const FR={key:null,actor:null,fight:false,moveIndex:0,lastMsg:'',typing:0};

const arenaOf=()=>$app.querySelector('.battle-classic,.handheld-arena');
// Journey battles are drawn by the Phaser engine when it claims the screen; this HTML version
// remains for online battles until they migrate.
export const fireRedActive=()=>!window.GameEngine?.claims()&&(S.screen==='battle'&&!!B||S.screen==='multiplayer'&&!!arenaOf());

const el=(tag,cls,html='')=>{const n=document.createElement(tag);if(cls)n.className=cls;if(html)n.innerHTML=html;return n;};
const effLabel={'super efetivo':'Super efetivo','pouco efetivo':'Pouco efetivo','sem efeito':'Sem efeito'};
const cmd=(label,attrs,disabled,sub='')=>`<button class="fr-cmd" ${attrs} ${disabled?'disabled':''}><span class="fr-cursor">▶</span><span>${label}${sub?`<small>${sub}</small>`:''}</span></button>`;
const blank='<span class="fr-cmd fr-cmd-empty"></span>';

// What each battle client offers, read from the markup and navigation it already produces.
function journeyView(items){
 const find=(action,value)=>items.find(x=>x.action===action&&(value===undefined||x.value===value));
 const bag=find('menu','bag'),ball=find('menu','ball'),party=find('menu','switch'),flee=find('flee');
 const actor=R.team[B.double?B.playerSlots[Math.min(B.commands.length,B.playerSlots.length-1)]:B.playerSlots?.[0]??R.active];
 const fleeCost=flee&&!B.train?String(flee.label).split('·')[1]?.trim()||'':'';
 return {key:B,actorKey:B.double?B.commands.length:0,actor:actor&&nm(actor),exp:B.double?null:actor,
  locked:!!B.lock,menu:B.forced?'switch':B.menu,message:B.log?.at(-1)||'',effKnown:!B.double,
  // Wild battles reach Poké Balls through the bag, as in FireRed.
  commands:cmd('MOCHILA','data-act="menu" data-v="bag"',!bag||bag.disabled&&!(ball&&!ball.disabled))+cmd('POKÉMON','data-act="menu" data-v="switch"',!party||party.disabled)+(flee?cmd(B.train?'SAIR':'FUGIR','data-act="flee"',flee.disabled,fleeCost):blank),
  tabs:['bag','ball'].includes(B.menu)&&ball?[['menu','bag','Itens',bag],['menu','ball','Pokébolas',ball]]:null,
  title:B.forced?'Pokémon':{bag:'Mochila',ball:'Pokébolas',switch:'Pokémon',itemTarget:'Mochila',itemMove:'Mochila',target:'Alvo'}[B.menu]||'',
  hint:{bag:'Usar qual item?',ball:'Usar qual Pokébola?',switch:'Escolha um Pokémon.',itemTarget:'Usar em qual Pokémon?',itemMove:'Restaurar PP de qual golpe?',target:'Escolha o alvo.'}[B.menu]};
}
function onlineView(stage,controls,items){
 const wrap=controls.querySelector('.pvp-journey-controls'),prompt=wrap?.querySelector(':scope>p')?.textContent.trim()||'';
 const hasMoves=!!wrap?.querySelector('[data-act="pvpMove"]'),hasButtons=!!wrap?.querySelector('button');
 const bag=items.find(x=>x.value==='bag'),party=items.find(x=>x.value==='pokemon');
 const actor=prompt.match(/^Escolha a ação de (.+?) ·/)?.[1]||stage.querySelector('.player-status .nm,.handheld-mon.player strong')?.firstChild?.textContent.split(' · ')[0].trim();
 const forfeit=!!$app.querySelector('[data-act="forfeitBattle"]');
 return {key:'online',actorKey:prompt,actor,exp:null,locked:!hasButtons,menu:hasMoves?'moves':'other',
  message:stage.querySelector('.pvp-status')?.textContent.trim()||prompt,effKnown:false,
  commands:cmd('MOCHILA','data-act="pvpMenu" data-v="bag"',!bag||bag.disabled)+cmd('POKÉMON','data-act="pvpMenu" data-v="pokemon"',!party||party.disabled)+(forfeit?cmd('DESISTIR','data-act="forfeitBattle"',false):blank),
  tabs:null,title:/desmaiou|Trocar/.test(prompt)?'Pokémon':/alvo/.test(prompt)?'Alvo':/Usar em|PP/.test(prompt)?'Mochila':wrap?.querySelector('[data-act="pvpItem"]')?'Mochila':'',hint:prompt};
}

function readableOn(color){
 const c=document.createElement('canvas').getContext?.('2d');if(!c)return 'fr-ink-dark';c.fillStyle=color;const hex=c.fillStyle;
 if(!/^#[0-9a-f]{6}$/i.test(hex))return 'fr-ink-dark';
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b>.36?'fr-ink-dark':'fr-ink-light';
}

// Turns an engine move button ("Nome<small>Tipo · poder 40 · PP 35/35 · super efetivo</small>") into a FireRed cell.
// Effectiveness is shown when the engine computed it (single journey battles); damaging moves without a tag are "Efetivo".
function moveCell(button,i,effKnown){
 const small=button.querySelector('small'),parts=(small?.textContent||'').split(' · ').map(s=>s.trim());
 const name=[...button.childNodes].filter(n=>n!==small).map(n=>n.textContent).join('').trim();
 const status=parts[1]==='Status',pp=parts.find(p=>p.startsWith('PP '))||'',tag=parts.find(p=>effLabel[p]);
 const eff=status?'':tag?effLabel[tag]:effKnown?'Efetivo':'',lock=parts.find(p=>p.startsWith('travado'));
 Object.assign(button.dataset,{frType:parts[0]||'',frPp:pp,frEff:eff,frPower:status?'Status':parts[1]||'',frIndex:String(i),frNote:lock||''});
 button.className=`mv fr-move ${readableOn(button.style.getPropertyValue?.('--move-color').trim()||'#a8a878')}${button.disabled?' is-disabled':''}`;
 button.innerHTML=`<span class="fr-move-name">${esc(name)}</span>${eff?`<span class="fr-eff fr-eff-${eff==='Super efetivo'?'up':eff==='Efetivo'?'mid':'down'}">${eff}</span>`:''}`;
 return button;
}

function moveInfo(button){
 if(!button)return '';
 const d=button.dataset;
 return `<p class="fr-info-row"><span>PP</span><b>${esc(d.frPp.replace('PP ',''))}</b></p><p class="fr-info-row"><span>TIPO/</span><b>${esc(d.frType.toUpperCase())}</b></p><p class="fr-info-row fr-info-power">${esc(d.frPower)}${d.frEff?` · ${esc(d.frEff)}`:''}</p>${d.frNote?`<p class="fr-info-note">${esc(d.frNote)}</p>`:''}`;
}

function typeMessage(p,text){
 if(text===FR.lastMsg){p.textContent=text;return;}
 FR.lastMsg=text;const token=++FR.typing,speed=Math.max(.5,Number(CFG.speed)||1);
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||typeof requestAnimationFrame!=='function'){p.textContent=text;return;}
 const total=Math.min(420,text.length*16)/speed,start=performance.now();
 const step=now=>{if(token!==FR.typing||!p.isConnected)return;const n=Math.ceil(text.length*Math.min(1,(now-start)/total));p.textContent=text.slice(0,n);if(n<text.length)requestAnimationFrame(step);};
 p.textContent='';requestAnimationFrame(step);
}

// FireRed/LeafGreen art from PokeAPI for species #1-386; later species keep the regular sprite.
// The manifest gives each sprite's empty rows at the bottom; dropping by that rests it on the ground.
function gbaSprites(arena){
 for(const img of arena.querySelectorAll('.battle-mon img,.handheld-sprite img')){
  const dex=Number(img.getAttribute('src')?.match(/\/(\d+)(?:-[a-z]+)?\.png$/)?.[1]),pad=window.FRLG_SPRITES?.[dex];if(!pad)continue;
  const side=img.closest('.art')?.classList.contains('back')?'b':'f',box=img.closest('.battle-mon,.handheld-sprite');
  img.src=`assets/sprites-frlg/${dex}-${side}.png`;box.classList.add('fr-gba');box.style.setProperty('--fr-drop',pad[side==='f'?0:1]*1.5);
 }
}

export function presentFireRed(stage,items){
 if(!fireRedActive()){FR.key=null;return;}
 const arena=stage.querySelector(':scope>.battle-classic,:scope>.handheld-arena'),controls=stage.querySelector(':scope>.react-battle-choices');
 if(!arena||!controls)return;
 // Battle history and options (Social) stay below the scene; only the command controls move into the frame.
 stage.after(...controls.querySelectorAll(':scope>details'));
 const view=S.screen==='multiplayer'?onlineView(stage,controls,items):journeyView(items);
 if(FR.key!==view.key){FR.key=view.key;FR.fight=false;FR.moveIndex=0;FR.lastMsg='';}
 if(FR.actor!==view.actorKey){FR.actor=view.actorKey;FR.fight=false;FR.moveIndex=0;}
 if(view.locked)FR.fight=false;
 stage.classList.add('fr-battle');stage.classList.toggle('fr-double',arena.classList.contains('handheld-arena'));
 const frame=el('div','fr-frame');stage.prepend(frame);frame.append(arena);
 gbaSprites(arena);
 // Player status: HP numbers and EXP bar, as in the GBA games.
 const ps=arena.querySelector('.player-status');
 if(ps&&view.exp&&!ps.querySelector('.fr-exp'))ps.insertAdjacentHTML('beforeend',`<div class="fr-exp"><span>EXP</span>${xpBar(view.exp)}</div>`);

 const box=el('div','fr-textbox');frame.append(box);
 const message=el('div','fr-message'),p=el('p');message.append(p);
 const moves=[...controls.querySelectorAll('.moves .mv')];
 const targets=[...controls.querySelectorAll('[data-act="target"],[data-act="pvpTarget"]')];
 if(!view.locked&&targets.length){
  // Targets are picked in the text box so both sides of the field stay visible, as in FireRed.
  const source=controls.querySelector('.pvp-journey-controls')||controls,prompt=source.querySelector(':scope>p')?.textContent.trim()||'Escolha o alvo.';
  const backBtn=source.querySelector('[data-act="pvpMenu"][data-v="main"],[data-act="menu"][data-v="moves"]');
  const menu=el('div','fr-menu fr-grid');menu.setAttribute('role','menu');
  for(const b of [...targets,...(backBtn?[backBtn]:[])]){const label=b.textContent.trim();b.className='fr-cmd';b.innerHTML=`<span class="fr-cursor">▶</span><span>${esc(b===backBtn?'VOLTAR':label)}</span>`;menu.append(b);}
  box.append(message,menu);typeMessage(p,prompt.replace(/:$/,'.'));
 }else if(!view.locked&&view.menu!=='moves'){
  // Bag, Poké Balls, party, targets and forced replacements keep the engine's own lists, shown as a full-scene menu.
  const overlay=el('div','fr-overlay');overlay.setAttribute('role','dialog');
  const tabs=view.tabs?`<nav class="fr-tabs">${view.tabs.map(([act,v,label,it])=>`<button class="fr-tab" data-act="${act}" data-v="${v}" aria-pressed="${B.menu===v}" ${it?.disabled?'disabled':''}>${label}</button>`).join('')}</nav>`:'';
  overlay.innerHTML=`<header class="fr-overlay-head"><strong>${view.title}</strong>${tabs}</header>`;
  const body=el('div','fr-overlay-body');
  const source=controls.querySelector('.pvp-journey-controls')||controls;
  const prompt=source.querySelector(':scope>p')?.textContent.trim();source.querySelector(':scope>p')?.remove();
  while(source.firstChild)body.append(source.firstChild);
  overlay.append(body);frame.append(overlay);
  message.classList.add('is-wide');box.append(message);typeMessage(p,prompt||view.hint||'Escolha uma opção.');
 }else if(!view.locked&&FR.fight&&moves.length){
  const grid=el('div','fr-moves fr-grid');moves.forEach((b,i)=>grid.append(moveCell(b,i,view.effKnown)));
  for(let i=moves.length;i<4;i++)grid.append(el('span','fr-move-empty','—'));
  const info=el('div','fr-info');
  FR.moveIndex=Math.min(FR.moveIndex,moves.length-1);
  const show=i=>{FR.moveIndex=i;info.innerHTML=moveInfo(moves[i])+`<button class="fr-back" data-fr="back">◀ Voltar</button>`;moves.forEach((b,k)=>b.classList.toggle('is-current',k===i));};
  moves.forEach((b,i)=>{b.addEventListener('mouseenter',()=>show(i));b.addEventListener('focus',()=>show(i));});
  show(FR.moveIndex);box.append(grid,info);
 }else if(!view.locked){
  box.append(message);typeMessage(p,`O que ${view.actor||'seu Pokémon'} vai fazer?`);
  box.insertAdjacentHTML('beforeend',`<div class="fr-menu fr-grid" role="menu" aria-label="Comandos da batalha">${cmd('LUTAR','data-fr="fight"',!moves.length)}${view.commands}</div>`);
 }else{
  message.classList.add('is-wide');box.append(message);typeMessage(p,view.message);
 }
 // The engine log stays in the page (hidden) for history and accessibility; the text box shows the current line.
 controls.remove();
 fitFireRed(stage);
 focusMenu(stage);
}

function focusMenu(stage){
 const active=document.activeElement;
 if(active&&stage.contains(active)&&active.closest('.fr-grid,.fr-overlay'))return;
 const grid=stage.querySelector('.fr-grid,.fr-overlay');if(!grid)return;
 const buttons=[...grid.querySelectorAll('button:not([disabled])')];
 (FR.fight?buttons[FR.moveIndex]:buttons[0])?.focus?.({preventScroll:true});
}

export function fitFireRed(stage=$app.querySelector('.react-battle-stage.fr-battle')){
 if(!stage)return;
 const w=stage.parentElement?.clientWidth||innerWidth||SCENE_W*2,h=(innerHeight||SCENE_H*2)-(stage.getBoundingClientRect?.().top||0)-16;
 const fit=Math.min(w/SCENE_W,h/SCENE_H),scale=fit>=1?Math.floor(fit):Math.max(.5,fit);
 stage.style.setProperty('--u',scale+'px');
 // Jersey 10 is drawn on a 10px em: font sizes must be whole multiples of it to stay crisp.
 stage.style.setProperty('--fp',Math.max(1,Math.floor(scale*1.5))+'px');stage.style.setProperty('--fps',Math.max(1,Math.floor(scale))+'px');
}

function back(){
 if(FR.fight){FR.fight=false;render();return true;}
 // The engine's own "Voltar" in the menu body (the category tabs are not a way back).
 const engineBack=[...$app.querySelectorAll('.fr-overlay-body :is([data-act="menu"],[data-act="pvpMenu"])')].at(-1);
 if(engineBack&&!engineBack.disabled){engineBack.click();return true;}
 return false;
}

export function installFireRedInput(){
 document.addEventListener('click',event=>{
  const target=event.target.closest('[data-fr]');if(!target||!fireRedActive()||S.screen==='battle'&&B.lock)return;
  if(target.dataset.fr==='fight'){FR.fight=true;render();}
  else if(target.dataset.fr==='back')back();
 });
 document.addEventListener('keydown',event=>{
  if(!fireRedActive()||event.target.closest?.('input,textarea,select')||event.ctrlKey||event.altKey||event.metaKey)return;
  const key=event.key;
  if(['x','X','Escape','Backspace'].includes(key)){if(back())event.preventDefault();return;}
  const grid=$app.querySelector('.fr-grid');
  if(['z','Z'].includes(key)){const f=document.activeElement;if(f&&$app.contains(f)&&f.tagName==='BUTTON'){event.preventDefault();f.click();}return;}
  const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-2,ArrowDown:2}[key];if(delta===undefined)return;
  const scope=grid||$app.querySelector('.fr-overlay');if(!scope)return;
  const buttons=[...scope.querySelectorAll('button')],i=Math.max(0,buttons.indexOf(document.activeElement));
  const step=grid?delta:Math.sign(delta);let next=i+step;
  while(buttons[next]?.disabled)next+=step;
  if(buttons[next]){event.preventDefault();buttons[next].focus();}
 });
 addEventListener('resize',()=>requestAnimationFrame(()=>fitFireRed()));
}
