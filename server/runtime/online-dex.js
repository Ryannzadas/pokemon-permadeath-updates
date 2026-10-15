/* National Dex belongs to the builder and online renderer only. */
const OnlineDex=(()=>{
 'use strict';
 const species=ONLINE_DEX_DATA.species,moves={...M,...ONLINE_DEX_DATA.moves},abilities=ONLINE_DEX_DATA.abilities;
 const items={...ONLINE_DEX_DATA.items,...(typeof JourneyStrategy!=='undefined'?JourneyStrategy.items:{})},natures=ONLINE_DEX_DATA.natures;
 const abilityName=id=>ONLINE_DEX_DATA.abilityLabels[id]||id;
 const moveName=id=>CFG.moveLanguage==='en'?(moves[id]?.en||moves[id]?.n||id):(moves[id]?.n||id);
 const sprite=(id,back=false)=>{const p=species[id];return p?`assets/online-sprites/${p.dex}${back&&ONLINE_DEX_DATA.backSprites?.includes(p.dex)?'-back':''}.png`:'';};
 // Called only inside the isolated server battle VM, never in journey/browser code.
 function installBattle(){
  for(const [id,p]of Object.entries(species))SP[id]={...p,b:[p.stats[0],p.stats[1],p.stats[2],p.stats[5]],c:.45,w:0,mv:p.learn.filter(x=>x.method==='level').map(x=>[Math.max(1,x.level),x.id]),evolution:[]};
  Object.assign(JourneyStrategy.items,items);Object.assign(M,moves);Object.assign(POKEMON_ABILITIES,abilities);
  const previous=recalc;recalc=m=>{previous(m);const n=natures[m.nature];if(n&&n.up!==n.down){m[n.up]=Math.floor(m[n.up]*1.1);m[n.down]=Math.floor(m[n.down]*.9);}if(m.sp==='shedinja'){m.maxHp=1;if(m.hp>0)m.hp=1;}};
 }
 return {species,moves,abilities,items,natures,abilityName,moveName,sprite,installBattle};
})();
