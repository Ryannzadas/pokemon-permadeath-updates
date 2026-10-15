'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const runtime=fs.existsSync(path.join(__dirname,'runtime'))?'./runtime':'../game';
const TeamModel=require(runtime+'/team-model.js'),Inventory=require(runtime+'/inventory-model.js');
const root=fs.existsSync(path.join(__dirname,'runtime'))?path.join(__dirname,'runtime'):path.join(__dirname,'../game');
const scripts=['assets.js','pokemon-data.js','legendary-data.js','mode-store.js','game.js','ability-data.js','strategy.js','journey-model.js','expansion.js','online-dex-data.js','online-dex.js'];
const source=Object.fromEntries(scripts.map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]));
const defaultBag={'hyper-potion':2,'full-heal':2,ether:1,'max-revive':2};
function environment(){const slots={},node={innerHTML:'',addEventListener(){},querySelectorAll:()=>[]};const c={console,Math:Object.create(Math),setTimeout:f=>{f();return 0;},clearTimeout(){},confirm:()=>false,window:{addEventListener(){},dispatchEvent(){},scrollTo(){}},document:{getElementById:()=>node,addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]},Event:class{},Audio:class{play(){return Promise.resolve();}pause(){}addEventListener(){}},localStorage:{getItem:k=>slots[k]||null,setItem:(k,v)=>slots[k]=v,removeItem:k=>delete slots[k]}};
 vm.createContext(c);Object.defineProperty(c,'ModeSaveStore',{get:()=>c.window.ModeSaveStore});
 for(const f of scripts){vm.runInContext(source[f],c,{filename:f,timeout:3000});if(f==='game.js')vm.runInContext('render=()=>{};musicStart=()=>{};musicStop=()=>{};sfx=()=>{};crySfx=()=>{};persist=()=>{};saveMeta=()=>{};',c);}
 vm.runInContext('OnlineDex.installBattle()',c);
 vm.runInContext('say=async text=>{B.log.push(text);};',c);return c;
}
const read=(c,s)=>JSON.parse(vm.runInContext('JSON.stringify('+s+')',c));
function metadata(){const c=environment();return read(c,'({species:SP,moves:M,abilities:POKEMON_ABILITIES,items:JourneyStrategy.items})');}
const data=metadata();
function validate(team,unlocked,rules){const result=TeamModel.validate(team,{...data,unlocked});if(rules.format==='double'&&result.length<2)throw Error('Duplas exigem pelo menos dois Pokémon.');if(result.some(m=>rules.banned.includes(m.sp)))throw Error('Espécie proibida pelas regras.');return result;}
function create(teams,rules){const c=environment();c.input=teams;c.level=rules.level;const state=read(c,'({teams:input.map(team=>team.map(x=>{const m=mk(x.sp,level);m.moves=x.moves.slice();m.pp=Object.fromEntries(m.moves.map(k=>[k,M[k].pp]));m.heldItem=x.heldItem;m.abilitySlot=x.abilitySlot;m.nature=x.nature||"hardy";recalc(m);JourneyStrategy.normalize(m);m.heldItem=x.heldItem;return m;})),slots:input.map(t=>Array.from({length:Math.min(t.length,'+(rules.format==='double'?2:1)+')},(_,i)=>i)),bags:input.map(()=>({})),turn:0,log:[],rng:0,winner:null})');state.bags=teams.map(()=>rules.bag?{...defaultBag}:{});state.rng=crypto.randomBytes(4).readUInt32LE();c.initial=state;vm.runInContext('for(let side=0;side<2;side++)for(const i of initial.slots[side])JourneyStrategy.enter(initial.teams[side][i],initial.slots[1-side].map(j=>initial.teams[1-side][j]));',c);return read(c,'initial');}
function legal(state,side,actions,rules){
 if(!Array.isArray(actions)||actions.length!==state.slots[side].length)throw Error('Escolha uma ação para cada Pokémon ativo.');const reserved={},switches=new Set();
 return actions.map((a,slot)=>{const index=state.slots[side][slot],m=state.teams[side][index];if(!a||typeof a!=='object')throw Error('Ação inválida.');
  if(a.kind==='switch'){const i=Number(a.target);if(!Number.isInteger(i)||!state.teams[side][i]||state.teams[side][i].hp<=0||state.slots[side].includes(i)||switches.has(i))throw Error('Troca inválida.');switches.add(i);return {kind:'switch',slot,actor:index,target:i};}
  if(a.kind==='wait'&&state.slots.some((slots,i)=>slots.some(n=>state.teams[i][n].hp<=0))&&m.hp>0)return {kind:'wait',slot,actor:index};if(m.hp<=0)throw Error('Troque o Pokémon desmaiado.');
  if(a.kind==='item'){if(!rules.bag||!defaultBag[a.id]||!state.bags[side][a.id]||(reserved[a.id]=(reserved[a.id]||0)+1)>state.bags[side][a.id])throw Error('Item indisponível.');reserved[a.id]=reserved[a.id]||1;const i=Number(a.target),target=state.teams[side][i];if(!Number.isInteger(i)||!target)throw Error('Alvo inválido.');const trial=JSON.parse(JSON.stringify(target));trial.ppMax=Object.fromEntries(trial.moves.map(k=>[k,data.moves[k].pp]));const result=Inventory.apply(a.id,trial,{battle:true,move:a.move});if(!result.ok)throw Error(result.msg);return {kind:'item',slot,actor:index,id:a.id,target:i,move:a.move||null};}
  if(a.kind!=='move')throw Error('Ação inválida.');const available=m.moves.filter(id=>m.pp[id]>0&&(!m.choiceMove||id===m.choiceMove));if(available.length&&!available.includes(a.id)||!available.length&&a.id!=='struggle')throw Error('Golpe indisponível.');const target=Number(a.target);if(!Number.isInteger(target)||!state.slots[1-side].includes(target)||state.teams[1-side][target]?.hp<=0)throw Error('Alvo inválido.');return {kind:'move',slot,actor:index,id:a.id,target};
 });
}
async function resolve(state,commands,rules){
 const c=environment();c.state=JSON.parse(JSON.stringify(state));c.Inventory=Inventory;let seed=state.rng>>>0;
 c.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 vm.runInContext(`R={mode:'classic',team:state.teams[0],active:state.slots[0][0],bag:state.bags[0],relics:{},battle:70};S.screen='battle';B={pvp:true,bag:state.bags[1],lock:false,enemies:state.teams[1],enemySlots:state.slots[1],playerSlots:state.slots[0],enemy:state.teams[1][state.slots[1][0]],commands:[],turn:state.turn,fainted:new Set(),log:state.log,used:[],sash:false,menu:'moves'};
  applyItem=(id,m,o={})=>{m.ppMax=Object.fromEntries(m.moves.map(k=>[k,M[k].pp]));return Inventory.apply(id,m,{battle:true,move:o.move});};
  resolveEnd=async()=>{B.lock=false;state.winner=R.team.every(m=>m.hp<=0)?B.enemies.every(m=>m.hp<=0)?'draw':1:B.enemies.every(m=>m.hp<=0)?0:null;};`,c);
 vm.runInContext(`state.events=[];
  let lastImpact='hit';sfx=name=>{if(['hit','hitSE','hitNE'].includes(name))lastImpact=name;};
  const record=(kind,mon,text='',move=null,symbol=null)=>{const side=mon?(R.team.includes(mon)?0:1):null;state.events.push({kind,impact:kind==='hit'?lastImpact:null,side,index:mon?(side?B.enemies:R.team).indexOf(mon):null,text,move,symbol,teams:[R.team,B.enemies].map(t=>t.map(m=>({sp:m.sp,lvl:m.lvl,hp:m.hp,maxHp:m.maxHp,types:m.types,ailment:m.ailment||null}))),slots:[B.playerSlots.slice(),B.enemySlots.slice()]});};
  say=async text=>{B.log.push(text);record('text',null,text);};
  window.BattleEffects={move:async(mon,id)=>record('attack',mon,'',id,'✦'),show:async(mon,kind,text)=>record(kind,mon,'',null,text),status:async(mon,kind)=>record(kind==='heal'?'buff':'status',mon,'',null,kind==='heal'?'✚':'✦')};
 `,c);
 // Forced replacements do not consume the opponent's turn.
 const replacing=state.slots.some((slots,i)=>slots.some(index=>state.teams[i][index].hp<=0));
 if(replacing){for(let side=0;side<2;side++)for(const a of commands[side])if(a.kind==='switch'&&state.teams[side][a.actor].hp<=0){c.side=side;c.action=a;vm.runInContext(`{const team=side?B.enemies:R.team,slots=side?B.enemySlots:B.playerSlots;team[action.actor].stages={};team[action.actor].critStage=0;team[action.actor].choiceMove=null;slots[action.slot]=action.target;JourneyStrategy.enter(team[action.target],(side?B.playerSlots:B.enemySlots).map(i=>(side?R.team:B.enemies)[i]).filter(m=>m.hp>0));}`,c);}const next=read(c,'({teams:[R.team,B.enemies],slots:[B.playerSlots,B.enemySlots],bags:state.bags,turn:B.turn,log:B.log,events:state.events,winner:state.winner})');next.rng=seed;return next;}
 c.commands=commands;
 vm.runInContext(`B.commands=commands.flatMap((list,side)=>list.map(a=>({side:side?'enemy':'player',actor:a.actor,slot:a.slot,id:a.kind==='move'?a.id:'quick-attack',target:a.target,...(a.kind==='switch'?{switch:a.target}:{}),...(a.kind==='item'?{item:a.id,itemTarget:a.target,itemMove:a.move}: {})})));`,c);
 await vm.runInContext('window.gameExpansion.runQueuedTurn()',c,{timeout:3000});
 const next=read(c,'({teams:[R.team,B.enemies],slots:[B.playerSlots,B.enemySlots],bags:[R.bag,state.bags[1]],turn:B.turn,log:B.log.slice(-100),events:state.events,winner:state.winner})');next.rng=seed;return next;
}
function trimSlots(state){for(let side=0;side<2;side++){const alive=state.teams[side].filter(m=>m.hp>0).length;while(state.slots[side].length>alive){const i=state.slots[side].findIndex(n=>state.teams[side][n].hp<=0);if(i<0)break;state.slots[side].splice(i,1);}}return state;}
function view(state,side){const publicMon=m=>({sp:m.sp,lvl:m.lvl,hp:m.hp,maxHp:m.maxHp,types:m.types,ailment:m.ailment||null,stages:m.stages||{}});return {events:(state.events||[]).map(e=>({kind:e.kind,impact:e.impact,side:e.side===null?null:e.side===side?'player':'enemy',index:e.index,text:e.text,move:e.side===side||e.kind==='attack'?e.move:null,symbol:e.symbol,frame:{team:e.teams[side],enemy:e.teams[1-side],slots:e.slots[side],enemySlots:e.slots[1-side]}})),team:state.teams[side],enemy:state.teams[1-side].map(publicMon),slots:state.slots[side],enemySlots:state.slots[1-side],bag:state.bags[side],turn:state.turn,log:state.log.slice(-30),winner:state.winner===null?null:state.winner==='draw'?'draw':state.winner===side?'won':'lost'};}
module.exports={data,validate,create,legal,resolve,view,trimSlots,defaultBag};
