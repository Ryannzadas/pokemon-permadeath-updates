// The existing engine remains authoritative for actions and available targets.
import {fireRedActive,presentFireRed,fitFireRed} from './battle-firered';
export function battleNavigation(){
 // Battles show these commands in the FireRed menu instead of the sidebar.
 if(S.screen==='multiplayer')return fireRedActive()?[]:window.socialBattleNavigation?.()||[];
 if(S.screen!=='battle'||!B)return null;
 return fireRedActive()?[]:commandItems();
}
// Shared with the Phaser battle scene so the command rules live in one place.
window.battleCommandItems=()=>S.screen==='battle'&&B?commandItems():[];
function commandItems(){
 const locked=B.lock||B.forced||B.menu==='target';
 const item=(icon,label,action,value,disabled=false)=>({icon,label,action,value,disabled:!!(locked||disabled),selected:action==='menu'&&B.menu===value});
 const list=[item('bag','Mochila','menu','bag')];
 if(!B.train&&!B.boss&&!B.double)list.push(item('dex','Capturar','menu','ball'));
 list.push(item('team','Trocar','menu','switch',!R.team.some((m,i)=>m.hp>0&&!B.playerSlots.includes(i))));
 if(!B.double)list.push(item('back',B.train?'Encerrar treino':`Fugir · ₽${fleeCost()}`,'flee','',!B.train&&(B.boss||R.money<fleeCost())));
 return list;
}
export function layoutBattle(){
 if(!['battle','multiplayer'].includes(S.screen))return;
 const arena=$app.querySelector('.battle-classic,.handheld-arena');if(!arena)return;
 $app.querySelectorAll('.moves + .row').forEach(row=>{if(row.querySelector('[data-act="menu"],[data-act="pvpMenu"]'))row.remove();});
 const parent=arena.parentElement,stage=document.createElement('section');stage.className='react-battle-stage game-battle-layout';arena.before(stage);stage.appendChild(arena);
 const log=parent.querySelector(':scope > .battle-log');if(log)stage.appendChild(log);
 const controls=document.createElement('div');controls.className='react-battle-choices';
 while(stage.nextSibling)controls.appendChild(stage.nextSibling);
 stage.appendChild(controls);
 if(fireRedActive()){presentFireRed(stage,S.screen==='multiplayer'?window.socialBattleNavigation?.()||[]:commandItems());return;}
 if(log)requestAnimationFrame(()=>{if(log.isConnected)log.scrollTop=log.scrollHeight;});
}
export function fitBattle(){
 const stage=$app.querySelector('.react-battle-stage');if(!stage)return;
 if(stage.classList.contains('fr-battle'))return fitFireRed(stage);
 const footer=innerWidth<=700?(document.querySelector('.react-mobile-nav')?.getBoundingClientRect().height||72):0;
 stage.style.setProperty('--battle-height',Math.max(420,innerHeight-stage.getBoundingClientRect().top-footer-16)+'px');
}
window.addEventListener('resize',()=>requestAnimationFrame(fitBattle));
