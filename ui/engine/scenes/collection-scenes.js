// Collection screens drawn in Phaser: the Pokédex. Filters use the same state the engine already
// keeps (S.dexFilter, S.dexType, S.dexEvolving, S.dexQuery) and "back" is the engine's subBack.
import { WIDTH, HEIGHT, TEXT, COLORS } from '../config.js';
import { pixelText, Menu } from '../ui.js';
import { command } from '../bridge.js';
import { addSpecies, addIcon } from '../assets.js';
import { defineScreenScene } from './screen-base.js';

const typeName = t => TYPES[t]?.[0] || t;
const typeColor = t => Phaser.Display.Color.HexStringToColor(TYPES[t]?.[1] || '#a8a878').color;

export function defineCollectionScenes(engine) {
  const ScreenScene = defineScreenScene(engine);

  // Text field over the game for searching (typing stays HTML: accents, paste).
  function searchField(scene, { x, y, w, h, value, onDone }) {
    const input = document.createElement('input');
    Object.assign(input, { type: 'search', value, autocomplete: 'off', spellcheck: false, placeholder: 'Nome ou número' });
    input.className = 'game-text-field';
    const place = () => {
      const r = scene.game.canvas.getBoundingClientRect(), z = r.width / WIDTH;
      Object.assign(input.style, { left: `${r.left + x * z}px`, top: `${r.top + y * z}px`, width: `${w * z}px`, height: `${h * z}px`, fontSize: `${Math.max(10, Math.round(z * 10))}px`, background: '#ffffff', border: `${Math.max(1, Math.round(z))}px solid #d8683c` });
    };
    input.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Enter') { event.preventDefault(); onDone(input.value); }
      if (event.key === 'Escape') { event.preventDefault(); onDone(null); }
    });
    document.getElementById('game-stage').append(input);
    place(); addEventListener('resize', place);
    input.cleanup = () => removeEventListener('resize', place);
    setTimeout(() => input.focus(), 0);
    return input;
  }

  // ---------- Pokédex ----------
  class DexScene extends ScreenScene {
    constructor() { super('dex'); }
    entries() {
      const query = String(S.dexQuery || '').toLowerCase().trim(), filter = S.dexFilter || 'all';
      return Object.values(SP).sort((a, b) => a.dex - b.dex).filter(p =>
        (filter === 'caught' ? META.caught.includes(p.id) : filter === 'missing' ? !META.caught.includes(p.id) : filter === 'seen' ? META.seen.includes(p.id) : true)
        && (!S.dexType || p.t.includes(S.dexType)) && (!S.dexEvolving || (p.evolution || []).some(o => SP[o.to]))
        && (!query || p.n.toLowerCase().includes(query) || String(p.dex).includes(query.replace(/^#/, ''))));
    }
    stateKey() { return [S.dexFilter, S.dexType, S.dexEvolving, S.dexQuery, META.seen.length, META.caught.length]; }
    teardown() { this.search?.cleanup?.(); this.search?.remove(); this.search = null; this.side?.destroy(); this.side = null; super.teardown(); }
    build() {
      this.backdrop(); this.header('Pokédex', `${META.seen.length} vistos · ${META.caught.length} obtidos`);
      const types = ['', ...Object.keys(TYPES)], filter = S.dexFilter || 'all', set = (k, v) => { S[k] = v; render(); };
      const cycleType = step => set('dexType', types[(types.indexOf(S.dexType || '') + step + types.length) % types.length]);
      const filters = [['all', 'Todos'], ['seen', 'Vistos'], ['caught', 'Obtidos'], ['missing', 'Não obtidos']];
      const sideItems = [
        ...filters.map(([id, label]) => ({ label, active: filter === id, onSelect: () => command('dexFilter', id) })),
        { label: `Tipo: ${S.dexType ? typeName(S.dexType) : 'Todos'}`, change: cycleType, onSelect: () => cycleType(1) },
        { label: `Evolui: ${S.dexEvolving ? 'Sim' : 'Todos'}`, onSelect: () => set('dexEvolving', !S.dexEvolving) },
        { label: S.dexQuery ? `“${S.dexQuery}”` : 'Pesquisar…', onSelect: () => this.openSearch() },
      ];
      this.win(4, 36, 118, 178);
      const list = this.entries();
      this.win(126, 36, 208, 178);
      this.win(338, 36, 138, 178);
      const detail = this.add.container(0, 0); this.root.add(detail);
      const showDetail = p => {
        detail.removeAll(true); if (!p) return;
        const seen = META.seen.includes(p.id), owned = META.caught.includes(p.id);
        detail.add(pixelText(this, 346, 42, `#${String(p.dex).padStart(3, '0')}`, { size: TEXT.body, color: COLORS.inkSoft }));
        detail.add(pixelText(this, 468, 42, owned ? '● Obtido' : seen ? '◉ Visto' : '—', { size: TEXT.body, color: owned ? '#b83838' : COLORS.inkSoft }).setOrigin(1, 0));
        if (!seen) { detail.add(pixelText(this, 407, 100, '?', { size: 40, color: COLORS.disabled }).setOrigin(0.5)); detail.add(pixelText(this, 407, 150, 'Não visto', { size: TEXT.large, color: COLORS.disabled }).setOrigin(0.5, 0)); return; }
        addSpecies(this, detail, p.id, 407, 140, { room: 84 });
        detail.add(pixelText(this, 407, 142, p.n, { size: TEXT.large }).setOrigin(0.5, 0));
        p.t.forEach((t, i) => {
          const tx = 407 + (i - (p.t.length - 1) / 2) * 52;
          detail.add(this.add.rectangle(tx, 172, 48, 13, typeColor(t)).setStrokeStyle(1, 0x303030, 0.4));
          detail.add(pixelText(this, tx, 167, typeName(t), { size: TEXT.small, color: '#202020' }).setOrigin(0.5, 0));
        });
        const evo = (p.evolution || []).filter(o => SP[o.to]).map(o => SP[o.to].n);
        if (evo.length) detail.add(pixelText(this, 346, 184, `Evolui: ${evo.join(', ')}`, { size: TEXT.small, color: COLORS.inkSoft, width: 124 }));
      };
      this.menu = new Menu(this, {
        x: 132, y: 42, columns: 2, cellW: 100, cellH: 21, rows: 8, input: engine.input, index: this.listIndex,
        items: list.length ? list.map(p => ({ p, onFocus: () => { this.listIndex = this.menu?.index; showDetail(p); } })) : [{ label: 'Nenhum encontrado.', disabled: true }],
        onBack: () => command('subBack'),
        drawCell: (c, item, x, y, focused) => {
          if (!item.p) { c.add(pixelText(this, x + 4, y + 4, item.label, { size: TEXT.body, color: COLORS.disabled })); return; }
          const p = item.p, seen = META.seen.includes(p.id);
          if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, 98, 20, 3));
          if (seen) addIcon(this, c, p.id, x + 12, y + 20, 1 / 3).setScale(0.6);
          c.add(pixelText(this, x + 24, y + 4, seen ? p.n : '???', { size: TEXT.body, color: seen ? COLORS.ink : COLORS.disabled }));
          if (META.caught.includes(p.id)) c.add(pixelText(this, x + 94, y + 4, '●', { size: TEXT.small, color: '#b83838' }).setOrigin(1, 0));
        },
      });
      this.root.add(this.menu.container);
      if (list[this.menu.index]) showDetail(list[this.menu.index]);
      // Filters on the left; left/right move between the filter menu and the list.
      this.side = new Menu(this, {
        x: 8, y: 42, columns: 1, cellW: 112, cellH: 24, input: engine.input, index: this.sideIndex,
        items: sideItems, onBack: () => command('subBack'),
        drawCell: (c, item, x, y, focused) => {
          if (focused || item.active) c.add(this.add.graphics().fillStyle(item.active ? 0xd8e8f8 : COLORS.menuFocus, 1).fillRoundedRect(x, y, 110, 21, 3));
          if (focused) c.add(pixelText(this, x + 3, y + 5, '▶', { size: TEXT.body }));
          c.add(pixelText(this, x + 13, y + 5, item.label, { size: TEXT.body, color: item.active ? '#285878' : COLORS.ink }));
        },
      });
      this.root.add(this.side.container);
      const sideHandle = this.side.handle.bind(this.side), listHandle = this.menu.handle.bind(this.menu);
      this.side.handle = action => {
        this.sideIndex = this.side.index;
        const item = this.side.items[this.side.index];
        if (action === 'right' && !item.change) { this.focusSide = false; this.side.blur(); this.menu.takeFocus(); return true; }
        if ((action === 'left' || action === 'right') && item.change) { item.change(action === 'left' ? -1 : 1); return true; }
        return sideHandle(action);
      };
      this.menu.handle = action => {
        if (action === 'left' && this.menu.index % 2 === 0) { this.focusSide = true; this.menu.blur(); this.side.takeFocus(); return true; }
        return listHandle(action);
      };
      if (this.focusSide) { this.menu.blur(); this.side.takeFocus(); } else { this.side.blur(); this.menu.takeFocus(); }
      this.hint('◀ ▶ filtros/lista · X volta');
    }
    openSearch() {
      if (this.search) return;
      engine.input.enabled = false;
      this.search = searchField(this, { x: 132, y: 216, w: 200, h: 18, value: S.dexQuery || '', onDone: value => {
        this.search.cleanup(); this.search.remove(); this.search = null; engine.input.enabled = true;
        if (value !== null) { S.dexQuery = value.trim(); this.listIndex = 0; render(); }
      } });
    }
  }

  // ---------- Trainer journal: history and achievements ----------
  class JournalScene extends ScreenScene {
    constructor() { super('journal'); }
    stateKey() { return [S.journal, META.history.length, META.runs]; }
    teardown() { this.side?.destroy(); this.side = null; super.teardown(); }
    build() {
      const tab = S.journal === 'achievements' ? 'achievements' : 'history';
      this.backdrop(); this.header('Diário do treinador', tab === 'history' ? `${META.runs} jornadas` : `${ACHIEVEMENTS.filter(a => a.progress() >= a.target).length}/${ACHIEVEMENTS.length} conquistas`);
      this.win(4, 36, 118, 60);
      this.win(126, 36, 350, 202);
      const items = tab === 'history' ? this.historyItems() : this.achievementItems();
      this.menu = new Menu(this, {
        x: 132, y: 42, columns: 1, cellW: 338, cellH: 48, rows: 4, input: engine.input,
        items: items.length ? items : [{ empty: true, disabled: true }],
        onBack: () => command('journalBack'),
        drawCell: (c, item, x, y, focused) => item.empty
          ? c.add(pixelText(this, x + 6, y + 6, tab === 'history' ? 'Nenhuma jornada encerrada ainda.' : 'Nenhuma conquista.', { size: TEXT.body, color: COLORS.disabled }))
          : tab === 'history' ? this.drawHistory(c, item, x, y, focused) : this.drawAchievement(c, item, x, y, focused),
      });
      this.root.add(this.menu.container);
      this.side = new Menu(this, {
        x: 8, y: 42, columns: 1, cellW: 112, cellH: 24, input: engine.input, index: tab === 'achievements' ? 1 : 0,
        items: [['history', 'Histórico'], ['achievements', 'Conquistas']].map(([v, label]) => ({ label, active: tab === v, onSelect: () => command('journal', v) })),
        onBack: () => command('journalBack'),
        drawCell: (c, item, x, y, focused) => {
          if (focused || item.active) c.add(this.add.graphics().fillStyle(item.active ? 0xd8e8f8 : COLORS.menuFocus, 1).fillRoundedRect(x, y, 110, 21, 3));
          if (focused) c.add(pixelText(this, x + 3, y + 5, '▶', { size: TEXT.body }));
          c.add(pixelText(this, x + 13, y + 5, item.label, { size: TEXT.body, color: item.active ? '#285878' : COLORS.ink }));
        },
      });
      this.root.add(this.side.container);
      const sideHandle = this.side.handle.bind(this.side), listHandle = this.menu.handle.bind(this.menu);
      this.side.handle = action => { if (action === 'right') { this.focusSide = false; this.side.blur(); this.menu.takeFocus(); return true; } return sideHandle(action); };
      this.menu.handle = action => { if (action === 'left') { this.focusSide = true; this.menu.blur(); this.side.takeFocus(); return true; } return listHandle(action); };
      if (this.focusSide !== false) { this.menu.blur(); this.side.takeFocus(); } else { this.side.blur(); this.menu.takeFocus(); }
      this.hint('◀ ▶ abas/lista · X volta');
    }
    historyItems() { return META.history.map(h => ({ h })); }
    achievementItems() { return ACHIEVEMENTS.map(a => ({ a })); }
    drawHistory(c, { h }, x, y, focused) {
      this.card(c, x, y, 334, 44, focused);
      const title = h.outcome === 'champion' ? '★ Campeão' : h.outcome === 'abandoned' ? 'Jornada abandonada' : 'Fim da jornada';
      c.add(pixelText(this, x + 6, y + 2, title, { size: TEXT.large, color: h.outcome === 'champion' ? '#b07818' : COLORS.ink }));
      c.add(pixelText(this, x + 328, y + 4, h.mode === 'classic' ? 'Clássico' : 'Permadeath', { size: TEXT.body, color: COLORS.inkSoft }).setOrigin(1, 0));
      c.add(pixelText(this, x + 6, y + 22, `${new Date(h.ended).toLocaleDateString('pt-BR')} · ${Number(h.wins) || 0} vitórias · ${Number(h.captures) || 0} capturas`, { size: TEXT.body, color: COLORS.inkSoft }));
      c.add(pixelText(this, x + 6, y + 32, String(h.cause || '').slice(0, 52), { size: TEXT.body, color: COLORS.inkSoft }));
      (h.team || []).filter(m => SP[m.sp]).slice(0, 6).forEach((m, i) => addIcon(this, c, m.sp, x + 220 + i * 18, y + 42, 1 / 3).setScale(0.5));
    }
    drawAchievement(c, { a }, x, y, focused) {
      const progress = Math.min(a.target, a.progress()), earned = progress >= a.target;
      this.card(c, x, y, 334, 44, focused);
      const avatar = Object.values(SP).find(p => p.dex === a.avatar);
      if (avatar) addIcon(this, c, avatar.id, x + 20, y + 34, 1 / 3).setAlpha(earned ? 1 : 0.35);
      c.add(pixelText(this, x + 40, y + 2, a.name, { size: TEXT.large, color: earned ? COLORS.ink : COLORS.inkSoft }));
      c.add(pixelText(this, x + 328, y + 4, earned ? '✓ Desbloqueada' : `${progress} / ${a.target}`, { size: TEXT.body, color: earned ? '#2a8048' : COLORS.inkSoft }).setOrigin(1, 0));
      c.add(pixelText(this, x + 40, y + 22, a.goal, { size: TEXT.body, color: COLORS.inkSoft, width: 200 }));
      c.add(this.add.graphics().fillStyle(COLORS.barTrack, 1).fillRect(x + 250, y + 26, 76, 4).fillStyle(earned ? 0x58d080 : 0x48a8f8, 1).fillRect(x + 250, y + 26, 76 * progress / a.target, 4));
      c.add(pixelText(this, x + 250, y + 32, `Título: ${a.title}`, { size: TEXT.small, color: COLORS.inkSoft }));
    }
  }

  return { DexScene, JournalScene };
}
