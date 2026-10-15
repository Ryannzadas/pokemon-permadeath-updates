const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const slots={},node={innerHTML:'',addEventListener(){},querySelectorAll:()=>[]};
const c={console,Math:Object.create(Math),setTimeout:f=>{f();return 0;},clearTimeout(){},confirm:()=>true,localStorage:{getItem:k=>slots[k]||null,setItem:(k,v)=>slots[k]=v,removeItem:k=>delete slots[k]},window:{addEventListener(){},dispatchEvent(){},scrollTo(){}},document:{getElementById:()=>node,addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]},Event:class{},Audio:class{play(){return Promise.resolve()}pause(){}addEventListener(){}}};
vm.createContext(c);Object.defineProperty(c,'ModeSaveStore',{get:()=>c.window.ModeSaveStore});
for(const f of ['assets.js','pokemon-data.js','mode-store.js','game.js','ability-data.js','strategy.js','journey-model.js','expansion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../game',f),'utf8'),c);
const run=s=>vm.runInContext(s,c);run("render=()=>{};musicStart=()=>{};musicStop=()=>{};crySfx=()=>{};say=async text=>{B.log.push(text)};Math.random=()=>.5;window.effects=[];window.sounds=[];sfx=n=>window.sounds.push(n);window.BattleEffects={move:async(m,id)=>window.effects.push(['move',m.sp,id]),show:async(m,kind)=>window.effects.push([kind,m.sp]),status:async(m,status)=>window.effects.push([status,m.sp])};");
function battle(move,enemy='onix'){run(`newRun('venusaur');R.team[0]=mk('venusaur',40);R.team[0].moves=['${move}'];R.team[0].pp['${move}']=50;R.team[0].spe=999;startBattle(false);B.enemies=[mk('${enemy}',40)];B.enemy=B.enemies[0];B.enemySlots=[0];B.enemy.moves=['splash'];B.enemy.pp.splash=40;B.enemy.hp=B.enemy.maxHp=1000;B.playerSlots=[0];S.screen='battle';window.effects=[];window.sounds=[];`);}
async function turn(){await run('playerMove(0)');await new Promise(r=>setImmediate(r));}
(async()=>{
 battle('swords-dance');await turn();assert.equal(run('R.team[0].stages.atk'),2);assert(run("window.effects.some(e=>e[0]==='buff'&&e[1]==='venusaur')"));
 battle('growl');await turn();assert.equal(run('B.enemy.stages.atk'),-1);assert(run("window.effects.some(e=>e[0]==='debuff'&&e[1]==='onix')"));
 battle('swords-dance');run('R.team[0].stages.atk=6');await turn();assert(!run("window.effects.some(e=>e[0]==='buff')"));
 battle('charge-beam','blissey');await turn();assert.equal(run('R.team[0].stages.spa'),1);assert(!run('B.enemy.stages.spa'),'Secondary boost belongs to attacker');
 battle('close-combat');run('B.enemy.hp=1');await turn();assert(run("window.effects.some(e=>e[0]==='debuff'&&e[1]==='venusaur')"),'Self debuff still applies on KO');
 battle('stun-spore');await turn();assert.equal(run('B.enemy.ailment'),'paralysis');assert(run("window.effects.some(e=>e[0]==='paralysis'&&e[1]==='onix')"));
 battle('vine-whip','charizard');await turn();assert(run("B.log.some(t=>t.includes('muito efetivo'))"));assert(run("window.sounds.includes('hitNE')"));
 battle('poison-sting','skarmory');await turn();assert(!run("window.sounds.some(n=>['hit','hitSE','hitNE'].includes(n))"),'No impact on immunity');assert(!run('B.enemy.ailment'));
 run("newRun('bulbasaur');R.team.push(mk('snivy',5));R.team[1].hp=0;startBattle(true);B.enemy.hp=0;finishWin(null)");assert.equal(run('R.team[1].hp'),0,'Training must not revive previously dead Pokémon');
 run("S.screen='hub';startBattle(true);R.team[0].hp=0");await run('resolveEnd()');assert.equal(run('R.team[0].hp'),run('R.team[0].maxHp'));assert.equal(run('R.team[1].hp'),0);
 console.log('PASS actual battle effects: buff/debuff targets and limits, self secondary effects on KO, ailments, resist/immunity impacts, and training cannot revive prior Permadeath deaths.');
})().catch(e=>{console.error(e);process.exitCode=1});
