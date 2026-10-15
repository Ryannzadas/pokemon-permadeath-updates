(function(root,factory){const model=factory();if(typeof module==='object')module.exports=model;else root.TeamModel=model;})(globalThis,()=>{
 'use strict';const natureIds=new Set('hardy lonely brave adamant naughty bold docile relaxed impish lax timid hasty serious jolly naive modest mild quiet bashful rash calm gentle sassy careful quirky'.split(' '));const clone=x=>JSON.parse(JSON.stringify(x));
 function speciesUnlocked(meta,id){return (meta.caught||[]).includes(id)||(meta.championTeams||[]).some(t=>[...(t.team||[]),...(t.original||[])].some(m=>m.sp===id));}
 function validate(team,{species,moves,abilities,items,unlocked=null,level=100}){
  if(!Array.isArray(team)||team.length<1||team.length>6)throw Error('Escolha de um a seis Pokémon.');
  return team.map(m=>{
   const s=species[m?.sp];if(!s||unlocked&&!unlocked.includes(m.sp))throw Error('Espécie indisponível.');
   if(!Array.isArray(m.moves)||m.moves.length<1||m.moves.length>4||new Set(m.moves).size!==m.moves.length)throw Error('Escolha de um a quatro golpes diferentes.');
   const legal=new Set(s.learn.filter(x=>x.method!=='level'||x.level<=level).map(x=>x.id));
   if(m.moves.some(id=>!moves[id]||!legal.has(id)))throw Error('Golpe incompatível com a espécie.');
   const slots=abilities[m.sp]||s.abilities||[],slot=Number(m.abilitySlot)||1;
   if(slots.length&&!slots.some(x=>x.slot===slot))throw Error('Habilidade incompatível.');
   if(m.nature&&!natureIds.has(m.nature))throw Error('Natureza inválida.');
   if(m.heldItem&&!items[m.heldItem])throw Error('Item equipável inválido.');
   return {sp:m.sp,moves:m.moves.slice(),abilitySlot:slot,heldItem:m.heldItem||null,...(m.nature?{nature:m.nature}:{})};
  });
 }
 function save(meta,entry,context){if(typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>40)throw Error('Dê um nome ao time, até 40 caracteres.');const team=validate(entry.team,context);meta.teamBuilder=Array.isArray(meta.teamBuilder)?meta.teamBuilder:[];let id=entry.id;if(!id)id=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);const result={id,name:entry.name.trim(),team},i=meta.teamBuilder.findIndex(t=>t.id===id);if(i<0){if(meta.teamBuilder.length>=30)throw Error('Você já tem 30 times. Remova um para criar outro.');meta.teamBuilder.push(result);}else meta.teamBuilder[i]=result;return clone(result);}
 const identifier=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const label=s=>String(s).split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
 function text(entry,context){if(!context)return [entry.name,...entry.team.map(m=>[`${m.sp} @ ${m.heldItem||'-'}`,`Ability Slot: ${m.abilitySlot||1}`,...(m.nature?[label(m.nature)+' Nature']:[]),...m.moves.map(id=>'- '+id)].join('\n'))].join('\n\n');return [`=== ${entry.name} ===`,...entry.team.map(m=>[`${label(m.sp)}${m.heldItem?' @ '+label(m.heldItem):''}`,`Ability: ${label((context.abilities[m.sp]||[]).find(x=>x.slot===(m.abilitySlot||1))?.id||'')}`,...(m.nature?[label(m.nature)+' Nature']:[]),...m.moves.map(id=>'- '+(context.moves[id]?.en||label(id)))].join('\n'))].join('\n\n');}
 function parse(text,context={}){if(typeof text!=='string'||text.length>12000)throw Error('Texto inválido.');const blocks=text.trim().split(/\n\s*\n/);let name='Time importado';if(blocks[0]?.startsWith('==='))name=blocks.shift().replace(/^===\s*(?:\[[^\]]+\]\s*)?|\s*===$/g,'').trim();else if(!blocks[0]?.includes('\n')&&!blocks[0]?.includes('@'))name=blocks.shift().trim();const team=blocks.map(b=>{const lines=b.split('\n').map(x=>x.trim()),[raw,item]=lines.shift().split(/\s*@\s*/),clean=raw.replace(/\s+\([MF]\)$/,''),sp=identifier(/\(([^)]+)\)/.exec(clean)?.[1]||clean),ability=identifier(lines.find(l=>l.startsWith('Ability:'))?.slice(8));return {sp,heldItem:item&&item!=='-'?identifier(item):null,abilitySlot:ability?(context.abilities?.[sp]||[]).find(x=>x.id===ability)?.slot||0:Number(lines.find(l=>l.startsWith('Ability Slot:'))?.split(':')[1])||1,...(lines.some(l=>/^\w+ Nature$/.test(l))?{nature:identifier(lines.find(l=>/^\w+ Nature$/.test(l)).replace(/ Nature$/,''))}:{}),moves:lines.filter(l=>l.startsWith('- ')).map(l=>identifier(l.slice(2)))};});return {name,team};}

 return {validate,speciesUnlocked,save,text,parse,clone};
});
