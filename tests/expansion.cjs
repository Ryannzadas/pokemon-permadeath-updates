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
async function main(){
 assert.equal(run('window.gameExpansion.TRAINERS.length'),14);
 assert(run('window.gameExpansion.TRAINERS.every(t=>t.team.every(id=>SP[id]))'));
 for(let stage=0;stage<14;stage++){
  run(`newRun('bulbasaur');R.battle=${stage*5+4};startBattle(false)`);
  assert.equal(run('S.screen'),'intro');assert.equal(run('B.enemies.length'),run(`window.gameExpansion.TRAINERS[${stage}].team.length`));
 }
 run("S.screen='starter';META.best=100");
 for(const category of run('STARTER_CATEGORIES.map(c=>c.id)')){
  run(`S.starterCategory=${JSON.stringify(category)}`);const html=run('rStarter()');
  assert(html.includes('grid starter-grid'));const count=run('STARTERS.filter(s=>s.category===S.starterCategory).length');
  assert.equal((html.match(/class="card starter-card/g)||[]).length,count);
  assert.equal((html.match(/class="starter-name"/g)||[]).length,count);
  assert.equal((html.match(/starter-moves/g)||[]).length,count);
 }
 run("newRun('bulbasaur');R.team.push(mk('charmander',5));startBattle(false);R.team[0].hp=0");
 await run('resolveEnd()');assert(run('B.forced'));const enemyHP=run('B.enemy.hp');
 await run('doSwitch(1)');assert(!run('B.forced'));assert.equal(run('R.active'),1);assert.equal(run('B.enemy.hp'),enemyHP);
 run("R.team[1].moves.forEach(id=>R.team[1].pp[id]=0);R.team[1].hp=R.team[1].maxHp;R.team[1].ailment=null;R.team[1].spe=999;B.enemy.moves=['splash'];B.enemy.pp.splash=40");assert.equal(run('window.gameExpansion.available(R.team[1]).length'),0);
 await run('playerMove(0)');await new Promise(r=>setImmediate(r));assert(run("B.log.some(t=>t.includes('Luta desesperada'))"));
 run("newRun('bulbasaur');R.team.push(mk('charmander',5),mk('squirtle',5));R.postgame=true;startBattle(false);R.team[0].hp=0;R.team[1].hp=0");
 await run('resolveEnd()');assert(run('B.forced'));await run('doSwitch(2)');assert(!run('B.forced'));assert.equal(run('B.playerSlots.length'),1);
 run("newRun('bulbasaur');S.screen='hub';ACT.pc();ACT.deposit('0')");assert.equal(run('R.team.length'),1);
 run("R.team.push(mk('charmander',5));ACT.deposit('1')");assert.equal(run('R.pc.length'),1);run("ACT.withdraw('0')");assert.equal(run('R.team.length'),2);
 run("R.team[0]=mk('venusaur',50);R.team[1]=mk('charizard',50);R.battle=70;winRun()");
 assert.equal(run('META.championTeams.length'),1);assert.equal(run('loadMeta().championTeams.length'),1);
 run("S.screen='title';ACT.postgame(META.championTeams[0].id)");assert(run('R.postgame'));assert.equal(run('R.team[0].sp'),'bulbasaur');assert.equal(run('R.team[0].lvl'),5);
 assert.equal(run('META.championTeams[0].original[0].sp'),'venusaur');
 run("archiveRun('defeat','test');SAVE_STORAGE.removeItem(SAVE_KEY);S.screen='title';ACT.postgame(META.championTeams[0].id)");assert.equal(run('META.championTeams[0].state'),'lost');
 run("newRun('riolu');R.team[0].friendship=220");assert.equal(run("window.gameExpansion.baseSpecies('lucario')"),'riolu');
 run("R.team[0].pp[R.team[0].moves[0]]=0;S.screen='summary';S.summary=0;S.summaryBox='team'");
 const pp=run('JSON.stringify(R.team[0].pp)');run("ACT.relearn('0:'+R.team[0].learned.find(id=>!R.team[0].moves.includes(id)))");assert.equal(run('JSON.stringify(R.team[0].pp)'),pp);
 run("newRun('vulpix');R.bag['fire-stone']=1");assert.equal(run('evoReady(R.team[0])[0][1]'),'ninetales');run("R.bag['fire-stone']=0");assert.equal(run('evoReady(R.team[0]).length'),0);
 run("newRun('bulbasaur');startBattle(true);R.team[0].hp=0");await run('resolveEnd()');assert.equal(run('R.team[0].hp'),run('R.team[0].maxHp'));assert.equal(run('S.screen'),'hub');
 assert(require('../desktop/store.cjs').cleanSlots(slots));
 console.log('PASS expansion: starter categories, trainer teams, forced switch, PP/Struggle, double faint, PC, champion persistence and postgame copies');
}
main().catch(e=>{console.error(e);process.exitCode=1});
