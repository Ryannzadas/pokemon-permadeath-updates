/* Kanto badge sprites from HeartGold/SoulSilver. See assets/badges/sources.json. */
(() => {
 const badges=[['boulder','Rocha','Brock'],['cascade','Cascata','Misty'],['thunder','Trovão','Lt. Surge'],['rainbow','Arco-íris','Erika'],['soul','Alma','Janine'],['marsh','Pântano','Sabrina'],['volcano','Vulcão','Blaine'],['earth','Terra','Giovanni']];
 window.renderKantoBadges=done=>`<div class="kanto-badges" aria-label="Insígnias de Kanto">${badges.map(([id,name,leader],i)=>`<span class="kanto-badge ${i<done?'earned':''}" title="${name} · ${leader} · ${i<done?'Conquistada':'Não conquistada'}"><img src="assets/badges/${id}.png" alt="Insígnia ${name} · ${i<done?'conquistada':'não conquistada'}" width="44" height="44"></span>`).join('')}</div>`;
})();
