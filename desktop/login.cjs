'use strict';
const http=require('node:http');
const crypto=require('node:crypto');
const fs=require('node:fs'),path=require('node:path');
function openGoogleLogin(config,openBrowser,options={}) {
  return new Promise((resolve,reject)=>{
    const state=crypto.randomBytes(32).toString('hex');
    let origin,timer,settled=false;
    const finish=(error,data)=>{if(settled)return;settled=true;clearTimeout(timer);server.close();error?reject(error):resolve(data);};
    const settings={config,state,mode:options.mode||'login',expectedUid:options.expectedUid||null,email:options.email||''};
    const page=fs.readFileSync(path.join(__dirname,'auth-page.html'),'utf8').replace('__CLIENT_URL__','/client.js?state='+state);
    const client='const SETTINGS='+JSON.stringify(settings)+';\n'+fs.readFileSync(path.join(__dirname,'auth-client.js'),'utf8');
    const server=http.createServer(async(req,res)=>{
      res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
      if(!origin || req.headers.host!==new URL(origin).host){res.writeHead(403).end();return;}
      const url=new URL(req.url,origin);
      if(req.method==='GET' && url.searchParams.get('state')===state && (url.pathname==='/auth'||url.pathname==='/client.js')){
        res.setHeader('Content-Type',url.pathname==='/auth'?'text/html; charset=utf-8':'text/javascript; charset=utf-8');
        res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' https://www.gstatic.com https://apis.google.com; style-src 'unsafe-inline'; connect-src 'self' https://www.gstatic.com https://*.googleapis.com https://*.firebaseapp.com https://*.google.com; frame-src https://*.firebaseapp.com; img-src https://*.googleusercontent.com; base-uri 'none'; form-action 'none'");
        res.end(url.pathname==='/auth'?page:client);return;
      }
      if(req.method==='POST' && ['/complete','/cancel'].includes(url.pathname) && req.headers.origin===origin && req.headers['content-type']==='application/json'){
        try{
          let body='';for await(const chunk of req){body+=chunk;if(body.length>24000)throw new Error('Resposta inválida.');}
          const data=JSON.parse(body);
          if(data.state!==state)throw new Error('Resposta inválida.');
          if(url.pathname==='/cancel'){res.setHeader('Content-Type','application/json');res.end('{"ok":true}');finish(null,{cancelled:true});return;}
          if(typeof data.idToken!=='string' || typeof data.refreshToken!=='string' || data.idToken.length>12000 || data.refreshToken.length>8000)throw new Error('Resposta inválida.');
          res.setHeader('Content-Type','application/json');res.end('{"ok":true}');finish(null,{idToken:data.idToken,refreshToken:data.refreshToken});
        }catch{res.writeHead(400).end();}return;
      }
      res.writeHead(404).end();
    });
    server.on('error',error=>finish(error));
    server.listen(0,'127.0.0.1',()=>{
      origin='http://127.0.0.1:'+server.address().port;
      timer=setTimeout(()=>finish(new Error('O login expirou. Clique em Entrar novamente.')),900000);
      Promise.resolve(openBrowser(origin+'/auth?state='+state)).catch(error=>finish(error));
    });
  });
}
module.exports={openGoogleLogin};
