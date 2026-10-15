(() => {
 'use strict';
 const root=document.documentElement;
 try{const storage=window.desktopAPI?.storage||localStorage;root.dataset.theme=JSON.parse(storage.getItem('umavida-cfg')||'{}').theme==='dark'?'dark':'light';}catch{root.dataset.theme='light';}
 let finished=false;
 function fail(){if(finished)return;root.dataset.uiState='error';const message=document.getElementById('ui-boot-message'),retry=document.getElementById('ui-boot-retry');if(message)message.textContent='Não foi possível abrir a interface.';if(retry)retry.hidden=false;}
 const timer=setTimeout(fail,20000);
 function onError(e){if(!e.target?.tagName||e.target.tagName==='SCRIPT')fail();}
 window.addEventListener('error',onError,true);
 window.addEventListener('DOMContentLoaded',()=>{document.getElementById('ui-boot-retry')?.addEventListener('click',()=>location.reload());if(root.dataset.uiState==='error')fail();},{once:true});
 window.finishInterfaceBoot=()=>{finished=true;clearTimeout(timer);window.removeEventListener('error',onError,true);root.removeAttribute('data-ui-state');document.getElementById('ui-boot')?.remove();};
})();
