"use strict";
const {operations}=require('./operations.cjs');
// Limits stay in memory: no database write for each poll. One Render instance.
function createHandler({service,verifyToken,now=()=>Date.now(),logger=console}){
 const limits=new Map();
 function reply(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
 return async(req,res)=>{
  if(req.method==='GET'&&req.url==='/health')return reply(res,200,{ok:true,service:'pokemon-social'});
  if(req.url!=='/social')return reply(res,404,{ok:false,error:'Rota inválida.'});
  if(req.method!=='POST')return reply(res,405,{ok:false,error:'Método inválido.'});
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(res,415,{ok:false,error:'Envie JSON.'});
  if(Number(req.headers['content-length']||0)>40000)return reply(res,413,{ok:false,error:'Pedido muito grande.'});
  const bearer=/^Bearer (.+)$/.exec(req.headers.authorization||'')?.[1];
  if(!bearer)return reply(res,401,{ok:false,error:'Entre na sua conta.'});
  let account;
  try{account=await verifyToken(bearer);}catch{return reply(res,401,{ok:false,error:'Sessão expirada. Entre novamente.'});}
  if(!account.email_verified)return reply(res,403,{ok:false,error:'Confirme seu e-mail.'});
  const minute=Math.floor(now()/60000);
  for(const [uid,x]of limits)if(x.minute!==minute)limits.delete(uid);
  const old=limits.get(account.uid),count=(old?.count||0)+1;
  if(count>120)return reply(res,429,{ok:false,error:'Muitos pedidos. Aguarde um minuto.'});
  limits.set(account.uid,{minute,count});
  let body;
  try{
   let length=0,chunks=[];
   for await(const chunk of req){length+=chunk.length;if(length>40000){reply(res,413,{ok:false,error:'Pedido muito grande.'});return;}chunks.push(chunk);}
   body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }catch{return reply(res,400,{ok:false,error:'JSON inválido.'});}
  if(!body||!operations.has(body.op)||!body.arg||typeof body.arg!=='object'||Array.isArray(body.arg))return reply(res,400,{ok:false,error:'Pedido inválido.'});
  try{reply(res,200,{ok:true,value:await service.call(account.uid,body.op,body.arg)});}
  catch(e){const infrastructure=typeof e.code==='number'||e.code==='RESOURCE_EXHAUSTED';logger.error('social request failed',e.code||e.name,'operation='+body.op,infrastructure?String(e.details||e.message||'').replace(/\s+/g,' ').slice(0,1000):e.name);reply(res,infrastructure?503:400,{ok:false,error:infrastructure?'Serviço temporariamente indisponível. Tente novamente mais tarde.':e.message});}
 };
}
module.exports={createHandler};
