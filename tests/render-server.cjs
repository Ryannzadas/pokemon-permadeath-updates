'use strict';
const assert=require('node:assert/strict'),http=require('node:http');
const {createHandler}=require('../server/http-handler.cjs'),{SocialService}=require('../server/social-service.cjs'),{MemoryRepository}=require('../server/repository.cjs');
const {validateServerURL,socialRequest}=require('../desktop/social.cjs');
(async()=>{
 for(const url of ['http://a.onrender.com','https://a.onrender.com.evil.test','https://user:pass@a.onrender.com','https://a.onrender.com/?x=1','https://127.0.0.1','https://a.onrender.com:444','https://a.onrender.com/other'])assert.throws(()=>validateServerURL(url));
 assert.equal(validateServerURL('https://league-test.onrender.com/social'),'https://league-test.onrender.com');assert.equal(validateServerURL(''),'');
 const original=global.fetch;
 try{let called=0;global.fetch=async(url,opts)=>{called++;assert.equal(url,'https://league-test.onrender.com/social');assert.equal(opts.redirect,'error');assert.equal(opts.headers.Authorization,'Bearer protected-token');return {ok:true,status:200,json:async()=>({ok:true,value:{id:'ok'}})};};await assert.rejects(socialRequest({},'protected-token','hello',{},''),/Configure/);assert.equal(called,0);assert.deepEqual(await socialRequest({},'protected-token','hello',{},'https://league-test.onrender.com'),{id:'ok'});}
 finally{global.fetch=original;}
 const service=new SocialService(new MemoryRepository());let time=1000;
 const server=http.createServer(createHandler({service,now:()=>time,logger:{error(){}},verifyToken:async token=>{if(token==='bad')throw Error('invalid');return {uid:token,email_verified:token!=='unverified'};}}));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const root='http://127.0.0.1:'+server.address().port;
 const post=(token,body={op:'hello',arg:{}},headers={})=>fetch(root+'/social',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},body:typeof body==='string'?body:JSON.stringify(body)});
 try{
  assert.equal((await fetch(root+'/health')).status,200);assert.equal((await fetch(root+'/social')).status,405);
  assert.equal((await post(null)).status,401);assert.equal((await post('bad')).status,401);assert.equal((await post('unverified')).status,403);
  assert.equal((await post('a','bad json')).status,400);assert.equal((await post('a',{op:'not-supported',arg:{}})).status,400);
  assert.equal((await post('a',{op:'hello',arg:{}},{'Content-Type':'text/plain'})).status,415);
  assert.equal((await post('a','x'.repeat(40001))).status,413);
  const a=await (await post('a',{op:'hello',arg:{name:'A',uid:'b'}})).json(),b=await (await post('b',{op:'hello',arg:{name:'B'}})).json();assert.notEqual(a.value.id,b.value.id);
  await post('a',{op:'request',arg:{id:b.value.id}});const incoming=await(await post('b',{op:'list',arg:{}})).json();assert.equal(incoming.value.requests[0].fromProfile.name,'A');
  await post('b',{op:'respond',arg:{id:incoming.value.requests[0].id,accept:true}});assert.equal((await(await post('a',{op:'list',arg:{}})).json()).value.friends.length,1);
  for(let i=0;i<120;i++)assert.equal((await post('rate',{op:'hello',arg:{}})).status,200);
  assert.equal((await post('rate')).status,429);time+=60000;assert.equal((await post('rate')).status,200);
  // Polling in the same presence window does not rewrite the profile document.
  let writes=0,clock=500000;const repo=new MemoryRepository(),transact=repo.transact.bind(repo);repo.transact=fn=>transact(t=>{const set=t.set;t.set=(p,v)=>{writes++;set(p,v);};return fn(t);});const thin=new SocialService(repo,{now:()=>clock});await thin.call('poller','hello');writes=0;await thin.call('poller','list');assert.equal(writes,0);clock+=45000;await thin.call('poller','list');assert.equal(writes,1);
  console.log('PASS Render HTTP: verified auth, identity isolation, friend flow, rate/body limits, URL allowlist, no redirects, presence write throttling.');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
