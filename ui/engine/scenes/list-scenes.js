// Simple engine pages drawn as game screens: missions, the event between battles, daily challenges,
// memorial, saved classic journeys, the league-cleared choice and the double post-game choice.
// They are lists of cards with actions, read from the engine's own page (like engineOptions); in
// phase 6 the engine hands them over as data.
import { WIDTH, HEIGHT, TEXT, COLORS } from '../config.js';
import { pixelText, Menu } from '../ui.js';
import { command } from '../bridge.js';
import { ensureTexture } from '../assets.js';
import { defineScreenScene } from './screen-base.js';

export const LIST_SCREENS = ['routes', 'missions', 'journeyEvent', 'daily', 'memorial', 'savedJourneys', 'leagueChoice', 'doubleChoice'];
const BACK = ['journeyBack', 'collectionBack', 'subBack', 'back'];
// The way back the toolbar offers on each page (the league-cleared choice has none: a choice is required).
const FALLBACK_BACK = { routes: 'journeyBack', missions: 'journeyBack', journeyEvent: 'journeyBack', daily: 'collectionBack', memorial: 'collectionBack', savedJourneys: 'collectionBack', doubleChoice: 'modeBack' };
const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
const actionOf = b => ({ action: b.dataset.act, value: b.dataset.v ?? '', label: text(b), disabled: b.disabled });

// The page as data: title, intro, back action, cards and loose choices.
function readPage() {
  const panel = document.querySelector('#app .panel h2')?.closest('.panel') || document.querySelector('#app .panel');
  if (!panel) return null;
  const own = [...document.querySelectorAll('#app [data-act]')].find(b => BACK.includes(b.dataset.act));
  const nav = document.querySelector('#game-toolbar .nav-back[data-nav]')?.dataset.nav || FALLBACK_BACK[S.screen];
  const back = own ? actionOf(own) : nav ? { action: nav, value: '' } : null;
  const inCard = el => el.closest('article');
  const cards = [...panel.querySelectorAll('article')].map(a => ({
    title: text(a.querySelector('h3,strong')),
    lines: [...a.querySelectorAll('p,small,label')].filter(el => !el.closest('details') && !el.querySelector('button')).map(text).filter(Boolean),
    images: [...a.querySelectorAll('img')].map(i => i.getAttribute('src')).filter(Boolean).slice(0, 6),
    progress: (p => p ? [Number(p.value), Number(p.max)] : null)(a.querySelector('progress')),
    actions: [...a.querySelectorAll('button[data-act]')].map(actionOf),
  }));
  const loose = [...panel.querySelectorAll('button[data-act]')].filter(b => !inCard(b) && !BACK.includes(b.dataset.act) && !b.closest('.journey-heading,.journal-heading'))
    .map(b => ({ title: text(b), lines: [], images: [], actions: [actionOf(b)] }));
  const intro = [...panel.querySelectorAll('p, :scope > h3')].filter(p => !p.closest('details,.note')).filter(p => !inCard(p) && !p.querySelector('button')).map(text).filter(Boolean);
  const msg = text(document.querySelector('#app .note[role="status"]'));
  // A page picture (the event scene), not the pictures inside the cards.
  const art = [...panel.querySelectorAll('.route-scene img, .event-scene img')].find(i => !inCard(i))?.getAttribute('src') || '';
  return { title: text(document.querySelector('#app .game-screen-heading h1') || panel.querySelector('h2')), back, cards: [...cards, ...loose], intro, msg, art };
}

export function defineListScenes(engine) {
  const ScreenScene = defineScreenScene(engine);
  class ListScene extends ScreenScene {
    constructor() { super('list'); }
    stateKey() { const p = readPage(); return [S.screen, JSON.stringify(p)]; }
    teardown() { this.pop?.destroy(); this.pop = null; super.teardown(); }
    create() { super.create(); this.events.on('sleep', () => { this.listIndex = 0; }); }
    build() {
      const page = readPage();
      this.backdrop();
      if (!page) return;
      this.header(page.title || 'Jornada', '');
      const goBack = () => page.back && command(page.back.action, page.back.value);
      const left = page.art ? 128 : 0;
      if (page.art) {
        this.win(4, 36, 120, 178);
        const img = this.add.image(64, 125, '__DEFAULT').setVisible(false); this.root.add(img);
        ensureTexture(this, 'list:' + page.art, page.art, () => { if (!img.active) return; const s = this.textures.get('list:' + page.art).getSourceImage(); img.setTexture('list:' + page.art).setScale(Math.min(112 / s.width, 170 / s.height)).setVisible(true); });
      }
      const x0 = 4 + left, w = WIDTH - 8 - left;
      this.win(x0, 36, w, 178);
      const big = page.cards.some(c => c.lines.length || c.images.length);
      const cellH = big ? 42 : 24, rows = Math.floor(170 / cellH);
      this.menu = new Menu(this, {
        x: x0 + 4, y: 40, columns: 1, cellW: w - 8, cellH, rows, input: engine.input, index: this.listIndex,
        items: page.cards.length ? page.cards.map(c => ({ c, onSelect: () => this.choose(c) })) : [{ empty: true, disabled: true }],
        onBack: goBack,
        drawCell: (cont, item, x, y, focused) => this.drawCard(cont, item, x, y, w - 14, cellH - 2, focused),
      });
      this.root.add(this.menu.container);
      if (!page.back) { const h = this.menu.handle.bind(this.menu); this.menu.handle = a => a === 'back' ? true : h(a); }
      this.message(page.msg || page.intro.join(' ') || (page.back ? 'Z: escolher  X: voltar' : 'Z: escolher'), { y: HEIGHT - 52, h: 48 });
    }
    drawCard(c, item, x, y, w, h, focused) {
      if (item.empty) { c.add(pixelText(this, x + 6, y + 4, 'Nada por aqui ainda.', { size: TEXT.body, color: COLORS.disabled })); return; }
      const card = item.c, live = card.actions.find(a => !a.disabled), done = card.actions.length && !live;
      if (focused) c.add(this.add.graphics().fillStyle(COLORS.menuFocus, 1).fillRoundedRect(x, y, w, h, 4));
      if (focused) c.add(pixelText(this, x + 2, y + (h > 24 ? 13 : 4), '▶', { size: TEXT.body }));
      let tx = x + 14;
      card.images.slice(0, card.lines.length ? 1 : 6).forEach((src, k) => {
        const img = this.add.image(tx + 16 + k * 34, y + h / 2, '__DEFAULT').setVisible(false); c.add(img);
        ensureTexture(this, 'list:' + src, src, () => { if (!img.active) return; const s = this.textures.get('list:' + src).getSourceImage(); img.setTexture('list:' + src).setScale(Math.min(34 / s.width, 34 / s.height)).setVisible(true); });
      });
      if (card.images.length && card.lines.length) tx += 36;
      const right = card.actions.length > 1 ? `${card.actions.length} opções` : card.actions[0] && card.lines.length ? card.actions[0].label : '';
      const rightW = right ? Math.min(150, right.length * 5 + 8) : 0;
      c.add(pixelText(this, tx, y + (h > 24 ? 3 : 4), card.title, { size: TEXT.body, color: done && !card.lines.length ? COLORS.disabled : COLORS.ink }));
      if (card.lines.length) c.add(pixelText(this, tx, y + 17, card.lines.slice(0, 2).join(' · '), { size: TEXT.small, color: COLORS.inkSoft, width: w - (tx - x) - rightW - 8 }));
      if (card.progress) {
        const [v, max] = card.progress, bw = 90, r = max ? Math.min(1, v / max) : 0;
        c.add(this.add.graphics().fillStyle(COLORS.barBorder, 1).fillRoundedRect(x + w - bw - 6, y + h - 9, bw + 2, 6, 2).fillStyle(COLORS.barTrack, 1).fillRect(x + w - bw - 5, y + h - 8, bw, 4).fillStyle(r >= 1 ? 0x48c060 : 0x40a8e8, 1).fillRect(x + w - bw - 5, y + h - 8, bw * r, 4));
      }
      if (right) c.add(pixelText(this, x + w - 6, y + 4, right, { size: TEXT.small, color: live ? '#2a6890' : COLORS.disabled }).setOrigin(1, 0));
    }
    // One action runs at once; several open a small window.
    choose(card) {
      this.listIndex = this.menu.index;
      const live = card.actions.filter(a => !a.disabled);
      if (!card.actions.length) return;
      if (card.actions.length === 1) { if (live.length) command(live[0].action, live[0].value); else this.typer?.show(card.actions[0].label); return; }
      this.menu.blur();
      const close = () => { this.pop?.destroy(); this.pop = null; this.menu.takeFocus(); };
      const items = card.actions.map(a => ({ label: a.label, size: TEXT.body, disabled: a.disabled, onSelect: () => { close(); command(a.action, a.value); } })).concat([{ label: 'CANCELAR', size: TEXT.body, onSelect: close }]);
      this.pop = this.popup({ x: WIDTH - 196, y: 44, w: 190, cellH: 18, items, onClose: close });
    }
  }
  return { ListScene };
}
