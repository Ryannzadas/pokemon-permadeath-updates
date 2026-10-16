'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../game');const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html'));if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(f,(e,b)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(b);});});let browser;

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  localStorage.setItem('umavida-cfg',JSON.stringify({sound:false,music:false}));
  window.Audio=class{constructor(src){this.src=src;this.currentTime=0;this.paused=true;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}addEventListener(){}removeEventListener(){}load(){}};
 });
 const url='http://127.0.0.1:'+server.address().port;
 await p.goto(url);await p.locator('.react-home').waitFor();
 assert.equal(await p.locator('.react-sidebar button').filter({hasText:'Social',exact:true}).count(),1);
 await p.evaluate(()=>{S.pendingMode='classic';S.pendingTrainer='red';newRun('bulbasaur');render();});
 assert.equal(await p.locator('.react-sidebar button').filter({hasText:'Social',exact:true}).count(),0);
 await p.evaluate(()=>{window.savedAudio=musAudio;musAudio.currentTime=42;});
 for(const action of ['ACT.dex()','ACT.journal("history")','ACT.journal("achievements")','ACT.subBack()']){
  await p.evaluate(action=>{(0,eval)(action);render();},action);
  assert(await p.evaluate(()=>musAudio===savedAudio&&musAudio.currentTime===42),action+' keeps playback');
 }
 await p.evaluate(()=>{ACT.shop();render();});assert.equal(await p.evaluate(()=>musTrackId),'pokeMart');
 await p.evaluate(()=>{ACT.shopTab('tm');S.shopQuery='beam';S.shopPage=2;S.shopQty={'potion':7};render();});
 assert.equal(await p.evaluate(()=>S.shopTab),'tm','rerender keeps category');
 await p.locator('.react-sidebar button').filter({hasText:'Jornada',exact:true}).click();
 assert.equal(await p.evaluate(()=>S.shop),false);
 await p.evaluate(()=>{ACT.shop();render();});
 assert.deepEqual(await p.evaluate(()=>[S.shopTab,S.shopQuery,S.shopPage,Object.keys(S.shopQty).length]),['balls','',0,0]);
 await p.evaluate(()=>{ACT.shopTab('tm');ACT.shop();ACT.shop();render();});assert.equal(await p.evaluate(()=>S.shopTab),'balls');
 await p.evaluate(()=>{ACT.shop();ACT.center();render();});assert.equal(await p.evaluate(()=>musTrackId),'pokeCenter');
 await p.evaluate(()=>{ACT.centerExit();ACT.camp();render();});assert.notEqual(await p.evaluate(()=>musTrackId),'pokeCenter');
 await p.evaluate(()=>{ACT.campExit();render();});
 for(const mode of ['classic','permadeath']){
  await p.evaluate(mode=>{S.screen='hub';S.shop=false;S.pendingMode=mode;S.pendingTrainer='red';S.pendingTrainerName='Teste';newRun('bulbasaur');R.battle=4;R.journey.pending=null;persist();window.beforePreview=JSON.stringify(R,(key,value)=>key==='playTimeMs'?undefined:value);startBattle(false);render();},mode);
  assert.equal(await p.evaluate(()=>S.screen),'intro');
  assert.deepEqual(await p.evaluate(()=>JSON.parse(JSON.stringify(R,(key,value)=>key==='playTimeMs'?undefined:value))),await p.evaluate(()=>JSON.parse(beforePreview)),'preview must not mutate run');
  assert.equal(await p.evaluate(()=>!!JSON.parse(SAVE_STORAGE.getItem(SAVE_KEY)).inBattle),false);
  await p.locator('.react-back').click();assert.equal(await p.evaluate(()=>S.screen),'hub');
  assert.equal(await p.evaluate(()=>JSON.stringify(R,(key,value)=>key==='playTimeMs'?undefined:value)===beforePreview),true,'cancel must not mutate run');
  await p.evaluate(()=>{startBattle(false);render();persist();});
  await p.reload();await p.locator('.react-home').waitFor();
  await p.evaluate(()=>{continueSave();render();});assert.equal(await p.evaluate(()=>S.screen),'hub','reload preview safely');
  assert.equal(await p.evaluate(()=>R.battle),4);
  await p.evaluate(()=>{startBattle(false);render();});
  await p.locator('[data-act=beginTrainer]').click();assert.equal(await p.evaluate(()=>S.screen),'battle');
  assert.equal(await p.evaluate(()=>!!JSON.parse(SAVE_STORAGE.getItem(SAVE_KEY)).inBattle),true);
  await p.evaluate(()=>ACT.cancelTrainer());assert.equal(await p.evaluate(()=>S.screen),'battle','cannot cancel committed battle');
 }
 await p.evaluate(()=>{B=null;S.screen='hub';render();});
 assert.equal(await p.locator('.react-header').evaluate(el=>el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))),false);
 assert.equal(await p.evaluate(()=>{const input=document.createElement('input');document.body.appendChild(input);const result=input.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}));input.remove();return result;}),true);
 assert.deepEqual(errors,[]);console.log('PASS journey navigation, uninterrupted journal audio, shop reset, contextual tracks, gym preview/cancel/reload/commit in both modes and game input policy.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server.close();});
