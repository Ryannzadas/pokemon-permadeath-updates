/* Active foreground time, persisted with the existing run and account keys. */
(() => {
 'use strict';
 let last=performance.now(),lastRun=null,active=false,ticks=0;
 const excluded=new Set(['title','doubleChoice','modeSelect','continueSelect','starter','character','trainerName','win','gameover']);
 function flush(){
  const now=performance.now(),elapsed=Math.max(0,Math.min(10000,now-last));
  if(active&&lastRun)lastRun.playTimeMs=Math.max(0,Number(lastRun.playTimeMs)||0)+elapsed;
  last=now;lastRun=R;const accountPage=['dex','journal','pc','summary'].includes(S.screen)&&window.gameExpansion?.subDestination()==='title';active=!!R&&!excluded.has(S.screen)&&!accountPage&&document.visibilityState==='visible'&&document.hasFocus();
 }
 const format=ms=>{const minutes=Math.floor(Math.max(0,Number(ms)||0)/60000);return `${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}min`;};
 window.JourneyClock={flush,format};
 const oldPersist=persist;persist=()=>{flush();oldPersist();};
 const oldRender=render;render=()=>{flush();oldRender();};
 const oldArchive=archiveRun;
 archiveRun=(outcome,cause)=>{
  flush();oldArchive(outcome,cause);if(!R)return;
  const history=META.history.find(h=>h.id===R.id);if(history)history.playTimeMs=R.playTimeMs||0;
  if(R.postgame&&outcome==='champion'&&!META.postgameRecords.some(h=>h.id===R.id)){
   const mode=R.mode==='classic'?'classic':'permadeath';
   META.postgameRecords.unshift({id:R.id,mode,ended:new Date().toISOString(),playTimeMs:R.playTimeMs||0,trainerName:R.trainerName||'',team:R.team.map(m=>({sp:m.sp,lvl:m.lvl,hp:m.hp}))});
   META.postgameRecords=META.postgameRecords.slice(0,100);META.completedPostgames[mode]++;
  }
  saveMeta();
 };
 const oldWin=winRun;winRun=()=>{flush();oldWin();const team=META.championTeams.find(t=>t.id===R?.id);if(team){team.playTimeMs=R.playTimeMs||0;saveMeta();}};
 for(const [mode,label,avatar] of [['classic','Clássico',196],['permadeath','Permadeath',197]])ACHIEVEMENTS.push({id:'double-'+mode,name:'Campeão em dupla · '+label,goal:'Concluir o pós-game em dupla neste modo.',title:'Campeão em dupla · '+label,avatar,progress:()=>META.completedPostgames[mode],target:1});
 const oldWinScreen=rWin;rWin=()=>oldWinScreen().replace('</section>',`<p>Tempo de jogo · ${format(R?.playTimeMs)}</p></section>`);
 const oldJournal=rJournal;
 rJournal=()=>{
  let html=oldJournal();if(S.journal==='history'){let index=0;html=html.replace(/(<article class="journal-entry">[\s\S]*?)(<div class="journal-team">)/g,(match,prefix,team)=>{const h=META.history[index++];return prefix+'<p>Tempo de jogo · '+(h?.playTimeMs==null?'Não registrado':format(h.playTimeMs))+'</p>'+team;});return html;}if(S.journal!=='achievements')return html;
  const records=META.postgameRecords.map(h=>`<article class="journal-entry"><h3>★ Duplas · ${h.mode==='classic'?'Clássico':'Permadeath'}</h3><p>${esc(h.trainerName||'Treinador')} · ${format(h.playTimeMs)} · ${esc(new Date(h.ended).toLocaleDateString('pt-BR'))}</p><div class="journal-team">${h.team.filter(m=>SP[m.sp]).map(m=>`<div><img src="${SPRITE(SP[m.sp].dex)}" alt="${esc(SP[m.sp].n)}"><span>${esc(SP[m.sp].n)} · Nv. ${m.lvl}</span></div>`).join('')}</div></article>`).join('');
  return html.replace(/<\/section>\s*$/,`<h3>Pós-games concluídos</h3>${records||'<p>Conclua o pós-game para registrar a equipe e o tempo de jogo.</p>'}</section>`);
 };
 for(const event of ['focus','blur','pagehide'])window.addEventListener(event,flush);
 document.addEventListener('visibilitychange',flush);
 setInterval(()=>{
  flush();document.querySelectorAll('[data-play-time]').forEach(el=>el.textContent=format(R?.playTimeMs));if(++ticks%30||!active)return;
  try{const saved=JSON.parse(SAVE_STORAGE.getItem(SAVE_KEY)||'null');if(saved?.R?.id===R.id){saved.R.playTimeMs=R.playTimeMs;SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify(saved));}}catch{}
 },1000);
 render();
})();
