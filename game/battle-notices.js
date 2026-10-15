/* Post-battle growth is visible in the result and announced once per result. */
(() => {
 const seen=new WeakSet();let pending=[],timer=null;
 const moveName=id=>window.gameExpansion.moveName(id);
 const changes=result=>(result?.xp||[]).filter(x=>x.to>x.from||(x.learned||[]).length||(x.evolutions||[]).length);
 const text=x=>`${SP[x.sp].n}${x.to>x.from?` · Nv. ${x.from} → ${x.to}`:''}${x.learned?.length?` · Aprendeu ${x.learned.map(moveName).join(', ')}`:''}${x.evolutions?.length?` · Pode evoluir para ${x.evolutions.map(id=>SP[id].n).join(' / ')}`:''}`;
 function clear(){clearTimeout(timer);timer=null;pending=[];document.getElementById('battle-growth-notice')?.remove();}
 function next(){clearTimeout(timer);document.getElementById('battle-growth-notice')?.remove();if(!pending.length)return;const message=pending.shift(),el=document.createElement('aside');el.id='battle-growth-notice';el.className='battle-growth-notice';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.innerHTML=`<button aria-label="Fechar aviso">×</button><strong>Progresso do Pokémon</strong><p>${esc(message)}</p>`;el.querySelector('button').addEventListener('click',next);document.body.appendChild(el);timer=setTimeout(next,7500);}
 const old=rReward;rReward=()=>{const html=old(),rows=changes(V);if(V&&!seen.has(V)){seen.add(V);if(rows.length){clear();pending=rows.map(text);next();}}return rows.length?html.replace('<ul class="xp-results">',`<section class="battle-growth"><h3>Progresso da equipe</h3>${rows.map(x=>`<p>${esc(text(x))}</p>`).join('')}<small>Novos golpes disponíveis no sumário.</small></section><ul class="xp-results">`):html;};
 const oldEvolve=evolveMon;evolveMon=async(...args)=>{const mon=args[0],before=mon?.sp;await oldEvolve(...args);if(before&&mon.sp!==before){clear();pending=[`${SP[before].n} evoluiu para ${SP[mon.sp].n}!`];next();}};
 window.addEventListener('game-screen-changed',()=>{if(['battle','intro','title','starter','gameover'].includes(S.screen))clear();});
})();
