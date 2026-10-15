'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let now=0,focused=true,timer;const storage={};
const c={performance:{now:()=>now},R:null,S:{screen:'title'},V:null,META:{history:[],championTeams:[],postgameRecords:[],completedPostgames:{classic:0,permadeath:0}},ACHIEVEMENTS:[],SP:{bulbasaur:{dex:1,n:'Bulbasaur'}},SAVE_KEY:'save',META_KEY:'meta',SAVE_STORAGE:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},persist(){},render(){},saveMeta(){},archiveRun(){if(!c.META.history.some(h=>h.id===c.R.id))c.META.history.push({id:c.R.id,team:[]});},winRun(){},rWin:()=>'<section></section>',rJournal:()=>'<section></section>',esc:String,SPRITE:String,window:{addEventListener(){}},document:{visibilityState:'visible',hasFocus:()=>focused,addEventListener(){},querySelectorAll:()=>[]},setInterval:f=>timer=f,console};
vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').resolve(__dirname,'../game/playtime.js'),'utf8'),c);
const clock=c.window.JourneyClock;
c.R={id:'base',mode:'classic',team:[],playTimeMs:0};c.S.screen='hub';now=100;clock.flush();now=1100;clock.flush();assert.equal(c.R.playTimeMs,1000);
c.document.visibilityState='hidden';now=2100;clock.flush();now=100000;clock.flush();assert.equal(c.R.playTimeMs,2000);
c.document.visibilityState='visible';now=101000;clock.flush();now=102000;clock.flush();assert.equal(c.R.playTimeMs,3000);
focused=false;now=103000;clock.flush();now=110000;clock.flush();assert.equal(c.R.playTimeMs,4000);focused=true;clock.flush();
const base=c.R;c.R={id:'second',mode:'permadeath',team:[],playTimeMs:0};now=111000;c.render();assert.equal(base.playTimeMs,5000);now=112000;clock.flush();assert.equal(c.R.playTimeMs,1000);
c.S.screen='title';now=113000;clock.flush();now=120000;c.persist();assert.equal(c.R.playTimeMs,2000);
c.S.screen='hub';clock.flush();storage.save=JSON.stringify({R:{id:'second'},S:{screen:'hub'},inBattle:true,training:false});
for(let i=0;i<30;i++){now+=1000;timer();}assert.equal(c.R.playTimeMs,32000);const saved=JSON.parse(storage.save);assert.equal(saved.R.playTimeMs,32000);assert.equal(saved.inBattle,true);assert.equal(saved.S.screen,'hub');
c.archiveRun('abandoned','test');assert.equal(c.META.history[0].playTimeMs,32000);assert.equal(c.META.postgameRecords.length,0);
for(const mode of ['classic','permadeath']){c.R={id:mode,mode,postgame:true,team:[{sp:'bulbasaur',lvl:50,hp:20}],trainerName:'Test',playTimeMs:3723000};c.render();c.archiveRun('champion','test');c.archiveRun('champion','test');assert.equal(c.META.completedPostgames[mode],1);}
assert.equal(c.META.postgameRecords.length,2);assert.equal(clock.format(3723000),'1h 02min');assert.equal(c.ACHIEVEMENTS.length,2);assert(c.ACHIEVEMENTS.every(a=>a.progress()===1));
const recorded=c.R.playTimeMs;c.window.gameExpansion={subDestination:()=>"title"};c.S.screen='journal';clock.flush();now+=5000;clock.flush();assert.equal(c.R.playTimeMs,recorded);
console.log('PASS playtime: foreground only, background/blur/title pause, independent runs, 30-second save preserves battle markers, base history, per-mode postgame teams/time, idempotent achievements.');
