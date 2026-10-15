'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const slots={},node={innerHTML:'',addEventListener(){},querySelectorAll:()=>[]};
const c={console,Math:Object.create(Math),setTimeout:f=>{f();return 0;},clearTimeout(){},confirm:()=>true,
 localStorage:{getItem:k=>slots[k]||null,setItem:(k,v)=>slots[k]=v,removeItem:k=>delete slots[k]},
 window:{addEventListener(){},dispatchEvent(){},scrollTo(){},scrollY:0},
 document:{getElementById:()=>node,addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],activeElement:null},Event:class{},
 Audio:class{play(){return Promise.resolve();}pause(){}addEventListener(){}removeEventListener(){}}};
vm.createContext(c);Object.defineProperty(c,'ModeSaveStore',{get:()=>c.window.ModeSaveStore});
for(const file of ['assets.js','pokemon-data.js','mode-store.js','game.js','ability-data.js','strategy.js','journey-model.js','expansion.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../game',file),'utf8'),c,{filename:file});
const run=s=>vm.runInContext(s,c);
run("musicStop=()=>{};musicStart=()=>{};sfx=()=>{};crySfx=()=>{};render=()=>{};say=async t=>{B.log.push(t)};Math.random=()=>.5;");
async function turn(){await run('playerMove(0)');await new Promise(r=>setImmediate(r));}
function battle(move,enemy){
 run(`newRun('venusaur');R.team[0]=mk('venusaur',30);R.team[0].moves=['${move}'];R.team[0].pp['${move}']=50;R.team[0].spe=999;startBattle(false);B.enemies=[mk('${enemy}',30)];B.enemy=B.enemies[0];B.enemySlots=[0];B.enemy.moves=['splash'];B.enemy.pp.splash=40;B.enemy.guard=false;B.playerSlots=[0];S.screen='battle';`);
}
(async()=>{
 assert.equal(run("POKEMON_ABILITIES.gengar[0].id"),'levitate','Gen-5 ability must survive modern database changes');
 battle('earthquake','gengar');const ghostHP=run('B.enemy.hp');await turn();assert.equal(run('B.enemy.hp'),ghostHP);assert(run("B.log.includes('Não afeta o alvo.')"));
 battle('water-gun','vaporeon');run('B.enemy.hp=10');await turn();assert.equal(run('B.enemy.hp'),10+run('Math.floor(B.enemy.maxHp/4)'));
 battle('tackle','snorlax');run("B.enemy.heldItem='sitrus-berry';B.enemy.hp=Math.floor(B.enemy.maxHp/2)+1;R.team[0].atk=1");await turn();assert.equal(run('B.enemy.heldItem'),null);assert(run('B.enemy.hp>B.enemy.maxHp/2'));
 battle('splash','snorlax');run("R.team[0].heldItem='leftovers';R.team[0].hp=20;R.team[0].ailment=null");const recovery=run('Math.floor(R.team[0].maxHp/16)');await turn();assert.equal(run('R.team[0].hp'),20+recovery);assert.equal(run('R.team[0].heldItem'),'leftovers');
 run("newRun('gyarados');R.team.push(mk('gyarados',20),mk('venusaur',20));R.postgame=true;R.active=2;startBattle(false)");assert(run('B.enemySlots.every(i=>B.enemies[i].stages.atk===-1)'),'Intimidate must hit both opponents');
 run('B.playerSlots[0]=2;B.commands=[]');await run('doSwitch(1)');run('B.commands.push({side:"player",actor:B.playerSlots[1],id:"splash",target:0})');await run('enemyTurn()');
 // Incoming faint replacements are a free switch, but staying in after a trainer replacement is not a new entry.
 run("newRun('gyarados');R.team.push(mk('gyarados',20));startBattle(false);B.enemy.stages.atk=0;R.team[0].hp=0");await run('resolveEnd()');await run('doSwitch(1)');assert.equal(run('B.enemy.stages.atk'),-1);
 run("B.forced=true;B.forcedSlot=0;B.switchReason='next'");await run('doSwitch(1)');assert.equal(run('B.enemy.stages.atk'),-1,'Staying in must not repeatedly trigger Intimidate');
 run("R.team[1].heldItem='sitrus-berry';R.team[1].hp=0;JourneyStrategy.berry(R.team[1]);JourneyStrategy.endTurn(R.team[1])");assert.equal(run('R.team[1].hp'),0,'Held items cannot undo permadeath');
 run("newRun('bulbasaur');R.team[0].ability='overgrow';R.team[0].hp=R.team[0].maxHp;R.team[0].lvl=30;window.enemy=mk('snorlax',30)");const normal=run('dmgCalc(R.team[0],window.enemy,M["vine-whip"],true).d');run('R.team[0].hp=1');assert(run('dmgCalc(R.team[0],window.enemy,M["vine-whip"],true).d')>normal);
 run("window.enemy.ability='thick-fat'");assert.equal(run('JourneyStrategy.damage(R.team[0],window.enemy,M.ember)'),.5);
 assert(run("JourneyStrategy.immune({ability:'limber'},'paralysis')"));
 run("R.battle=3;JourneyModel.schedule(R,()=>.1)");assert.equal(run('R.journey.pending'),'help');run('R.journey.pending=null;JourneyModel.schedule(R,()=>.1)');assert.equal(run('R.journey.pending'),null,'Same victory cannot create a second event');
 run("R.journey.seen=['bulbasaur'];JourneyModel.observe(R,'pikachu');JourneyModel.observe(R,'pikachu')");assert.equal(run('R.journey.seen.length'),2);
 run("META.journeyRewards=['friend'];saveMeta()");assert.equal(run('loadMeta().journeyRewards[0]'),'friend');

 battle('tackle','snorlax');run("R.team[0].moves=['tackle','vine-whip'];R.team[0].pp.tackle=20;R.team[0].pp['vine-whip']=20;R.team[0].heldItem='choice-band';B.enemy.hp=9999;B.enemy.maxHp=9999");await turn();assert.equal(run('R.team[0].choiceMove'),'tackle');const lockedPP=run("R.team[0].pp['vine-whip']");await run('playerMove(1)');assert.equal(run("R.team[0].pp['vine-whip']"),lockedPP);assert.equal(run('window.gameExpansion.available(R.team[0]).length'),1);
 run("R.team.push(mk('venusaur',30));B.forced=true;B.forcedSlot=0;B.switchReason='next'");await run('doSwitch(1)');assert.equal(run('R.team[0].choiceMove'),null);run("B.forced=true;B.forcedSlot=0;B.switchReason='next'");await run('doSwitch(0)');assert.equal(run('R.team[0].choiceMove'),null);
 battle('tackle','snorlax');run("R.team[0].heldItem='life-orb';B.enemy.hp=9999;B.enemy.maxHp=9999;window.initialHP=R.team[0].hp");await turn();assert.equal(run('R.team[0].hp'),run('window.initialHP-Math.floor(R.team[0].maxHp/10)'));
 battle('earthquake','gengar');run("R.team[0].heldItem='life-orb';window.initialHP=R.team[0].hp");await turn();assert.equal(run('R.team[0].hp'),run('window.initialHP'),'Immune targets must not cause Life Orb recoil');
 battle('tackle','snorlax');run("B.enemy.heldItem='focus-sash';R.team[0].atk=999999");await turn();assert.equal(run('B.enemy.hp'),1);assert.equal(run('B.enemy.heldItem'),null);
 run("window.wounded={hp:5,maxHp:20,heldItem:'focus-sash'};JourneyStrategy.takeHit(window.wounded,10)");assert.equal(run('window.wounded.hp'),0);assert.equal(run('window.wounded.heldItem'),'focus-sash');
 battle('tackle','snorlax');run('B.enemy.hp=0');run('finishWin(null)');assert.equal(run('V.gain'),40,'New early victory payout');
 run("newRun('venusaur');R.battle=4;startBattle(false);ACT.beginTrainer();finishWin(null)");assert.equal(run('V.gain'),128,'New first-gym payout');
 run("newRun('venusaur');startBattle(true);finishWin(null)");assert.equal(run('V.gain'),0,'Training cannot farm money');
 assert(require('../desktop/store.cjs').cleanSlots(slots));
 battle('absorb','snorlax');run("R.team[0].hp=10;R.team[0].spa=999999;B.enemy.hp=1;B.enemy.ability=null");await turn();assert.equal(run('R.team[0].hp'),11,'Draining must use actual HP removed rather than overkill damage');
 battle('struggle','snorlax');run("B.enemy.hp=9999;B.enemy.maxHp=9999;window.initialHP=R.team[0].hp");await turn();assert.equal(run('R.team[0].hp'),run('window.initialHP-Math.floor(R.team[0].maxHp/4)'),'Struggle recoil is applied once');
 battle('splash','snorlax');await turn();assert.equal(run('!!R.team[0].guard'),false);assert.equal(run('B.enemy.guard'),false,'Splash must not grant defensive protection');
 console.log('PASS drain overkill, single Struggle recoil and Splash without defensive buffs.');
 console.log('PASS strategy: real turns, historical abilities, Ground immunity, absorption, Berry consumption, Leftovers, double Intimidate, forced switch, Choice Band lock, Life Orb recoil, Focus Sash consumption, new payouts, permadeath, event anti-repeat and permanent rewards.');
})().catch(e=>{console.error(e);process.exitCode=1;});
