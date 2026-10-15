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

const expected={azumarill:['water','fairy'],marill:['water','fairy'],azurill:['normal','fairy'],ralts:['psychic','fairy'],kirlia:['psychic','fairy'],gardevoir:['psychic','fairy'],'mr-mime':['psychic','fairy'],'mime-jr':['psychic','fairy'],sylveon:['fairy']};
for(const [id,types] of Object.entries(expected)){assert.deepEqual(JSON.parse(run(`JSON.stringify(mk('${id}',20).types)`)),types);}
for(const id of JSON.parse(run('JSON.stringify(Object.keys(POKEMON_DATA.species))')))assert.deepEqual(JSON.parse(run(`JSON.stringify(SP['${id}'].t)`)),JSON.parse(run(`JSON.stringify(POKEMON_DATA.species['${id}'].types)`)));
for(const id of JSON.parse(run("JSON.stringify(Object.keys(POKEMON_DATA.moves).filter(id=>POKEMON_DATA.moves[id].t==='fairy'))")))assert.equal(run(`M['${id}'].t`),'fairy');
for(const mode of ['classic','permadeath']){run(`S={screen:'starter',pendingMode:'${mode}'};newRun('azumarill');R.pc=[mk('mr-mime',20)];R.team[0].types=['water'];R.pc[0].types=['normal'];R.team[0].hp=1;R.team[0].pp[R.team[0].moves[0]]=0;persist();continueSave();`);assert.deepEqual(JSON.parse(run('JSON.stringify(R.team[0].types)')),['water','fairy']);assert.deepEqual(JSON.parse(run('JSON.stringify(R.pc[0].types)')),['psychic','fairy']);assert.equal(run('R.team[0].hp'),1);assert.equal(run('R.team[0].pp[R.team[0].moves[0]]'),0);}
for(const [type,value] of [['dragon',0],['poison',2],['grass',2],['electric',2],['steel',1],['fire',.5],['fighting',.5]])assert.equal(run(`eff('${type}',['water','fairy'])`),value);
console.log('PASS modern roster/move types, Fairy species and effectiveness, both-mode save/PC correction without HP or PP recovery.');
