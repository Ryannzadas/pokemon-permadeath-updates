'use strict';
const {app,BrowserWindow,ipcMain,protocol,net,session,shell,safeStorage,dialog,Menu}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {SaveStore,cleanSlots,atomicWrite}=require('./store.cjs');
const {FirebaseCloud}=require('./cloud.cjs');
const {socialRequest,validateServerURL}=require('./social.cjs');
const {openGoogleLogin}=require('./login.cjs');
const {createUpdateController}=require('./updates.cjs');
// Preserve the portable application's account and save directory.
app.setPath('userData',path.join(app.getPath('appData'),'pokemon-permadeath-visual-test'));
let updates;
protocol.registerSchemesAsPrivileged([{scheme:'game',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
const single=app.requestSingleInstanceLock();
if(!single)app.quit();
let win,store,config={},cloud,user=null,auth=null,busy=false,syncing=false,conflict=false,message='',syncTimer;
let generation=0,serverURL='',syncError='';
const home=()=>app.getPath('userData');
const credentialFile=()=>path.join(home(),'account.enc');
const configured=()=>!!(config.apiKey && config.projectId && config.authDomain && config.appId);
function validateConfig(c){
  if(!c || typeof c.apiKey!=='string' || !/^AIza[\w-]+$/.test(c.apiKey) || !/^[a-z][a-z0-9-]{4,62}$/.test(c.projectId||'') || c.authDomain!==c.projectId+'.firebaseapp.com' || typeof c.appId!=='string' || !c.appId.startsWith('1:'))throw new Error('Selecione o JSON de configuração Web do Firebase.');
  return {apiKey:c.apiKey,authDomain:c.authDomain,projectId:c.projectId,appId:c.appId};
}
function status(){return {syncError,multiplayerURL:serverURL,update:updates?.status(),configured:configured(),user,busy,syncing,conflict,dirty:store?.data.dirty||false,updatedAt:store?.data.updatedAt,message,canImportGuest:!!store?.read(null).slots['umavida-save-v1']};}
function notify(){if(win&&!win.isDestroyed())win.webContents.send('account:changed',status());}
function errorMessage(error){
  if(error.status===403)return 'A nuvem recusou o acesso. Confira as regras do Firestore.';
  if(error.status===401)return 'Sua sessão expirou. Saia da conta e entre novamente.';
  if(error.versionConflict)return 'O envio encontrou uma mudança na nuvem. Tente sincronizar novamente.';
  if(error.status===429 || error.code==='RESOURCE_EXHAUSTED')return 'O limite temporário da nuvem foi atingido. Seu progresso continua salvo neste PC. Tente mais tarde.';
  if(error.status>=500)return 'O serviço de nuvem está indisponível. Seu progresso continua salvo neste PC. Tente novamente.';
  if(error.status===400)return 'A nuvem recusou o envio'+(/^[A-Z_]+$/.test(error.code||'')?' ('+error.code+')':'')+'. Seu progresso continua salvo neste PC.';
  return error.message?.includes('fetch') || error.name==='TimeoutError' ? 'Sem conexão com a nuvem. O progresso está salvo neste computador.' : error.message||'Não foi possível concluir.';
}
function saveCredentials(){
  if(!safeStorage.isEncryptionAvailable())throw new Error('O Windows não disponibilizou a proteção das credenciais.');
  const encrypted=safeStorage.encryptString(JSON.stringify({projectId:config.projectId,user,refreshToken:auth.refreshToken}));
  // Never retain plaintext or backup refresh tokens.
  fs.mkdirSync(home(),{recursive:true});fs.writeFileSync(credentialFile()+'.tmp',encrypted,{mode:0o600});fs.renameSync(credentialFile()+'.tmp',credentialFile());
}
async function token(){
  if(!auth || !user)throw new Error('Entre na sua conta primeiro.');
  if(auth.expiresAt>Date.now()+60000)return auth.idToken;
  let data;try{data=await cloud.refresh(auth.refreshToken);}catch(error){
    if(error.status===400||error.status===401)throw new Error('Sua sessão precisa ser renovada. Volte à tela inicial, saia da conta e entre novamente com a mesma conta. Seu progresso local está preservado.');
    throw error;
  }
  if(data.user_id!==user.uid)throw new Error('A identidade da sessão não confere.');
  auth={idToken:data.id_token,refreshToken:data.refresh_token,expiresAt:Date.now()+Number(data.expires_in)*1000};saveCredentials();return auth.idToken;
}
function scheduleSync(){clearTimeout(syncTimer);if(user && !conflict)syncTimer=setTimeout(()=>sync(false).catch(()=>{}),1500);}
async function sync(allowPull=false){
  if(!user || !configured() || busy || syncing || conflict)return status();
  syncing=true;syncError='';notify();const epoch=generation;let completed=false;
  try{
    const idToken=await token(),remote=await cloud.get(user.uid,idToken);
    if(epoch!==generation)return status();
    const local=store.data;
    if(remote && remote.version!==local.cloudVersion && JSON.stringify(remote.slots)!==JSON.stringify(local.slots)){
      if(local.dirty || !allowPull){conflict=true;message='Há um progresso diferente na nuvem. Escolha qual manter na tela de título.';}
      else {store.replace(remote.slots,remote.version);message='Progresso recuperado da nuvem.';if(win)win.reload();}
    }else if(remote && JSON.stringify(remote.slots)===JSON.stringify(local.slots)){
      store.markSynced(remote.version,local.revision);message='Progresso sincronizado.';
    }else if(!remote && local.cloudVersion){
      conflict=true;message='O save da nuvem não está mais disponível. Escolha qual progresso manter na tela de título.';
    }else if(local.dirty){
      const revision=local.revision,slots=structuredClone(local.slots);
      const version=await cloud.put(user.uid,idToken,slots,remote?.version||null);
      if(epoch===generation){store.markSynced(version,revision);message='Progresso salvo na nuvem.';}
    }else message=remote?'Progresso sincronizado.':'Conta conectada. Seu próximo progresso será salvo na nuvem.';
    completed=true;
  }catch(error){
    if(epoch===generation){
      if(error.versionConflict){
        try{const remote=await cloud.get(user.uid,await token());
          if(epoch===generation){
            if(remote && JSON.stringify(remote.slots)===JSON.stringify(store.data.slots)){store.markSynced(remote.version,store.data.revision);message='Progresso sincronizado.';completed=true;}
            else {conflict=true;message='Há um progresso diferente na nuvem. Escolha qual manter na tela de título.';}
          }
        }catch(checkError){if(epoch===generation){syncError=errorMessage(checkError);message=syncError;}}
      }else {syncError=errorMessage(error);message=syncError;}
    }
  }
  finally{syncing=false;notify();if(completed&&epoch===generation&&user&&store.data.dirty&&!conflict)scheduleSync();}
  return status();
}
async function requireTitle(){
  if(busy || syncing)throw new Error('Aguarde a operação atual terminar.');
  const allowed=await win.webContents.executeJavaScript('Boolean(window.desktopCanManage && window.desktopCanManage())');
  if(!allowed)throw new Error('Volte à tela de título para gerenciar a conta.');
}
function register(name,fn){ipcMain.handle(name,async(event,...args)=>{assertSender(event);try{return {ok:true,value:await fn(...args)};}catch(error){message=errorMessage(error);notify();return {ok:false,error:message};}});}
function assertSender(event){if(event.sender!==win?.webContents || event.senderFrame!==win.webContents.mainFrame || (new URL(event.senderFrame.url).protocol!=='game:' || new URL(event.senderFrame.url).host!=='app'))throw new Error('Origem inválida.');}
async function login(mode='login'){
  await requireTitle();if(!configured())throw new Error('Configure seu projeto Firebase para ativar o login.');
  if(!safeStorage.isEncryptionAvailable())throw new Error('Não foi possível proteger a sessão neste computador.');
  const expectedUid=mode==='link'?user?.uid:null;
  if(mode==='link'&&!expectedUid)throw new Error('Entre com Google antes de adicionar uma senha.');
  let cancelled=false;
  busy=true;message='Conclua a operação de acesso no navegador.';notify();
  try{
    const result=await openGoogleLogin(config,url=>shell.openExternal(url),{mode,expectedUid,email:user?.email||''});
    if(result.cancelled){message='Operação de acesso encerrada.';cancelled=true;}else{
    const identity=await cloud.identify(result.idToken);
    if(expectedUid&&identity.uid!==expectedUid)throw new Error('A conta selecionada é diferente da conta do jogo.');
    const refreshed=await cloud.refresh(result.refreshToken);
    if(refreshed.user_id!==identity.uid)throw new Error('A identidade do login não confere.');
    if(mode!=='link')store.select(identity.uid);generation++;user=identity;
    auth={idToken:refreshed.id_token,refreshToken:refreshed.refresh_token,expiresAt:Date.now()+Number(refreshed.expires_in)*1000};saveCredentials();conflict=false;message='Conta conectada.';
    }
  }finally{busy=false;notify();}
  if(cancelled)return status();
  await sync(true);win.reload();return status();
}
async function logout(){await requireTitle();generation++;clearTimeout(syncTimer);user=null;auth=null;conflict=false;syncError='';fs.rmSync(credentialFile(),{force:true});store.select(null);message='Modo local. Seus saves por conta continuam preservados.';win.reload();notify();return status();}
async function resolveConflict(choice){
  await requireTitle();if(!user || !['local','cloud'].includes(choice))throw new Error('Escolha inválida.');
  const confirm=await dialog.showMessageBox(win,{type:'question',buttons:['Cancelar',choice==='local'?'Usar progresso deste PC':'Usar progresso da nuvem'],defaultId:0,cancelId:0,message:'Qual progresso você quer manter?',detail:'Uma cópia do save local será preservada antes da mudança.'});
  if(confirm.response!==1)return status();
  busy=true;notify();try{const t=await token(),remote=await cloud.get(user.uid,t);
    if(choice==='cloud'){if(!remote)throw new Error('Não existe save na nuvem.');store.replace(remote.slots,remote.version);}
    else {const v=await cloud.put(user.uid,t,store.data.slots,remote?.version||null);store.markSynced(v,store.data.revision);}
    conflict=false;syncError='';message='Progresso escolhido e sincronizado.';win.reload();
  }finally{busy=false;notify();}return status();
}
async function importSlots(slots){
  const result=await dialog.showMessageBox(win,{type:'question',buttons:['Cancelar','Importar'],defaultId:0,cancelId:0,message:'Substituir o progresso deste perfil?',detail:'O save atual será mantido como cópia de segurança.'});
  if(result.response!==1)return;
  store.replace(cleanSlots(slots),store.data.cloudVersion,true);scheduleSync();win.reload();
}
function createWindow(){
  win=new BrowserWindow({show:false,width:1080,height:850,minWidth:420,minHeight:600,backgroundColor:'#f5f2e9',title:'Pokemon Permadeath — Teste Visual',icon:path.join(app.getAppPath(),'game/assets/app-icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.webContents.on('will-attach-webview',event=>event.preventDefault());
  win.once('ready-to-show',()=>{win.maximize();win.show();});
  Menu.setApplicationMenu(null);win.loadURL('game://app/index.html');
}
app.whenReady().then(async()=>{
  store=new SaveStore(path.join(home(),'saves'));
  for(const file of [path.join(home(),'firebase-config.json'),path.join(app.getAppPath(),'firebase-config.json')])try{config=validateConfig(JSON.parse(fs.readFileSync(file,'utf8')));break;}catch{}
  cloud=new FirebaseCloud(config);
  for(const file of [path.join(home(),'multiplayer-config.json'),path.join(app.getAppPath(),'multiplayer-config.json')])try{const candidate=validateServerURL(JSON.parse(fs.readFileSync(file,'utf8')).url);if(candidate){serverURL=candidate;break;}}catch{}
  if(configured()&&safeStorage.isEncryptionAvailable()&&fs.existsSync(credentialFile()))try{
    const saved=JSON.parse(safeStorage.decryptString(fs.readFileSync(credentialFile())));
    if(saved.projectId===config.projectId){store.select(saved.user.uid);user=saved.user;auth={refreshToken:saved.refreshToken,expiresAt:0};await sync(true);}
  }catch{user=null;auth=null;store.select(null);message='Entre novamente para reconectar sua conta.';}
  const root=path.resolve(app.getAppPath(),'game');
  protocol.handle('game',req=>{
    const url=new URL(req.url);let file;try{file=path.resolve(root,'.'+decodeURIComponent(url.pathname));}catch{return new Response('Not found',{status:404});}
    if(url.host!=='app'||!file.startsWith(root+path.sep))return new Response('Not found',{status:404});
    return net.fetch(pathToFileURL(file).href);
  });
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  ipcMain.on('store:bootstrap',event=>{try{assertSender(event);event.returnValue=store.data.slots;}catch{event.returnValue={};}});
  ipcMain.on('store:write',(event,data)=>{try{assertSender(event);if(busy)throw new Error('Aguarde a conta conectar.');store.write(data.key,data.value);event.returnValue={ok:true};scheduleSync();notify();}catch(e){event.returnValue={ok:false,error:e.message};message=e.message;notify();}});
  register('account:status',status);register('account:login',()=>login());register('account:signup',()=>login('signup'));register('account:reset-password',()=>login('reset'));register('account:link-password',()=>login('link'));register('account:logout',logout);
  register('account:sync',async()=>{await requireTitle();return sync(true);});register('account:resolve',resolveConflict);
  register('account:import-guest',async()=>{await requireTitle();if(!user)throw new Error('Entre na conta primeiro.');await importSlots(store.read(null).slots);return status();});
  register('account:export',async()=>{await requireTitle();const result=await dialog.showSaveDialog(win,{defaultPath:'pokemon-save.json',filters:[{name:'Save',extensions:['json']}]});if(!result.canceled)fs.writeFileSync(result.filePath,JSON.stringify({schema:1,slots:store.data.slots},null,2));return status();});
  register('account:import',async()=>{await requireTitle();const result=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Save',extensions:['json']}]});if(!result.canceled){if(fs.statSync(result.filePaths[0]).size>700000)throw new Error('Save muito grande.');const data=JSON.parse(fs.readFileSync(result.filePaths[0],'utf8'));await importSlots(data.slots);}return status();});
  register('social:configure',async value=>{const next=validateServerURL(value);atomicWrite(path.join(home(),'multiplayer-config.json'),JSON.stringify({url:next}));serverURL=next;return {url:serverURL};});
  register('social:request',async(op,arg)=>{if(!user||!configured())throw new Error('Entre na sua conta para jogar online.');return socialRequest(config,await token(),op,arg,serverURL);});
  register('account:configure',async()=>{await requireTitle();if(user)throw new Error('Saia da conta antes de mudar o Firebase.');const result=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Configuração Firebase',extensions:['json']}]});if(!result.canceled){const c=validateConfig(JSON.parse(fs.readFileSync(result.filePaths[0],'utf8')));atomicWrite(path.join(home(),'firebase-config.json'),JSON.stringify(c));config=c;cloud=new FirebaseCloud(c);message='Firebase configurado. Você já pode entrar com Google.';notify();}return status();});
  updates=createUpdateController({updater:require('electron-updater').autoUpdater,onChange:notify,currentVersion:app.getVersion(),enabled:false});
  // Full screen for the game window (F11 or the game options); returns the resulting state.
  register('window:fullscreen',flag=>{if(typeof flag==='boolean'&&win)win.setFullScreen(flag);return !!win?.isFullScreen();});
  register('update:check',()=>{updates.check();return status();});
  register('update:download',()=>{updates.download();return status();});
  register('update:install',async()=>{
    await requireTitle();
    if(updates.status().phase!=='ready')throw new Error('Baixe a atualização antes de instalar.');
    if(user&&store.data.dirty&&!conflict)await sync(false);
    await requireTitle();
    if(conflict||(user&&store.data.dirty))throw new Error('Sincronize o progresso antes de instalar a atualização.');
    const saved=store.data.slots['umavida-save-v1'];
    if(saved&&JSON.parse(saved).inBattle)throw new Error('Conclua a batalha antes de atualizar.');
    busy=true;clearTimeout(syncTimer);notify();
    try{updates.install();}catch(e){busy=false;notify();throw e;}
    return status();
  });
  createWindow();setTimeout(()=>updates.check(),15000).unref();setInterval(()=>{if(user && store.data.dirty && !conflict)sync(false).catch(()=>{});},60000).unref();
}).catch(error=>{dialog.showErrorBox('Não foi possível abrir o jogo',error.message);app.quit();});
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});
app.on('window-all-closed',()=>app.quit());
