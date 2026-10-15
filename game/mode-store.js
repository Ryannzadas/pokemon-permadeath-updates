/* Four independent journey slots inside the existing account-synced save key. */
(() => {
 const key='umavida-save-v1',modes=['permadeath','classic'],keys=['permadeath','classic','permadeath-double','classic-double'];let storage,selected;
 const slotKey=(mode,kind='standard')=>{if(!modes.includes(mode)||!['standard','double'].includes(kind))throw Error('Jornada inválida.');return mode+(kind==='double'?'-double':'');};
 const base=slot=>slot.startsWith('classic')?'classic':'permadeath';
 function read(){
  const raw=storage.getItem(key);if(!raw)return {runs:{}};const doc=JSON.parse(raw),runs={};
  const old=doc.runs||{[doc.R?.mode==='classic'?'classic':'permadeath']:doc};
  for(const [id,save] of Object.entries(old)){if(!keys.includes(id)||!save?.R)continue;const mode=save.R.mode==='classic'?'classic':base(id),kind=save.R.postgame?'double':'standard';runs[slotKey(mode,kind)]=save;}
  const wanted=doc.activeSlot||doc.activeMode;const active=runs[wanted]?wanted:wanted&&runs[slotKey(base(wanted),'double')]?slotKey(base(wanted),'double'):Object.keys(runs)[0];
  return {runs,activeSlot:active};
 }
 function currentSlot(){return selected||read().activeSlot||'permadeath';}
 function current(){return base(currentSlot());}
 function write(doc){
  const active=doc.runs[currentSlot()]?currentSlot():keys.find(k=>doc.runs[k]);
  if(!active){storage.removeItem(key);return;}
  storage.setItem(key,JSON.stringify({...doc.runs[active],schema:3,activeMode:base(active),activeSlot:active,runs:doc.runs}));
 }
 window.ModeSaveStore={
  wrap(raw){storage=raw;return {getItem(k){if(k!==key)return raw.getItem(k);const save=read().runs[currentSlot()];return save?JSON.stringify(save):null;},setItem(k,value){if(k!==key){raw.setItem(k,value);return;}const save=JSON.parse(value),mode=modes.includes(save.R?.mode)?save.R.mode:current(),slot=slotKey(mode,save.R?.postgame?'double':'standard'),doc=read();doc.runs[slot]=save;const previous=selected;selected=slot;try{write(doc);}catch(e){selected=previous;throw e;}},removeItem(k){if(k!==key){raw.removeItem(k);return;}const doc=read();delete doc.runs[currentSlot()];write(doc);}};},
  select(mode,kind){const slot=kind?slotKey(mode,kind):mode;if(!keys.includes(slot))throw Error('Modo inválido.');selected=slot;},
  slots(){return read().runs;},current,currentSlot,slotKey,kind:()=>currentSlot().endsWith('-double')?'double':'standard',
  label(slot){return (base(slot)==='classic'?'Clássico':'Permadeath')+' · '+(slot.endsWith('-double')?'Duplas':'Padrão');}
 };
})();
