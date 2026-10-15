const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'../game');
const slots={};const node={innerHTML:'',addEventListener(){},querySelectorAll:()=>[]};
const c={console,Math:Object.create(Math),setTimeout:f=>{f();return 0},clearTimeout(){},confirm:()=>true,
 localStorage:{getItem:k=>slots[k]||null,setItem:(k,v)=>slots[k]=v,removeItem:k=>delete slots[k]},
 window:{addEventListener(){},dispatchEvent(){},scrollTo(){},scrollY:0},
 document:{getElementById:()=>node,addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],activeElement:null},Event:class{},
 Audio:class {constructor(){this.paused=true}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}addEventListener(){}removeEventListener(){}}};
vm.createContext(c);Object.defineProperty(c,'ModeSaveStore',{get:()=>c.window.ModeSaveStore});for(const f of ['assets.js','pokemon-data.js','mode-store.js','game.js','expansion.js'])vm.runInContext(fs.readFileSync(`${root}/${f}`,'utf8'),c,{filename:f});
const run=s=>vm.runInContext(s,c);
run('musicStop=()=>{};musicStart=()=>{};sfx=()=>{};crySfx=()=>{};render=()=>{};say=async t=>{B.log.push(t)};');
const caps=[10,15,20,26,31,36,41,47,52,57,62,68,73,78];
for(const mode of ['classic','permadeath'])for(const postgame of [false,true]){
 run(`ModeSaveStore.select('${mode}');S.pendingMode='${mode}';newRun('bulbasaur');R.postgame=${postgame}`);
 for(let i=0;i<caps.length;i++){run(`R.battle=${i*5}`);assert.equal(run('window.JourneyLevelCap.current()'),caps[i]);}
 run("R.battle=0;R.team[0]=mk('bulbasaur',9);R.team[0].xp=xpNeed(9)-5;window.notes=[]");assert.equal(run('addXp(R.team[0],999999,window.notes)'),5);assert.equal(run('R.team[0].lvl'),10);assert.equal(run('R.team[0].xp'),0);assert.equal(run('addXp(R.team[0],500,[])'),0);assert.equal(run('R.team[0].lvl'),10);
 run("R.bag.candy=2;S.sel='candy';ACT.card('0')");assert.equal(run('R.bag.candy'),2);assert(run('S.msg.includes("Limite")'));
 run("R.battle=5;ACT.card('0')");assert.equal(run('R.team[0].lvl'),12);assert.equal(run('R.bag.candy'),1);
 run("R.team[0]=mk('bulbasaur',14);ACT.card('0')");assert.equal(run('R.team[0].lvl'),15);assert.equal(run('R.bag.candy'),0);assert.equal(run('R.team[0].xp'),0);
 run("R.battle=0;R.team[0]=mk('bulbasaur',9);levelUp(R.team[0],100,[])");assert.equal(run('R.team[0].lvl'),10);
 run("R.team[0]=mk('venusaur',54);R.team[0].xp=100;addXp(R.team[0],500,[]);levelUp(R.team[0],2,[])");assert.equal(run('R.team[0].lvl'),54,'Legacy level must remain intact');assert.equal(run('R.team[0].xp'),0);
 run("R.battle=45;addXp(R.team[0],xpNeed(54),[])");assert.equal(run('R.team[0].lvl'),55);run('persist();R=null;continueSave()');assert.equal(run('R.team[0].lvl'),55);assert.equal(run('window.JourneyLevelCap.current()'),57);
 // The cap opens on the stage boundary, not on training, exploration, or a Classic defeat.
 run("R.battle=4;R.team=[mk('bulbasaur',10),mk('charmander',9)];R.team[1].xp=xpNeed(9)-2;S.screen='hub';startBattle(false);ACT.beginTrainer();B.enemy.hp=0;B.xpEnemies=[B.enemy];finishWin(null)");assert.equal(run('R.battle'),5);assert.equal(run('window.JourneyLevelCap.current()'),15);assert.equal(run('V.xp[0].amount'),0);assert.equal(run('V.xp[1].amount'),2);assert.equal(run('R.team[1].lvl'),10);
}
run("R.battle=70;R.team[0]=mk('bulbasaur',99);addXp(R.team[0],999999,[])");assert.equal(run('R.team[0].lvl'),100);assert.equal(run('R.team[0].xp'),0);
console.log('PASS level cap: every stage, both modes/postgames, XP truncation/no banking, candy block/partial level, direct level-ups, legacy level preservation, later release, reload, actual party XP reporting, level 100.');
