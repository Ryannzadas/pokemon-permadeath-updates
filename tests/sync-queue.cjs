'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),path=require('node:path');
const {SaveStore}=require('../desktop/store.cjs');
const source=fs.readFileSync(require.resolve('../desktop/main.cjs'),'utf8'),fn=source.slice(source.indexOf('async function sync('),source.indexOf('async function requireTitle('));
(async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sync-queue-'));try{
 const store=new SaveStore(directory);store.select('a');store.write('umavida-meta-v1',JSON.stringify({name:'before'}));let remote=null,queued=0,putCount=0;
 const c={user:{uid:'a'},configured:()=>true,busy:false,syncing:false,conflict:false,syncError:'',message:'',generation:0,store,status:()=>({dirty:store.data.dirty,syncError:c.syncError}),notify(){},token:async()=> 't',errorMessage:e=>e.message,scheduleSync(){queued++;},structuredClone,cloud:{get:async()=>remote,put:async(uid,t,slots,version)=>{putCount++;assert.equal(version,remote?.version||null);if(putCount===1)store.write('umavida-meta-v1',JSON.stringify({name:'during upload'}));remote={slots,version:'v'+putCount};return remote.version;}},win:{reload(){throw Error('must not reload during upload');}}};
 vm.createContext(c);vm.runInContext(fn,c);await c.sync(false);assert.equal(store.data.dirty,true);assert.equal(queued,1);assert.equal(store.data.cloudVersion,'v1');
 await c.sync(false);assert.equal(store.data.dirty,false);assert.equal(putCount,2);assert.equal(JSON.parse(remote.slots['umavida-meta-v1']).name,'during upload');assert.equal(c.syncError,'');
 store.write('umavida-meta-v1',JSON.stringify({name:'local safe'}));c.cloud.get=async()=>{throw Error('cloud denied');};await c.sync(false);assert.equal(c.syncError,'cloud denied');assert.equal(store.data.dirty,true);assert.equal(queued,1);assert.equal(JSON.parse(store.data.slots['umavida-meta-v1']).name,'local safe');

 // An invalid request must remain an error, not create conflict choices.
 c.cloud.get=async()=>{throw Object.assign(Error('invalid request'),{status:400,code:'INVALID_ARGUMENT',versionConflict:false});};await c.sync(true);assert.equal(c.conflict,false);assert.equal(c.syncError,'invalid request');
 // A failed version precondition is re-read before exposing a real conflict.
 remote={slots:{'umavida-meta-v1':JSON.stringify({name:'before local edit'})},version:store.data.cloudVersion};c.cloud.get=async()=>remote;
 c.cloud.put=async()=>{remote={slots:{'umavida-meta-v1':JSON.stringify({name:'other device'})},version:'other'};throw Object.assign(Error('precondition'),{versionConflict:true});};
 await c.sync(true);assert.equal(c.conflict,true);assert.equal(c.syncError,'');assert.equal(store.data.dirty,true);assert.equal(JSON.parse(store.data.slots['umavida-meta-v1']).name,'local safe');
 // A completed write with a lost response is reconciled without a false conflict.
 c.conflict=false;remote={slots:structuredClone(store.data.slots),version:'confirmed'};await c.sync(true);assert.equal(c.conflict,false);assert.equal(store.data.dirty,false);assert.equal(store.data.cloudVersion,'confirmed');
 // Deletion on the server does not silently recreate/overwrite an old cloud save.
 store.write('umavida-meta-v1',JSON.stringify({name:'keep me'}));remote=null;await c.sync(true);assert.equal(c.conflict,true);assert.equal(store.data.dirty,true);
 c.conflict=false;store.data.cloudVersion=null;c.cloud.put=async()=>{remote={slots:structuredClone(store.data.slots),version:'committed'};throw Object.assign(Error('precondition'),{versionConflict:true});};await c.sync(true);assert.equal(c.conflict,false);assert.equal(store.data.dirty,false);assert.equal(store.data.cloudVersion,'committed');
 // A failed operation from a previous login must not affect the new account.
 c.cloud.get=async()=>{c.generation++;throw Error('old account');};await c.sync(true);assert.equal(c.syncError,'');
 console.log('PASS sync: change during upload is queued and sent, revision/version preserved, failures keep local save and show error without tight retries.');
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
