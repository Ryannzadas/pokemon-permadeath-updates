'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../game'),slots={};let hour=12;
const node={innerHTML:'',addEventListener(){},querySelectorAll:()=>[]};
const c={console,Math,Date:class extends Date{getHours(){return hour;}},setTimeout:f=>{f();return 0},clearTimeout(){},confirm:()=>true,
 localStorage:{getItem:k=>slots[k]||null,setItem:(k,v)=>slots[k]=v,removeItem:k=>delete slots[k]},
 window:{addEventListener(){},dispatchEvent(){},scrollTo(){},scrollY:0},document:{getElementById:()=>node,addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]},Event:class{},
 Audio:class{constructor(){this.paused=true}play(){return Promise.resolve()}pause(){}addEventListener(){}removeEventListener(){}}};
vm.createContext(c);Object.defineProperty(c,'ModeSaveStore',{get:()=>c.window.ModeSaveStore});
for(const file of ['assets.js','pokemon-data.js','mode-store.js','game.js','ability-data.js','strategy.js','expansion.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c,{filename:file});
const run=s=>vm.runInContext(s,c),ready=()=>JSON.parse(run('JSON.stringify(evoReady(R.team[0]).map(x=>x[1]))'));
run("musicStop=()=>{};sfx=()=>{};render=()=>{};newRun('eevee');R.battle=45;R.team=[mk('eevee',54)];R.team[0].friendship=255;R.team[0].moves=['charm','tackle'];recalc(R.team[0]);");
assert.equal(run('M.charm.t'),'fairy');assert(!ready().includes('sylveon'));assert(!ready().includes('espeon'));
run('levelUp(R.team[0],1,[])');assert.deepEqual(ready(),['sylveon']);hour=23;assert.deepEqual(ready(),['sylveon']);
run('persist();R=null;continueSave()');assert.equal(run('R.team[0].lvl'),55);assert.deepEqual(ready(),['sylveon']);
// Merely having learned a Fairy move is insufficient: it must be one of the active four.
run("R.team[0].moves=['tackle'];R.team[0].learned.push('charm');");assert.deepEqual(ready(),['umbreon']);hour=12;assert.deepEqual(ready(),['espeon']);
// High friendship and a move without a subsequent level-up do not unlock Sylveon.
run("R.team[0]=mk('eevee',54);R.team[0].friendship=255;R.team[0].moves=['baby-doll-eyes'];recalc(R.team[0]);");assert.deepEqual(ready(),[]);
run('levelUp(R.team[0],1,[])');assert.deepEqual(ready(),['sylveon']);
run('R.team[0].friendship=10;levelUp(R.team[0],1,[])');assert.deepEqual(ready(),[]);
run("R.team[0]=mk('eevee',100);R.team[0].friendship=255;R.team[0].moves=['charm'];levelUp(R.team[0],1,[])");assert.deepEqual(ready(),[]);
run("R.team[0]=mk('eevee',30);R.team[0].friendship=157;R.team[0].moves=['charm'];levelUp(R.team[0],1,[])");assert.equal(run('R.team[0].friendship'),160);assert.deepEqual(ready(),['sylveon']);
run('R.team[0].hp=0');assert(!run('canEvolve(R.team[0])'));
run("R.team[0]=mk('sylveon',55)");assert.deepEqual(JSON.parse(run('JSON.stringify(R.team[0].types)')),['fairy']);assert.equal(run('R.team[0].spa'),126);assert.equal(run('R.team[0].ability'),'cute-charm');
for(const [type,mul] of [['dragon',0],['poison',2],['steel',2],['fighting',.5],['dark',.5],['bug',.5]])assert.equal(run(`eff('${type}',['fairy'])`),mul);
for(const [type,mul] of [['dragon',2],['dark',2],['fighting',2],['fire',.5],['poison',.5],['steel',.5]])assert.equal(run(`eff('fairy',['${type}'])`),mul);
assert.equal(run("M['moonblast'].t"),'fairy');assert.equal(run("M['draining-kiss'].t"),'fairy');assert.equal(run("window.gameExpansion.baseSpecies('sylveon')"),'eevee');
for(const mon of ['sylveon','eevee'])assert(run(`SP['${mon}'].learn.every(x=>M[x.id])`));
assert(fs.readFileSync(path.join(root,'assets/sprites/700-f.png')).subarray(0,4).equals(Buffer.from([137,80,78,71])));
assert(fs.readFileSync(path.join(root,'assets/sprites/700-b.png')).subarray(0,4).equals(Buffer.from([137,80,78,71])));
assert.equal(run('CRIES[700]'),'assets/cries/700.ogg');
console.log('PASS Sylveon: real level-up, friendship threshold, equipped Fairy move, day/night priority, inactive move fallback, reload, dead/max-level exclusions, official stats/typing, Fairy matchups, learnset, base lineage and offline assets.');
