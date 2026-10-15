'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {FirebaseCloud,CloudError}=require('../desktop/cloud.cjs');
const source=fs.readFileSync(require.resolve('../desktop/main.cjs'),'utf8');
const c={};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function errorMessage('),source.indexOf('function saveCredentials(')),c);
(async()=>{const original=global.fetch;try{
 const cloud=new FirebaseCloud({projectId:'test-project'});
 let request;
 global.fetch=async(url,options)=>{request={url:new URL(url),options};return {ok:true,json:async()=>({updateTime:'2026-10-10T16:00:00.000001Z'})};};
 await cloud.put('owner','token',{'umavida-meta-v1':'{}'},'2026-10-09T20:05:06.296030Z');assert.equal(request.url.searchParams.get('currentDocument.updateTime'),'2026-10-09T20:05:06.296030Z');assert.equal(request.url.searchParams.has('currentDocument.exists'),false);assert.deepEqual(JSON.parse(request.options.body),{fields:{payload:{stringValue:'{"umavida-meta-v1":"{}"}'},schema:{integerValue:'1'}}});
 await cloud.put('owner','token',{'umavida-meta-v1':'{}'},null);assert.equal(request.url.searchParams.get('currentDocument.exists'),'false');
 for(const [status,code,message,conflict] of [[400,'INVALID_ARGUMENT','Invalid input',false],[400,'FAILED_PRECONDITION','The document version does not match',true],[400,'FAILED_PRECONDITION','The query requires an index',false],[409,'ABORTED','Conflict',true],[403,'PERMISSION_DENIED','Denied',false],[429,'RESOURCE_EXHAUSTED','Quota',false]]){
 global.fetch=async()=>({ok:false,status,json:async()=>({error:{status:code,message}})});await assert.rejects(cloud.put('owner','token',{},null),e=>e instanceof CloudError&&e.code===code&&e.versionConflict===conflict);
 const text=c.errorMessage(new CloudError(message,status,code));assert(!text.includes('progresso na nuvem mudou'));if(code==='INVALID_ARGUMENT')assert(text.includes(code));if(status===429)assert(text.includes('limite'));
 }
 console.log('PASS cloud REST preconditions, typed errors, invalid input/index failures never mistaken for version conflicts, permission/quota messages.');
 }finally{global.fetch=original;}})().catch(e=>{console.error(e);process.exitCode=1;});
