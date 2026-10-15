'use strict';
const {cleanSlots}=require('./store.cjs');
class CloudError extends Error { constructor(message,status,code=''){super(message);this.status=status;this.code=code;}
  get versionConflict(){return ['ABORTED','ALREADY_EXISTS'].includes(this.code)||this.status===409||this.status===412||(this.code==='FAILED_PRECONDITION'&&/precondition|version|update.?time|document.*(exist|changed)/i.test(this.message));} }
async function request(url,options={}) {
  const response=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new CloudError(data.error?.message || 'Falha no serviço de nuvem.',response.status,data.error?.status||'');
  return data;
}
class FirebaseCloud {
  constructor(config){this.config=config;}
  async identify(idToken){
    const data=await request('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(this.config.apiKey),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken})});
    const u=data.users?.[0];
    const providers=(u?.providerUserInfo||[]).map(p=>p.providerId);
    if(!u?.localId || u.disabled || !providers.some(p=>p==='google.com'||p==='password'))throw new Error('Entre com uma conta válida.');
    if(!u.emailVerified)throw new Error('Confirme seu e-mail antes de entrar no jogo.');
    return {uid:u.localId,email:u.email||'',name:u.displayName||u.email||'Jogador',emailVerified:true,providers};
  }
  async refresh(refreshToken){
    return request('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(this.config.apiKey),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:refreshToken}).toString()});
  }
  document(uid){return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(this.config.projectId)}/databases/(default)/documents/players/${encodeURIComponent(uid)}`;}
  async get(uid,token){
    try{const doc=await request(this.document(uid),{headers:{Authorization:'Bearer '+token}});return {slots:cleanSlots(JSON.parse(doc.fields.payload.stringValue)),version:doc.updateTime};}
    catch(e){if(e.status===404)return null;throw e;}
  }
  async put(uid,token,slots,version){
    const url=new URL(this.document(uid));
    // Optimistic concurrency prevents silent overwrites from another device.
    if(version)url.searchParams.set('currentDocument.updateTime',version);else url.searchParams.set('currentDocument.exists','false');
    const doc=await request(url,{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({fields:{payload:{stringValue:JSON.stringify(cleanSlots(slots))},schema:{integerValue:'1'}}})});
    return doc.updateTime;
  }
}
module.exports={FirebaseCloud,CloudError};
