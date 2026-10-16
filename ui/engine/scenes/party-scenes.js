// Party screens drawn in Phaser: the team. Picking a Pokémon opens a small menu (summary, lead),
// like the party screen of the main games. Actions are the engine's own (summary, lead).
import { WIDTH, HEIGHT, TEXT, COLORS, hpColor } from '../config.js';
import { pixelText, drawWindow, Menu } from '../ui.js';
import { command } from '../bridge.js';
import { addIcon } from '../assets.js';
import { defineScreenScene } from './screen-base.js';

const typeName = t => TYPES[t]?.[0] || t;
const typeColor = t => Phaser.Display.Color.HexStringToColor(TYPES[t]?.[1] || '#a8a878').color;

export function definePartyScenes(engine) {
  const ScreenScene = defineScreenScene(engine);

  // A small window with choices over the screen; closes with X.
  function popup(scene, { x, y, w, items, onClose }) {
    const layer = scene.add.container(0, 0); scene.root.add(layer);
    const g = scene.add.graphics(); layer.add(g);
    drawWindow(g, x, y, w, items.length * 22 + 12, { fill: COLORS.menuFill, border: COLORS.menuBorder, inner: COLORS.menuInner, radius: 5 });
    const menu = new Menu(scene, { x: x + 6, y: y + 6, columns: 1, cellW: w - 12, cellH: 22, items, input: engine.input, onBack: onClose });
    layer.add(menu.container);
    return { destroy() { menu.destroy(); layer.destroy(true); } };
  }

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

  return { TeamScene };
}
