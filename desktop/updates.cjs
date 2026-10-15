'use strict';
function createUpdateController({updater,onChange,currentVersion,enabled=true}) {
  let state={phase:'idle',currentVersion,version:null,percent:0,message:'Verifique se há uma nova versão.'};
  const set=patch=>{state={...state,...patch};onChange();};
  const fail=error=>set({phase:'error',message:/404|No published|No releases|Cannot find latest|ERR_UPDATER_LATEST_VERSION_NOT_FOUND/i.test(error?.message||'')?'Ainda não há uma versão publicada para atualização.':'Não foi possível atualizar. Confira sua conexão e tente novamente.'});
  updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowDowngrade=false;updater.allowPrerelease=false;
  updater.on('checking-for-update',()=>set({phase:'checking',message:'Procurando atualizações…'}));
  updater.on('update-available',info=>set({phase:'available',version:info.version,percent:0,message:`Versão ${info.version} disponível.`}));
  updater.on('update-not-available',()=>set({phase:'current',message:'Você já está na versão mais recente.'}));
  updater.on('download-progress',info=>set({phase:'downloading',percent:Math.min(100,Math.max(0,Math.round(info.percent))),message:'Baixando atualização…'}));
  updater.on('update-downloaded',info=>set({phase:'ready',version:info.version,percent:100,message:'Atualização pronta. Volte à tela inicial para instalar.'}));
  updater.on('error',fail);
  return {
    status:()=>({...state}),
    check(){if(!enabled){set({phase:'error',message:'Use a versão instalada no Windows para atualizar.'});return;}if(['checking','downloading','ready','installing'].includes(state.phase))return;set({phase:'checking',message:'Procurando atualizações…'});Promise.resolve().then(()=>updater.checkForUpdates()).catch(fail);},
    download(){if(!enabled||state.phase!=='available')return;set({phase:'downloading',percent:0,message:'Baixando atualização…'});Promise.resolve().then(()=>updater.downloadUpdate()).catch(fail);},
    install(){if(!enabled||state.phase!=='ready')throw new Error('Baixe a atualização antes de instalar.');set({phase:'installing',message:'Reiniciando para instalar…'});updater.quitAndInstall(false,true);}
  };
}
module.exports={createUpdateController};
