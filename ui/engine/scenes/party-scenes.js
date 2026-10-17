// Party, item and storage screens drawn in Phaser: team, bag, shop and PC. Picking opens small windows
// over the screen, like the main games. Every action is the engine's own (summary, lead, items, buying, boxes).
import { WIDTH, HEIGHT, TEXT, COLORS, hpColor } from '../config.js';
import { pixelText, drawWindow, Menu } from '../ui.js';
import { command } from '../bridge.js';
import { addIcon, addSpecies, ensureTexture } from '../assets.js';
import { defineScreenScene, money } from './screen-base.js';

const typeName = t => TYPES[t]?.[0] || t;
const typeColor = t => Phaser.Display.Color.HexStringToColor(TYPES[t]?.[1] || '#a8a878').color;

export function definePartyScenes(engine) {
  const ScreenScene = defineScreenScene(engine);

  const popup = (scene, options) => scene.popup(options);

  // ---------- Team ----------
  class TeamScene extends ScreenScene {
    constructor() { super('team'); }
    stateKey() { return [R.team.map(m => [m.sp, m.lvl, m.hp, m.maxHp, m.ailment, m.heldItem]), R.active]; }
    teardown() { this.pop?.destroy(); this.pop = null; super.teardown(); }
    build() {
      this.backdrop(); this.header('Equipe', `Limite Nv ${JourneyLevelCap.current()}`);
      this.menu = new Menu(this, {
        x: 8, y: 36, columns: 2, cellW: 234, cellH: 59, input: engine.input, index: this.lastIndex,
        items: R.team.map((m, i) => ({ m, i, onSelect: () => this.openActions(m, i) })),
        onBack: () => command('visualReturnHub'),
        drawCell: (c, item, x, y, focused) => this.drawMon(c, item, x, y, focused),
      });
      this.root.add(this.menu.container);
      this.message(R.team.length > 1 ? 'Escolha um Pokémon.' : 'Seu parceiro de jornada.');
    }
    drawMon(c, { m, i }, x, y, focused) {
      const dead = m.hp <= 0, lead = i === R.active;
      this.card(c, x, y, 228, 55, focused, dead);
      if (lead) c.add(this.add.rectangle(x + 1, y + 1, 4, 53, COLORS.messageBorder).setOrigin(0));
      addIcon(this, c, m.sp, x + 26, y + 40, 1 / 3).setScale(1.25).setAlpha(dead ? 0.4 : 1);
      const ink = dead ? COLORS.disabled : COLORS.ink;
      c.add(pixelText(this, x + 52, y + 3, nm(m), { size: TEXT.large, color: ink }));
      c.add(pixelText(this, x + 222, y + 6, `Nv${m.lvl}`, { size: TEXT.body, color: ink }).setOrigin(1, 0));
      (SP[m.sp]?.t || m.types || []).forEach((t, k) => {
        c.add(this.add.rectangle(x + 52 + k * 44, y + 25, 40, 11, typeColor(t)).setOrigin(0).setStrokeStyle(1, 0x303030, 0.4));
        c.add(pixelText(this, x + 72 + k * 44, y + 24, typeName(t), { size: TEXT.small, color: '#202020' }).setOrigin(0.5, 0));
      });
      const ratio = Math.max(0, m.hp / m.maxHp);
      c.add(this.add.graphics().fillStyle(COLORS.barBorder, 1).fillRoundedRect(x + 51, y + 40, 102, 6, 2).fillStyle(COLORS.barTrack, 1).fillRect(x + 52, y + 41, 100, 4).fillStyle(hpColor(ratio), 1).fillRect(x + 52, y + 41, 100 * ratio, 4));
      c.add(pixelText(this, x + 222, y + 36, dead ? 'Desmaiado' : `${m.hp}/${m.maxHp}`, { size: TEXT.body, color: dead ? '#b83838' : COLORS.inkSoft }).setOrigin(1, 0));
      if (m.ailment && !dead) c.add(pixelText(this, x + 160, y + 38, String(m.ailment).toUpperCase().slice(0, 3), { size: TEXT.body, color: '#c03028' }));
      if (focused) c.add(pixelText(this, x - 6, y + 22, '▶', { size: TEXT.body }));
    }
    openActions(m, i) {
      this.lastIndex = i;
      this.menu.blur();
      const close = () => { this.pop?.destroy(); this.pop = null; this.menu.takeFocus(); this.typer?.show('Escolha um Pokémon.'); };
      const items = [{ label: 'SUMÁRIO', onSelect: () => { close(); command('summary', i); } }];
      if (i !== R.active && m.hp > 0) items.push({ label: 'LIDERAR', onSelect: () => { close(); command('lead', i); } });
      items.push({ label: 'CANCELAR', onSelect: close });
      this.pop = popup(this, { x: WIDTH - 130, y: HEIGHT - 60 - items.length * 22, w: 124, items, onClose: close });
      this.typer?.show(`O que fazer com ${nm(m)}?`);
    }
  }

  // ---------- Bag ----------
  // Items, categories and which ones can be used here come from the engine (BagView.data); using an
  // item is the engine's own flow: sel(item) → card(party member) [→ inventoryHubMove(move)].
  const srcOf = html => /src="([^"]+)"/.exec(html || '')?.[1] || '';
  const itemImage = (scene, c, src, x, y, size) => {
    if (!src) return;
    const img = scene.add.image(x, y, '__DEFAULT').setVisible(false); c.add(img);
    ensureTexture(scene, 'item:' + src, src, () => { if (img.active) img.setTexture('item:' + src).setDisplaySize(size, size).setVisible(true); });
  };
  class BagScene extends ScreenScene {
    constructor() { super('bag'); }
    stateKey() { const d = window.BagView?.data(); return [this.notice, d?.tab, d?.entries.map(e => [e.id, e.qty, e.usable]), S.sel, S.itemPicking, S.itemTarget, S.msg, R.team.map(m => [m.hp, m.pp])]; }
    teardown() { this.side?.destroy(); this.side = null; this.pop?.destroy(); this.pop = null; super.teardown(); }
    build() {
      const data = window.BagView.data(), shown = data.tab === 'all' ? data.entries : data.entries.filter(e => e.cat === data.tab);
      const total = data.entries.reduce((n, e) => n + e.qty, 0);
      this.backdrop(); this.header('Mochila', `${total} ${total === 1 ? 'item' : 'itens'}`);
      this.win(4, 36, 118, 178); this.win(126, 36, 208, 178); this.win(338, 36, 138, 178);
      const detail = this.add.container(0, 0); this.root.add(detail);
      const showDetail = e => {
        detail.removeAll(true); if (!e) return;
        itemImage(this, detail, srcOf(e.ico), 407, 70, 40);
        detail.add(pixelText(this, 407, 94, e.name, { size: TEXT.large, width: 128, align: 'center' }).setOrigin(0.5, 0));
        detail.add(pixelText(this, 344, 118, e.desc || '', { size: TEXT.body, color: COLORS.inkSoft, width: 126 }));
        detail.add(pixelText(this, 344, 194, e.usable ? 'Z: usar' : e.hint, { size: TEXT.small, color: e.usable ? '#2a8048' : COLORS.inkSoft, width: 126 }));
      };
      this.listIndex = Math.min(this.listIndex || 0, Math.max(0, shown.length - 1));
      this.menu = new Menu(this, {
        x: 130, y: 41, columns: 1, cellW: 200, cellH: 21, rows: 8, input: engine.input, index: this.listIndex,
        items: shown.length ? shown.map(e => ({ e, onFocus: () => showDetail(e), onSelect: () => { this.listIndex = this.menu.index; this.notice = ''; if (e.usable) command('sel', e.id); } })) : [{ empty: true, disabled: true }],
        onBack: () => command('visualReturnHub'),
        drawCell: (c, item, x, y, focused) => {
          if (item.empty) { c.add(pixelText(this, x + 6, y + 4, total ? 'Nada nesta categoria.' : 'Mochila vazia.', { size: TEXT.body, color: COLORS.disabled })); return; }
          const e = item.e;
          if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, 198, 20, 3));
          itemImage(this, c, srcOf(e.ico), x + 11, y + 10, 16);
          c.add(pixelText(this, x + 24, y + 4, e.name, { size: TEXT.body, color: e.usable ? COLORS.ink : COLORS.inkSoft }));
          c.add(pixelText(this, x + 194, y + 4, `×${e.qty}`, { size: TEXT.body }).setOrigin(1, 0));
        },
      });
      this.root.add(this.menu.container);
      showDetail(shown[this.menu.index]);
      const tabs = [{ id: 'all', label: 'Todos' }, ...data.categories];
      this.side = new Menu(this, {
        x: 8, y: 41, columns: 1, cellW: 112, cellH: 19, input: engine.input, index: Math.max(0, tabs.findIndex(t => t.id === data.tab)),
        items: tabs.map(t => ({ ...t, active: t.id === data.tab, onSelect: () => { this.listIndex = 0; this.focusSide = false; command('bagTab', t.id); } })),
        onBack: () => command('visualReturnHub'),
        drawCell: (c, item, x, y, focused) => {
          if (focused || item.active) c.add(this.add.graphics().fillStyle(item.active ? 0xd8e8f8 : COLORS.menuFocus, 1).fillRoundedRect(x, y, 110, 17, 3));
          if (focused) c.add(pixelText(this, x + 3, y + 3, '▶', { size: TEXT.body }));
          c.add(pixelText(this, x + 13, y + 3, item.label, { size: TEXT.body, color: item.active ? '#285878' : COLORS.ink }));
        },
      });
      this.root.add(this.side.container);
      // ◀ ▶ moves between the categories and the item list.
      const sideHandle = this.side.handle.bind(this.side), listHandle = this.menu.handle.bind(this.menu);
      this.side.handle = action => { if (action === 'right') { this.focusSide = false; this.side.blur(); this.menu.takeFocus(); return true; } return sideHandle(action); };
      this.menu.handle = action => { if (action === 'left') { this.focusSide = true; this.menu.blur(); this.side.takeFocus(); return true; } return listHandle(action); };
      if (this.focusSide) { this.menu.blur(); this.side.takeFocus(); } else { this.side.blur(); this.menu.takeFocus(); }
      if (S.sel && S.itemPicking) this.openMoves();
      else if (S.sel) this.openTargets();
      this.message(S.msg || (!S.sel && this.notice) || (S.sel ? `Usar ${ITEMS[S.sel]?.n || 'item'} em qual Pokémon?` : total ? 'Escolha um item.' : 'Sua mochila está vazia.'), { y: HEIGHT - 52, h: 48 });
    }
    // Party list to use the selected item on (the engine applies it and reports the result).
    openTargets() {
      this.menu.blur(); this.side.blur();
      const cancel = () => command('sel', S.sel);
      this.pop = popup(this, {
        x: 130, y: 44, w: 200, cellH: 18,
        items: R.team.map((m, i) => ({ label: `${nm(m)}  Nv${m.lvl}  ${m.hp}/${m.maxHp}`, size: TEXT.body, onSelect: () => { command('card', i); this.backToList(); } })).concat([{ label: 'CANCELAR', size: TEXT.body, onSelect: cancel }]),
        onClose: cancel,
      });
    }
    // After using (or failing to use) an item, go back to the list like the main games do.
    backToList() { const said = S.msg; if (S.sel && !S.itemPicking) { command('sel', S.sel); this.notice = said; } }
    // Ether-like items ask which move to restore.
    openMoves() {
      this.menu.blur(); this.side.blur();
      const m = R.team[S.itemTarget];
      this.pop = popup(this, {
        x: 130, y: 60, w: 200, cellH: 18,
        items: (m?.moves || []).map(id => ({ label: `${window.gameExpansion.moveName(id)}  ${m.pp[id]}/${M[id].pp}`, size: TEXT.body, onSelect: () => { command('inventoryHubMove', id); this.backToList(); } })),
        onClose: () => command('sel', S.sel),
      });
    }
  }

  // ---------- Shop ----------
  // Stock, tabs and limits come from the engine (ShopView.data). Buying is the engine's own flow:
  // shopQty(item:quantity) then buy(item); the quantity window works like the Poké Mart's.
  class ShopScene extends ScreenScene {
    constructor() { super('shop'); }
    stateKey() { const d = window.ShopView?.data(); return [this.buying, d?.tab, d?.money, d?.items.map(e => [e.i, e.qty, e.sold, e.canBuy]), S.msg]; }
    teardown() { this.side?.destroy(); this.side = null; this.qtyRelease?.(); this.qtyRelease = null; super.teardown(); }
    build() {
      const data = window.ShopView.data(), shown = data.items;
      this.backdrop(); this.header('Loja', money(data.money));
      this.win(4, 36, 118, 178); this.win(126, 36, 208, 178); this.win(338, 36, 138, 178);
      const detail = this.add.container(0, 0); this.root.add(detail);
      const showDetail = e => {
        detail.removeAll(true); if (!e) return;
        itemImage(this, detail, srcOf(e.ico), 407, 70, 40);
        detail.add(pixelText(this, 407, 94, e.name, { size: TEXT.large, width: 128, align: 'center' }).setOrigin(0.5, 0));
        let y = 118;
        if (e.type) {
          detail.add(this.add.rectangle(344, y + 1, 40, 11, typeColor(e.type)).setOrigin(0).setStrokeStyle(1, 0x303030, 0.4));
          detail.add(pixelText(this, 364, y, typeName(e.type), { size: TEXT.small, color: '#202020' }).setOrigin(0.5, 0));
          y += 16;
        }
        detail.add(pixelText(this, 344, y, e.desc, { size: TEXT.body, color: COLORS.inkSoft, width: 126 }));
        detail.add(pixelText(this, 344, 194, e.sold ? 'Esgotado' : e.once ? 'Compra única' : `Até ${e.max} com seu saldo`, { size: TEXT.small, color: COLORS.inkSoft, width: 126 }));
      };
      this.listIndex = Math.min(this.listIndex || 0, Math.max(0, shown.length - 1));
      this.menu = new Menu(this, {
        x: 130, y: 41, columns: 1, cellW: 200, cellH: 21, rows: 8, input: engine.input, index: this.listIndex,
        items: shown.length ? shown.map(e => ({ e, onFocus: () => showDetail(e), onSelect: () => this.startBuying(e) })) : [{ empty: true, disabled: true }],
        onBack: () => command('shop'),
        drawCell: (c, item, x, y, focused) => {
          if (item.empty) { c.add(pixelText(this, x + 6, y + 4, 'Nada à venda aqui.', { size: TEXT.body, color: COLORS.disabled })); return; }
          const e = item.e, off = e.sold || data.money < e.price;
          if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, 198, 20, 3));
          itemImage(this, c, srcOf(e.ico), x + 11, y + 10, 16);
          c.add(pixelText(this, x + 24, y + 4, e.name, { size: TEXT.body, color: off ? COLORS.inkSoft : COLORS.ink }));
          c.add(pixelText(this, x + 194, y + 4, e.sold ? 'Esgotado' : money(e.price), { size: TEXT.body, color: off ? '#b83838' : COLORS.ink }).setOrigin(1, 0));
        },
      });
      this.root.add(this.menu.container);
      showDetail(shown[this.menu.index]);
      this.side = new Menu(this, {
        x: 8, y: 41, columns: 1, cellW: 112, cellH: 19, input: engine.input, index: Math.max(0, data.tabs.findIndex(t => t.id === data.tab)),
        items: data.tabs.map(t => ({ ...t, active: t.id === data.tab, onSelect: () => { this.listIndex = 0; this.focusSide = false; command('shopTab', t.id); } })),
        onBack: () => command('shop'),
        drawCell: (c, item, x, y, focused) => {
          if (focused || item.active) c.add(this.add.graphics().fillStyle(item.active ? 0xd8e8f8 : COLORS.menuFocus, 1).fillRoundedRect(x, y, 110, 17, 3));
          if (focused) c.add(pixelText(this, x + 3, y + 3, '▶', { size: TEXT.body }));
          c.add(pixelText(this, x + 13, y + 3, item.label, { size: TEXT.body, color: item.active ? '#285878' : COLORS.ink }));
        },
      });
      this.root.add(this.side.container);
      const sideHandle = this.side.handle.bind(this.side), listHandle = this.menu.handle.bind(this.menu);
      this.side.handle = action => { if (action === 'right') { this.focusSide = false; this.side.blur(); this.menu.takeFocus(); return true; } return sideHandle(action); };
      this.menu.handle = action => { if (action === 'left') { this.focusSide = true; this.menu.blur(); this.side.takeFocus(); return true; } return listHandle(action); };
      if (this.focusSide) { this.menu.blur(); this.side.takeFocus(); } else { this.side.blur(); this.menu.takeFocus(); }
      const buying = shown.find(e => e.i === this.buying);
      if (buying && !buying.sold) this.quantityWindow(buying);
      else this.buying = null;
      this.message(S.msg || (buying ? `${buying.name}? Quantos você quer?` : 'Posso ajudar? Escolha um item.'), { y: HEIGHT - 52, h: 48 });
    }
    startBuying(e) {
      this.listIndex = this.menu.index;
      if (e.sold) return;
      this.buying = e.i; this.sync();
    }
    // ▲▼ ±1, ◀▶ ±10, Z buys, X cancels.
    quantityWindow(e) {
      this.menu.blur(); this.side.blur();
      const x = 230, y = 150, g = this.add.graphics(); this.root.add(g);
      drawWindow(g, x, y, 104, 40, { fill: COLORS.menuFill, border: COLORS.menuBorder, inner: COLORS.menuInner, radius: 5 });
      this.root.add(pixelText(this, x + 10, y + 6, `×${String(e.qty).padStart(2, '0')}`, { size: TEXT.large }));
      this.root.add(pixelText(this, x + 96, y + 9, money(e.price * e.qty), { size: TEXT.body, color: e.canBuy ? COLORS.ink : '#b83838' }).setOrigin(1, 0));
      if (!e.once) this.root.add(pixelText(this, x + 10, y + 26, '▲▼ ±1  ◀▶ ±10', { size: TEXT.small, color: COLORS.inkSoft }));
      const set = q => { if (!e.once && q !== e.qty) command('shopQty', `${e.i}:${q}`); };
      const handler = action => {
        if (action === 'up') set(Math.min(e.max || 1, e.qty + 1));
        else if (action === 'down') set(Math.max(1, e.qty - 1));
        else if (action === 'right') set(Math.min(e.max || 1, e.qty + 10));
        else if (action === 'left') set(Math.max(1, e.qty - 10));
        else if (action === 'confirm') { if (e.canBuy) { this.buying = null; command('buy', e.i); } }
        else if (action === 'back') { this.buying = null; this.sync(); }
        return true;
      };
      this.qtyRelease = engine.input.push(handler);
    }
  }

  // ---------- PC ----------
  // Journey box (party ⇄ box, like "Mover Pokémon") and the champions' box. The journey box only
  // exists when the engine offers it (opened from the journey); every move is deposit/withdraw.
  const PC_STATES = { ready: 'Disponível no pós-game', active: 'Tentativa em andamento', lost: 'Memorial · Permadeath encerrado', completed: 'Pós-game concluído' };
  class PCScene extends ScreenScene {
    constructor() { super('pc'); }
    hasRun() { return !!R && !!document.querySelector('#app [data-act="deposit"]'); }
    stateKey() { return [this.hasRun(), S.presentationPCBox, R?.team.map(m => [m.sp, m.lvl, m.hp]), R?.pc.map(m => [m.sp, m.lvl, m.hp]), (META.championTeams || []).map(t => [t.id, t.state]), S.msg]; }
    teardown() { for (const k of ['tabs', 'party', 'pop']) { this[k]?.destroy(); this[k] = null; } super.teardown(); }
    build() {
      const run = this.hasRun(), box = run ? (S.presentationPCBox || 'run') : 'champions';
      this.backdrop(); this.header('PC', run ? `Caixa ${R.pc.length}/120` : 'Equipes campeãs');
      const tabs = (run ? [{ id: 'run', label: 'Caixa da jornada' }] : []).concat([{ id: 'champions', label: 'Equipes campeãs' }]);
      this.tabs = new Menu(this, {
        x: 6, y: 36, columns: tabs.length, cellW: 120, cellH: 18, input: engine.input, index: tabs.findIndex(t => t.id === box),
        items: tabs.map(t => ({ ...t, active: t.id === box, onSelect: () => { this.region = 'list'; command('presentationPCBox', t.id); } })),
        onBack: () => command('subBack'),
        drawCell: (c, item, x, y, focused) => {
          c.add(this.add.graphics().fillStyle(item.active ? 0xf8f8f0 : 0x506878, 1).fillRoundedRect(x, y, 116, 16, 4).lineStyle(focused ? 2 : 1, focused ? COLORS.messageBorder : 0x303840, 1).strokeRoundedRect(x, y, 116, 16, 4));
          c.add(pixelText(this, x + 58, y + 2, item.label, { size: TEXT.body, color: item.active ? COLORS.ink : '#e8f0f4' }).setOrigin(0.5, 0));
        },
      });
      this.root.add(this.tabs.container);
      if (box === 'run') this.buildRun(); else this.buildChampions();
      // ▲ from the top of a list reaches the tabs; ▼ from the tabs goes back.
      const tabsHandle = this.tabs.handle.bind(this.tabs);
      this.tabs.handle = action => { if (action === 'down') { this.focusRegion(this.lastList || 'list'); return true; } return tabsHandle(action); };
      this.focusRegion(this.region || 'list');
    }
    focusRegion(region) {
      const menus = { tabs: this.tabs, party: this.party, list: this.menu };
      if (!menus[region]) region = 'list';
      if (region !== 'tabs') this.lastList = region;
      this.region = region;
      for (const [k, m] of Object.entries(menus)) if (m && k !== region) m.blur();
      menus[region]?.takeFocus();
    }
    buildRun() {
      this.win(4, 58, 150, 156); this.win(158, 58, 198, 156); this.win(360, 58, 116, 156);
      const detail = this.add.container(0, 0); this.root.add(detail);
      const show = (m, where) => {
        detail.removeAll(true); if (!m) return;
        addSpecies(this, detail, m.sp, 418, 128, { scale: 1 });
        detail.add(pixelText(this, 418, 132, nm(m), { size: TEXT.large, width: 108, align: 'center', color: m.hp > 0 ? COLORS.ink : COLORS.disabled }).setOrigin(0.5, 0));
        detail.add(pixelText(this, 366, 156, `Nv${m.lvl}`, { size: TEXT.body }));
        detail.add(pixelText(this, 470, 156, m.hp > 0 ? `${m.hp}/${m.maxHp}` : 'Desmaiado', { size: TEXT.body, color: m.hp > 0 ? COLORS.inkSoft : '#b83838' }).setOrigin(1, 0));
        this.hpBar(detail, 367, 172, 102, m);
        (SP[m.sp]?.t || []).forEach((t, k) => {
          detail.add(this.add.rectangle(367 + k * 52, 182, 48, 11, typeColor(t)).setOrigin(0).setStrokeStyle(1, 0x303030, 0.4));
          detail.add(pixelText(this, 391 + k * 52, 181, typeName(t), { size: TEXT.small, color: '#202020' }).setOrigin(0.5, 0));
        });
        detail.add(pixelText(this, 366, 198, where, { size: TEXT.small, color: COLORS.inkSoft }));
      };
      const lastAlive = m => R.team.filter(p => p.hp > 0).length - (m.hp > 0 ? 1 : 0) < 1;
      this.party = new Menu(this, {
        x: 8, y: 62, columns: 1, cellW: 142, cellH: 25, input: engine.input, index: this.partyIndex,
        items: R.team.map((m, i) => ({ m, i, onFocus: () => show(m, 'Na equipe'), onSelect: () => this.openActions('party', m, i, lastAlive(m)) })),
        onBack: () => command('subBack'),
        drawCell: (c, { m, i }, x, y, focused) => {
          if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, 140, 23, 3));
          addIcon(this, c, m.sp, x + 16, y + 22, 1 / 4).setAlpha(m.hp > 0 ? 1 : 0.4);
          c.add(pixelText(this, x + 34, y + 2, nm(m), { size: TEXT.body, color: m.hp > 0 ? COLORS.ink : COLORS.disabled }));
          c.add(pixelText(this, x + 34, y + 12, `Nv${m.lvl}${i === R.active ? ' · ★' : ''}`, { size: TEXT.small, color: COLORS.inkSoft }));
          if (m.hp <= 0) c.add(pixelText(this, x + 136, y + 7, '✝', { size: TEXT.body, color: '#b83838' }).setOrigin(1, 0));
        },
      });
      this.root.add(this.party.container);
      this.root.add(pixelText(this, 12, 214 - 13, `Equipe ${R.team.length}/6`, { size: TEXT.small, color: COLORS.inkSoft }));
      const cols = 6;
      this.menu = new Menu(this, {
        x: 162, y: 62, columns: cols, cellW: 32, cellH: 36, rows: 4, input: engine.input, index: this.boxIndex,
        items: R.pc.length ? R.pc.map((m, i) => ({ m, i, onFocus: () => show(m, 'No PC'), onSelect: () => this.openActions('box', m, i, R.team.length >= 6) })) : [{ empty: true, disabled: true }],
        onBack: () => command('subBack'),
        drawCell: (c, item, x, y, focused) => {
          if (item.empty) { c.add(pixelText(this, x + 4, y + 4, 'Caixa vazia.', { size: TEXT.body, color: COLORS.disabled })); return; }
          if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, 30, 34, 4).lineStyle(1, COLORS.messageBorder, 1).strokeRoundedRect(x, y, 30, 34, 4));
          addIcon(this, c, item.m.sp, x + 15, y + 30, 1 / 4).setAlpha(item.m.hp > 0 ? 1 : 0.4);
        },
        cursor: false,
      });
      this.root.add(this.menu.container);
      const partyHandle = this.party.handle.bind(this.party), boxHandle = this.menu.handle.bind(this.menu);
      this.party.handle = action => {
        if (action === 'right') { this.focusRegion('list'); return true; }
        if (action === 'left') return true;
        if (action === 'up' && this.party.index === 0) { this.focusRegion('tabs'); return true; }
        return partyHandle(action);
      };
      this.menu.handle = action => {
        if (action === 'left' && this.menu.index % cols === 0) { this.focusRegion('party'); return true; }
        if (action === 'up' && this.menu.index < cols) { this.focusRegion('tabs'); return true; }
        return boxHandle(action);
      };
      const focused = this.region === 'party' ? R.team[this.party.index] : R.pc[this.menu.index];
      show(focused || R.team[0], this.region === 'party' || !R.pc.length ? 'Na equipe' : 'No PC');
      if (!R.pc.length && this.region !== 'tabs') this.region = 'party';
      this.message(S.msg || 'Z: opções  ◀ ▶: equipe/caixa  X: sair', { y: HEIGHT - 52, h: 48 });
    }
    openActions(where, m, i, blocked) {
      if (where === 'party') this.partyIndex = i; else this.boxIndex = i;
      this.party.blur(); this.menu.blur();
      const close = () => { this.pop?.destroy(); this.pop = null; this.focusRegion(where === 'party' ? 'party' : 'list'); this.typer?.show('Z: opções  ◀ ▶: equipe/caixa  X: sair'); };
      const items = where === 'party'
        ? [{ label: 'DEPOSITAR', size: TEXT.body, disabled: blocked, onSelect: () => { close(); command('deposit', i); } }]
        : [{ label: 'RETIRAR', size: TEXT.body, disabled: blocked, onSelect: () => { close(); command('withdraw', i); } }, { label: 'SUMÁRIO', size: TEXT.body, onSelect: () => { close(); command('summary', i); } }];
      items.push({ label: 'CANCELAR', size: TEXT.body, onSelect: close });
      this.pop = popup(this, { x: WIDTH - 112, y: HEIGHT - 66 - items.length * 18, w: 106, cellH: 18, items, onClose: close });
      this.typer?.show(blocked ? (where === 'party' ? 'Precisa ficar ao menos um Pokémon vivo na equipe.' : 'Sua equipe está cheia.') : `O que fazer com ${nm(m)}?`);
    }
    buildChampions() {
      this.win(4, 58, WIDTH - 8, 156);
      const teams = META.championTeams || [];
      const usable = id => { const b = document.querySelector(`#app [data-act="postgame"][data-v="${CSS.escape(id)}"]`); return !!b && !b.disabled; };
      const items = teams.map(t => ({ t, disabled: false, onSelect: () => { if (usable(t.id)) command('postgame', t.id); } }));
      if (document.querySelector('#app [data-act="openDouble"]')) items.push({ label: 'Escolher equipe para duplas', onSelect: () => command('openDouble') });
      this.menu = new Menu(this, {
        x: 10, y: 63, columns: 1, cellW: WIDTH - 20, cellH: 37, rows: 4, input: engine.input, index: this.champIndex,
        items: items.length ? items : [{ empty: true, disabled: true }],
        onBack: () => command('subBack'),
        drawCell: (c, item, x, y, focused) => {
          if (item.empty) { c.add(pixelText(this, x + 6, y + 6, 'Vença Lance e Blue para guardar sua primeira equipe.', { size: TEXT.body, color: COLORS.disabled })); return; }
          if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, WIDTH - 22, 35, 4));
          if (focused) c.add(pixelText(this, x + 3, y + 11, '▶', { size: TEXT.body }));
          if (!item.t) { c.add(pixelText(this, x + 14, y + 10, item.label, { size: TEXT.large })); return; }
          const t = item.t;
          c.add(pixelText(this, x + 14, y + 3, `Equipe campeã · ${new Date(t.date || Date.now()).toLocaleDateString('pt-BR')}`, { size: TEXT.body }));
          c.add(pixelText(this, x + 14, y + 17, (PC_STATES[t.state] || 'Memorial') + (usable(t.id) ? ' · Z: usar em dupla' : ''), { size: TEXT.small, color: COLORS.inkSoft }));
          (t.original || t.team).slice(0, 6).forEach((m, k) => addIcon(this, c, m.sp, x + 250 + k * 34, y + 33, 1 / 4));
        },
      });
      this.root.add(this.menu.container);
      this.message(S.msg || 'Equipes da Liga: só para o pós-game em dupla.', { y: HEIGHT - 52, h: 48 });
    }
  }

  return { TeamScene, BagScene, ShopScene, PCScene };
}
