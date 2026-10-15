'use strict';
const assert=require('node:assert/strict'),E=require('../server/battle-engine.cjs'),Team=require('../game/team-model.js');
const fs=require('node:fs'),vm=require('node:vm');const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('game/online-dex-data.js','utf8'),ctx);const data=vm.runInContext('ONLINE_DEX_DATA',ctx);
assert.equal(Object.keys(data.natures).length,25);assert(Object.keys(data.items).length>300);
for(const id of ['choice-scarf','assault-vest','heavy-duty-boots','clear-amulet','booster-energy','ability-shield'])assert(data.items[id]);
for(const id of ['pikachu','greninja','pecharunt'])assert(data.species[id].learn.length);
assert(data.species.pikachu.learn.some(x=>x.id==='hidden-power'));
assert(data.abilities.greninja.some(x=>x.id==='protean'&&x.slot===3));assert.equal(data.abilities.gengar[0].id,'cursed-body');
const rules={level:50,format:'single',bag:true,banned:[]},base={sp:'pikachu',moves:['thunderbolt'],abilitySlot:1,heldItem:'heavy-duty-boots'};
const neutral=E.create([[base],[base]],rules).teams[0][0];
for(const [nature,n]of Object.entries(data.natures)){
 const roster=E.validate([{...base,nature}],null,rules),m=E.create([roster,roster],rules).teams[0][0];assert.equal(m.nature,nature);assert.equal(m.heldItem,'heavy-duty-boots');assert.equal(m.maxHp,neutral.maxHp);
 for(const stat of ['atk','def','spa','spd','spe'])assert.equal(m[stat],Math.floor(neutral[stat]*(n.up!==n.down?(stat===n.up?1.1:stat===n.down?.9:1):1)));
 const entry={name:'Nature test',team:roster},parsed=Team.parse(Team.text(entry,E.data),E.data);assert.deepEqual(Team.validate(parsed.team,E.data),roster);
}
assert.throws(()=>E.validate([{...base,nature:'invented'}],null,rules),/Natureza/);assert.throws(()=>E.validate([{...base,heldItem:'not-an-item'}],null,rules),/Item/);assert.throws(()=>E.validate([{...base,moves:['malignant-chain']}],null,rules),/incompatível/);
console.log('PASS full held-item catalog, historical legal moves, current hidden abilities, all 25 nature stat effects/import/export/server validation.');
