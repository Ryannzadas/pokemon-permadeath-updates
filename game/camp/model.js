(function(root,factory){const model=factory();if(typeof module==='object')module.exports=model;else root.CampModel=model;})(globalThis,()=>{
  'use strict';
  const WIDTH=640,HEIGHT=416,LIMIT=3;
  const bounds={x:62,y:76,w:516,h:306};
  const trees=[[66,106],[112,76],[164,66],[218,68],[424,68],[478,72],[532,82],[577,114],[58,171],[584,174],[60,244],[582,241],[74,315],[570,361],[123,374],[185,382],[430,381],[492,378]];
  const obstacles=[
    {x:268,y:83,w:104,h:60,kind:'tent'},
    {x:300,y:208,w:40,h:29,kind:'fire'},
    {x:442,y:268,w:104,h:68,kind:'pond'},
    {x:271,y:269,w:82,h:16,kind:'log'},
    {x:385,y:112,w:24,h:20,kind:'crate'},
    {x:146,y:244,w:26,h:15,kind:'rock'},
    {x:482,y:162,w:32,h:18,kind:'rock'},
    ...trees.map(([x,y])=>({x:x-9,y:y-8,w:18,h:16,kind:'tree'}))
  ];
  const spawn={x:320,y:335,dir:'up'};
  const spots=[[209,194],[428,197],[217,305],[391,303],[396,157],[141,163]];
  function safePosition(p){
    const x=Number(p?.x),y=Number(p?.y);
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<bounds.x+6||x>bounds.x+bounds.w-6||y<bounds.y+8||y>bounds.y+bounds.h+.1||obstacles.some(o=>x+6.5>o.x&&x-6.5<o.x+o.w&&y-.5>o.y&&y-9<o.y+o.h))return {...spawn};
    return {x:Math.round(x*100)/100,y:Math.round(y*100)/100,dir:['up','down','left','right'].includes(p.dir)?p.dir:'down'};
  }
  function normalize(run){
    if(!run)throw new Error('No journey');
    const old=run.camp&&typeof run.camp==='object'?run.camp:{};
    const stage=Math.max(0,Math.floor(Number(run.battle)||0));
    const same=old.stage===stage;
    run.camp={version:1,position:safePosition(old.position),stage,used:same?Math.max(0,Math.min(LIMIT,Math.floor(Number(old.used)||0))):0};
    return run.camp;
  }
  function interact(run,index,kind){
    const state=normalize(run),m=run.team[Number(index)];
    if(!Number.isInteger(Number(index))||!m||!(m.hp>0))return {ok:false,message:'Este Pokémon não está disponível no acampamento.'};
    if(!['play','feed'].includes(kind))return {ok:false,message:'Ação inválida.'};
    if(state.used>=LIMIT)return {ok:false,message:'A equipe já aproveitou esta pausa. Vença uma batalha da jornada para renovar as interações.'};
    const friendship=Math.max(0,Math.min(255,Number(m.friendship??70)||0));
    if(friendship>=255)return {ok:false,message:'A amizade deste Pokémon já está no máximo.'};
    if(kind==='feed'&&run.money<15)return {ok:false,message:'Você precisa de ₽15 para oferecer um lanche.'};
    m.friendship=Math.min(255,friendship+(kind==='feed'?5:3));
    if(kind==='feed')run.money-=15;
    state.used++;
    return {ok:true,gain:m.friendship-friendship,message:kind==='feed'?'Gostou do lanche!':'Vocês brincaram juntos!'};
  }
  return {WIDTH,HEIGHT,LIMIT,bounds,trees,obstacles,spawn,spots,safePosition,normalize,interact};
});
