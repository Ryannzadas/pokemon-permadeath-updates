'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../game');const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.woff2':'font/woff2','.webp':'image/webp'};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html'));if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(b);});});let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',e.message);});
 await p.addInitScript(()=>{localStorage.setItem('umavida-cfg',JSON.stringify({sound:false,music:false,moveLanguage:'pt'}));window.testStatus=null;window.desktopAPI={onStatus:f=>window.testStatus=f,status:async()=>({ok:true,value:{configured:true,user:{uid:'test',name:'Teste'},dirty:false,updatedAt:1,update:{phase:'disabled'}}}),sync:async()=>({ok:true,value:{configured:true,user:{uid:'test'},dirty:false,updatedAt:2,update:{phase:'disabled'}}}),storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>localStorage.removeItem(k)}};});
 await p.goto('http://127.0.0.1:'+server.address().port);await p.locator('.visual-title').waitFor();await p.waitForTimeout(230);await p.screenshot({path:'/tmp/ui-menu.png'});

 const snapshots={};
 for(const mode of ['classic','permadeath']){
  await p.evaluate(mode=>{ModeSaveStore.select(mode);S.pendingMode=mode;S.pendingTrainer='red';S.pendingTrainerName='Padrão '+mode;newRun('bulbasaur');R.money=mode==='classic'?321:654;R.team.push(mk('charmander',5));R.pc=[mk('eevee',12)];persist();META.champ=true;META.championTeams=[{id:'champ',mode:'classic',state:'ready',team:[{sp:'venusaur',lvl:70},{sp:'charizard',lvl:70}],original:[{sp:'venusaur',lvl:70},{sp:'charizard',lvl:70}]}];S.screen='title';render();},mode);
  snapshots[mode]=await p.evaluate(mode=>JSON.stringify(ModeSaveStore.slots()[mode]),mode);
  await p.evaluate(mode=>{ACT.postgame('champ');ACT.chooseMode(mode);R.trainer='red';R.trainerName='Duplas '+mode;R.money=mode==='classic'?999:888;persist();render();},mode);
  assert.equal(await p.evaluate(()=>R.postgame),true);assert.equal(await p.evaluate(mode=>JSON.stringify(ModeSaveStore.slots()[mode]),mode),snapshots[mode]);
  assert.equal(await p.evaluate(()=>R.team[0].sp),'bulbasaur');assert.equal(await p.evaluate(()=>R.team[0].lvl),5);
 }
 assert.equal(await p.evaluate(()=>Object.keys(ModeSaveStore.slots()).length),4);await p.reload();await p.locator('[data-act="cont"]').click();assert.equal(await p.locator('[data-act="contMode"]').count(),4);
 for(const [slot,money] of [['classic',321],['classic-double',999],['permadeath',654],['permadeath-double',888]]){
  await p.locator(`[data-act="contMode"][data-v="${slot}"]`).click();assert.equal(await p.evaluate(()=>R.money),money);assert.equal(await p.evaluate(()=>!!R.postgame),slot.endsWith('-double'));await p.locator('[data-nav="accountTitle"]').click();await p.locator('[data-act="cont"]').click();
 }
 await p.evaluate(()=>{ModeSaveStore.select('classic-double');SAVE_STORAGE.removeItem(SAVE_KEY);});assert.equal(await p.evaluate(()=>Object.keys(ModeSaveStore.slots()).length),3);assert.equal(await p.evaluate(()=>ModeSaveStore.slots().classic.R.money),321);assert.deepEqual(errors,[]);
 console.log('PASS four account-synced slots: creating champion duos preserves standard save/PC, separate mode rules and level-5 base forms, reload, four Continue choices, switching back and deleting only one journey.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
