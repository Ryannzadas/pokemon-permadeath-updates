'use strict';
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'../game');
const server=http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURI(req.url.split('?')[0]));fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.mp3')?'audio/mpeg':file.endsWith('.png')?'image/png':'application/octet-stream');res.end(data);});});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.BROWSER_PATH,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],missing=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE:',e.message);});page.on('response',r=>{if(r.status()===404)missing.push(r.url());});page.on('dialog',d=>d.accept());
 await page.addInitScript(()=>{localStorage.setItem('umavida-cfg',JSON.stringify({sound:false,music:false}));window.statusListener=null;window.desktopAPI={onStatus:f=>window.statusListener=f,status:async()=>({ok:true,value:{configured:false,update:{phase:'idle'}}}),downloadUpdate:async()=>({ok:true,value:{update:{phase:'downloading',version:'0.3.3',percent:5}}}),installUpdate:async()=>({ok:true,value:{update:{phase:'installing'}}}),storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>{if(window.failSave)throw Error('Disk failure');localStorage.setItem(k,v);},removeItem:k=>localStorage.removeItem(k)}};});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof window.rContinueChoice==='function');assert.deepEqual(errors,[]);

 await page.evaluate(()=>{ModeSaveStore.select('classic');S={screen:'starter',pendingMode:'classic',pendingTrainer:'ethan',pendingTrainerName:'Teste'};newRun('eevee');R.battle=45;R.team[0]=mk('eevee',54);R.team[0].friendship=255;R.team[0].moves=['tackle','quick-attack'];recalc(R.team[0]);persist();ACT.summary('0');S.presentationSummaryTab='evolution';render();});
 assert(await page.locator('#app').textContent().then(x=>x.includes('Sylveon: amizade 160 + golpe Fada equipado + subir de nível')));
 await page.evaluate(()=>{ACT.relearn('0:charm');render();});
 assert.equal(await page.locator('[data-act="summaryEvolve"]').count(),0);
 await page.evaluate(()=>{levelUp(R.team[0],1,[]);persist();render();});
 assert.equal(await page.locator('[data-act="summaryEvolve"]').count(),1);
 assert.equal(await page.locator('[data-act="summaryEvolve"]').textContent(),'Evoluir para Sylveon');
 await page.reload();await page.locator('[data-act="cont"]').click();await page.evaluate(()=>{ACT.summary('0');S.presentationSummaryTab='evolution';render();});
 assert.equal(await page.locator('[data-act="summaryEvolve"]').textContent(),'Evoluir para Sylveon');
 // The actual animation may be canceled without losing the Eevee or its eligible level-up.
 await page.locator('[data-act="summaryEvolve"]').click();await page.locator('.evo .btn').click();await page.waitForFunction(()=>document.querySelector('.evo .btn')?.textContent==='Continuar');await page.locator('.evo .btn').click();await page.waitForFunction(()=>!EVOLVING);assert.equal(await page.evaluate(()=>R.team[0].sp),'eevee');
 await page.locator('[data-act="summaryEvolve"]').click();await page.waitForFunction(()=>document.querySelector('.evo-text')?.textContent.includes('evoluiu para Sylveon'),{timeout:25000});await page.locator('.evo .btn').click();await page.waitForFunction(()=>!EVOLVING);
 assert.equal(await page.evaluate(()=>R.team[0].sp),'sylveon');assert.deepEqual(await page.evaluate(()=>R.team[0].types),['fairy']);assert(await page.evaluate(()=>META.caught.includes('sylveon')));assert.equal(await page.evaluate(()=>R.team[0].sylveonLevelReady),undefined);
 assert(await page.locator('.summary-identity .tp').textContent().then(x=>x==='Fada'));
 assert(await page.locator('.summary-identity img').evaluate(e=>e.complete&&e.naturalWidth>0));
 for(const width of [1280,720,360]){await page.setViewportSize({width,height:850});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:path.resolve(__dirname,'../../sylveon-summary.png')});
 await page.reload();await page.locator('[data-act="cont"]').click();assert.equal(await page.evaluate(()=>R.team[0].sp),'sylveon');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('PASS Sylveon UI: equipped-move requirement, level gate, priority, pending evolution reload, real cancellation/evolution animation, Fairy summary/sprite, Pokédex, resulting save reload and responsive widths; no page errors or missing assets.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();server.close();});
