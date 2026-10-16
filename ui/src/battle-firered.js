// FireRed-style presentation for single battles. The engine's own buttons are moved into the
// GBA-like frame, so actions, disabled states and battle rules stay in the engine.
const SCENE_W=360,SCENE_H=240;
const FR={battle:null,fight:false,moveIndex:0,lastMsg:'',typing:0};

export const fireRedActive=()=>S.screen==='battle'&&!!B&&!B.double;

const el=(tag,cls,html='')=>{const n=document.createElement(tag);if(cls)n.className=cls;if(html)n.innerHTML=html;return n;};
const effLabel={'super efetivo':'Super efetivo','pouco efetivo':'Pouco efetivo','sem efeito':'Sem efeito'};

function readableOn(color){
 const c=document.createElement('canvas').getContext?.('2d');if(!c)return 'fr-ink-dark';c.fillStyle=color;const hex=c.fillStyle;
 if(!/^#[0-9a-f]{6}$/i.test(hex))return 'fr-ink-dark';
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b>.36?'fr-ink-dark':'fr-ink-light';
}

// Turns an engine move button ("Nome<small>Tipo · poder 40 · PP 35/35 · super efetivo</small>") into a FireRed cell.
function moveCell(button,i){
 const small=button.querySelector('small'),parts=(small?.textContent||'').split(' · ').map(s=>s.trim());
 const name=[...button.childNodes].filter(n=>n!==small).map(n=>n.textContent).join('').trim();
 const status=parts[1]==='Status',pp=parts.find(p=>p.startsWith('PP '))||'',tag=parts.find(p=>effLabel[p]);
 const eff=status?'':tag?effLabel[tag]:'Efetivo',lock=parts.find(p=>p.startsWith('travado'));
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

function commandMenu(items){
 const find=(action,value)=>items.find(x=>x.action===action&&(value===undefined||x.value===value));
 const bag=find('menu','bag'),ball=find('menu','ball'),party=find('menu','switch'),flee=find('flee');
 const cmd=(label,attrs,disabled,sub='')=>`<button class="fr-cmd" ${attrs} ${disabled?'disabled':''}><span class="fr-cursor">▶</span><span>${label}${sub?`<small>${sub}</small>`:''}</span></button>`;
 const fleeCost=flee&&!B.train?String(flee.label).split('·')[1]?.trim()||'':'';
 // Wild battles reach Poké Balls through the bag, as in FireRed.
 const bagAttrs=bag?`data-act="menu" data-v="bag"`:'';
 return `<div class="fr-menu fr-grid" role="menu" aria-label="Comandos da batalha">${cmd('LUTAR','data-fr="fight"',false)}${cmd('MOCHILA',bagAttrs,!bag||bag.disabled&&!(ball&&!ball.disabled))}${cmd('POKÉMON','data-act="menu" data-v="switch"',!party||party.disabled)}${flee?cmd(B.train?'SAIR':'FUGIR','data-act="flee"',flee.disabled,fleeCost):''}</div>`;
}

export function presentFireRed(stage,items){
 if(!fireRedActive()){FR.battle=null;return;}
 if(FR.battle!==B){FR.battle=B;FR.fight=false;FR.moveIndex=0;FR.lastMsg='';}
 if(B.lock||B.forced)FR.fight=false;
 stage.classList.add('fr-battle');
 const arena=stage.querySelector(':scope>.battle-classic'),controls=stage.querySelector(':scope>.react-battle-choices');
 if(!arena||!controls)return;
 const frame=el('div','fr-frame');stage.prepend(frame);frame.append(arena);

 // Player status: HP numbers and EXP bar, as in the GBA games.
 const pm=R.team[B.playerSlots?.[0]??R.active];
 // FireRed/LeafGreen art from PokeAPI for species #1-386; later species keep the regular sprite.
 // The manifest gives each sprite's empty rows at the bottom; dropping by that rests it on the ground.
 const gba=(img,m,side)=>{const dex=SP[m?.sp]?.dex,pad=window.FRLG_SPRITES?.[dex];if(!img||!pad)return;img.src=`assets/sprites-frlg/${dex}-${side}.png`;const box=img.closest('.battle-mon');box?.classList.add('fr-gba');box?.style.setProperty('--fr-drop',pad[side==='f'?0:1]*1.5);};
 gba(arena.querySelector('.enemy-mon img'),B.enemy,'f');gba(arena.querySelector('.player-mon img'),pm,'b');
 const ps=arena.querySelector('.player-status');
 if(ps&&pm&&!ps.querySelector('.fr-exp'))ps.insertAdjacentHTML('beforeend',`<div class="fr-exp"><span>EXP</span>${xpBar(pm)}</div>`);

 const box=el('div','fr-textbox');frame.append(box);
 const message=el('div','fr-message'),p=el('p');message.append(p);
 const idle=!B.lock&&!B.forced&&B.menu==='moves';
 const moves=[...controls.querySelectorAll('.moves .mv')];
 // Forced replacement after a faint always opens the party list so the player is never stuck.
 if(!B.lock&&(B.forced||B.menu!=='moves')){
  // Bag, Poké Balls, party and targets keep the engine's own lists, shown as a full-scene menu.
  const overlay=el('div','fr-overlay');overlay.setAttribute('role','dialog');
  const prompt=controls.querySelector(':scope>p')?.textContent.trim();
  const title=B.forced?'Pokémon':{bag:'Mochila',ball:'Pokébolas',switch:'Pokémon',itemTarget:'Mochila',itemMove:'Mochila',target:'Alvo'}[B.menu]||'';
  const tabs=['bag','ball'].includes(B.menu)&&items.some(x=>x.value==='ball')?`<nav class="fr-tabs">${[['bag','Itens'],['ball','Pokébolas']].map(([v,l])=>{const it=items.find(x=>x.value===v);return `<button class="fr-tab" data-act="menu" data-v="${v}" aria-pressed="${B.menu===v}" ${it?.disabled?'disabled':''}>${l}</button>`;}).join('')}</nav>`:'';
  overlay.innerHTML=`<header class="fr-overlay-head"><strong>${title}</strong>${tabs}</header>`;
  const body=el('div','fr-overlay-body');while(controls.firstChild)body.append(controls.firstChild);body.querySelector(':scope>p')?.remove();
  overlay.append(body);frame.append(overlay);
  message.classList.add('is-wide');box.append(message);typeMessage(p,prompt||{bag:'Usar qual item?',ball:'Usar qual Pokébola?',switch:'Escolha um Pokémon.',itemTarget:'Usar em qual Pokémon?',itemMove:'Restaurar PP de qual golpe?',target:'Escolha o alvo.'}[B.menu]||'Escolha uma opção.');
 }else if(idle&&FR.fight&&moves.length){
  const grid=el('div','fr-moves fr-grid');moves.forEach((b,i)=>grid.append(moveCell(b,i)));
  for(let i=moves.length;i<4;i++)grid.append(el('span','fr-move-empty','—'));
  const info=el('div','fr-info');
  FR.moveIndex=Math.min(FR.moveIndex,moves.length-1);
  const show=i=>{FR.moveIndex=i;info.innerHTML=moveInfo(moves[i])+`<button class="fr-back" data-fr="back">◀ Voltar</button>`;moves.forEach((b,k)=>b.classList.toggle('is-current',k===i));};
  moves.forEach((b,i)=>{b.addEventListener('mouseenter',()=>show(i));b.addEventListener('focus',()=>show(i));});
  show(FR.moveIndex);box.append(grid,info);
 }else if(idle){
  box.append(message);typeMessage(p,`O que ${nm(pm)} vai fazer?`);
  box.insertAdjacentHTML('beforeend',commandMenu(items));
 }else{
  message.classList.add('is-wide');box.append(message);typeMessage(p,B.log?.at(-1)||'');
 }
 controls.remove();stage.querySelector(':scope>.battle-log')?.remove();
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
 const engineBack=[...$app.querySelectorAll('.fr-overlay-body [data-act="menu"]')].at(-1);
 if(engineBack&&!engineBack.disabled){engineBack.click();return true;}
 return false;
}

export function installFireRedInput(){
 document.addEventListener('click',event=>{
  const target=event.target.closest('[data-fr]');if(!target||!fireRedActive()||B.lock)return;
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
