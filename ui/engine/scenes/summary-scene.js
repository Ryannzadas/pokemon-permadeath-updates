// Pokémon summary drawn in Phaser, in pages like the main games (◀ ▶ change page). Every change is
// the engine's own action: relearn, teach, equip/unequip, evolve and trade.
import { WIDTH, HEIGHT, TEXT, COLORS } from '../config.js';
import { pixelText, Menu } from '../ui.js';
import { command, engineOptions } from '../bridge.js';
import { addSpecies, ensureTexture } from '../assets.js';
import { defineScreenScene } from './screen-base.js';

const typeName = t => TYPES[t]?.[0] || t;
const typeColor = t => Phaser.Display.Color.HexStringToColor(TYPES[t]?.[1] || '#a8a878').color;
const moveName = id => window.gameExpansion.moveName(id);
const category = mv => mv.cat === 1 ? 'Status' : mv.cat === 3 ? 'Especial' : 'Físico';
const srcOf = html => /src="([^"]+)"/.exec(html || '')?.[1] || '';
const PAGES = [['info', 'INFO'], ['stats', 'STATUS'], ['moves', 'GOLPES'], ['learn', 'APRENDER'], ['item', 'ITEM'], ['evolution', 'EVOLUÇÃO']];
const X0 = 160, X1 = WIDTH - 8; // right panel content

export function defineSummaryScene(engine) {
  const ScreenScene = defineScreenScene(engine);

  class SummaryScene extends ScreenScene {
    constructor() { super('summary'); }
    // Each visit starts on the first page.
    create() { super.create(); this.events.on('sleep', () => { this.page = null; this.listIndex = 0; }); }
    mon() { return (S.summaryBox === 'pc' ? R?.pc : R?.team)?.[S.summary]; }
    stateKey() {
      const m = this.mon();
      return [this.page, S.summary, S.summaryBox, S.presentationSummaryTab, S.msg, JSON.stringify(m), JSON.stringify(R?.bag), this.evolutionKey()];
    }
    evolutionKey() { return S.presentationSummaryTab === 'evolution' ? document.querySelector('#app .summary-tab-panel')?.textContent || '' : ''; }
    teardown() { this.pageRelease?.(); this.pageRelease = null; this.pop?.destroy(); this.pop = null; super.teardown(); }

    build() {
      const m = this.mon();
      if (!m) { this.backdrop(); this.message('Pokémon não encontrado.'); return; }
      this.page ??= 'info';
      const pageIndex = PAGES.findIndex(p => p[0] === this.page);
      this.backdrop();
      this.header('Sumário', S.summaryBox === 'pc' ? 'PC' : 'Equipe');
      // Page tabs: the current one stands out; ◀ ▶ move between them.
      PAGES.forEach(([, label], i) => {
        const x = 96 + i * 63, on = i === pageIndex;
        this.root.add(this.add.graphics().fillStyle(on ? 0xf8f8f0 : 0x3a5a70, 1).fillRoundedRect(x, 7, 60, 16, 4));
        this.root.add(pixelText(this, x + 30, 9, label, { size: TEXT.small, color: on ? COLORS.ink : '#d8e8f0' }).setOrigin(0.5, 0));
      });
      this.buildIdentity(m);
      this.win(154, 36, WIDTH - 158, 178);
      // Page switching, back, and the page's own menu on top (when it has one).
      this.pageRelease = engine.input.push(action => this.pageInput(action));
      this['page_' + this.page](m);
      if (this.menu) {
        const handle = this.menu.handle.bind(this.menu);
        this.menu.handle = action => (action === 'left' || action === 'right') ? this.pageInput(action) : handle(action);
      }
      this.message(S.msg || this.note || (m.hp <= 0 ? `${nm(m)} desmaiou: não pode mudar golpes ou itens.` : '◀ ▶ páginas  X: voltar'), { y: HEIGHT - 52, h: 48 });
      this.note = '';
    }
    pageInput(action) {
      if (action === 'left' || action === 'right') {
        const i = PAGES.findIndex(p => p[0] === this.page), next = PAGES[(i + (action === 'left' ? -1 : 1) + PAGES.length) % PAGES.length][0];
        this.page = next; this.listIndex = 0;
        // The evolution list is computed by the engine and read from its own page.
        const tab = next === 'evolution' ? 'evolution' : next === 'learn' ? 'learn' : next === 'moves' ? 'moves' : 'stats';
        if (S.presentationSummaryTab !== tab) command('presentationSummaryTab', tab); else { this.key = ''; this.sync(); }
        return true;
      }
      if (action === 'back') { command('subBack'); return true; }
      return true;
    }

    buildIdentity(m) {
      this.win(4, 36, 146, 178);
      const dead = m.hp <= 0;
      this.root.add(pixelText(this, 10, 41, `Nº${String(SP[m.sp].dex).padStart(3, '0')}`, { size: TEXT.small, color: COLORS.inkSoft }));
      this.root.add(pixelText(this, 144, 41, `Nv${m.lvl}`, { size: TEXT.body }).setOrigin(1, 0));
      addSpecies(this, this.root, m.sp, 77, 132, { scale: 1 }).setAlpha(dead ? 0.5 : 1);
      this.root.add(pixelText(this, 77, 134, nm(m) + (m.alpha ? ' ★' : ''), { size: TEXT.large, width: 140, align: 'center', color: dead ? COLORS.disabled : COLORS.ink }).setOrigin(0.5, 0));
      (SP[m.sp]?.t || []).forEach((t, k, all) => {
        const x = 77 - all.length * 25 + k * 50;
        this.root.add(this.add.rectangle(x + 2, 156, 46, 11, typeColor(t)).setOrigin(0).setStrokeStyle(1, 0x303030, 0.4));
        this.root.add(pixelText(this, x + 25, 155, typeName(t), { size: TEXT.small, color: '#202020' }).setOrigin(0.5, 0));
      });
      this.root.add(pixelText(this, 10, 172, 'HP', { size: TEXT.small, color: COLORS.inkSoft }));
      this.root.add(pixelText(this, 144, 170, dead ? 'Desmaiado' : `${m.hp}/${m.maxHp}`, { size: TEXT.body, color: dead ? '#b83838' : COLORS.ink }).setOrigin(1, 0));
      this.hpBar(this.root, 11, 184, 132, m);
      if (m.ailment && !dead) this.root.add(pixelText(this, 10, 194, String(m.ailment).toUpperCase(), { size: TEXT.small, color: '#c03028' }));
    }
    row(y, label, value, color = COLORS.ink) {
      this.root.add(pixelText(this, X0 + 4, y, label, { size: TEXT.body, color: COLORS.inkSoft }));
      this.root.add(pixelText(this, X1 - 6, y, String(value), { size: TEXT.body, color }).setOrigin(1, 0));
    }

    page_info(m) {
      const T = JourneyStrategy, held = m.heldItem ? T.items[m.heldItem] : null, cap = JourneyLevelCap.current();
      this.row(42, 'Local', S.summaryBox === 'pc' ? 'PC da jornada' : 'Equipe');
      this.row(56, 'Amizade', `${m.friendship ?? 0}/255`);
      this.row(70, 'Limite da etapa', `Nv ${cap}${m.lvl >= cap ? ' · XP pausado' : ''}`);
      this.row(84, 'Item', held ? held.n : 'Nenhum');
      this.root.add(this.add.rectangle(X0 + 2, 100, X1 - X0 - 6, 1, 0xb8c0c8).setOrigin(0));
      this.root.add(pixelText(this, X0 + 4, 104, 'Habilidade', { size: TEXT.small, color: COLORS.inkSoft }));
      this.root.add(pixelText(this, X0 + 4, 116, T.label(m), { size: TEXT.large }));
      this.root.add(pixelText(this, X0 + 4, 136, T.description(m), { size: TEXT.body, color: COLORS.inkSoft, width: X1 - X0 - 12 }));
    }
    page_stats(m) {
      [['HP', m.maxHp], ['Ataque', m.atk], ['Defesa', m.def], ['At. especial', m.spa], ['Def. especial', m.spd], ['Velocidade', m.spe]]
        .forEach(([label, value], i) => this.row(44 + i * 18, label, value));
      const need = xpNeed(m.lvl), xp = m.xp || 0, ratio = Math.max(0, Math.min(1, xp / need));
      this.row(160, 'Experiência', `${xp}/${need}`);
      this.root.add(this.add.graphics().fillStyle(COLORS.barBorder, 1).fillRoundedRect(X0 + 4, 178, X1 - X0 - 10, 6, 2).fillStyle(COLORS.barTrack, 1).fillRect(X0 + 5, 179, X1 - X0 - 12, 4).fillStyle(0x40a8e8, 1).fillRect(X0 + 5, 179, (X1 - X0 - 12) * ratio, 4));
    }
    moveRow(c, id, x, y, w, focused, right) {
      const mv = M[id];
      if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, w, 21, 3));
      c.add(this.add.rectangle(x + 4, y + 5, 40, 11, typeColor(mv.t)).setOrigin(0).setStrokeStyle(1, 0x303030, 0.4));
      c.add(pixelText(this, x + 24, y + 4, typeName(mv.t), { size: TEXT.small, color: '#202020' }).setOrigin(0.5, 0));
      c.add(pixelText(this, x + 50, y + 4, moveName(id), { size: TEXT.body }));
      if (right) c.add(pixelText(this, x + w - 4, y + 4, right, { size: TEXT.body, color: COLORS.inkSoft }).setOrigin(1, 0));
    }
    moveDetail(container, id) {
      container.removeAll(true); if (!id || !M[id]) return;
      const mv = M[id];
      container.add(this.add.rectangle(X0 + 2, 160, X1 - X0 - 6, 1, 0xb8c0c8).setOrigin(0));
      container.add(pixelText(this, X0 + 4, 166, `${category(mv)} · Poder ${mv.p || '—'} · Precisão ${mv.a ? mv.a + '%' : '—'} · PP ${mv.pp}`, { size: TEXT.body, color: COLORS.inkSoft }));
    }
    page_moves(m) {
      const detail = this.add.container(0, 0); this.root.add(detail);
      this.menu = new Menu(this, {
        x: X0, y: 42, columns: 1, cellW: X1 - X0, cellH: 26, input: engine.input, index: this.listIndex,
        items: m.moves.map(id => ({ id, onFocus: () => this.moveDetail(detail, id) })),
        onBack: () => command('subBack'),
        drawCell: (c, item, x, y, focused) => this.moveRow(c, item.id, x, y, X1 - X0 - 4, focused, `PP ${m.pp?.[item.id] ?? M[item.id].pp}/${M[item.id].pp}`),
      });
      this.root.add(this.menu.container);
      this.moveDetail(detail, m.moves[this.menu.index]);
    }
    page_learn(m) {
      const learned = (m.learned || m.moves).filter(id => !m.moves.includes(id) && M[id]);
      const machines = SP[m.sp].learn.filter(x => x.method === 'machine' && M[x.id] && R.bag['tm:' + x.id] > 0 && !(m.learned || []).includes(x.id));
      const byLevel = SP[m.sp].learn.filter(x => x.method === 'level' && M[x.id] && !(m.learned || m.moves).includes(x.id));
      const items = [
        ...learned.map(id => ({ id, tag: 'Aprendido', onSelect: () => this.relearn(m, id) })),
        ...machines.map(x => ({ id: x.id, tag: 'TM/HM', onSelect: () => this.teach(m, x.id) })),
        ...byLevel.map(x => ({ id: x.id, tag: `Nv ${x.level || 1}`, onSelect: () => { this.typer?.show(`${moveName(x.id)} é aprendido no nível ${x.level || 1}.`); } })),
      ];
      const detail = this.add.container(0, 0); this.root.add(detail);
      this.menu = new Menu(this, {
        x: X0, y: 42, columns: 1, cellW: X1 - X0, cellH: 22, rows: 5, input: engine.input, index: this.listIndex,
        items: items.length ? items.map(i => ({ ...i, onFocus: () => this.moveDetail(detail, i.id) })) : [{ empty: true, disabled: true }],
        onBack: () => command('subBack'),
        drawCell: (c, item, x, y, focused) => {
          if (item.empty) { c.add(pixelText(this, x + 6, y + 4, 'Nada novo para aprender agora.', { size: TEXT.body, color: COLORS.disabled })); return; }
          this.moveRow(c, item.id, x, y, X1 - X0 - 14, focused, item.tag);
        },
      });
      this.root.add(this.menu.container);
      this.moveDetail(detail, items[this.menu.index]?.id);
    }
    // A learned move goes into a free slot or replaces one of the current four.
    relearn(m, id) {
      if (m.hp <= 0) return;
      this.listIndex = this.menu.index; this.menu.blur();
      const close = () => { this.pop?.destroy(); this.pop = null; this.menu.takeFocus(); };
      const items = m.moves.map((old, slot) => ({ label: `No lugar de ${moveName(old)}`, size: TEXT.body, onSelect: () => { close(); command('relearn', `${slot}:${id}`); } }));
      if (m.moves.length < 4) items.unshift({ label: 'Adicionar', size: TEXT.body, onSelect: () => { close(); command('relearn', `${m.moves.length}:${id}`); } });
      items.push({ label: 'CANCELAR', size: TEXT.body, onSelect: close });
      this.pop = this.popup({ x: X1 - 196, y: 44, w: 192, cellH: 18, items, onClose: close });
      this.typer?.show(`Equipar ${moveName(id)}?`);
    }
    teach(m, id) {
      if (m.hp <= 0) return;
      this.listIndex = this.menu.index; this.menu.blur();
      const close = () => { this.pop?.destroy(); this.pop = null; this.menu.takeFocus(); };
      this.pop = this.popup({ x: X1 - 120, y: 44, w: 116, cellH: 18, items: [{ label: 'ENSINAR', size: TEXT.body, onSelect: () => { close(); command('teach', id); } }, { label: 'CANCELAR', size: TEXT.body, onSelect: close }], onClose: close });
      this.typer?.show(`Usar o TM/HM de ${moveName(id)}? Ele é consumido.`);
    }
    page_item(m) {
      const T = JourneyStrategy, held = m.heldItem ? T.items[m.heldItem] : null;
      const icon = (c, ico, x, y, size) => {
        const src = srcOf(ico); if (!src) return;
        const img = this.add.image(x, y, '__DEFAULT').setVisible(false); c.add(img);
        ensureTexture(this, 'item:' + src, src, () => { if (img.active) img.setTexture('item:' + src).setDisplaySize(size, size).setVisible(true); });
      };
      this.root.add(pixelText(this, X0 + 4, 42, 'Equipado', { size: TEXT.small, color: COLORS.inkSoft }));
      if (held) { icon(this.root, held.ico, X0 + 14, 62, 20); this.root.add(pixelText(this, X0 + 28, 54, held.n, { size: TEXT.large })); }
      else this.root.add(pixelText(this, X0 + 4, 54, 'Nenhum item.', { size: TEXT.body, color: COLORS.disabled }));
      const owned = Object.entries(T.items).filter(([id]) => R.bag[id] > 0 && id !== m.heldItem);
      const items = [...(held ? [{ unequip: true, label: 'Retirar e devolver à mochila' }] : []), ...owned.map(([id, x]) => ({ id, x }))];
      const desc = this.add.container(0, 0); this.root.add(desc);
      const describe = item => { desc.removeAll(true); const d = item?.x?.d || held?.d; if (d) desc.add(pixelText(this, X0 + 4, 172, d, { size: TEXT.small, color: COLORS.inkSoft, width: X1 - X0 - 12 })); };
      this.menu = new Menu(this, {
        x: X0, y: 76, columns: 1, cellW: X1 - X0, cellH: 19, rows: 5, input: engine.input, index: this.listIndex,
        items: items.length ? items.map(i => ({ ...i, disabled: m.hp <= 0, onFocus: () => describe(i), onSelect: () => i.unequip ? command('unequip') : command('equip', i.id) })) : [{ empty: true, disabled: true }],
        onBack: () => command('subBack'),
        drawCell: (c, item, x, y, focused) => {
          if (item.empty) { c.add(pixelText(this, x + 6, y + 3, 'Nenhum equipável na mochila.', { size: TEXT.body, color: COLORS.disabled })); return; }
          if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, X1 - X0 - 14, 17, 3));
          if (item.unequip) { c.add(pixelText(this, x + 8, y + 3, item.label, { size: TEXT.body, color: '#b83838' })); return; }
          icon(c, item.x.ico, x + 10, y + 9, 14);
          c.add(pixelText(this, x + 22, y + 3, `Equipar ${item.x.n}`, { size: TEXT.body, color: item.disabled ? COLORS.disabled : COLORS.ink }));
          c.add(pixelText(this, x + X1 - X0 - 20, y + 3, `×${R.bag[item.id]}`, { size: TEXT.body }).setOrigin(1, 0));
        },
      });
      this.root.add(this.menu.container);
      describe(items[this.menu.index]);
    }
    // Conditions and the evolve/trade buttons come from the engine's evolution page.
    page_evolution() {
      const panel = document.querySelector('#app .summary-tab-panel');
      const lines = [...(panel?.querySelectorAll('p') || [])].map(p => p.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
      lines.slice(0, 9).forEach((line, i) => this.root.add(pixelText(this, X0 + 4, 42 + i * 13, line, { size: TEXT.small, color: line.includes('✓') ? '#2a8048' : COLORS.inkSoft, width: X1 - X0 - 12 })));
      const options = engineOptions('.summary-tab-panel [data-act="summaryEvolve"], [data-act="tradePokemon"]');
      if (!options.length) return;
      this.menu = new Menu(this, {
        x: X0, y: 214 - 6 - options.length * 20, columns: 1, cellW: X1 - X0, cellH: 20, input: engine.input, index: this.listIndex,
        items: options.map(o => ({ label: o.label.toUpperCase(), size: TEXT.body, disabled: o.disabled, onSelect: () => command(o.action, o.value) })),
        onBack: () => command('subBack'),
      });
      this.root.add(this.menu.container);
    }
  }

  return { SummaryScene };
}
