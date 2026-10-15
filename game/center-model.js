'use strict';
const CenterModel=(()=>{
  const WIDTH=640,HEIGHT=416,bounds={x:40,y:94,w:560,h:306},spawn={x:320,y:240,dir:'up'};
  const obstacles=[{x:176,y:120,w:288,h:52},{x:56,y:112,w:48,h:64},{x:516,y:112,w:64,h:64}];
  const spots=[[200,246],[440,246],[180,313],[459,313],[250,348],[390,348]];
  function safePosition(p){
    const x=Number(p?.x),y=Number(p?.y);
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<47||x>593||y<103||y>400||obstacles.some(o=>x+6.5>o.x&&x-6.5<o.x+o.w&&y-.5>o.y&&y-9<o.y+o.h))return {...spawn};
    return {x:Math.round(x*100)/100,y:Math.round(y*100)/100,dir:['up','down','left','right'].includes(p.dir)?p.dir:'up'};
  }
  const needsHealing=run=>run.team.some(m=>m.hp<m.maxHp||m.ailment||m.moves.some(id=>m.pp[id]<M[id].pp));
  return {WIDTH,HEIGHT,bounds,spawn,obstacles,spots,safePosition,needsHealing};
})();
