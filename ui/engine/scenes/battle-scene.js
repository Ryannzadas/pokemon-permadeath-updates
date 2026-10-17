// Battles drawn in Phaser: journey battles (wild, trainer, gym, training, exploration; singles and
// doubles) and online battles (Social and leagues). The scene is a projection of a battle source:
// every engine render() calls sync(), which updates sprites, status boxes, messages and menus.
// Player choices go back as the source's own commands. journeySource reads R/S/B and the journey's
// buttons; onlineSource reads OnlineBattle.state() from the online client.
import { WIDTH, HEIGHT, TEXT, COLORS, hpColor } from '../config.js';
import { pixelText, drawWindow, Menu, Typewriter } from '../ui.js';
import { command, engineOptions, enginePrompt } from '../bridge.js';
import { ensureTexture, pixelBounds, addIcon } from '../assets.js';
// The National Dex of online battles is a global constant of the page (not on window).
const onlineDex = () => typeof OnlineDex !== 'undefined' ? OnlineDex : null;

const ARENA_H = 198;
const BOX_Y = ARENA_H;
const effLabel = { 'super efetivo': 'Super efetivo', 'pouco efetivo': 'Pouco efetivo', 'sem efeito': 'Sem efeito' };
const effMark = { 'Super efetivo': '▲', 'Efetivo': '●', 'Pouco efetivo': '▼', 'Sem efeito': '✕' };
const fxColor = { attack: '#f8f8f8', hit: '#f8e070', buff: '#70d0f8', debuff: '#f87070', status: '#d090f8' };

// Where each Pokémon stands: x is the center, ground is where its feet rest.
const SPOTS = {
  single: { enemy: [{ x: 362, ground: 116 }], player: [{ x: 128, ground: ARENA_H }] },
  double: { enemy: [{ x: 318, ground: 102 }, { x: 414, ground: 94 }], player: [{ x: 84, ground: ARENA_H }, { x: 200, ground: ARENA_H }] },
};

// Names and dex numbers work for journey species (SP) and National Dex species from online battles.
const monName = m => SP[m.sp]?.n || onlineDex()?.species?.[m.sp]?.n || m.sp;
const dexOf = sp => SP[sp]?.dex ?? onlineDex()?.species?.[sp]?.dex;
const itemIcon = id => /src="([^"]+)"/.exec(ITEMS[id]?.ico || '')?.[1] || '';
const onlineMoveName = id => onlineDex()?.moveName(id) || M[id]?.n || id;

// ---------- journey battles ----------
const journeySource = {
  online: false, exp: true,
  active: () => S.screen === 'battle' && !!B,
  key: () => B,
  arena: () => window.battleArenaName?.() || 'Floresta',
  sides() {
    const layout = B.double ? 'double' : 'single';
    const enemy = (B.enemySlots?.length ? B.enemySlots : [0]).map(i => B.enemies?.[i] || B.enemy).filter(Boolean);
    const player = (B.playerSlots?.length ? B.playerSlots : [R.active]).map(i => R.team[i]).filter(Boolean);
    return { layout, enemy, player, enemyIds: enemy, playerIds: player };
  },
  // B.fx is 'e' (enemy hit) or 'p' (player hit) while the engine shows the impact; B.visual floats
  // a move, status or stat symbol over a Pokémon.
  flash: () => B.fx ? { token: B.fx, side: B.fx } : null,
  visual: () => B.visual ? { token: B.visual, id: B.visual.mon, text: B.visual.text, kind: B.visual.kind } : null,
  effKnown: () => !B.double,
  actor: () => R.team[B.double ? B.playerSlots[Math.min(B.commands.length, B.playerSlots.length - 1)] : B.playerSlots?.[0] ?? R.active],
  actorKey: () => B.double ? B.commands.length : 0,
  mode(fight) {
    if (B.lock) return 'message';
    const forced = !!B.forced;
    if (!forced && B.menu === 'target') return 'target';
    if (forced || B.menu !== 'moves') return 'overlay';
    return fight ? 'fight' : 'command';
  },
  menuKey: () => B.menu,
  options(mode) {
    return mode === 'fight' ? engineOptions('.react-battle-choices .moves .mv')
      : mode === 'target' ? engineOptions('.react-battle-choices [data-act="target"]')
      : mode === 'overlay' ? engineOptions('.react-battle-choices button') : [];
  },
  message(mode) { return mode === 'message' ? (B.log?.at(-1) || '') : mode === 'command' ? `O que ${monName(this.actor())} vai fazer?` : enginePrompt(); },
  commands() {
    const items = window.battleCommandItems?.() || [], find = (action, value) => items.find(c => c.action === action && (value === undefined || c.value === value));
    const bag = find('menu', 'bag'), ball = find('menu', 'ball'), party = find('menu', 'switch'), flee = find('flee');
    return [
      // Wild battles reach Poké Balls through the bag, as in FireRed.
      { label: 'MOCHILA', disabled: !bag || bag.disabled && !(ball && !ball.disabled), onSelect: () => command('menu', bag && !bag.disabled ? 'bag' : 'ball') },
      { label: 'POKÉMON', disabled: !party || party.disabled, onSelect: () => command('menu', 'switch') },
      flee ? { label: B.train ? 'SAIR' : 'FUGIR', sub: B.train ? '' : String(flee.label).split('·')[1]?.trim(), disabled: flee.disabled, onSelect: () => command('flee') } : { label: '', disabled: true },
    ];
  },
  targetBack: () => engineOptions('.react-battle-choices [data-act="menu"]')[0],
  overlay(options) {
    const titles = { bag: 'Mochila', ball: 'Pokébolas', switch: 'Pokémon', itemTarget: 'Mochila', itemMove: 'Mochila' };
    const isBack = o => o.action === 'menu' && o.label.startsWith('Voltar');
    const ball = (window.battleCommandItems?.() || []).find(c => c.value === 'ball');
    return {
      title: B.forced ? 'Pokémon' : titles[B.menu] || '',
      hint: { bag: 'Usar qual item?', ball: 'Usar qual Pokébola?', switch: 'Escolha um Pokémon.', itemTarget: 'Usar em qual Pokémon?', itemMove: 'Restaurar PP de qual golpe?' }[B.menu],
      back: options.filter(isBack).at(-1), list: options.filter(o => !isBack(o)),
      tabs: ['bag', 'ball'].includes(B.menu) && ball ? [['bag', 'Itens'], ['ball', 'Pokébolas']].map(([v, label]) => ({ label, active: B.menu === v, onSelect: () => command('menu', v) })) : null,
      partyMon: o => ['sw', 'inventoryTarget'].includes(o.action) ? R.team[Number(o.value)] : null,
    };
  },
};

// ---------- online battles (Social, leagues) ----------
const online = () => window.OnlineBattle?.state();
const onlineSource = {
  online: true, exp: false,
  active: () => S.screen === 'multiplayer' && !!online(),
  key: () => online().id,
  arena: () => 'Estádio',
  // Each replayed frame brings new objects, so Pokémon are identified by side and team index.
  sides() {
    const s = online();
    return { layout: s.double ? 'double' : 'single', enemy: s.enemySlots.map(i => s.enemy[i]), player: s.slots.map(i => s.team[i]),
      enemyIds: s.enemySlots.map(i => 'enemy:' + i), playerIds: s.slots.map(i => 'player:' + i) };
  },
  // The turn replay plays one event at a time: 'hit' flashes the Pokémon, other kinds float a symbol.
  flash: () => { const e = online().effect; return e?.kind === 'hit' ? { token: e, side: e.side === 'enemy' ? 'e' : 'p' } : null; },
  visual: () => { const e = online().effect; return e && e.kind !== 'hit' ? { token: e, id: `${e.side}:${e.index}`, text: e.symbol, kind: e.kind } : null; },
  effKnown: () => false,
  actor: () => { const s = online(); return s.team[s.actor]; },
  actorKey: () => { const s = online(); return `${s.turn}:${s.slot}:${s.chosen}`; },
  mode(fight) {
    const s = online();
    if (s.waiting) return 'message';
    if (s.menu === 'target') return 'target';
    if (['pokemon', 'bag', 'itemTarget', 'itemMove'].includes(s.menu)) return 'overlay';
    return fight ? 'fight' : 'command';
  },
  menuKey: () => online().menu,
  options(mode) {
    const s = online(), m = s.team[s.actor];
    if (mode === 'fight') return s.moves.map(({ id, disabled }) => {
      const mv = OnlineDex.moves[id];
      return { action: 'pvpMove', value: id, label: onlineMoveName(id), disabled, color: TYPES[mv.t]?.[1] || '#a8a878',
        sub: `${TYPES[mv.t]?.[0] || ''} · ${mv.cat === 1 ? 'Status' : 'poder ' + (mv.p || 'variável')} · PP ${id === 'struggle' ? '—' : (m.pp[id] ?? mv.pp) + '/' + mv.pp}` };
    });
    if (mode === 'target') return s.targets.map(i => ({ action: 'pvpTarget', value: i, label: monName(s.enemy[i]) }));
    if (mode !== 'overlay') return [];
    const ether = s.team[s.choice?.target];
    const list = s.menu === 'pokemon' ? s.bench.map(i => ({ action: 'pvpSwitch', value: i, label: monName(s.team[i]) }))
      : s.menu === 'bag' ? s.bag.map(b => ({ action: 'pvpItem', value: b.id, label: ITEMS[b.id]?.n || b.id, sub: `×${b.n}`, disabled: b.disabled, icon: itemIcon(b.id) }))
      : s.menu === 'itemTarget' ? s.itemTargets.map(t => ({ action: 'pvpItemTarget', value: t.i, label: monName(s.team[t.i]), disabled: t.disabled }))
      : (ether?.moves || []).map(id => ({ action: 'pvpItemMove', value: id, label: onlineMoveName(id), sub: `PP ${ether.pp[id]}/${OnlineDex.moves[id].pp}`, disabled: ether.pp[id] >= OnlineDex.moves[id].pp }));
    // A fainted Pokémon must be replaced: no way back from that list.
    return m?.hp > 0 ? list.concat([{ action: 'pvpMenu', value: 'main', label: 'Voltar' }]) : list;
  },
  message(mode) {
    const s = online(), m = s.team[s.actor], name = m ? monName(m) : '';
    if (mode === 'message') return s.status;
    if (mode === 'command') return `O que ${name} vai fazer?` + (s.count > 1 ? ` (${s.chosen + 1}/${s.count})` : '');
    if (mode === 'target') return `Usar ${onlineMoveName(s.choice?.id)} em quem?`;
    return { pokemon: m?.hp <= 0 ? `${name} desmaiou. Escolha outro.` : 'Trocar gasta a ação deste Pokémon.', bag: 'Usar qual item?', itemTarget: 'Usar em qual Pokémon?', itemMove: 'Restaurar PP de qual golpe?' }[s.menu] || '';
  },
  commands() {
    const s = online();
    return [
      { label: 'MOCHILA', disabled: !s.bag.some(b => !b.disabled), onSelect: () => command('pvpMenu', 'bag') },
      { label: 'POKÉMON', disabled: !s.bench.length, onSelect: () => command('pvpMenu', 'pokemon') },
      { label: 'DESISTIR', onSelect: () => command('forfeitBattle') },
    ];
  },
  targetBack: () => ({ action: 'pvpMenu', value: 'main' }),
  overlay(options) {
    const s = online(), isBack = o => o.action === 'pvpMenu';
    return {
      title: { pokemon: 'Pokémon', bag: 'Mochila', itemTarget: 'Mochila', itemMove: 'Mochila' }[s.menu] || '',
      hint: '', back: options.filter(isBack).at(-1), list: options.filter(o => !isBack(o)), tabs: null,
      partyMon: o => ['pvpSwitch', 'pvpItemTarget'].includes(o.action) ? s.team[Number(o.value)] : null,
    };
  },
};
const SOURCES = [journeySource, onlineSource];
export const battleOwnsScreen = () => SOURCES.some(src => src.active());

// Defined on demand: Phaser is a global that only exists in the real game page.
export const defineBattleScene = () => class BattleScene extends Phaser.Scene {
  constructor(engine) { super('battle'); this.engine = engine; }

  create() {
    this.bounds = new Map();           // texture key -> visible pixel box
    this.mons = new Map();             // slot key -> { sprite, box, hp, mon, id }
    this.ui = null; this.uiKey = '';
    this.fight = false; this.moveIndex = 0; this.actorKey = null;
    this.bg = this.add.image(WIDTH / 2, ARENA_H / 2, '__DEFAULT').setDisplaySize(WIDTH, ARENA_H);
    this.layerMons = this.add.container(0, 0);
    this.layerStatus = this.add.container(0, 0);
    this.layerFx = this.add.container(0, 0);
    this.frame = this.add.graphics();
    this.frame.fillStyle(0x283848, 1).fillRect(0, BOX_Y, WIDTH, HEIGHT - BOX_Y);
    this.frame.fillStyle(COLORS.frame, 1).fillRect(0, BOX_Y, WIDTH, 2);
    this.layerUi = this.add.container(0, 0);
    this.layerOverlay = this.add.container(0, 0);
    this.events.on('wake', () => this.sync());
    // A new render scale redraws texts at the new resolution.
    this.events.on('rescale', () => { this.uiKey = ''; for (const m of this.mons.values()) m.boxKey = ''; this.sync(); });
    this.sync();
  }

  update() { this.engine.input.pollGamepads(); }

  // ---------- state -> scene ----------
  sync() {
    const src = SOURCES.find(s => s.active());
    if (!this.layerUi || this.sys.isSleeping() || !src) return;
    this.src = src;
    const key = src.key();
    if (this.battle !== key) { this.battle = key; this.fight = false; this.moveIndex = 0; this.uiKey = ''; this.resetField(); }
    this.syncArena();
    this.syncField();
    this.syncUi();
  }

  resetField() {
    for (const m of this.mons.values()) { m.sprite.destroy(); m.box.destroy(); }
    this.mons.clear(); this.layerFx.removeAll(true);
    this.entering = true;
  }

  syncArena() {
    const name = this.src.arena(), key = 'arena:' + name;
    if (this.arenaKey === key) return;
    this.arenaKey = key;
    this.ensureTexture(key, `assets/visual/${name}.webp`, () => { if (this.arenaKey === key) this.bg.setTexture(key).setDisplaySize(WIDTH, ARENA_H); });
  }

  syncField() {
    const { layout, enemy, player, enemyIds, playerIds } = this.src.sides(), seen = new Set();
    const place = (side, mon, slot, id) => {
      const key = `${side}:${slot}`; seen.add(key);
      let entry = this.mons.get(key);
      if (!entry || entry.id !== id || entry.sp !== mon.sp) { entry?.sprite.destroy(); entry?.box.destroy(); entry = this.createMon(side, mon, slot, layout); entry.id = id; this.mons.set(key, entry); }
      entry.mon = mon;
      this.updateMon(entry, side, mon, slot, layout);
    };
    enemy.forEach((m, i) => place('enemy', m, i, enemyIds[i]));
    player.forEach((m, i) => place('player', m, i, playerIds[i]));
    for (const [key, entry] of this.mons) if (!seen.has(key)) { entry.sprite.destroy(); entry.box.destroy(); this.mons.delete(key); }
    this.entering = false;
    this.playEffects();
  }

  spriteInfo(mon, back) {
    const dex = dexOf(mon.sp);
    if (window.FRLG_SPRITES?.[dex]) return { key: `frlg:${dex}-${back ? 'b' : 'f'}`, url: `assets/sprites-frlg/${dex}-${back ? 'b' : 'f'}.png`, scale: 2 };
    // Regular (DS-era) sprites are doubled when the Pokémon fits, so sizes match the FireRed ones.
    const url = SP[mon.sp] ? SPRITE(dex, back) : onlineDex().sprite(mon.sp, back);
    return { key: `spr:${url}`, url, scale: 'fit' };
  }

  createMon(side, mon, slot, layout) {
    const spot = SPOTS[layout][side][slot] || SPOTS[layout][side][0];
    const sprite = this.add.image(spot.x, spot.ground, '__DEFAULT').setOrigin(0.5, 1).setVisible(false);
    this.layerMons.add(sprite);
    const info = this.spriteInfo(mon, side === 'player'), enter = this.entering;
    this.ensureTexture(info.key, info.url, () => {
      if (!sprite.active) return;
      const b = this.pixelBounds(info.key);
      const room = side === 'enemy' ? spot.ground - 6 : ARENA_H - 50;
      const scale = info.scale === 'fit' ? ((b.bottom - b.top + 1) * 2 <= room ? 2 : 1) : info.scale;
      sprite.setTexture(info.key).setScale(scale).setVisible(true);
      // Rest the visible feet on the ground and center the visible body on the spot.
      sprite.setOrigin((b.left + b.right + 1) / 2 / b.width, (b.bottom + 1) / b.height);
      sprite.setPosition(spot.x, spot.ground);
      if (side === 'enemy' && layout === 'double' && slot === 1) this.layerMons.sendToBack(sprite);
      if (mon.hp <= 0) sprite.setAlpha(0.2);
      if (enter) this.tweens.add({ targets: sprite, x: { from: side === 'enemy' ? WIDTH + 60 : -60, to: spot.x }, duration: 420, ease: 'Cubic.out' });
    });
    const box = this.add.container(0, 0); this.layerStatus.add(box);
    return { sprite, box, hp: mon.hp, mon, sp: mon.sp, side, slot, fainted: mon.hp <= 0 };
  }

  statusLayout(side, slot, layout) {
    if (layout === 'single') return side === 'enemy' ? { x: 14, y: 14, w: 176, h: 42, exp: false, numbers: false } : { x: 288, y: 118, w: 184, h: 70, exp: true, numbers: true };
    return side === 'enemy' ? { x: 8 + slot * 10, y: 6 + slot * 44, w: 172, h: 40, exp: false, numbers: false } : { x: 294 + slot * 8, y: 104 + slot * 46, w: 178, h: 44, exp: false, numbers: true, compact: true };
  }

  updateMon(entry, side, mon, slot, layout) {
    // Redraw the status box only when what it shows changed, so the HP bar animation can finish.
    const boxKey = [monName(mon), mon.lvl, mon.hp, mon.maxHp, mon.ailment, mon.xp | 0, mon.alpha, layout, slot].join('|');
    if (boxKey === entry.boxKey) return;
    entry.boxKey = boxKey;
    const L = this.statusLayout(side, slot, layout), box = entry.box;
    box.removeAll(true);
    const g = this.add.graphics(); box.add(g);
    drawWindow(g, L.x, L.y, L.w, L.h, { fill: COLORS.statusFill, border: COLORS.statusBorder, radius: 5, shadow: COLORS.statusShadow });
    const nameSize = TEXT.large;
    box.add(pixelText(this, L.x + 8, L.y + 3, monName(mon) + (mon.alpha ? ' ★' : ''), { size: nameSize }));
    box.add(pixelText(this, L.x + L.w - 8, L.y + 3, `Nv${mon.lvl}`, { size: nameSize }).setOrigin(1, 0));
    if (mon.ailment) box.add(pixelText(this, L.x + 8, L.y + L.h - 13, String(mon.ailment).toUpperCase().slice(0, 3), { size: TEXT.small, color: '#c03028' }));
    const barY = L.y + (nameSize === TEXT.large ? 24 : 15), barX = L.x + 34, barW = L.w - 44;
    box.add(pixelText(this, L.x + 12, barY - 3, 'HP', { size: TEXT.small, color: COLORS.hpLabel }).setBackgroundColor('#405040').setPadding(2, 0, 2, 0));
    const track = this.add.graphics().fillStyle(COLORS.barBorder, 1).fillRoundedRect(barX - 1, barY - 1, barW + 2, 7, 3).fillStyle(COLORS.barTrack, 1).fillRect(barX, barY, barW, 5);
    box.add(track);
    const ratio = Math.max(0, mon.hp / mon.maxHp), fill = this.add.rectangle(barX, barY, barW * Math.max(0, entry.hp / mon.maxHp), 5, hpColor(ratio)).setOrigin(0);
    box.add(fill);
    if (entry.hp !== mon.hp) this.tweens.add({ targets: fill, width: barW * ratio, duration: 400 / (CFG.speed || 1), ease: 'Linear', onUpdate: () => fill.setFillStyle(hpColor(fill.width / barW)) });
    if (L.numbers) box.add(pixelText(this, L.x + L.w - 8, barY + 6, `${Math.max(0, mon.hp)}/ ${mon.maxHp}`, { size: L.compact ? TEXT.small : TEXT.large }).setOrigin(1, 0));
    if (L.exp && this.src.exp) {
      const ey = L.y + L.h - 9, ew = L.w - 44;
      box.add(pixelText(this, L.x + 8, ey - 4, 'EXP', { size: TEXT.small, color: '#405040' }));
      box.add(this.add.graphics().fillStyle(COLORS.barTrack, 1).fillRect(L.x + 34, ey, ew, 3).fillStyle(COLORS.exp, 1).fillRect(L.x + 34, ey, ew * Math.min(1, (mon.xp | 0) / xpNeed(mon.lvl)), 3));
    }
    // Faint: the sprite drops and fades out once.
    if (mon.hp <= 0 && !entry.fainted) { entry.fainted = true; this.tweens.add({ targets: entry.sprite, y: entry.sprite.y + 24, alpha: 0.15, duration: 380 }); }
    if (mon.hp > 0 && entry.fainted) { entry.fainted = false; entry.sprite.setAlpha(1); }
    entry.hp = mon.hp;
  }

  monEntry(id) { for (const e of this.mons.values()) if (e.id === id) return e; return null; }

  playEffects() {
    // Hit flash on the side that was hit ('e' enemy, 'p' player), once per impact.
    const flash = this.src.flash();
    if (flash && flash.token !== this.lastFx) {
      for (const e of this.mons.values()) if ((flash.side === 'e') === (e.side === 'enemy') && e.sprite.visible) this.tweens.add({ targets: e.sprite, alpha: 0.1, duration: 60, yoyo: true, repeat: 2 });
    }
    this.lastFx = flash?.token;
    // Move, status and stat effects float a symbol over the right Pokémon.
    const v = this.src.visual();
    if (v && v.token !== this.lastVisual) {
      const e = this.monEntry(v.id);
      if (e) {
        const t = pixelText(this, e.sprite.x, e.sprite.y - e.sprite.displayHeight * 0.6, v.text || '✦', { size: TEXT.large, color: fxColor[v.kind] || '#ffffff', shadow: '#202020' }).setOrigin(0.5);
        this.layerFx.add(t);
        this.tweens.add({ targets: t, y: t.y - 18, alpha: 0, duration: 650 / (CFG.speed || 1), onComplete: () => t.destroy() });
        if (v.kind === 'buff' || v.kind === 'debuff') this.tweens.add({ targets: e.sprite, y: e.sprite.y + (v.kind === 'buff' ? -4 : 4), duration: 120, yoyo: true, repeat: 1 });
      }
    }
    this.lastVisual = v?.token;
  }

  // ---------- text box, menus and overlays ----------
  syncUi() {
    const src = this.src, actorKey = src.actorKey();
    if (actorKey !== this.actorKey) { this.actorKey = actorKey; this.fight = false; this.moveIndex = 0; }
    const mode = src.mode(this.fight);
    if (mode === 'message') this.fight = false;
    const options = src.options(mode);
    const commands = mode === 'command' ? src.commands() : [];
    const message = src.message(mode);
    const key = JSON.stringify([src.online, mode, src.menuKey(), options.map(o => [o.action, o.value, o.label, o.sub, o.disabled]), commands.map(c => [c.label, c.disabled, c.sub]), mode === 'message' ? '' : message]);
    if (key !== this.uiKey) { this.uiKey = key; this.buildUi(mode, options, commands, message); }
    if (mode === 'message') this.typer?.show(message, { speed: CFG.speed || 1 });
  }

  clearUi() {
    this.menu?.destroy(); this.menu = null;
    this.keyRelease?.(); this.keyRelease = null;
    this.typer?.destroy(); this.typer = null;
    this.layerUi.removeAll(true); this.layerOverlay.removeAll(true);
  }

  messageWindow(wide, text) {
    const g = this.add.graphics(); this.layerUi.add(g);
    const w = wide ? WIDTH - 8 : 286;
    drawWindow(g, 4, BOX_Y + 4, w, HEIGHT - BOX_Y - 8, { fill: COLORS.messageFill, border: COLORS.messageBorder, inner: COLORS.messageInner, radius: 5 });
    const t = pixelText(this, 16, BOX_Y + 12, '', { size: TEXT.large, color: COLORS.white, shadow: COLORS.shadowLight, width: w - 24 });
    this.layerUi.add(t);
    this.typer = new Typewriter(this, t);
    this.typer.show(text, { speed: CFG.speed || 1 });
  }

  menuWindow(x, w) {
    const g = this.add.graphics(); this.layerUi.add(g);
    drawWindow(g, x, BOX_Y + 4, w, HEIGHT - BOX_Y - 8, { fill: COLORS.menuFill, border: COLORS.menuBorder, inner: COLORS.menuInner, radius: 5 });
  }

  buildUi(mode, options, commands, message) {
    this.clearUi();
    const input = this.engine.input;
    if (mode === 'message') {
      this.messageWindow(true, message);
      // Online: X leaves while waiting (the match goes on online); after the result, Z or X returns.
      if (this.src.online) this.keyRelease = input.push(action => {
        if (action === 'back' || action === 'confirm' && online()?.winner) command('socialBack');
        return true;
      });
      return;
    }

    if (mode === 'command') {
      this.messageWindow(false, message);
      this.menuWindow(294, 182);
      const items = [{ label: 'LUTAR', onSelect: () => { this.fight = true; this.uiKey = ''; this.syncUi(); } }, ...commands];
      this.menu = new Menu(this, { x: 302, y: BOX_Y + 11, columns: 2, cellW: 86, cellH: 27, items, input });
      this.layerUi.add(this.menu.container);
      return;
    }

    if (mode === 'fight') {
      this.menuWindow(4, 318); this.menuWindow(326, 150);
      const info = this.add.container(0, 0); this.layerUi.add(info);
      const effOf = o => {
        const parts = o.sub.split(' · ').map(s => s.trim()), status = parts[1] === 'Status';
        const tag = parts.find(p => effLabel[p]);
        return { parts, status, eff: status ? '' : tag ? effLabel[tag] : this.src.effKnown() ? 'Efetivo' : '' };
      };
      const showInfo = o => {
        info.removeAll(true);
        const { parts, status, eff } = effOf(o);
        info.add(pixelText(this, 336, BOX_Y + 11, 'PP', { size: TEXT.large }));
        info.add(pixelText(this, 466, BOX_Y + 11, (parts.find(p => p.startsWith('PP ')) || '').replace('PP ', ''), { size: TEXT.large }).setOrigin(1, 0));
        info.add(pixelText(this, 336, BOX_Y + 30, 'TIPO/' + (parts[0] || '').toUpperCase(), { size: TEXT.large }));
        info.add(pixelText(this, 336, BOX_Y + 50, [status ? 'Status' : parts[1], eff].filter(Boolean).join(' · '), { size: TEXT.small, color: COLORS.inkSoft }));
      };
      const items = options.map((o, i) => ({ ...o, eff: effOf(o).eff, onFocus: () => { this.moveIndex = i; showInfo(o); }, onSelect: () => { this.moveIndex = i; command(o.action, o.value); } }));
      while (items.length < 4) items.push({ label: '—', disabled: true, empty: true });
      this.menu = new Menu(this, {
        x: 10, y: BOX_Y + 9, columns: 2, cellW: 154, cellH: 27, items, input, cursor: false,
        onBack: () => { this.fight = false; this.uiKey = ''; this.syncUi(); },
        drawCell: (c, item, x, y, focused) => this.drawMoveCell(c, item, x, y, focused),
      });
      this.menu.index = Math.min(this.moveIndex, options.length - 1);
      if (this.menu.items[this.menu.index]?.disabled) this.menu.index = Math.max(0, this.menu.items.findIndex(i => !i.disabled));
      this.menu.render();
      this.layerUi.add(this.menu.container);
      if (options[this.menu.index]) showInfo(options[this.menu.index]);
      return;
    }

    if (mode === 'target') {
      this.messageWindow(false, message.replace(/:$/, '.'));
      this.menuWindow(294, 182);
      const back = this.src.targetBack();
      this.menu = new Menu(this, {
        x: 302, y: BOX_Y + 11, columns: 2, cellW: 86, cellH: 27, input,
        items: options.map(o => ({ label: o.label, disabled: o.disabled, onSelect: () => command(o.action, o.value) })),
        onBack: back ? () => command(back.action, back.value) : undefined,
      });
      this.layerUi.add(this.menu.container);
      return;
    }

    // Bag, Poké Balls, party, item targets and forced replacement: a full-arena menu.
    this.buildOverlay(options, message);
  }

  drawMoveCell(c, item, x, y, focused) {
    const g = this.add.graphics(); c.add(g);
    if (item.empty) { c.add(pixelText(this, x + 8, y + 5, '—', { size: TEXT.large, color: COLORS.disabled })); return; }
    const color = Phaser.Display.Color.HexStringToColor(item.color || '#a8a878');
    const fill = item.disabled ? 0xb8b8b8 : color.color;
    g.fillStyle(0x000000, 0.3).fillRoundedRect(x, y, 150, 25, 4).fillStyle(fill, 1).fillRoundedRect(x + 1, y + 1, 148, 23, 3);
    g.fillStyle(0x000000, 0.15).fillRect(x + 2, y + 21, 146, 2);
    if (focused && !item.disabled) g.lineStyle(2, 0x303030, 1).strokeRoundedRect(x, y, 150, 25, 4);
    const light = (0.2126 * color.red + 0.7152 * color.green + 0.0722 * color.blue) / 255 > 0.55;
    const ink = item.disabled ? '#606060' : light ? '#202020' : '#ffffff';
    c.add(pixelText(this, x + 7, y + 1, item.label, { size: TEXT.large, color: ink }));
    if (item.eff) c.add(pixelText(this, x + 143, y + 13, `${effMark[item.eff]} ${item.eff}`, { size: TEXT.small, color: ink }).setOrigin(1, 0));
  }

  buildOverlay(options, message) {
    const { title, hint, back, list, tabs, partyMon } = this.src.overlay(options);
    const g = this.add.graphics(); this.layerOverlay.add(g);
    g.fillStyle(COLORS.panelFill, 1).fillRect(0, 0, WIDTH, ARENA_H).fillStyle(COLORS.panelHead, 1).fillRect(0, 0, WIDTH, 26);
    this.layerOverlay.add(pixelText(this, 10, 3, title, { size: TEXT.large, color: '#ffffff', shadow: '#285878' }));
    (tabs || []).forEach(({ label, active, onSelect }, i) => {
      const x = 286 + i * 96;
      const tg = this.add.graphics().fillStyle(0xffffff, active ? 1 : 0.25).fillRoundedRect(x, 3, 90, 20, 4);
      const tt = pixelText(this, x + 45, 3, label, { size: TEXT.large, color: active ? '#285878' : '#ffffff' }).setOrigin(0.5, 0);
      const zone = this.add.zone(x, 3, 90, 20).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', onSelect);
      this.layerOverlay.add([tg, tt, zone]);
    });
    // Party choices show each Pokémon as a card; items show their icon.
    const party = list.length && list.every(o => partyMon(o));
    const items = list.map(o => ({ ...o, mon: party ? partyMon(o) : null, onSelect: () => command(o.action, o.value) }));
    if (!items.length) items.push({ label: 'Nada disponível.', disabled: true });
    const cellH = party ? 52 : 30, rows = Math.floor((ARENA_H - 34) / cellH);
    this.menu = new Menu(this, {
      x: 10, y: 32, columns: 2, cellW: 232, cellH, rows, items, input: this.engine.input,
      onBack: back && !back.disabled ? () => command(back.action, back.value) : undefined,
      drawCell: (c, item, x, y, focused) => party ? this.drawPartyCell(c, item, x, y, focused) : this.drawItemCell(c, item, x, y, focused),
    });
    this.layerOverlay.add(this.menu.container);
    this.messageWindow(true, message || hint || 'Escolha uma opção.');
  }

  cellFrame(c, x, y, w, h, focused, disabled) {
    const g = this.add.graphics(); c.add(g);
    g.fillStyle(disabled ? 0xe0e0e0 : 0xffffff, 1).fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(focused && !disabled ? 2 : 1, focused && !disabled ? COLORS.messageBorder : 0xa8b0c0, 1).strokeRoundedRect(x, y, w, h, 4);
  }

  // Small icon: FireRed sprite at half size when available, otherwise the regular sprite at a third.
  iconFor(c, url, key, x, y, size, scale) {
    const img = this.add.image(x, y, '__DEFAULT').setOrigin(0.5).setVisible(false); c.add(img);
    this.ensureTexture(key, url, () => { if (img.active) img.setTexture(key).setScale(scale ?? size / this.textures.get(key).getSourceImage().width).setVisible(true); });
    return img;
  }

  drawPartyCell(c, item, x, y, focused) {
    const m = item.mon, w = 226, h = 48;
    this.cellFrame(c, x, y, w, h, focused, item.disabled);
    addIcon(this, c, m.sp, x + 24, y + 38, 0.5);
    const ink = item.disabled ? COLORS.disabled : COLORS.ink;
    c.add(pixelText(this, x + 50, y + 3, monName(m), { size: TEXT.large, color: ink }));
    c.add(pixelText(this, x + w - 8, y + 3, `Nv${m.lvl}`, { size: TEXT.large, color: ink }).setOrigin(1, 0));
    const ratio = Math.max(0, m.hp / m.maxHp), bx = x + 50, by = y + 30, bw = 110;
    c.add(this.add.graphics().fillStyle(COLORS.barBorder, 1).fillRoundedRect(bx - 1, by - 1, bw + 2, 7, 3).fillStyle(COLORS.barTrack, 1).fillRect(bx, by, bw, 5).fillStyle(hpColor(ratio), 1).fillRect(bx, by, bw * ratio, 5));
    c.add(pixelText(this, x + w - 8, by - 4, m.hp <= 0 ? 'Desmaiado' : `${m.hp}/ ${m.maxHp}`, { size: TEXT.body, color: ink }).setOrigin(1, 0));
    if (focused && !item.disabled) c.add(pixelText(this, x - 8, y + 16, '▶', { size: TEXT.body }));
  }

  drawItemCell(c, item, x, y, focused) {
    const w = 226, h = 26;
    this.cellFrame(c, x, y, w, h, focused, item.disabled);
    if (item.icon) this.iconFor(c, item.icon, `item:${item.icon}`, x + 15, y + 13, 22);
    c.add(pixelText(this, x + (item.icon ? 32 : 10), y + 3, item.label, { size: TEXT.large, color: item.disabled ? COLORS.disabled : COLORS.ink }));
    if (item.sub) c.add(pixelText(this, x + w - 8, y + 9, item.sub, { size: TEXT.small, color: COLORS.inkSoft }).setOrigin(1, 0));
    if (focused && !item.disabled) c.add(pixelText(this, x - 8, y + 8, '▶', { size: TEXT.body }));
  }

  // ---------- assets ----------
  ensureTexture(key, url, done) { ensureTexture(this, key, url, done); }
  pixelBounds(key) { return pixelBounds(this, key); }
};
