"use strict";
const operations=new Set(['hello','list','profile','request','respond','remove','block','invite','answerInvite','match','action','forfeit','createLeague','league','leagueInvite','leagueJoin','leagueTeam','leagueStart','leagueMatch','leagueEdit','leagueDelete']);
function validateServerURL(value){
 if(typeof value!=='string'||value.length>250)throw Error('Endereço do servidor inválido.');
 if(!value.trim())return '';
 let u;try{u=new URL(value.trim());}catch{throw Error('Cole o endereço HTTPS do Render.');}
 if(u.protocol!=='https:'||!/^([a-z0-9]+(?:-[a-z0-9]+)*)\.onrender\.com$/.test(u.hostname)||u.port||u.username||u.password||u.search||u.hash||!['/','/social'].includes(u.pathname))throw Error('Use um endereço https://nome.onrender.com do Render.');
 return u.origin;
}
async function socialRequest(config,token,op,arg={},serverURL=''){
 if(!operations.has(op)||!arg||JSON.stringify(arg).length>32000)throw Error('Pedido inválido.');
 const url=validateServerURL(serverURL);if(!url)throw Error('Configure o endereço do servidor em Conexão multiplayer.');
 let response;
 try{response=await fetch(url+'/social',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({op,arg}),redirect:'error',signal:AbortSignal.timeout(90000)});}
 catch(e){throw Error(e.name==='TimeoutError'?'O servidor está demorando para despertar. Aguarde e clique em Conectar.':'Não foi possível conectar ao servidor. Confira o endereço e sua conexão.');}
 const data=await response.json().catch(()=>null);
 if(response.status===404||!data)throw Error('O servidor ainda está iniciando ou não foi configurado. Aguarde e clique em Conectar.');
 if(!response.ok||!data.ok)throw Error(data.error||'Não foi possível conectar.');return data.value;
}
module.exports={socialRequest,operations,validateServerURL};
