(function(root,factory){const model=factory();if(typeof module==='object')module.exports=model;else root.CollectionModel=model;})(globalThis,()=>{
 'use strict';const clone=x=>JSON.parse(JSON.stringify(x));
 function normalize(meta){meta.classicRuns=Array.isArray(meta.classicRuns)?meta.classicRuns.filter(x=>x?.R?.mode==='classic'&&Array.isArray(x.R.team)):[];meta.memorial=Array.isArray(meta.memorial)?meta.memorial:[];meta.daily=meta.daily&&typeof meta.daily==='object'?meta.daily:{};meta.teamBuilder=Array.isArray(meta.teamBuilder)?meta.teamBuilder:[];return meta;}
 function compact(run){const r=clone(run);for(const m of [...r.team,...(r.pc||[])]){delete m.ppMax;delete m.stages;delete m.choiceMove;delete m.guardTurns;delete m.critStage;}return r;}
 function remember(meta,run){normalize(meta);if(run.mode!=='classic')return;const entry={R:compact(run),S:{screen:'hub',shop:false,sel:null,msg:''}},i=meta.classicRuns.findIndex(x=>x.R.id===run.id);if(i<0)meta.classicRuns.push(entry);else meta.classicRuns[i]=entry;}
 function restore(meta,id){normalize(meta);const entry=meta.classicRuns.find(x=>x.R.id===id&&x.R.leagueCleared);if(!entry)throw Error('Jornada não encontrada.');return clone(entry);}
 function alphaDue(run,boss,train,random=Math.random){if(train)return false;run.alphaCounter=Math.max(0,Number(run.alphaCounter)||0)+1;if(boss||run.alphaCounter<5)return false;run.alphaCounter-=5;return random()<.3;}
 function dateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
 function daily(meta,date=new Date()){normalize(meta);const key=dateKey(date);if(meta.daily.date!==key)meta.daily={date:key,wins:0,observed:[],events:0,claimed:[]};return meta.daily;}
 const dailyGoals=[{id:'wins',n:'Vença três batalhas',goal:3,title:'Treinador dedicado',avatar:6},{id:'observed',n:'Veja cinco espécies',goal:5,title:'Olhar atento',avatar:54},{id:'events',n:'Participe de dois eventos',goal:2,title:'Explorador diário',avatar:133}];
 function claim(meta,id,date){const d=daily(meta,date),goal=dailyGoals.find(x=>x.id===id);if(!goal||d.claimed.includes(id)||(id==='observed'?d.observed.length:d[id])<goal.goal)return false;d.claimed.push(id);meta.dailyRewards=[...new Set([...(meta.dailyRewards||[]),id])];return true;}
 function memorial(meta,mon,run){normalize(meta);if(meta.memorial.length>=30)throw Error('Memorial cheio. Remova um registro para guardar outro.');const key=run.id+':'+(mon.id||mon.sp+':'+mon.lvl);if(meta.memorial.some(x=>x.key===key))return false;meta.memorial.push({key,sp:mon.sp,lvl:mon.lvl,trainer:run.trainerName,mode:run.mode,date:new Date().toISOString()});return true;}
 return {normalize,remember,restore,alphaDue,daily,dailyGoals,claim,memorial};
});
