/* Game navigation policy. React and the legacy renderer share these rules. */
(() => {
 'use strict';
 const journeyScreens=new Set(['hub','camp','center','routes','routeWorld','missions','journeyEvent','battle','intro','reward']);
 const journalScreens=new Set(['dex','journal','summary','pc']);
 function isJourney(){
  return !!R&&(journeyScreens.has(S.screen)||(journalScreens.has(S.screen)&&window.gameExpansion.subDestination()==='hub'));
 }
 function musicContext(){
  if(S.screen==='hub'&&S.shop)return 'shop';
  if(S.screen==='hub'||journalScreens.has(S.screen)&&isJourney())return 'journey';
  return S.screen;
 }
 function canDispatch(action){
  if(!['battle','multiplayer','intro'].includes(S.screen))return true;
  if(['snd','mus'].includes(action))return true;
  if(S.screen==='multiplayer'&&action==='socialBack')return true;
  return S.screen==='intro'&&B?.preview&&action==='cancelTrainer';
 }
 const toggleShop=ACT.shop;
 ACT.shop=()=>{
  if(S.screen!=='hub'||EVOLVING)return;
  if(!S.shop){S.shopTab='general';S.shopQuery='';S.shopPage=0;S.shopQty={};S.sel=null;}
  toggleShop();
 };
 const editable=target=>target instanceof Element&&target.closest('input,textarea,[contenteditable="true"]');
 // Preserve text editing and custom right-click game menus without the browser menu.
 document.addEventListener('contextmenu',event=>{if(!editable(event.target))event.preventDefault();});
 document.addEventListener('dragstart',event=>{if(!editable(event.target))event.preventDefault();});
 window.GameNavigation=Object.freeze({isJourney,musicContext,canDispatch});
})();
