'use strict';
/* Run-local exploration and account-wide cosmetic rewards. No battle bonuses. */
const JourneyModel=(()=>{
  const routes={
    forest:{name:'Floresta',description:'Trilhas verdes · mais encontros de Planta e Inseto.',types:['grass','bug'],species:'bulbasaur'},
    cave:{name:'Caverna',description:'Passagens rochosas · mais encontros de Pedra e Terra.',types:['rock','ground'],species:'geodude'},
    lake:{name:'Lago',description:'Margens tranquilas · mais encontros de Água.',types:['water'],species:'squirtle'}
  };
  const missions=[
    {id:'observer',name:'Olhar curioso',description:'Observe 8 espécies diferentes nesta jornada.',goal:8,title:'Observador',avatar:54},
    {id:'friend',name:'Laços de amizade',description:'Tenha um Pokémon vivo com 120 de amizade.',goal:120,title:'Companheiro leal',avatar:197},
    {id:'explorer',name:'Pequenas histórias',description:'Participe de 3 eventos entre batalhas.',goal:3,title:'Viajante',avatar:196}
  ];
  function normalize(run){
    if(!run)return null;
    const j=run.journey&&typeof run.journey==='object'?run.journey:{};
    j.route=routes[j.route]?j.route:'forest';
    j.seen=[...new Set(Array.isArray(j.seen)?j.seen.filter(x=>typeof x==='string'):[])].slice(0,700);
    for(const m of [...run.team,...(run.pc||[])])if(!j.seen.includes(m.sp))j.seen.push(m.sp);
    j.events=Math.max(0,Number(j.events)||0);
    j.lastEventBattle=Number.isFinite(j.lastEventBattle)?j.lastEventBattle:run.battle;
    j.pending=['help','traveler','view'].includes(j.pending)?j.pending:null;
    j.log=Array.isArray(j.log)?j.log.filter(x=>typeof x==='string').slice(-8):[];
    run.journey=j;return j;
  }
  function observe(run,species){const j=normalize(run);if(!j.seen.includes(species))j.seen.push(species);}
  function progress(run,id){
    const j=normalize(run);if(!j)return 0;
    if(id==='observer')return j.seen.length;
    if(id==='explorer')return j.events;
    return Math.max(0,...[...run.team,...(run.pc||[])].filter(m=>m.hp>0).map(m=>m.friendship||0));
  }
  function schedule(run,random=Math.random){
    const j=normalize(run);
    if(j.pending||run.battle<=j.lastEventBattle||run.battle%3!==0||run.battle>=70)return;
    j.lastEventBattle=run.battle;
    if(random()<.65)j.pending=['help','traveler','view'][Math.min(2,Math.floor(random()*3))];
  }
  return {routes,missions,normalize,observe,progress,schedule};
})();
if(typeof module!=='undefined')module.exports=JourneyModel;
