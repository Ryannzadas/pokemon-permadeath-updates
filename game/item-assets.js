/* Sprites from PokeAPI/sprites, bundled offline. Adapted items reuse their equivalent. */
window.itemSprite=id=>`<img class="item-sprite" src="assets/${id.startsWith('relic-')||['friendship','link-cable','moss-rock','ice-rock','magnetic-rock'].includes(id)?'custom-items':'items'}/${id==='pewter-crunchies'?'lava-cookie':id}.png" alt="">`;
window.applyItemSprites=()=>{
 const aliases={super:'super-potion',candy:'rare-candy',ball:'poke-ball',great:'great-ball'};
 Object.entries(ITEMS).forEach(([id,item])=>{if(!id.startsWith('tm:'))item.ico=itemSprite(aliases[id]||id);});
 Object.entries(JourneyStrategy.items).forEach(([id,item])=>item.ico=itemSprite(id));
 Object.entries(RELICS).forEach(([id,item])=>item.ico=itemSprite('relic-'+id));
};
