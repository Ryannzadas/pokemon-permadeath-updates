/* Preserve the caret when a live search or background refresh redraws a form. */
(() => {
 'use strict';
 const previous=render;
 render=()=>{
  const page=S.screen,field=document.activeElement;
  const editable=field&&$app.contains(field)&&field.id&&(field.tagName==='TEXTAREA'||field.tagName==='INPUT'&&['text','search','url','email','tel','password'].includes(field.type));
  const snapshot=editable?{id:field.id,value:field.value,start:field.selectionStart,end:field.selectionEnd,direction:field.selectionDirection,top:field.scrollTop,left:field.scrollLeft}:null;
  const x=window.scrollX,y=window.scrollY;
  previous();
  if(snapshot&&S.screen===page){
   const next=document.getElementById(snapshot.id);
   if(next&&$app.contains(next)&&!next.disabled){
    next.value=snapshot.value;next.focus({preventScroll:true});
    try{if(snapshot.start!==null)next.setSelectionRange(snapshot.start,snapshot.end,snapshot.direction);}catch{}
    next.scrollTop=snapshot.top;next.scrollLeft=snapshot.left;window.scrollTo(x,y);
   }
  }
 };
})();
