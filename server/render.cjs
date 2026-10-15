"use strict";
const fs=require('node:fs'),http=require('node:http');
const {initializeApp,cert}=require('firebase-admin/app'),{getAuth}=require('firebase-admin/auth'),{getFirestore}=require('firebase-admin/firestore');
const {SocialService}=require('./social-service.cjs'),{FirestoreRepository}=require('./repository.cjs'),{createHandler}=require('./http-handler.cjs');
function start(){
 const projectId=process.env.FIREBASE_PROJECT_ID||'pokemon-permadeath';
 const file=process.env.GOOGLE_APPLICATION_CREDENTIALS||'/etc/secrets/firebase-service-account.json';
 let credential;
 try{credential=JSON.parse(fs.readFileSync(file,'utf8'));}catch{throw Error('Adicione o Secret File firebase-service-account.json no Render.');}
 if(credential.project_id!==projectId)throw Error('A conta de serviço pertence a outro projeto Firebase.');
 initializeApp({projectId,credential:cert(credential)});
 const service=new SocialService(new FirestoreRepository(getFirestore()));
 const server=http.createServer(createHandler({service,verifyToken:token=>getAuth().verifyIdToken(token,true)}));
 server.requestTimeout=30000;server.headersTimeout=15000;
 server.listen(Number(process.env.PORT||10000),'0.0.0.0',()=>console.log('Multiplayer pronto.'));
 return server;
}
if(require.main===module)try{start();}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={start};
