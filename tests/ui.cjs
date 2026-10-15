const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||undefined,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('[data-act="start"]').click();
 await page.locator('[data-act="pickTrainer"][data-v="ethan"]').click();
 const categories=await page.locator('[data-act="starterCategory"]').evaluateAll(a=>a.map(n=>n.dataset.v));
 for(const width of [1280,720,360]){
  await page.setViewportSize({width,height:900});
  for(const id of categories){
   await page.locator(`[data-act="starterCategory"][data-v="${id}"]`).click();
   const layout=await page.locator('.starter-card').evaluateAll(cards=>cards.map(n=>{
    const r=n.getBoundingClientRect(),b=n.querySelector('[data-act="pickStarter"]').getBoundingClientRect(),img=n.querySelector('.art img');
    return {x:r.x,y:r.y,w:r.width,h:r.height,button:b.y+b.height,imgW:img.getBoundingClientRect().width,loaded:img.complete&&img.naturalWidth>0};
   }));
   assert(layout.length);for(const r of layout){assert(r.x>=0&&r.x+r.w<=width+1);assert.equal(r.imgW,96);}
   for(const a of layout)for(const b of layout)if(Math.abs(a.y-b.y)<1){assert(Math.abs(a.w-b.w)<1);assert(Math.abs(a.button-b.button)<1);}
  }
 }
 await page.setViewportSize({width:1280,height:900});
 await page.locator('[data-act="starterCategory"][data-v="kanto"]').click();
 await page.screenshot({path:require('node:path').resolve(__dirname,'../../starter-layout-030.png'),fullPage:true});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS browser UI: all starter categories aligned at 1280/720/360px, no horizontal overflow or JavaScript errors');
})().catch(e=>{console.error(e);process.exitCode=1});
