'use strict';
/* Offline expansion. Keeps the existing storage keys and desktop bridge. */
(() => {
  const DATA=POKEMON_DATA;
  const strategy=typeof JourneyStrategy!=='undefined'?JourneyStrategy:null,journal=typeof JourneyModel!=='undefined'?JourneyModel:null;
  if(strategy)Object.assign(ITEMS,strategy.items);
  const LEGACY={quick:'quick-attack',slam:'slam',ember:'ember',flame:'flamethrower',watergun:'water-gun',vine:'vine-whip',razor:'razor-leaf',solar:'solar-beam',shock:'thunder-shock',bolt:'thunderbolt',gust:'gust',wing:'wing-attack',rock:'rock-throw',slide:'rock-slide',mud:'mud-slap',quake:'earthquake',chop:'karate-chop',cross:'cross-chop',conf:'confusion',psychic:'psychic',psybeam:'psybeam',lick:'lick',shadow:'shadow-ball',sting:'poison-sting',sludge:'sludge-bomb',icebeam:'ice-beam',bug:'bug-bite',dragon:'dragon-claw',dpulse:'dragon-pulse',pursuit:'pursuit',crunch:'crunch',darkpulse:'dark-pulse',metalclaw:'metal-claw',ironhead:'iron-head',flashcannon:'flash-cannon'};
  const portugueseNames=Object.fromEntries(Object.entries(M).map(([id,m])=>[LEGACY[id]||id,m.n]));
  Object.entries(DATA.moves).forEach(([id,m])=>M[id]={...m,t:m.t,n:portugueseNames[id]||m.n});
  Object.entries(LEGACY).forEach(([old,id])=>{if(DATA.moves[id])M[old]={...DATA.moves[id]};});
  M.struggle={n:'Luta desesperada',en:'Struggle',t:'normal',p:50,a:100,pp:1,cat:2};
  const originalIds=new Set(Object.keys(SP));
  // Official names that capitalizing the id would get wrong.
  const OFFICIAL_NAMES={'nidoran-f':'Nidoran♀','nidoran-m':'Nidoran♂','mr-mime':'Mr. Mime','mime-jr':'Mime Jr.'};
  Object.entries(DATA.species).forEach(([id,d])=>{
    if(!SP[id])sp(id,OFFICIAL_NAMES[id]||id[0].toUpperCase()+id.slice(1),d.dex,d.types,[d.stats[0],d.stats[1],d.stats[2],d.stats[5]],.45,1,[]);
    const s=SP[id];s.stats=d.stats;s.learn=d.learn;s.evolution=d.evolutions;s.base=d.base;
    // Use the current PokeAPI typing consistently across the existing roster.
    s.t=d.types.slice();if(!s.t.length)s.t=['normal'];
    if(d.abilities&&typeof POKEMON_ABILITIES!=='undefined')POKEMON_ABILITIES[id]=d.abilities;
    SPRITES[d.dex]={f:`assets/sprites/${d.dex}-f.png`,b:`assets/sprites/${d.dex}-b.png`};
    s.mv=d.learn.filter(m=>m.method==='level').map(m=>[Math.max(1,m.level),m.id]);
  });
  MUSIC_FILES.evolving='assets/music_files/evolving.mp3';
  const TRAINERS=[
    {name:'Brock',type:'rock',sprite:'Spr_B2W2_Brock',team:['geodude','onix']},
    {name:'Misty',type:'water',sprite:'Spr_HGSS_Misty',team:['staryu','starmie']},
    {name:'Lt. Surge',type:'electric',sprite:'Spr_HGSS_Lt_Surge',team:['magnemite','pikachu','raichu']},
    {name:'Erika',type:'grass',sprite:'Spr_HGSS_Erika',team:['tangela','victreebel','vileplume']},
    {name:'Janine',type:'poison',sprite:'Spr_HGSS_Janine',team:['ariados','weezing','venomoth','crobat']},
    {name:'Sabrina',type:'psychic',sprite:'Spr_HGSS_Sabrina',team:['mr-mime','hypno','espeon','alakazam']},
    {name:'Blaine',type:'fire',sprite:'Spr_B2W2_Blaine',team:['magmar','rapidash','houndoom','camerupt','arcanine']},
    {name:'Giovanni',type:'ground',sprite:'Spr_HGSS_Giovanni',team:['nidorino','dugtrio','nidoqueen','nidoking','rhydon']},
    {name:'Will',type:'psychic',sprite:'Spr_HGSS_Will',team:['xatu','jynx','exeggutor','slowbro','xatu']},
    {name:'Koga',type:'poison',sprite:'Spr_HGSS_Koga',team:['ariados','venomoth','forretress','muk','crobat']},
    {name:'Bruno',type:'fighting',sprite:'Spr_HGSS_Bruno',team:['hitmontop','hitmonlee','hitmonchan','onix','machamp']},
    {name:'Karen',type:'dark',sprite:'Spr_HGSS_Karen',team:['umbreon','vileplume','murkrow','gengar','houndoom']},
    {name:'Lance',type:'dragon',sprite:'Spr_HGSS_Lance',team:['gyarados','dragonite','dragonite','aerodactyl','charizard','dragonite']},
    {name:'Blue',type:null,sprite:'Spr_HGSS_Blue',team:['pidgeot','alakazam','rhydon','gyarados','arcanine','exeggutor']}
  ];
  const ITEMS_EXTRA={
    ether:{n:'Éter',d:'Recupera 10 PP de todos os golpes',price:65,ico:'🔹'},elixir:{n:'Elixir',d:'Recupera todos os PP',price:150,ico:'🔷'},
    friendship:{n:'Doce de amizade',d:'+20 amizade · até 3 por Pokémon por jornada',price:100,ico:'♥'},
    'fire-stone':{n:'Pedra de Fogo'},'water-stone':{n:'Pedra da Água'},'thunder-stone':{n:'Pedra do Trovão'},'leaf-stone':{n:'Pedra da Folha'},'moon-stone':{n:'Pedra da Lua'},'sun-stone':{n:'Pedra Solar'},'dusk-stone':{n:'Pedra do Crepúsculo'},'dawn-stone':{n:'Pedra da Aurora'},'shiny-stone':{n:'Pedra Brilhante'},'razor-claw':{n:'Garra Afiada de evolução'},'razor-fang':{n:'Presa Afiada de evolução'},'metal-coat':{n:'Revestimento Metálico'},'kings-rock':{n:'Rocha do Rei'},'dragon-scale':{n:'Escama de Dragão'},'protector':{n:'Protetor'},'electirizer':{n:'Eletrizador'},'magmarizer':{n:'Magmatizador'},'reaper-cloth':{n:'Pano do Ceifador'},'prism-scale':{n:'Escama Prisma'},'link-cable':{n:'Cabo de Troca'},'moss-rock':{n:'Pedra Musgosa'},'ice-rock':{n:'Pedra Gelada'},'magnetic-rock':{n:'Pedra Magnética'}
  };
  Object.entries(ITEMS_EXTRA).forEach(([id,x])=>ITEMS[id]={price:180,ico:'💎',d:'Evolui uma espécie compatível; veja o sumário',...x});
  const stoneIds=Object.keys(ITEMS_EXTRA).filter(id=>!['ether','elixir','friendship'].includes(id));
  let optionsOpen=false,lastScreen=null,subReturn='title';
  const monName=m=>SP[m.sp].n;
  const moveName=id=>CFG.moveLanguage==='en'?(M[id].en||M[id].n):M[id].n;
  const normalized=id=>LEGACY[id]||id;
  const timePeriod=()=>{const h=new Date().getHours();return h>=6&&h<18?'day':'night';};
  const stageIndex=()=>R?.postgame?Math.floor(R.battle/5):R?(R.endless?Math.floor(R.battle/5)%14:Math.floor(R.battle/5)):0;
  const trainerNext=()=>{const t=TRAINERS[stageIndex()]||null;if(!t||!R?.endless)return t;const pool=Object.keys(SP).filter(id=>!t.type||SP[id].t.includes(t.type));return {...t,team:t.team.map(()=>pick(pool))};};
  nextIsBoss=()=>!!trainerNext()&&(R.battle+1)%5===0;
  nextBoss=()=>{const t=trainerNext()||TRAINERS.at(-1);return {id:t.team.at(-1),title:t.name,...t};};
  function learnAll(m){return (SP[m.sp].learn||[]).filter(x=>x.method==='level'&&x.level<=m.lvl).map(x=>x.id);}
  function normalizeMon(m){
    if(!m||!SP[m.sp])return;
    m.lvl=Math.max(1,Math.min(100,Number(m.lvl)||5));
    m.learned=[...new Set([...(m.learned||[]).map(normalized),...(m.moves||[]).map(normalized),...learnAll(m)])].filter(id=>M[id]);
    m.moves=(m.moves||[]).map(normalized).filter(id=>M[id]).slice(0,4);
    if(!m.moves.length){const legal=learnAll(m);m.moves=legal.filter(id=>M[id].cat!==1).slice(-2);for(const id of legal.slice().reverse())if(m.moves.length<4&&!m.moves.includes(id))m.moves.push(id);}
    if(!m.moves.length)m.moves=['tackle'];
    m.pp=m.pp&&typeof m.pp==='object'?m.pp:{};
    Object.entries({...m.pp}).forEach(([id,v])=>{const n=normalized(id);if(n!==id){m.pp[n]=Math.min(Number(v)||0,m.pp[n]??Infinity);delete m.pp[id];}});
    m.moves.forEach(id=>{if(m.pp[id]===undefined)m.pp[id]=M[id].pp||20;else m.pp[id]=Math.max(0,Math.min(M[id].pp||20,Number(m.pp[id])||0));});
    m.friendship=Math.max(0,Math.min(255,Number(m.friendship??70)));m.friendItems=Math.max(0,Number(m.friendItems)||0);
    m.stages={};if(strategy)strategy.normalize(m);
  }
  recalc=m=>{
    const s=SP[m.sp],st=s.stats||[...s.b.slice(0,3),s.b[1],s.b[2],s.b[3]],L=m.lvl,old=m.maxHp||0,wasDead=old>0&&m.hp<=0;
    m.maxHp=Math.floor(2*st[0]*L/100)+L+10;
    [m.atk,m.def,m.spa,m.spd,m.spe]=st.slice(1).map(b=>Math.floor(2*b*L/100)+5);
    m.types=s.t;normalizeMon(m);
    if(old)m.hp=wasDead?0:Math.max(1,Math.min(m.maxHp,m.hp+(m.maxHp-old)));
  };
  mk=(id,L)=>{const slots=typeof POKEMON_ABILITIES!=='undefined'?POKEMON_ABILITIES[id]||[]:[];const m={sp:id,lvl:L,hp:0,xp:0,abilitySlot:slots.length?pick(slots).slot:1};recalc(m);m.hp=m.maxHp;return m;};
  known=(s,L)=>{const ids=(s.learn||[]).filter(x=>x.method==='level'&&x.level<=L).map(x=>x.id);return [...new Set(ids)].slice(-4);};
  function ensureRun(){
    if(!R)return;R.mode=R.mode==='classic'?'classic':'permadeath';R.pc=Array.isArray(R.pc)?R.pc:[];if(R.heldItemsVersion!==1)R.shop=null;R.heldItemsVersion=1;if(R.leagueVersion!==3)R.shop=null;R.leagueVersion=3;
    [...R.team,...R.pc,...(R.pending?[R.pending]:[])].forEach(m=>{normalizeMon(m);recalc(m);});
    R.bag=R.bag||{};Object.keys(ITEMS).forEach(id=>R.bag[id]=Math.max(0,Number(R.bag[id])||0));
    if(R.mode==='classic'){
      R.classicLegacy=R.classicLegacy||{items:{},relics:{}};
      for(const [id,n]of Object.entries(R.relics||{}))R.classicLegacy.relics[id]=(R.classicLegacy.relics[id]||0)+n;
      R.relics={};for(const id of ['friendship','link-cable','moss-rock','ice-rock','magnetic-rock']){R.classicLegacy.items[id]=(R.classicLegacy.items[id]||0)+(R.bag[id]||0);R.bag[id]=0;}
      if(R.reward)R.reward=[];R.shop=null;
    }
    if(R.pending){R.pc.push(R.pending);R.pending=null;}
    R.active=R.team[R.active]?.hp>0?R.active:Math.max(0,R.team.findIndex(m=>m.hp>0));
    ensureRunId();if(journal)journal.normalize(R);
  }
  const oldNewRun=newRun;
  newRun=id=>{oldNewRun(id);R.pc=[];R.leagueVersion=3;ensureRun();persist();};
  const oldLoad=continueSave;
  continueSave=()=>{oldLoad();ensureRun();if(S.screen!=='gameover')persist();};
  const levelCaps=[10,15,20,26,31,36,41,47,52,57,62,68,73,78];
  const levelCap=()=>R?levelCaps[Math.floor(Math.max(0,R.battle)/5)]||100:100;
  window.JourneyLevelCap={current:levelCap,limits:levelCaps.slice()};
  ITEMS.candy.d='Até +2 níveis, respeitando o limite da etapa.';
  addXp=(m,amount,notes)=>{
    const cap=levelCap();if(m.lvl>=cap){m.xp=0;return 0;}
    let room=0;for(let level=m.lvl;level<cap;level++)room+=xpNeed(level);
    const current=Math.max(0,Math.floor(Number(m.xp)||0)),gained=Math.min(Math.max(0,Math.floor(Number(amount)||0)),Math.max(0,room-current));
    let total=current+gained,n=0;while(m.lvl+n<cap&&total>=xpNeed(m.lvl+n)){total-=xpNeed(m.lvl+n);n++;}
    m.xp=m.lvl+n>=cap?0:total;if(n)levelUp(m,n,notes);return gained;
  };
  levelUp=(m,n,notes)=>{
    n=Math.min(Math.max(0,Math.floor(n)),Math.max(0,levelCap()-m.lvl));if(!n)return;
    const before=new Set(m.learned||[]),previousLevel=m.lvl;m.lvl=Math.min(100,m.lvl+n);m.friendship=Math.min(255,(m.friendship||70)+3*n);recalc(m);
    if(m.lvl>previousLevel&&sylveonEligible(m))m.sylveonLevelReady=true;
    notes.push(`${monName(m)} subiu para o nível ${m.lvl}.`);
    (m.learned||[]).filter(id=>!before.has(id)).forEach(id=>notes.push(`${monName(m)} aprendeu ${moveName(id)}. Disponível no sumário.`));
    if(canEvolve(m))notes.push(`${monName(m)} pode evoluir!`);
  };
  xpGain=(m,e,boss)=>Math.max(1,Math.round((20+4*e.lvl)*Math.pow((2*e.lvl+10)/(e.lvl+m.lvl+10),2.5)*(boss?1.25:1)));
  const ppLeft=(m,id)=>id==='struggle'?Infinity:m.pp[id]||0;
  const available=m=>m.moves.filter(id=>ppLeft(m,id)>0&&(!strategy||strategy.allowed(m,id)));
  const refill=m=>{m.learned.forEach(id=>m.pp[id]=M[id].pp||20);m.ailment=null;m.stages={};};
  function evolutionItem(o){
    if(o.item)return o.item;
    if(o.trigger===2)return R?.mode==='classic'?null:'link-cable';
    if(o.location&&R?.mode==='classic')return o.to==='leafeon'?'leaf-stone':o.to==='glaceon'?'ice-stone':'thunder-stone';
    if(o.location)return ['leafeon','glaceon'].includes(o.to)?(o.to==='leafeon'?'moss-rock':'ice-rock'):'magnetic-rock';
    if(o.beauty)return 'prism-scale';return null;
  }
  const knowsFairy=m=>m.moves.some(id=>M[id]?.t==='fairy');
  const sylveonEligible=m=>m.sp==='eevee'&&m.friendship>=160&&knowsFairy(m);
  function evolutionConditions(m,o){
    // Fairy moves prevent Espeon/Umbreon, even while waiting for the next level.
    if(m.sp==='eevee'&&['espeon','umbreon'].includes(o.to)&&knowsFairy(m))return false;
    if(o.moveType&&!m.moves.some(id=>M[id]?.t===o.moveType))return false;
    if(o.to==='sylveon'&&!m.sylveonLevelReady)return false;
    if(o.trigger===2&&R?.mode==='classic'&&!S.tradeApplying)return false;
    const item=evolutionItem(o);
    if(item&&!R.bag[item])return false;
    if(o.level&&m.lvl<o.level)return false;
    if(o.friendship&&m.friendship<o.friendship)return false;
    if(o.time&&o.time!==timePeriod())return false;
    if(o.move&&!m.moves.includes(o.move))return false;
    if(o.relative!==''&&o.relative!=null){const sign=Math.sign(m.atk-m.def);if(sign!==Number(o.relative))return false;}
    if(o.party&&!R.team.some(p=>SP[p.sp].dex===Number(o.party)))return false;
    return true;
  }
  // Game adaptations avoid trade servers/location maps: compatible evolution items replace them.
  function evolutions(m){return (SP[m.sp].evolution||[]).filter(o=>SP[o.to]).filter((o,i,a)=>a.findIndex(x=>x.to===o.to)===i);}
  evoReady=m=>evolutions(m).filter(o=>evolutionConditions(m,o)).map(o=>[o.level||1,o.to]);
  function evolutionText(m,o){if(o.to==='sylveon')return `amizade 160 + golpe Fada equipado + subir de nível${sylveonEligible(m)&&!m.sylveonLevelReady?' · suba mais um nível':''}`;return [o.trigger===2&&R?.mode==='classic'?'troca com treinador':'',o.level?`nível ${o.level}`:'',o.friendship?`amizade ${o.friendship}`:'',o.time==='day'?'dia (6h–18h)':o.time==='night'?'noite (18h–6h)':'',evolutionItem(o)?ITEMS[evolutionItem(o)]?.n||evolutionItem(o):'',o.move?`conhecer ${moveName(o.move)}`:'',o.relative!==''&&o.relative!=null?['Ataque = Defesa','Ataque > Defesa','Ataque < Defesa'][Number(o.relative)===0?0:Number(o.relative)>0?1:2]:'',o.party?'espécie companheira na equipe':'',m.sp==='eevee'&&['espeon','umbreon'].includes(o.to)?'sem golpe Fada equipado':''].filter(Boolean).join(' + ')||'Subir de nível';}
  const originalEvolve=evolveMon;
  evolveMon=async(m,k=0)=>{
    if(S.screen==='battle'||EVOLVING||!m)return;
    const to=evoReady(m)[k]?.[1];if(!to)return;
    const rule=evolutions(m).find(o=>o.to===to),item=evolutionItem(rule),before=m.sp;
    await originalEvolve(m,k);
    if(m.sp!==before){delete m.sylveonLevelReady;if(item)R.bag[item]--;persist();}
  };
  genShop=()=>[
    ...['potion','super',...(R?.mode==='classic'?['revive']:[]),'ball','great','ether','elixir','friendship','candy',...stoneIds,...Object.keys(strategy?.items||{})].map(id=>({kind:'item',id,price:ITEMS[id].price,once:false})),
    ...shuffle(Object.keys(RELICS).filter(id=>relic(id)<RELICS[id].max)).slice(0,2).map(id=>({kind:'relic',id,price:160,once:true}))
  ];
  const oldApply=applyItem;
  applyItem=(id,m)=>{
    if(id==='candy'&&m?.lvl>=levelCap())return {ok:false,msg:`Limite da etapa: nível ${levelCap()}. Vença o próximo chefe para liberar novos níveis.`};
    if(id==='revive'&&R?.mode==='classic'&&m)return oldApply(id,m);
    if(!m||m.hp<=0)return {ok:false,msg:'Esse Pokémon desmaiou.'};
    if(id==='revive')return {ok:false,msg:'A morte é permanente nesta jornada.'};
    if(id==='ether'||id==='elixir'){const needs=m.moves.some(x=>ppLeft(m,x)<M[x].pp);if(!needs)return {ok:false,msg:'Os PP já estão cheios.'};m.learned.forEach(x=>m.pp[x]=Math.min(M[x].pp,(m.pp[x]??M[x].pp)+(id==='ether'?10:M[x].pp)));return {ok:true,msg:'PP recuperados.'};}
    if(id==='friendship'){if(m.friendItems>=3||m.friendship>=255)return {ok:false,msg:'Limite de amizade por item atingido.'};m.friendship=Math.min(255,m.friendship+20);m.friendItems++;return {ok:true,msg:'Amizade aumentou!'};}
    if(strategy?.items[id])return {ok:false,msg:'Equipe este item pelo sumário do Pokémon.'};
    if(stoneIds.includes(id))return {ok:false,msg:'Veja a condição no sumário e use Evoluir para consumir o item compatível.'};
    return oldApply(id,m);
  };
  ACT.rest=()=>{if(!R||R.money<60)return;R.money-=60;R.team.forEach(m=>{if(m.hp>0){m.hp=m.maxHp;refill(m);m.friendship=Math.min(255,m.friendship+2);}});S.msg='Sobreviventes recuperaram HP e PP. Desmaiados não revivem.';persist();};
  const oldArchive=archiveRun;
  archiveRun=(outcome,cause)=>{
    oldArchive(outcome,cause);const h=META.history.find(h=>h.id===R?.id);if(h){h.pc=(R.pc||[]).map(m=>({sp:m.sp,lvl:m.lvl,hp:m.hp}));h.postgame=!!R.postgame;}
    if(R?.postgame&&R.mode!=='classic'){const memorial=(META.championTeams||[]).find(t=>t.id===R.sourceTeam);if(memorial){memorial.state=outcome==='champion'?'completed':'lost';memorial.final=JSON.parse(JSON.stringify(R.team));}}
    saveMeta();
  };
  const oldWin=winRun;
  winRun=()=>{
    const memorialMon=m=>({sp:m.sp,lvl:m.lvl,hp:m.hp,moves:m.moves.slice(),friendship:m.friendship});
    if(!R.postgame){META.championTeams=META.championTeams||[];if(!META.championTeams.some(t=>t.id===R.id))META.championTeams.push({id:R.id,date:new Date().toISOString(),state:'ready',mode:R.mode,team:R.team.filter(m=>m.hp>0).map(memorialMon),original:R.team.map(memorialMon)});saveMeta();}
    oldWin();
  };
  function baseSpecies(id){let guard=0;while(SP[id]?.base&&SP[SP[id].base]&&guard++<10)id=SP[id].base;return id;}
  function beginDouble(mons,source=null){
    if(mons.length<2)return false;
    const previousSlot=ModeSaveStore.currentSlot();ModeSaveStore.select(S.pendingMode||ModeSaveStore.current(),'double');
    const before={R,S:JSON.parse(JSON.stringify(S)),V,META:JSON.parse(JSON.stringify(META)),save:SAVE_STORAGE.getItem(SAVE_KEY)};
    try{
      S.pendingFormat='double';newRun(mons[0].sp);R.team=mons;R.postgame=true;R.active=0;if(source)R.sourceTeam=source;else delete R.sourceTeam;
      R.team.forEach(m=>dexRecord(m.sp));persist();SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify({R,S:{...S,screen:S.screen==='character'?'hub':S.screen},V}));
      if(source&&R.mode!=='classic'){const t=META.championTeams.find(t=>t.id===source);t.state='active';}SAVE_STORAGE.setItem(META_KEY,JSON.stringify(META));return true;
    }catch(e){
      R=before.R;S=before.S;V=before.V;for(const key of Object.keys(META))delete META[key];Object.assign(META,before.META);
      try{if(before.save)SAVE_STORAGE.setItem(SAVE_KEY,before.save);else SAVE_STORAGE.removeItem(SAVE_KEY);saveMeta();}catch{}
      ModeSaveStore.select(previousSlot);S.msg='Não foi possível salvar o pós-game. A equipe campeã não foi consumida. Tente novamente.';return false;
    }
  }
  ACT.postgame=id=>{
    const classic=(S.pendingMode||ModeSaveStore.current())==='classic';const t=(META.championTeams||[]).find(t=>t.id===id&&(classic||t.state==='ready'));if(!t){S.msg='Esta equipe não tem mais tentativas no Permadeath. Ela pode ser usada no Clássico.';return;}
    if(hasSave()){S.msg='Encerre a jornada em andamento antes de iniciar o pós-game.';return;}
    const mons=t.team.map(m=>mk(baseSpecies(m.sp),5));
    if(mons.length<2){S.msg='Batalhas em dupla exigem dois Pokémon. Esta equipe não tem dois sobreviventes.';return;}
    beginDouble(mons,id);
  };
  function saveBattle(){SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify({R,S:{...S,screen:'hub',shop:false,sel:null},V,inBattle:true,training:!!B.train,trainingLiving:B.trainingLiving}));}
  const originalPersist=persist;
  persist=()=>{if(R&&S.screen==='intro'&&B?.preview){SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify({R,S:{...S,screen:'hub',shop:false,sel:null},V}));return;}if(R&&['summary','pc','dex','journal'].includes(S.screen)){SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify({R,S:{...S,screen:subReturn==='hub'?'hub':'title'},V}));return;}originalPersist();};
  function enemyLevel(){const base=4+Math.floor((R.battle+1)*1.05),alive=R.team.filter(m=>m.hp>0),avg=alive.reduce((s,m)=>s+m.lvl,0)/Math.max(1,alive.length);return Math.min(100,Math.max(base,Math.floor(avg-3)));}
  function makeEnemy(id,L,alpha=false){const m=mk(id,L);m.alpha=alpha;if(alpha){m.maxHp=Math.floor(m.maxHp*1.2);m.hp=m.maxHp;m.atk=Math.floor(m.atk*1.08);m.spa=Math.floor(m.spa*1.08);}return m;}
  let confirmingTrainer=false;
  startBattle=train=>{
    if(S.screen!=='hub'||EVOLVING||!R.team.some(m=>m.hp>0))return;
    if(R.battle>=70&&!R.endless){winRun();return;}
    // The introduction is a preview. Encounter effects and quit penalties start on confirmation.
    if(!train&&!S.exploring&&nextIsBoss()&&!confirmingTrainer){
      const trainer=trainerNext(),L=enemyLevel();
      const enemies=trainer.team.map((id,i)=>makeEnemy(id,Math.max(2,L+(i===trainer.team.length-1?1:-1))));
      B={preview:true,boss:true,trainer,enemies,enemy:enemies[0],double:!!R.postgame,train:false,musicTrack:stageIndex()>=12?'champion':'bossKanto'};
      S.screen='intro';S.shop=false;S.sel=null;persist();return;
    }
    if(train){if(R.mode==='classic'){S.msg='No Clássico, prepare sua equipe nos encontros selvagens.';return;}if(!trainingLeft()){S.msg='Treinos esgotados nesta etapa.';return;}if(R.trainStage!==R.battle){R.trainStage=R.battle;R.trainUsed=0;}R.trainUsed++;}
    const exploration=!!S.exploring;delete S.exploring;const boss=!train&&!exploration&&nextIsBoss(),trainer=boss?trainerNext():null,L=enemyLevel(),double=!!R.postgame;
    const alpha=window.CollectionModel?CollectionModel.alphaDue(R,boss,train):false;
    let enemies;
    if(boss){enemies=trainer.team.map((id,i)=>makeEnemy(id,Math.max(2,L+(i===trainer.team.length-1?1:-1))));}
    else{
      let pool=Object.values(SP).filter(s=>originalIds.has(s.id)&&s.w<=(R.battle<5?0:R.battle<12?1:3));
      if(journal&&!train){const route=journal.routes[journal.normalize(R).route];const favored=pool.filter(s=>s.t.some(t=>route.types.includes(t)));if(favored.length&&Math.random()<.7)pool=favored;}
      const safe=R.battle===0?pool.filter(s=>!(s.mv||[]).some(([l,id])=>l<=5&&M[id]?.p&&eff(M[id].t,active().types)>1)):pool;
      enemies=Array.from({length:double?2:1},()=>makeEnemy(pick(safe.length?safe:pool).id,L, alpha));
    }
    enemies.forEach(m=>dexRecord(m.sp));R.lastEnemy=enemies[0].sp;
    B={enemy:enemies[0],enemies,enemyIndex:0,enemySlots:[0,...(double?[1]:[])],double,playerSlots:[R.active,...(double?[R.team.findIndex((m,i)=>i!==R.active&&m.hp>0)]:[])],commands:[],used:[],log:[],boss,trainer,train:!!train,exploration,lock:false,forced:false,menu:'moves',sash:false,fx:null,title:trainer?.name||'',musicTrack:trainer?stageIndex()>=12?'champion':'bossKanto':chooseBattleTrack(false,enemies[0]),trainingLiving:train?R.team.map((m,i)=>m.hp>0?i:-1).filter(i=>i>=0):[],fainted:new Set(R.team.map((m,i)=>m.hp<=0?'p'+i:null).filter(Boolean)),xpEnemies:[]};
    B.playerSlots=B.playerSlots.filter(i=>i>=0&&R.team[i]?.hp>0);
    if(journal&&!train)enemies.forEach(m=>journal.observe(R,m.sp));
    B.playerSlots.forEach(i=>B.used.push(R.team[i]));
    if(strategy){for(const i of B.playerSlots)strategy.enter(R.team[i],B.enemySlots.map(x=>B.enemies[x]));for(const i of B.enemySlots)strategy.enter(B.enemies[i],B.playerSlots.map(x=>R.team[x]));}
    saveBattle();S.screen='battle';S.shop=false;S.sel=null;
    B.log.push(trainer?`${trainer.name} desafia você com ${enemies.length} Pokémon!`:`${enemies.some(m=>m.alpha)?'Encontro raro: Pokémon Alfa!':'Encontro selvagem!'}${double?' Batalha em dupla.':''}`);
    musicStart(B.musicTrack);sfx('start');crySfx(B.enemy);
  };
  ACT.beginTrainer=()=>{
    if(S.screen!=='intro'||!B?.preview)return;
    S.screen='hub';confirmingTrainer=true;
    try{startBattle(false);}finally{confirmingTrainer=false;}
  };
  ACT.cancelTrainer=()=>{
    if(S.screen!=='intro'||!B?.preview)return;
    B=null;S.screen='hub';S.shop=false;S.sel=null;S.msg='';persist();
  };
  const stageMultiplier=(m,key)=>{const v=Math.max(-6,Math.min(6,m.stages?.[key]||0));return v>=0?(2+v)/2:2/(2-v);};
  dmgCalc=(att,def,mv,pl)=>{
    const special=mv.cat===3,A=(special?att.spa:att.atk)*stageMultiplier(att,special?'spa':'atk'),D=(special?def.spd:def.def)*stageMultiplier(def,special?'spd':'def');
    const base=Math.floor(((2*att.lvl/5+2)*(mv.p||60)*A/Math.max(1,D))/50)+2,stab=att.types.includes(mv.t)?(pl&&relic('band')?1.65:1.5):1;
    const abilityMult=strategy?strategy.damage(att,def,mv):1;
    const e=abilityMult===0?0:mv===M.struggle?1:eff(mv.t,def.types),crit=Math.random()<(att.critStage>=2?.5:1/24+(pl?.04*relic('lens'):0));
    const mult=pl?1+.08*relic('claw'):1/(1+.08*relic('shell'));
    return {d:e?Math.max(1,Math.floor(base*stab*e*abilityMult*(crit?1.5:1)*(.85+Math.random()*.15)*mult*(att.ailment==='burn'&&!special&&att.ability!=='guts'?.5:1))):0,e,crit};
  };
  pickEnemyMove=(e,p)=>{
    const ids=available(e);if(!ids.length)return 'struggle';
    if(Math.random()<.45)return ids.slice().sort((a,b)=>(M[b].p||25)*eff(M[b].t,p.types)-(M[a].p||25)*eff(M[a].t,p.types))[0];return pick(ids);
  };
  async function perform(att,def,id,isPlayer){
    const mv=M[id];if(!mv||att.hp<=0||def.hp<=0||strategy&&!strategy.allowed(att,id))return;
    if(att.ailment==='sleep'){att.sleepTurns=(att.sleepTurns||1)-1;if(att.sleepTurns<=0)att.ailment=null;else {await say(`${monName(att)} está dormindo.`);return;}}
    if(att.ailment==='paralysis'&&Math.random()<.25){await say(`${monName(att)} está paralisado.`);return;}
    if(att.ailment==='freeze'){if(Math.random()<.2)att.ailment=null;else {await say(`${monName(att)} está congelado.`);return;}}
    if(id!=='struggle'){if(ppLeft(att,id)<=0)return;att.pp[id]--;}
    strategy?.choose(att,id);
    await say(`${monName(att)} usou ${moveName(id)}!`,260);
    await window.BattleEffects?.move(att,id);
    if(![4,7,13].includes(mv.target)&&Math.random()*100>=Math.min(100,mv.a*stageMultiplier(att,'accuracy')/stageMultiplier(def,'evasion'))){sfx('miss');await say('Mas errou!',240);return;}
    const self=[4,7,13].includes(mv.target),target=self?att:def;
    if(mv.cat===1){
      if(id==='splash'){await say('Não teve efeito.',180);return;}
      const healing=Number(mv.meta?.healing)||0;
      if(healing){const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+Math.ceil(target.maxHp*healing/100));if(target.hp>before)await window.BattleEffects?.status(target,'heal');}
      else if(mv.changes?.length){await changeStats(target,mv);}
      else if(Number(mv.meta?.meta_ailment_id)>0){const before=target.ailment;applyAilment(target,mv);if(target.ailment&&target.ailment!==before){await window.BattleEffects?.status(target,target.ailment);await say(`${monName(target)}: ${({poison:'envenenado',burn:'queimado',paralysis:'paralisado',sleep:'dormindo',freeze:'congelado'})[target.ailment]}!`,180);}else await say('Não teve efeito.',180);}
      else{att.guard=true;await say('Postura defensiva: reduz o próximo golpe. (Adaptação)',220);}return;
    }
    if(strategy?.absorb(def,mv)){await say(`${monName(def)} recuperou HP com ${strategy.label(def)}!`,220);return;}
    const r=dmgCalc(att,def,mv,isPlayer);let damage=def.guard?Math.ceil(r.d/2):r.d;def.guard=false;
    if(r.e&&['dragon-rage','sonic-boom'].includes(id))damage=id==='dragon-rage'?40:20;
    if(r.e&&['seismic-toss','night-shade'].includes(id))damage=att.lvl;
    if(id==='false-swipe')damage=Math.min(damage,Math.max(0,def.hp-1));
    const actualDamage=Math.min(def.hp,damage),heldSash=strategy?strategy.takeHit(def,damage):null;
    if(!strategy)def.hp=Math.max(0,def.hp-damage);
    if(heldSash)await say(`${monName(def)} resistiu com Focus Sash!`,220);
    if(!isPlayer&&def.hp===0&&relic('sash')&&!B.sash){B.sash=true;def.hp=1;}
    if(id==='struggle')att.hp=Math.max(0,att.hp-Math.max(1,Math.floor(att.maxHp/4)));
    const drain=Number(mv.meta?.drain)||0;if(id!=='struggle'){if(drain>0)att.hp=Math.min(att.maxHp,att.hp+Math.ceil(actualDamage*drain/100));else if(drain<0)att.hp=Math.max(0,att.hp-Math.ceil(actualDamage*-drain/100));}
    if(isPlayer&&relic('fang')&&att.hp>0)att.hp=Math.min(att.maxHp,att.hp+Math.floor(actualDamage*.1));
    const statTarget=Number(mv.meta?.meta_category_id)===7?att:def;
    if(r.e&&statTarget.hp>0&&mv.changes?.length&&Number(mv.meta?.stat_chance)>0&&Math.random()*100<Number(mv.meta.stat_chance))await changeStats(statTarget,mv);
    if(r.e&&def.hp>0&&Number(mv.meta?.ailment_chance)>0&&Math.random()*100<Number(mv.meta.ailment_chance)){const before=def.ailment;applyAilment(def,mv);if(def.ailment&&def.ailment!==before)await window.BattleEffects?.status(def,def.ailment);}
    if(strategy?.recoil(att,actualDamage))await say(`${monName(att)} perdeu HP com Life Orb.`,180);
    for(const m of [att,def]){const item=strategy?.berry(m);if(item)await say(`${monName(m)} usou ${ITEMS[item].n}!`,180);}
    if(r.e){sfx(r.e>1?'hitSE':r.e<1?'hitNE':'hit');await window.BattleEffects?.show(def,'hit','✧');}if(r.e>0&&r.e<1)await say('Não é muito efetivo…',220);if(r.e>1)await say('É super efetivo!',220);if(!r.e)await say('Não afeta o alvo.',220);
  }
  async function changeStats(target,mv){
    const keys={2:'atk',3:'def',4:'spa',5:'spd',6:'spe',7:'accuracy',8:'evasion'};
    const names={atk:'Ataque',def:'Defesa',spa:'Ataque especial',spd:'Defesa especial',spe:'Velocidade',accuracy:'Precisão',evasion:'Evasão'},changed=[];
    mv.changes.forEach(([stat,n])=>{const key=keys[stat];if(!key)return;if(n<0&&(target.guardTurns>0||R?.guardTurns>0&&R.team.includes(target)))return;const before=target.stages[key]||0;target.stages[key]=Math.max(-6,Math.min(6,before+n));if(target.stages[key]!==before)changed.push({key,delta:target.stages[key]-before});});
    if(!changed.length){await say('O atributo já está no limite.',180);return;}
    for(const positive of [true,false])if(changed.some(x=>(x.delta>0)===positive))await window.BattleEffects?.show(target,positive?'buff':'debuff',positive?'↑':'↓');
    await say(changed.map(x=>`${names[x.key]} ${x.delta>0?'aumentou':'diminuiu'}`).join(' · ')+'.',180);
  }
  function applyAilment(m,mv){const a=Number(mv.meta?.meta_ailment_id);if(m.ailment)return;const names={1:'paralysis',2:'sleep',3:'freeze',4:'burn',5:'poison'};if(names[a]&&!strategy?.immune(m,names[a])){m.ailment=names[a];m.sleepTurns=2;strategy?.berry(m);}}
  async function runTurn(){
    B.lock=true;const commands=[...B.commands];B.commands=[];
    const livingPlayer=B.playerSlots.filter(i=>R.team[i]?.hp>0);
    if(!B.pvp)B.enemySlots.forEach(i=>{const att=B.enemies[i];if(att?.hp>0){const target=pick(livingPlayer),def=R.team[target];commands.push({side:'enemy',actor:i,target,id:pickEnemyMove(att,def)});}});
    B.turn=(B.turn||0)+1;
    commands.forEach(c=>{c.tie=Math.random();const m=c.side==='player'?R.team[c.actor]:B.enemies[c.actor];c.speed=m.spe*stageMultiplier(m,'spe')*(m.ailment==='paralysis'?.5:1)*(c.side==='player'?1+.25*relic('feather'):1);});
    const priority=c=>c.switch!==undefined?6:c.item?7:M[c.id]?.pri||0;
    commands.sort((a,b)=>priority(b)-priority(a)||b.speed-a.speed||a.tie-b.tie);
    for(const c of commands){
      const att=c.side==='player'?R.team[c.actor]:B.enemies[c.actor];
      if(!att||att.hp<=0)continue;
      if(c.switch!==undefined){const team=c.side==='player'?R.team:B.enemies,slots=c.side==='player'?B.playerSlots:B.enemySlots,opponents=c.side==='player'?B.enemySlots.map(x=>B.enemies[x]):B.playerSlots.map(x=>R.team[x]);att.choiceMove=null;att.critStage=0;att.stages={};slots[c.slot]=c.switch;strategy?.enter(team[c.switch],opponents);if(c.side==='player'){if(c.slot===0)R.active=c.switch;B.used.push(team[c.switch]);}await say(`Vai, ${monName(team[c.switch])}!`,250);continue;}
      if(c.item){const team=c.side==='player'?R.team:B.enemies,bag=c.side==='player'?R.bag:B.bag,target=team[c.itemTarget??c.actor],res=applyItem(c.item,target,{move:c.itemMove,battle:true});if(res.ok){bag[c.item]--;await say(res.msg,220);}else await say(res.msg,180);continue;}
      const pool=c.side==='player'?B.enemies:R.team,slots=c.side==='player'?B.enemySlots:B.playerSlots;
      let def=pool[c.target];if(!def||def.hp<=0||!slots.includes(c.target))def=pool[slots.find(i=>pool[i]?.hp>0)];
      if(def)await perform(att,def,c.id,c.side==='player');
    }
    for(const m of [...B.playerSlots.map(i=>R.team[i]),...B.enemySlots.map(i=>B.enemies[i])])if(m?.hp>0){if(['burn','poison'].includes(m.ailment))m.hp=Math.max(0,m.hp-Math.max(1,Math.floor(m.maxHp/8)));}
    for(const m of [...B.playerSlots.map(i=>R.team[i]),...B.enemySlots.map(i=>B.enemies[i])]){const item=strategy?.endTurn(m);if(item)await say(`${monName(m)} usou ${ITEMS[item].n}!`,180);}
    if(relic('leftovers'))for(const i of B.playerSlots){const m=R.team[i];if(m?.hp>0&&m.hp<m.maxHp){m.hp=Math.min(m.maxHp,m.hp+Math.max(1,Math.floor(m.maxHp*.06*relic('leftovers'))));await say(`As Sobras restauraram o HP de ${monName(m)}.`,180);}}
    if(R.guardTurns>0)R.guardTurns--;B.enemies.forEach(m=>{if(m.guardTurns>0)m.guardTurns--;});
    await resolveEnd();
  }
  function currentActor(){return B.playerSlots[Math.min(B.commands.length,B.playerSlots.length-1)];}
  playerMove=async i=>{
    if(!B||B.lock||B.forced||S.screen!=='battle')return;
    const actor=currentActor(),m=R.team[actor];if(!m||m.hp<=0)return;
    const ids=available(m),id=ids.length?m.moves[i]:'struggle';if(!id||!M[id]||ppLeft(m,id)<=0||(ids.length&&!ids.includes(id)))return;
    B.pendingMove={actor,id};
    if(B.double&&B.enemySlots.filter(i=>B.enemies[i]?.hp>0).length>1){B.menu='target';render();return;}
    queueMove(B.enemySlots.find(i=>B.enemies[i]?.hp>0));
  };
  function queueMove(target){
    if(!B.pendingMove)return;B.commands.push({side:'player',actor:B.pendingMove.actor,id:B.pendingMove.id,target});B.pendingMove=null;B.menu='moves';
    const living=B.playerSlots.filter(i=>R.team[i]?.hp>0).length;
    if(B.commands.length>=living)runTurn();else render();
  }
  ACT.target=v=>{const i=Number(v);if(B?.menu==='target'&&B.enemies[i]?.hp>0&&B.enemySlots.includes(i))queueMove(i);};
  enemyTurn=async()=>{B.commands=[];await runTurn();};
  function synchronizeFaintSwitch(){
    if(!B||!R||B.train||S.screen!=='battle'||!B.enemies.some(m=>m.hp>0))return false;
    const deadSlot=B.playerSlots.findIndex(i=>!R.team[i]||R.team[i].hp<=0);
    if(deadSlot<0)return false;
    if(R.team.some((m,i)=>m.hp>0&&!B.playerSlots.includes(i))){B.forced=true;B.forcedSlot=deadSlot;B.switchReason='faint';B.menu='switch';B.lock=false;return true;}
    B.playerSlots=B.playerSlots.filter(i=>R.team[i]?.hp>0);if(B.playerSlots.length)R.active=B.playerSlots[0];return false;
  }
  resolveEnd=async()=>{
    if(!B)return;
    for(const [i,m]of B.enemies.entries())if(m.hp<=0&&!B.fainted.has('e'+i)){B.fainted.add('e'+i);B.xpEnemies.push(m);await say(`${monName(m)} desmaiou!`,250);}
    for(const [i,m]of R.team.entries())if(m.hp<=0&&!B.fainted.has('p'+i)){B.fainted.add('p'+i);await say(`${monName(m)} desmaiou!`,250);if(B.train){m.hp=m.maxHp;endTraining(`${monName(m)} se recuperou com HP cheio. Treino encerrado.`);return;}}
    if(!R.team.some(m=>m.hp>0)){gameOver();return;}
    if(B.enemies.every(m=>m.hp<=0)){finishWin(null);B.lock=false;render();return;}
    let replaced=false;
    B.enemySlots=B.enemySlots.filter(i=>B.enemies[i]?.hp>0);
    while(B.enemySlots.length<(B.double?2:1)){const next=B.enemies.findIndex((m,i)=>m.hp>0&&!B.enemySlots.includes(i));if(next<0)break;B.enemySlots.push(next);strategy?.enter(B.enemies[next],B.playerSlots.map(x=>R.team[x]));dexRecord(B.enemies[next].sp);await say(`${B.trainer?.name||'Adversário'} enviou ${monName(B.enemies[next])}!`,250);replaced=true;}
    B.enemy=B.enemies[B.enemySlots[0]];
    if(synchronizeFaintSwitch()){render();return;}
    if(replaced&&!B.double){B.forced=true;B.forcedSlot=0;B.switchReason='next';B.menu='switch';B.lock=false;render();return;}
    B.lock=false;B.menu='moves';render();
  };
  doSwitch=async i=>{
    if(!B||B.lock||!R.team[i]||R.team[i].hp<=0)return;
    if((B.playerSlots.includes(i)&&B.switchReason!=='next')||B.commands.some(c=>c.switch===i))return;
    const slot=B.forced?B.forcedSlot:B.commands.length;
    if(B.forced){B.lock=true;const entering=B.playerSlots[slot]!==i;if(entering&&R.team[B.playerSlots[slot]])R.team[B.playerSlots[slot]].choiceMove=null;B.playerSlots[slot]=i;if(entering)strategy?.enter(R.team[i],B.enemySlots.map(x=>B.enemies[x]));R.active=B.playerSlots[0];if(!B.used.includes(R.team[i]))B.used.push(R.team[i]);B.forced=false;B.menu='moves';await say(`Vai, ${monName(R.team[i])}!`,200);const dead=B.playerSlots.findIndex(x=>R.team[x].hp<=0);if(dead>=0){if(R.team.some((m,x)=>m.hp>0&&!B.playerSlots.includes(x))){B.forced=true;B.forcedSlot=dead;B.switchReason='faint';B.menu='switch';}else B.playerSlots=B.playerSlots.filter(x=>R.team[x].hp>0);}B.lock=false;render();return;}
    B.commands.push({side:'player',actor:B.playerSlots[slot],slot,switch:i,id:'quick-attack',target:0});B.menu='moves';if(B.commands.length>=B.playerSlots.length)runTurn();else render();
  };
  useBattleItem=async id=>{
    if(!B||B.lock||B.forced||!R.bag[id]||!['potion','super','ether','elixir'].includes(id))return;
    const actor=currentActor();B.commands.push({side:'player',actor,item:id,id:'quick-attack',target:0});B.menu='moves';if(B.commands.length>=B.playerSlots.length)runTurn();else render();
  };
  const originalCatch=throwBall;
  throwBall=async id=>{if(B?.double){S.msg='Capturas indisponíveis nos desafios em dupla.';return;}if(R.team.length>=6&&R.pc.length>=120){await say('O PC está cheio. Capture quando houver espaço na equipe ou nas caixas.');return;}await originalCatch(id);};
  finishWin=captured=>{
    const notes=[],xp=[];const gain=B.train?0:Math.floor((40+R.battle*6)*(B.boss?2:1)*(1+.25*relic('amulet')));R.money+=gain;
    const defeated=B.xpEnemies.length?B.xpEnemies:[B.enemy];
    R.team.forEach(m=>{if(m.hp<=0)return;const total=defeated.reduce((sum,e)=>sum+xpGain(m,e,B.boss),0);const amt=Math.max(1,Math.round(total*(B.used.includes(m)?1:XP_BENCH)*(B.train?TRAIN_XP:1)/(B.boss?Math.sqrt(defeated.length):1)));const before=m.lvl,known=new Set(m.learned||[]),previousEvolutions=new Set(evoReady(m).map(x=>x[1])),gained=addXp(m,amt,notes);m.friendship=Math.min(255,m.friendship+2);xp.push({sp:m.sp,amount:gained,from:before,to:m.lvl,learned:(m.learned||[]).filter(id=>!known.has(id)),evolutions:evoReady(m).map(x=>x[1]).filter(id=>!previousEvolutions.has(id)),capped:m.lvl>=levelCap()});m.stages={};m.choiceMove=null;});
    if(!B.train&&!B.exploration){R.battle++;R.won++;}
    if(B.train)R.team.forEach((m,i)=>{if(B.trainingLiving.includes(i)){m.hp=m.maxHp;m.ailment=null;m.stages={};m.choiceMove=null;}});
    if(captured){normalizeMon(captured);R.caught++;dexRecord(captured.sp,true);if(R.team.length<6)R.team.push(captured);else {R.pc.push(captured);notes.push(`${monName(captured)} foi enviado ao PC.`);}}
    if(journal&&!B.train){if(captured)journal.observe(R,captured.sp);if(!B.exploration)journal.schedule(R);}
    recordTeam();V={gain,notes,xp,boss:B.boss,training:B.train,exploration:B.exploration,champ:!B.train&&B.boss&&R.battle===70,trainer:B.trainer?.name};
    R.reward=B.train||B.exploration?null:genReward(B.boss);if(!B.train&&!B.exploration)R.shop=null;S.screen='reward';musicStart(victoryKind(B),false);persist();
  };
  ACT.menu=v=>{if(!B||B.lock||B.forced||(B.train&&v==='ball')||(B.double&&v==='ball'))return;B.menu=v;};
  ACT.retire=()=>{if(R?.battle<70||!['reward','hub'].includes(S.screen))return;winRun();};
  const originalRewardAction=ACT.reward,originalBack=ACT.back;
  ACT.reward=i=>{originalRewardAction(i);if(R?.battle>=70&&!R.endless&&S.screen==='hub')winRun();};
  ACT.back=()=>{originalBack();if(R?.battle>=70&&!R.endless&&S.screen==='hub')winRun();};
  // Do not permit closing the trainer introduction to evade the battle marker.
  window.desktopCanReturnTitle=()=>S.screen==='hub'&&!EVOLVING;

  /* Screens */
  const btn=(act,label,v='',cls='alt',disabled=false)=>`<button class="btn ${cls}" data-act="${act}" data-v="${esc(v)}" ${disabled?'disabled':''}>${label}</button>`;
  function subHeader(title){return `<div class="journal-heading"><h2>${title}</h2>${btn('subBack','Voltar')}</div>`;}
  function openSub(screen){if(!['hub','title','win','dex','journal','pc','summary'].includes(S.screen)||EVOLVING)return;if(['hub','title','win'].includes(S.screen))subReturn=S.screen==='win'?'title':S.screen;S.screen=screen;S.shop=false;}
  ACT.dex=()=>openSub('dex');
  ACT.journal=tab=>{openSub('journal');S.journal=tab==='achievements'?'achievements':'history';};
  ACT.subBack=()=>{if(S.screen==='summary'&&S.summaryBox==='pc'){S.screen='pc';delete S.relearnMove;return;}S.screen=subReturn;S.sel=null;if(subReturn==='hub')persist();};
  ACT.journalBack=ACT.subBack;
  ACT.summary=i=>{if(S.screen!=='hub'&&S.screen!=='pc')return;S.summary=Number(i);S.summaryBox=S.screen==='pc'?'pc':'team';openSub('summary');};
  ACT.pc=()=>{if(['hub','title','win'].includes(S.screen))openSub('pc');};
  ACT.deposit=i=>{
    if(S.screen!=='pc'||subReturn!=='hub')return;i=Number(i);const m=R.team[i];if(!m||R.team.filter(m=>m.hp>0).length-(m.hp>0?1:0)<1)return;
    if(R.pc.length>=120){S.msg='O PC desta jornada tem limite de 120 Pokémon.';return;}R.pc.push(m);R.team.splice(i,1);R.active=Math.max(0,R.team.findIndex(m=>m.hp>0));persist();
  };
  ACT.withdraw=i=>{if(S.screen!=='pc'||subReturn!=='hub'||R.team.length>=6)return;i=Number(i);if(!R.pc[i])return;R.team.push(R.pc.splice(i,1)[0]);persist();};
  ACT.selectRelearn=id=>{if(S.screen==='summary'&&summaryMon().learned.includes(id)){S.relearnMove=id;}};
  ACT.relearn=v=>{
    if(S.screen!=='summary')return;const m=summaryMon();if(!m||m.hp<=0)return;const [slot,id]=v.split(':');if(!m.learned.includes(id)||m.moves.includes(id)||!M[id])return;
    const i=Number(slot);if(i<0||i>3)return;m.moves[i]=id;delete S.relearnMove;if(m.pp[id]===undefined)m.pp[id]=M[id].pp;persist();S.msg='Golpe equipado. Os PP existentes foram preservados.';
  };
  ACT.teach=id=>{
    if(S.screen!=='summary')return;const m=summaryMon();if(!m||m.hp<=0||!R.bag['tm:'+id]||m.learned.includes(id)||!SP[m.sp].learn.some(x=>x.method==='machine'&&x.id===id))return;
    R.bag['tm:'+id]--;m.learned.push(id);m.pp[id]=M[id].pp;persist();S.msg=`TM/HM de ${moveName(id)} ensinada. Equipe na lista de aprendidos.`;
  };
  ACT.moveLanguage=()=>{CFG.moveLanguage=CFG.moveLanguage==='en'?'pt':'en';saveCfg();};
  function summaryMon(){return (S.summaryBox==='pc'?R.pc:R.team)[S.summary];}
  function moveRow(id){const m=M[id];return `<strong>${esc(moveName(id))}</strong><small>${TYPES[m.t]?.[0]||m.t} · ${m.cat===1?'Status':m.cat===3?'Especial':'Físico'} · poder ${m.p||'—'} · precisão ${m.a}% · PP ${m.pp}</small>`;}
  function rSummary(){
    const m=summaryMon();if(!m)return `<section class="panel">${subHeader('Sumário')}Pokémon não encontrado.</section>`;
    const moves=m.moves.map((id,i)=>`<article class="move-entry">${moveRow(id)}<span>PP ${ppLeft(m,id)}/${M[id].pp}</span></article>`).join('');
    const learned=m.learned.map(id=>`<article class="move-entry">${moveRow(id)}<div class="row">${m.moves.includes(id)?'<span>Equipado</span>':btn('selectRelearn','Equipar',id,'alt',m.hp<=0)}${m.moves.length<4&&!m.moves.includes(id)?btn('relearn','Adicionar',`${m.moves.length}:${id}`,'',m.hp<=0):''}</div></article>`).join('');
    const byLevel=SP[m.sp].learn.filter(x=>x.method==='level').map(x=>`<article class="move-entry"><span>Nv. ${x.level||1} ${m.learned.includes(x.id)?'✓ aprendido':''}</span>${moveRow(x.id)}</article>`).join('');
    const machines=SP[m.sp].learn.filter(x=>x.method==='machine'&&R.bag['tm:'+x.id]>0).map(x=>`<article class="move-entry">${moveRow(x.id)}${btn('teach',m.learned.includes(x.id)?'Já aprendido':'Ensinar TM/HM',x.id,'alt',m.learned.includes(x.id)||m.hp<=0)}</article>`).join('');
    return `<section class="panel">${subHeader('Sumário do Pokémon')}${msgBox()}<div class="summary-identity">${art(m)}<div><h3>${monName(m)} ${m.alpha?window.alphaBadge?.()||'Alfa':''} · Nv. ${m.lvl}</h3>${types(m)}<p>HP ${m.hp}/${m.maxHp} · XP ${m.xp||0}/${xpNeed(m.lvl)}</p><small>Limite da etapa · Nv. ${levelCap()}${m.lvl>=levelCap()?' · XP pausado':''}</small></div></div><div class="stats"><span>Ataque ${m.atk}</span><span>Defesa ${m.def}</span><span>At. especial ${m.spa}</span><span>Def. especial ${m.spd}</span><span>Velocidade ${m.spe}</span></div><label>Amizade ${m.friendship}/255</label><progress max="255" value="${m.friendship}"></progress><p>${timePeriod()==='day'?'☀ Dia':'☾ Noite'} · Horário local do computador</p><h3>Evolução</h3>${evolutions(m).map(o=>`<p>${SP[o.to].n}: ${esc(evolutionText(m,o))} ${evolutionConditions(m,o)&&m.hp>0?'✓ pronto':''}</p>`).join('')||'<p>Não há evolução disponível nesta versão.</p>'}${m.hp>0&&evoReady(m).length?`<div class="row">${evoReady(m).map((o,k)=>btn('summaryEvolve',`Evoluir para ${SP[o[1]].n}`,String(k),'gold')).join('')}</div>`:''}${window.journeySummaryPanel?window.journeySummaryPanel(m):''}<h3>Golpes atuais</h3>${moves}${S.relearnMove?`<div class="move-replace"><p>Substituir por ${esc(moveName(S.relearnMove))}</p>${m.moves.map((old,i)=>btn('relearn',esc(moveName(old)),`${i}:${S.relearnMove}`)).join('')}</div>`:''}<details><summary>Já aprendidos · trocar ou reaprender</summary><div class="move-list">${learned}</div></details><details><summary>Aprendizado por nível</summary><div class="move-list">${byLevel}</div></details><details><summary>TM/HM da mochila</summary><div class="move-list">${machines||'<p>Você não tem TM/HM compatíveis na mochila.</p>'}</div><details><summary>Compatibilidade completa</summary>${SP[m.sp].learn.filter(x=>x.method==='machine').map(x=>`<p>${esc(moveName(x.id))}</p>`).join('')}</details></details><p class="tiny">Base de aprendizado: ${m.sp==='sylveon'?'Sword/Shield':m.sp==='eevee'?'geração 5 + golpes Fada':'geração 5'}. Alguns efeitos especiais foram adaptados para este jogo; golpes de status sem efeito específico assumem postura defensiva.</p></section>`;
  }
  ACT.summaryEvolve=k=>{if(S.screen==='summary')evolveMon(summaryMon(),Number(k));};
  function rDex(){
    const query=String(S.dexQuery||'').toLowerCase().trim(),filter=S.dexFilter||'all';
    const entries=Object.values(SP).sort((a,b)=>a.dex-b.dex).filter(p=>(filter==='caught'?META.caught.includes(p.id):filter==='missing'?!META.caught.includes(p.id):filter==='seen'?META.seen.includes(p.id):true)&&(!S.dexType||p.t.includes(S.dexType))&&(!S.dexEvolving||(p.evolution||[]).some(o=>SP[o.to]))&&(!query||p.n.toLowerCase().includes(query)||String(p.dex).includes(query.replace(/^#/,''))));
    return `<section class="panel">${subHeader('Pokédex')}<label for="dex-search">Pesquisar por nome ou número</label><input id="dex-search" type="search" value="${esc(S.dexQuery||'')}" autocomplete="off" placeholder="Ex.: Pikachu ou 25"><p>${META.seen.length} vistos · ${META.caught.length} obtidos</p><div class="row">${[['all','Todos'],['seen','Vistos'],['caught','Obtidos'],['missing','Não obtidos']].map(([id,n])=>btn('dexFilter',n,id,filter===id?'':'alt')).join('')}</div><div class="dex-more-filters"><label>Tipo<select id="dex-type"><option value="">Todos</option>${Object.entries(TYPES).map(([id,t])=>`<option value="${id}" ${S.dexType===id?'selected':''}>${t[0]}</option>`).join('')}</select></label><label><input id="dex-evolving" type="checkbox" ${S.dexEvolving?'checked':''}> Tem evolução</label></div><div class="journal-grid">${entries.map(p=>{const seen=META.seen.includes(p.id),owned=META.caught.includes(p.id);return `<article class="journal-card"><span>#${p.dex}</span>${seen?`<img src="${SPRITE(p.dex)}" alt="${esc(p.n)}"><strong>${p.n}</strong>${types({types:p.t})}`:'<div class="unknown-mon">?</div><strong>Não visto</strong>'}<small>${owned?'● Obtido':seen?'◉ Visto':'—'}</small></article>`;}).join('')||'<p>Nenhum Pokémon encontrado.</p>'}</div></section>`;
  }
  const originalJournal=rJournal;
  rJournal=()=>{
    let html=originalJournal();
    html=html.replace(/<button class="btn [^"]*" data-act="journal" data-v="dex"[^>]*>Pokédex<\/button>/,'');
    META.history.filter(h=>h.pc?.length).forEach(h=>{const text=h.pc.filter(m=>SP[m.sp]).map(m=>`${SP[m.sp].n} Nv. ${m.lvl}`).join(', ');html=html.replace(esc(h.cause||'Motivo não registrado')+'</p>',esc(h.cause||'Motivo não registrado')+`</p><p class="tiny">PC no encerramento: ${esc(text)}</p>`);});
    return html;
  };
  function rPC(){
    const box=R&&subReturn==='hub'?`<h3>Equipe · ${R.team.length}/6</h3><div class="journal-grid">${R.team.map((m,i)=>`<article class="journal-card">${art(m)}<strong>${monName(m)} Nv. ${m.lvl}</strong><small>HP ${m.hp}/${m.maxHp}</small>${btn('deposit','Depositar',String(i),'alt',R.team.filter(p=>p.hp>0).length-(m.hp>0?1:0)<1)}</article>`).join('')}</div><h3>PC desta jornada · ${R.pc.length}/120</h3><div class="journal-grid">${R.pc.map((m,i)=>`<article class="journal-card">${art(m)}<strong>${monName(m)} Nv. ${m.lvl}</strong><small>${m.hp>0?'Vivo':'Desmaiado'}</small>${btn('summary','Sumário',String(i))}${btn('withdraw','Retirar',String(i),'',R.team.length>=6)}</article>`).join('')||'<p>Caixas vazias.</p>'}</div>`:'';
    const memorial=(META.championTeams||[]).map(t=>`<article class="journal-entry"><h3>Equipe campeã · ${esc(new Date(t.date).toLocaleDateString('pt-BR'))}</h3><p>${({ready:'Disponível para uma tentativa no pós-game',active:'Tentativa em andamento',lost:'Memorial · Permadeath encerrado',completed:'Pós-game concluído · memorial'})[t.state]||'Memorial'}</p><small>Clássico: reutilizável${t.playTimeMs==null?'':` · Tempo da Liga: ${window.JourneyClock?.format(t.playTimeMs)||''}`}</small><div class="journal-team">${(t.original||t.team).map(m=>`<div><img src="${SPRITE(SP[m.sp].dex)}" alt=""><span>${monName(m)} Nv. ${m.lvl}</span></div>`).join('')}</div>${btn('postgame','Usar no pós-game em dupla',t.id,'gold')}</article>`).join('');
    return `<section class="panel">${subHeader('PC')}<p>O PC normal pertence apenas à jornada. Pokémon guardados não evitam a derrota da equipe.</p>${msgBox()}${box}<h3>Caixa especial de campeões</h3><p>Somente para o pós-game. Ao iniciar, os sobreviventes voltam à forma inicial e ao nível 5. Permadeath: uma tentativa por equipe. Clássico: pode reutilizar a equipe. A Pokédex e o registro original não mudam.</p>${memorial||'<p>Vença Lance e Blue para guardar sua primeira equipe.</p>'}${META.champ?btn('openDouble','Escolher equipe para duplas'):''}</section>`;
  }
  function rIntro(){const t=B.trainer;return `<section class="panel trainer-intro"><p>${stageIndex()<8?'Líder de ginásio':stageIndex()<12?'Elite Four':'Campeão'}</p><img src="assets/trainers/${t.sprite}.png" alt="${t.name}"><h2>${t.name}</h2><p>${t.type?`Especialidade: ${TYPES[t.type][0]}`:'Equipe de tipos variados'} · ${t.team.length} Pokémon</p><p>Prepare sua equipe antes de começar.</p>${btn('beginTrainer','Começar batalha','','gold')}${btn('cancelTrainer','Voltar à jornada')}</section>`;}
  const originalTitle=rTitle;
  rTitle=()=>originalTitle().replace(/<button class="btn gba-option" data-act="journal" data-v="dex">[\s\S]*?<\/button>/,`<button class="btn gba-option" data-act="dex"><span>Pokédex</span><small>Pesquisar espécies</small></button>`).replace(/<button class="btn gba-option" data-act="journal" data-v="history">[\s\S]*?<\/button>/,`<button class="btn gba-option" data-act="journal" data-v="history"><span>Diário do Treinador</span><small>Histórico e conquistas</small></button>`).replace(/<button class="btn gba-option" data-act="journal" data-v="achievements">[\s\S]*?<\/button>/,`<button class="btn gba-option" data-act="pc"><span>${META.champ?'PC de campeões · Pós-game':'PC de campeões'}</span><small>Equipes da Liga e memoriais</small></button>`).replace('<details class="gba-options">',`<details class="gba-options" ${optionsOpen?'open':''}>`).replace('<div class="settings">',`<div class="settings">${btn('moveLanguage',`Golpes: ${CFG.moveLanguage==='en'?'English':'Português'}`)}`);
  const originalStarter=rStarter;
  rStarter=()=>originalStarter().replace('<div class="grid">','<div class="grid starter-grid">');
  const originalHub=rHub;
  rHub=()=>{
    const t=trainerNext(),boss=nextIsBoss();
    let html=originalHub().replace('₽60 · recupera 35% de HP','₽60 · recupera HP e PP dos vivos');
    html=html.replace('</nav>',`${btn('dex','Pokédex')}${btn('journal','Diário do Treinador','history')}${btn('pc','PC')}</nav>`);
    if(boss)html=html.replace('<h2>'+t.name+'</h2>',`<h2>${t.name}</h2><p class="next-trainer">${stageIndex()<8?'Líder':stageIndex()<12?'Elite Four':'Campeão'} · ${t.type?TYPES[t.type][0]:'Tipos variados'} · ${t.team.length} Pokémon</p>`).replace('Desafiar ginásio',`Desafiar ${t.name}`);
    if(R.battle===65)html=html.replace('SUA JORNADA','LANCE VENCIDO · PREPARE-SE PARA BLUE');
    const extra=['ether','elixir','friendship'].filter(id=>R.bag[id]>0).map(id=>btn('sel',`${ITEMS[id].n} ×${R.bag[id]}`,id,'alt',!R.bag[id])).join('');
    return html.replace('<h2>Mochila</h2>',`<h2>Mochila</h2><div class="row">${extra}</div>`);
  };
  const originalReward=rReward;
  rReward=()=>originalReward().replace('Você venceu o Campeão.','Você venceu Lance e Blue!').replace('Pode encerrar a jornada como lenda, ou continuar no modo infinito — ainda permadeath.','Conclua a Liga para guardar sua equipe e liberar o pós-game em dupla.').replace('Aposentar (vitória)','Concluir Liga e guardar equipe').replace('Ginásio conquistado!',`${V.trainer||'Treinador'} derrotado!`);
  const originalWinScreen=rWin;
  rWin=()=>originalWinScreen().replace('A run acaba aqui — de propósito.',R.postgame?(R.mode==='classic'?'Pós-game clássico concluído! A equipe campeã pode ser escolhida novamente.':'Pós-game concluído! Uma equipe campeã usada no Permadeath fica registrada no memorial.'):'A equipe campeã foi registrada no PC especial. A forma original permanece no histórico.').replace('</section>',`${btn('pc','Ver PC de campeões')}</section>`);
  function rBattleNew(){
    if(!B.lock)synchronizeFaintSwitch();
    const actor=currentActor(),pm=R.team[actor]||active(),lk=B.lock;
    let controls='';
    if(window.inventoryBattleHTML&&R.mode==='classic'&&!B.forced&&['bag','ball','itemTarget','itemMove'].includes(B.menu))controls=window.inventoryBattleHTML(pm,lk);
    else if(B.forced||B.menu==='switch'){
      const slots=B.playerSlots;const opts=R.team.map((m,i)=>({m,i})).filter(o=>o.m.hp>0&&(!slots.includes(o.i)||B.switchReason==='next'));
      controls=`<p>${B.forced?(B.switchReason==='next'?'Próximo adversário: escolha quem entra (troca gratuita).':'Seu Pokémon desmaiou. Escolha outro sobrevivente.'):'Trocar gasta a ação deste Pokémon.'}</p><div class="row">${opts.map(o=>btn('sw',`${monName(o.m)} · Nv. ${o.m.lvl} · HP ${o.m.hp}/${o.m.maxHp}`,String(o.i),'alt',lk)).join('')}</div>${B.forced?'':btn('menu','Voltar','moves')}`;
    }else if(B.menu==='target'){controls=`<p>Escolha o alvo de ${moveName(B.pendingMove.id)}:</p><div class="row">${B.enemySlots.filter(i=>B.enemies[i].hp>0).map(i=>btn('target',monName(B.enemies[i]),String(i))).join('')}</div>`;
    }else if(B.menu==='bag'){controls=`<div class="row">${['potion','super','ether','elixir'].map(id=>btn('bagUse',`${ITEMS[id].n} ×${R.bag[id]}`,id,'alt',lk||!R.bag[id])).join('')}${btn('menu','Voltar','moves')}</div>`;
    }else if(B.menu==='ball'){controls=`<div class="row">${['ball','great'].map(id=>btn('ballUse',`${ITEMS[id].n} ×${R.bag[id]}`,id,'alt',lk||!R.bag[id])).join('')}${btn('menu','Voltar','moves')}</div>`;
    }else{
      const ids=available(pm).length?pm.moves:['struggle'];
      controls=`<p>${B.double?`Escolha a ação de ${monName(pm)} · ${B.commands.length+1}/${B.playerSlots.length}`:''}</p><div class="moves">${ids.map((id,i)=>{const mv=M[id];return btn('mv',`${esc(moveName(id))}<small>${TYPES[mv.t]?.[0]} · ${mv.cat===1?'Status':`poder ${mv.p||'variável'}`} · PP ${id==='struggle'?'—':ppLeft(pm,id)+'/'+mv.pp}${strategy&&!strategy.allowed(pm,id)?' · travado por Choice Band':''}</small>`,String(i),'alt mv',lk||ppLeft(pm,id)<=0||(strategy&&!strategy.allowed(pm,id))).replace('class="btn',`style="--move-color:${TYPES[mv.t][1]}" class="btn`).replace('</small>',`${mv.cat!==1&&!B.double?(strategy?.damage(pm,B.enemy,mv)===0||eff(mv.t,B.enemy.types)===0)?' · sem efeito':eff(mv.t,B.enemy.types)>1?' · super efetivo':eff(mv.t,B.enemy.types)<1?' · pouco efetivo':'':''}</small>`);}).join('')}</div><div class="row">${btn('menu','Mochila','bag','',lk)}${!B.train&&!B.boss&&!B.double?btn('menu','Capturar','ball','',lk):''}${btn('menu','Trocar','switch','',lk||!R.team.some((m,i)=>m.hp>0&&!B.playerSlots.includes(i)))}${B.double?'':btn('flee',B.train?'Encerrar treino':`Fugir · ₽${fleeCost()}`,'','alt',lk||!B.train&&(B.boss||R.money<fleeCost()))}</div>`;
    }
    const mons=(slots,team,side)=>slots.map((index,i)=>{const m=team[index];return `<article class="handheld-mon ${side} position-${i} ${m.hp<=0?'fainted':''}"><div class="handheld-sprite">${art(m,side==='player',true)}</div><div class="handheld-status"><strong>${monName(m)}${m.alpha?window.alphaBadge?.()||'Alfa':''} <small>Nv. ${m.lvl}</small></strong><div class="battle-types">${types(m)}</div>${hpBar(m)}<small>${side==='player'?`HP ${m.hp}/${m.maxHp}`:''}${m.ailment?' · '+m.ailment:''}</small></div></article>`;}).join('');
    const arena=B.double?`<div class="handheld-arena is-double"><div class="handheld-ground enemy-ground"></div><div class="handheld-ground player-ground"></div>${mons(B.enemySlots,B.enemies,'enemy')}${mons(B.playerSlots,R.team,'player')}</div>`:`<div class="arena battle-classic"><div class="battle-platform enemy-platform"></div><div class="battle-platform player-platform"></div><div class="battle-status enemy-status plate"><div class="nm">${monName(B.enemy)}${B.enemy.alpha?window.alphaBadge?.()||'Alfa':''} · Nv. ${B.enemy.lvl}</div><div class="battle-types">${types(B.enemy)}</div>${hpBar(B.enemy)}</div><div class="battle-mon enemy-mon">${art(B.enemy,false,true)}</div><div class="battle-mon player-mon">${art(active(),true,true)}</div><div class="battle-status player-status plate"><div class="nm">${monName(active())} · Nv. ${active().lvl}</div><div class="battle-types">${types(active())}</div>${hpBar(active())}<div class="battle-hp">HP ${active().hp}/${active().maxHp}</div></div></div>`;
    return `${B.boss?`<p>${B.trainer.name} · Restam ${B.enemies.filter(m=>m.hp>0).length}/${B.enemies.length}</p>`:''}${arena}<div class="log battle-log" aria-live="polite">${B.log.slice(-40).map(l=>`<div>${esc(l)}</div>`).join('')}</div>${controls}`;
  }
  const oldScreenMusic=screenMusic;
  screenMusic=()=>{if(['intro','summary','pc','dex'].includes(S.screen)){if(musicScreen!==S.screen){musicScreen=S.screen;playCityMusic(lastMenuCity);}if(S.screen==='intro'&&musTrackId!==B.musicTrack)musicStart(B.musicTrack);return;}oldScreenMusic();};
  render=()=>{
    const previous=lastScreen,y=window.scrollY||0,search=document.getElementById('dex-search'),focusSearch=search===document.activeElement,cursor=search?.selectionStart;
    const details=[...document.querySelectorAll('#app details')].map(n=>n.open);
    const settings=document.querySelector('.gba-options');if(settings)optionsOpen=settings.open;
    screenMusic();
    const pages={title:rTitle,starter:rStarter,hub:rHub,battle:rBattleNew,reward:rReward,gameover:rOver,win:rWin,journal:rJournal,dex:rDex,summary:rSummary,pc:rPC,intro:rIntro};
    $app.innerHTML=head()+`<p id="audio-notice" class="audio-notice" role="status">${esc(audioNotice)}</p>`+(pages[S.screen]||rTitle)()+rPlaylist();
    if(previous===S.screen){document.querySelectorAll('#app details').forEach((n,i)=>{if(details[i]!==undefined)n.open=details[i];});window.scrollTo(0,y);}else window.scrollTo(0,0);
    if(focusSearch&&S.screen==='dex'){const n=document.getElementById('dex-search');n.focus({preventScroll:true});try{n.setSelectionRange(cursor,cursor);}catch{}}
    lastScreen=S.screen;window.dispatchEvent(new Event('game-screen-changed'));const log=document.querySelector('.log');if(log)log.scrollTop=log.scrollHeight;
  };
  $app.addEventListener('input',e=>{if(e.target.id==='dex-search'){S.dexQuery=e.target.value;render();}});
  $app.addEventListener('toggle',e=>{if(e.target.classList?.contains('gba-options'))optionsOpen=e.target.open;},true);
  // Keep original keyboard shortcuts, but expose both actors through the same move selection.
  if(!Array.isArray(META.championTeams))META.championTeams=[];
  try{
    const saved=JSON.parse(SAVE_STORAGE.getItem(SAVE_KEY)||'null');
    if(saved?.R){const oldR=R;R=saved.R;ensureRun();saved.R=R;R=oldR;SAVE_STORAGE.setItem(SAVE_KEY,JSON.stringify(saved));}
  }catch(e){console.error('Migration preserved original save:',e.message);}
  saveMeta();render();
  window.gameExpansion={subDestination:()=>subReturn,moveName,TRAINERS,baseSpecies,normalizeMon,timePeriod,available,makeEnemy,evolutionConditions,beginDouble,runQueuedTurn:runTurn};
})();
