'use strict';
const JourneyStrategy=(()=>{
  const abilities={
    overgrow:['Overgrow · Crescimento','Golpes de Planta ×1,5 com HP em 1/3 ou menos.'],
    blaze:['Blaze · Chama','Golpes de Fogo ×1,5 com HP em 1/3 ou menos.'],
    torrent:['Torrent · Torrente','Golpes de Água ×1,5 com HP em 1/3 ou menos.'],
    swarm:['Swarm · Enxame','Golpes de Inseto ×1,5 com HP em 1/3 ou menos.'],
    levitate:['Levitate · Levitação','Imune aos golpes de Terra.'],
    'water-absorb':['Water Absorb · Absorção de Água','Golpes de Água não causam dano e recuperam 1/4 do HP máximo.'],
    'volt-absorb':['Volt Absorb · Absorção de Voltagem','Golpes Elétricos não causam dano e recuperam 1/4 do HP máximo.'],
    'thick-fat':['Thick Fat · Gordura Espessa','Recebe metade do dano de Fogo e Gelo.'],
    adaptability:['Adaptability · Adaptabilidade','Bônus de golpes do próprio tipo passa a ×2.'],
    intimidate:['Intimidate · Intimidação','Ao entrar, reduz o Ataque dos adversários em um estágio.'],
    guts:['Guts · Garra','Ataque físico ×1,5 com uma condição de status; queimadura não reduz o Ataque.'],
    limber:['Limber · Flexibilidade','Não pode ficar paralisado.'],
    insomnia:['Insomnia · Insônia','Não pode adormecer.'],
    'vital-spirit':['Vital Spirit · Espírito Vital','Não pode adormecer.'],
    immunity:['Immunity · Imunidade','Não pode ser envenenado.'],
    'water-veil':['Water Veil · Véu de Água','Não pode ser queimado.'],
    'magma-armor':['Magma Armor · Armadura de Magma','Não pode ser congelado.']
  };
  const items={
    'oran-berry':{n:'Oran Berry',d:'Consumida quando o HP chega à metade: recupera 10 HP.',price:45,ico:'🫐'},
    'sitrus-berry':{n:'Sitrus Berry',d:'Consumida quando o HP chega à metade: recupera 1/4 do HP máximo.',price:100,ico:'🍊'},
    'lum-berry':{n:'Lum Berry',d:'Consumida para curar uma condição de status.',price:80,ico:'🍒'},
    leftovers:{n:'Leftovers',d:'Recupera 1/16 do HP máximo ao fim de cada turno. Não é consumido.',price:260,ico:'🍱'},
    'choice-band':{n:'Choice Band',d:'Ataque físico ×1,5. Trava o primeiro golpe usado até trocar o Pokémon ou encerrar a batalha.',price:300,ico:'🎗️'},
    'life-orb':{n:'Life Orb',d:'Dano dos golpes ×1,3. Após causar dano, perde 1/10 do HP máximo. Não é consumido.',price:360,ico:'🔮'},
    'focus-sash':{n:'Focus Sash',d:'Com HP cheio, sobrevive a um golpe fatal com 1 HP. Consumido ao ativar; não protege de dano residual.',price:220,ico:'🧣'}
  };
  const key=m=>m?.ability;
  function normalize(m){
    const slots=typeof POKEMON_ABILITIES!=='undefined'?POKEMON_ABILITIES[m.sp]||[]:[];
    const slot=slots.find(x=>x.slot===(m.abilitySlot||1))||slots[0];
    if(slot){m.ability=slot.id;m.abilitySlot=slot.slot;}else m.ability=null;
    if(!items[m.heldItem])m.heldItem=null;
    m.choiceMove=null;
  }
  function label(m){return abilities[key(m)]?.[0]||String(key(m)||'Sem habilidade').replace(/-/g,' ');}
  function description(m){return abilities[key(m)]?.[1]||'O efeito desta habilidade será incluído em uma próxima etapa.';}
  function damage(att,def,mv){
    const a=key(att),d=key(def);let multiplier=1;
    const types={overgrow:'grass',blaze:'fire',torrent:'water',swarm:'bug'};
    if(types[a]===mv.t&&att.hp<=att.maxHp/3)multiplier*=1.5;
    if(a==='adaptability'&&att.types.includes(mv.t))multiplier*=2/1.5;
    if(a==='guts'&&att.ailment&&mv.cat===2)multiplier*=1.5;
    if(att.heldItem==='choice-band'&&mv.cat===2)multiplier*=1.5;
    if(att.heldItem==='life-orb')multiplier*=1.3;
    if(d==='thick-fat'&&['fire','ice'].includes(mv.t))multiplier*=.5;
    if(d==='levitate'&&mv.t==='ground')return 0;
    return multiplier;
  }
  function absorb(def,mv){
    if((key(def)==='water-absorb'&&mv.t==='water')||(key(def)==='volt-absorb'&&mv.t==='electric')){
      if(def.hp>0)def.hp=Math.min(def.maxHp,def.hp+Math.max(1,Math.floor(def.maxHp/4)));
      return true;
    }return false;
  }
  function immune(m,status){return {paralysis:['limber'],sleep:['insomnia','vital-spirit'],poison:['immunity'],burn:['water-veil'],freeze:['magma-armor']}[status]?.includes(key(m));}
  function enter(m,opponents){
    m.choiceMove=null;
    if(m.hp>0){if(immune(m,m.ailment))m.ailment=null;berry(m);}
    if(key(m)!=='intimidate'||m.hp<=0)return false;
    let changed=false;
    for(const o of opponents)if(o?.hp>0){o.stages=o.stages||{};const v=o.stages.atk||0;if(v>-6){o.stages.atk=v-1;changed=true;}}
    return changed;
  }
  function berry(m){
    if(m.hp<=0)return null;
    const id=m.heldItem;
    if(id==='lum-berry'&&m.ailment){m.ailment=null;m.sleepTurns=0;m.heldItem=null;return id;}
    if(['oran-berry','sitrus-berry'].includes(id)&&m.hp<=m.maxHp/2){
      m.hp=Math.min(m.maxHp,m.hp+(id==='oran-berry'?10:Math.max(1,Math.floor(m.maxHp/4))));m.heldItem=null;return id;
    }return null;
  }
  function endTurn(m){
    if(m.hp<=0)return null;
    const consumed=berry(m);
    if(m.heldItem==='leftovers'&&m.hp<m.maxHp){m.hp=Math.min(m.maxHp,m.hp+Math.max(1,Math.floor(m.maxHp/16)));return 'leftovers';}
    return consumed;
  }
  function allowed(m,id){return m.heldItem!=='choice-band'||!m.choiceMove||m.choiceMove===id||id==='struggle';}
  function choose(m,id){if(m.heldItem==='choice-band'&&id!=='struggle'&&!m.choiceMove)m.choiceMove=id;}
  function takeHit(m,damage){
    const full=m.hp===m.maxHp&&m.hp>0;
    m.hp=Math.max(0,m.hp-damage);
    if(full&&m.hp===0&&m.heldItem==='focus-sash'){m.hp=1;m.heldItem=null;return 'focus-sash';}
    return null;
  }
  function recoil(m,damage){
    if(m.heldItem==='life-orb'&&m.hp>0&&damage>0){m.hp=Math.max(0,m.hp-Math.max(1,Math.floor(m.maxHp/10)));return true;}
    return false;
  }
  return {abilities,items,normalize,label,description,damage,absorb,immune,enter,berry,endTurn,allowed,choose,takeHit,recoil};
})();
if(typeof module!=='undefined')module.exports=JourneyStrategy;
