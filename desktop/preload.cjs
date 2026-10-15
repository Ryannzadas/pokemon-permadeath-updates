'use strict';
const {contextBridge,ipcRenderer}=require('electron');
let slots=ipcRenderer.sendSync('store:bootstrap');
const allowed=new Set(['umavida-save-v1','umavida-meta-v1','umavida-cfg']);
contextBridge.exposeInMainWorld('desktopAPI',{
  storage:{
    getItem:key=>allowed.has(key)?slots[key]??null:null,
    setItem:(key,value)=>{if(!allowed.has(key))throw new Error('Chave inválida.');const response=ipcRenderer.sendSync('store:write',{key,value:String(value)});if(!response?.ok)throw new Error(response?.error||'Falha ao salvar.');slots[key]=String(value);},
    removeItem:key=>{if(!allowed.has(key))return;const response=ipcRenderer.sendSync('store:write',{key,value:null});if(!response?.ok)throw new Error(response?.error||'Falha ao salvar.');delete slots[key];}
  },
  checkUpdates:()=>ipcRenderer.invoke('update:check'),
  downloadUpdate:()=>ipcRenderer.invoke('update:download'),
  installUpdate:()=>ipcRenderer.invoke('update:install'),
  configureMultiplayer:url=>ipcRenderer.invoke('social:configure',url),
  social:(op,arg)=>ipcRenderer.invoke('social:request',op,arg),
  status:()=>ipcRenderer.invoke('account:status'),
  signup:()=>ipcRenderer.invoke('account:signup'),
  resetPassword:()=>ipcRenderer.invoke('account:reset-password'),
  linkPassword:()=>ipcRenderer.invoke('account:link-password'),
  login:()=>ipcRenderer.invoke('account:login'),
  logout:()=>ipcRenderer.invoke('account:logout'),
  sync:()=>ipcRenderer.invoke('account:sync'),
  resolve:choice=>ipcRenderer.invoke('account:resolve',choice),
  importGuest:()=>ipcRenderer.invoke('account:import-guest'),
  exportSave:()=>ipcRenderer.invoke('account:export'),
  importSave:()=>ipcRenderer.invoke('account:import'),
  configure:()=>ipcRenderer.invoke('account:configure'),
  onStatus:callback=>{const listener=(_event,value)=>callback(value);ipcRenderer.on('account:changed',listener);return()=>ipcRenderer.removeListener('account:changed',listener);}
});
