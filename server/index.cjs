'use strict';
const {onRequest}=require('firebase-functions/v2/https'),{initializeApp}=require('firebase-admin/app'),{getAuth}=require('firebase-admin/auth'),{getFirestore}=require('firebase-admin/firestore');
const {SocialService}=require('./social-service.cjs'),{FirestoreRepository}=require('./repository.cjs');
initializeApp();const db=getFirestore(),service=new SocialService(new FirestoreRepository(db));
exports.social=onRequest({region:'southamerica-east1',memory:'512MiB',timeoutSeconds:30,maxInstances:10,cors:false},async(req,res)=>{
 res.set('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Método inválido.'});
 try{if(Number(req.headers['content-length']||0)>40000)return res.status(413).json({error:'Pedido muito grande.'});const token=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1];if(!token)return res.status(401).json({error:'Entre na sua conta.'});const account=await getAuth().verifyIdToken(token,true);if(!account.email_verified)return res.status(403).json({error:'Confirme seu e-mail.'});
  // An account may submit up to 120 requests/minute; never trust a renderer-supplied uid.
  await db.runTransaction(async tx=>{const ref=db.doc('socialLimits/'+account.uid),snapshot=await tx.get(ref),old=snapshot.data(),minute=Math.floor(Date.now()/60000),count=old?.minute===minute?old.count+1:1;if(count>120)throw Error('Muitos pedidos. Aguarde um minuto.');tx.set(ref,{minute,count});});
  const value=await service.call(account.uid,req.body?.op,req.body?.arg);res.json({ok:true,value});
 }catch(e){console.error('social request failed',e.code||e.name);res.status(e.code?.startsWith('auth/')?401:400).json({ok:false,error:e.code?.startsWith('auth/')?'Sessão expirada. Entre novamente.':e.message});}
});
