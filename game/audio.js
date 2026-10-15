/* Automatic contextual soundtrack and quiet, per-move battle effects. */
(() => {
 const extra=EXTRA_AUDIO.music;
 const groups={title:['title',...extra.titles.map(t=>t.id)],cities:[...CITY_TRACKS,...extra.cities.map(t=>t.id)]};
 const battles={wild:['wild','wildKanto'],gym:['bossKanto'],champion:['champion'],elite:['bossKanto'],trainer:['trainerJohto','trainerKanto','rival'],legendary:['wild']};
 for(const t of [...extra.titles,...extra.cities,...Object.values(extra.battle).flat()])MUSIC_FILES[t.id]=t.file;
 for(const t of extra.cities){MENU_MUSIC[t.id]=t.file;CITY_TRACKS.push(t.id);MENU_TRACKS.push({id:t.id,name:t.name});}
 for(const [kind,tracks]of Object.entries(extra.battle))battles[kind].push(...tracks.map(t=>t.id));
 let oldContext=null,lastTitle=null,lastBattle={};
 const choose=(ids,previous)=>pick(ids.filter(id=>ids.length===1||id!==previous));
 rPlaylist=()=>'';refreshPlaylist=()=>{};updatePlaylistStatus=()=>{};playlistOpen=false;
 ACT.playlistToggle=()=>{};ACT.playlistClose=()=>{};
 const originalStart=musicStart;
 musicStart=(id,loop=true)=>{
  originalStart(id,loop);
  if(musAudio&&(groups.title.includes(id)||groups.cities.includes(id))){musAudio.loop=false;const audio=musAudio;audio.onended=()=>{if(musAudio!==audio)return;if(S.screen==='title'){lastTitle=choose(groups.title,id);musicStart(lastTitle,false);}else if(!['battle','intro','reward','gameover','win'].includes(S.screen)&&!(S.screen==='hub'&&S.shop))playCityMusic(id);};}
 };
 playCityMusic=previous=>musicStart(choose(groups.cities,previous),false);
 screenMusic=()=>{
  if(EVOLVING)return;const context=GameNavigation.musicContext();
  if(context===oldContext&&musAudio)return;
  oldContext=context;musicScreen=context;
  if(context==='title'){lastTitle=choose(groups.title,lastTitle);musicStart(lastTitle,false);}
  else if(context==='shop')musicStart('pokeMart');
  else if(context==='center')musicStart('pokeCenter');
  else if(['battle','intro'].includes(context)){if(B&&musTrackId!==B.musicTrack)musicStart(B.musicTrack);}
  else if(['reward','win','gameover'].includes(context))return;
  else playCityMusic(lastMenuCity);
 };
 const oldBattle=startBattle;
 startBattle=train=>{
  const was=S.screen;oldBattle(train);
  if(was!=='hub'||!B||!['battle','intro'].includes(S.screen))return;
  const category=B.trainer?Math.floor(R.battle/5)<8?'gym':Math.floor(R.battle/5)<12?'elite':'champion':B.enemy.alpha?'legendary':pick(['wild','wild','trainer','champion']);
  B.musicTrack=lastBattle[category]=choose(battles[category],lastBattle[category]);musicStart(B.musicTrack);oldContext=S.screen;
 };
 // Existing impact clips supplied in the SFX archive. No normal-hit sound on immunity.
 const oldSfx=sfx;let impactAudio=null,attackAudio=null;
 sfx=name=>{
  if(['hit','hitSE','hitNE'].includes(name)){
   if(!CFG.sound)return;
   try{impactAudio?.pause();impactAudio=new Audio('assets/audio032/impact-'+name+'.mp3');impactAudio.volume=.24;impactAudio.playbackRate=CFG.speed||1;impactAudio.play().catch(()=>{});}catch{}return;
  }oldSfx(name);
 };
 const statusIcons={poison:'☠',burn:'♨',paralysis:'ϟ',sleep:'Zz',freeze:'❄',heal:'✚'};
 function mount(){
  document.querySelectorAll('.battle-effect').forEach(el=>el.remove());if(!B?.visual)return;
  const {mon,kind,text}=B.visual;
  let el;
  if(B.double){const player=R.team.includes(mon);const slots=player?B.playerSlots:B.enemySlots,team=player?R.team:B.enemies;const index=slots.findIndex(i=>team[i]===mon);el=document.querySelectorAll(player?'.player-side .combat-card':'.enemy-side .combat-card')[index];}
  else el=document.querySelector(R.team.includes(mon)?'.player-mon':'.enemy-mon');
  if(el){const node=document.createElement('span');node.className='battle-effect '+kind;node.textContent=text;node.setAttribute('aria-hidden','true');node.style.animationDuration=`${.65/(CFG.speed||1)}s`;el.appendChild(node);}
 }
 const oldRender=render;render=()=>{oldRender();mount();};
 window.BattleEffects={
  async show(mon,kind,text){if(!B)return;const battle=B;B.visual={mon,kind,text};render();await sleep(650);if(B===battle){B.visual=null;render();}},
  async move(mon,id){
   attackAudio?.pause();const clip=EXTRA_AUDIO.moves[id];
   if(CFG.sound&&clip)try{attackAudio=new Audio(clip.file);attackAudio.volume=.32;attackAudio.playbackRate=CFG.speed||1;attackAudio.play().catch(()=>{});}catch{}
   await this.show(mon,'attack','✦');
  },
  status(mon,kind){return this.show(mon,kind==='heal'?'buff':'status',statusIcons[kind]||'✦');},
  stop(){attackAudio?.pause();impactAudio?.pause();}
 };
 const oldSound=ACT.snd;ACT.snd=()=>{oldSound();if(!CFG.sound)BattleEffects.stop();};
 render();
})();
