/* One command boundary for game buttons and persistent navigation. */
(() => {
 'use strict';
 const pending=new Set();
 async function dispatch(action,value='',options={}){
  if($app.inert||document.querySelector('.profile-panel'))return false;
  if(options.navigation&&!GameNavigation.canDispatch(action))return false;
  const fn=ACT[action];if(typeof fn!=='function')return false;
  const key=action+'\u0000'+value;if(pending.has(key))return false;
  pending.add(key);
  if(S.screen!=='battle')S.msg='';
  menuActionSound(action,value);
  try{
   const result=fn(value);
   render();
   if(result&&typeof result.then==='function'){await result;render();}
   return true;
  }catch(error){console.error('Game command failed:',action,error);S.msg=error.message||'Não foi possível concluir. Tente novamente.';render();return false;}
  finally{pending.delete(key);}
 }
 window.GameCommands=Object.freeze({dispatch});
})();
