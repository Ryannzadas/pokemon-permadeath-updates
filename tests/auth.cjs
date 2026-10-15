'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {openGoogleLogin}=require('../desktop/login.cjs');
const {FirebaseCloud}=require('../desktop/cloud.cjs');
async function loopback(cancel){
 let resolve;const opened=new Promise(r=>resolve=r);const done=openGoogleLogin({apiKey:'test'},resolve,{mode:'link',expectedUid:'original'});const url=new URL(await opened),origin=url.origin,state=url.searchParams.get('state');
 const page=await fetch(url);assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/default-src 'none'/);assert.match(await page.text(),/Criar conta/);
 assert.equal((await fetch(origin+'/client.js?state=bad')).status,404);
 const post=(body,site=origin,path='/complete')=>fetch(origin+path,{method:'POST',headers:{Origin:site,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await post({state,idToken:'x',refreshToken:'y'},'https://bad.example')).status,404);
 assert.equal((await post({state:'bad',idToken:'x',refreshToken:'y'})).status,400);
 assert.equal((await post({state})).status,400);
 assert.equal((await post({state,idToken:'x',refreshToken:'y'},origin,cancel?'/cancel':'/complete')).status,200);
 assert.deepEqual(await done,cancel?{cancelled:true}:{idToken:'x',refreshToken:'y'});
}
async function identity(){const original=global.fetch;try{for(const [provider,verified,disabled,valid] of [['password',true,false,true],['google.com',true,false,true],['password',false,false,false],['google.com',true,true,false],['anonymous',true,false,false]]){global.fetch=async()=>({ok:true,json:async()=>({users:[{localId:'original',emailVerified:verified,disabled,providerUserInfo:[{providerId:provider}]}]})});const p=new FirebaseCloud({apiKey:'test'}).identify('token');if(valid)assert.equal((await p).uid,'original');else await assert.rejects(p);}}finally{global.fetch=original;}}
async function gate(result,identityUid='original',mode='link'){
 const source=fs.readFileSync(require.resolve('../desktop/main.cjs'),'utf8');const fn=source.slice(source.indexOf('async function login('),source.indexOf('async function logout('));let selects=0,reloads=0;
 const c={requireTitle:async()=>{},configured:()=>true,safeStorage:{isEncryptionAvailable:()=>true},user:{uid:'original'},busy:false,message:'',notify(){},status:()=>({busy:c.busy}),openGoogleLogin:async()=>result,config:{},shell:{openExternal(){}},cloud:{identify:async()=>({uid:identityUid}),refresh:async()=>({user_id:identityUid,id_token:'t',refresh_token:'r',expires_in:3600})},store:{select(){selects++}},generation:0,saveCredentials(){},conflict:false,sync:async()=>{},win:{reload(){reloads++}}};vm.createContext(c);vm.runInContext(fn,c);let error,output;try{output=await c.login(mode)}catch(e){error=e}return {selects,reloads,error,output,busy:c.busy};
}
(async()=>{await loopback(true);await loopback(false);await identity();let r=await gate({cancelled:true});assert.equal(r.output.busy,false);assert.equal(r.reloads,0);r=await gate({idToken:'t',refreshToken:'r'});assert.equal(r.selects,0);assert.equal(r.reloads,1);assert(!r.error);r=await gate({idToken:'t',refreshToken:'r'},'other');assert(r.error);assert.equal(r.selects,0);assert.equal(r.reloads,0);assert.equal(r.busy,false);console.log('PASS auth: loopback state/origin, cancellation, verified providers and same-UID linking guards');})().catch(e=>{console.error(e);process.exitCode=1});
