let open=null;
export function installDialogs(){
 window.GameDialogs={confirm(message,{title='Confirme antes de continuar',confirmLabel='Confirmar',cancelLabel='Continuar jogando'}={}){
  if(open)return Promise.resolve(false);
  return new Promise(resolve=>{
   const previous=document.activeElement,oldInert=$app.inert;
   const shade=document.createElement('div');shade.className='game-confirm-overlay';
   const panel=document.createElement('section');panel.className='game-confirm-panel';panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','game-confirm-title');panel.setAttribute('aria-describedby','game-confirm-message');
   const kicker=document.createElement('span');kicker.className='react-kicker';kicker.textContent='SUA ESCOLHA';
   const heading=document.createElement('h2');heading.id='game-confirm-title';heading.textContent=title;
   const text=document.createElement('p');text.id='game-confirm-message';text.textContent=message;
   const cancel=document.createElement('button');cancel.className='btn gold';cancel.textContent=cancelLabel;cancel.dataset.dialog='cancel';
   const confirm=document.createElement('button');confirm.className='btn alt';confirm.textContent=confirmLabel;confirm.dataset.dialog='confirm';
   function close(result){document.removeEventListener('keydown',key,true);shade.remove();$app.inert=oldInert;open=null;previous?.isConnected&&previous.focus({preventScroll:true});resolve(result);}
   function key(event){if(event.key==='Escape'){event.stopImmediatePropagation();event.preventDefault();close(false);}else if(event.key==='Tab'){const first=cancel,last=confirm;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}}
   cancel.onclick=()=>close(false);confirm.onclick=()=>close(true);shade.onclick=e=>{if(e.target===shade)close(false)};
   panel.append(kicker,heading,text,cancel,confirm);shade.append(panel);document.body.append(shade);$app.inert=true;document.addEventListener('keydown',key,true);open=shade;cancel.focus();
  });
 }};
}
