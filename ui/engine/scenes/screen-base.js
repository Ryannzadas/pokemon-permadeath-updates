// Base for menu-like screens: rebuilds from engine state when its key changes, and offers the
// shared pieces (backdrop, header, windows, message box, cards, images, HP bars).
import { WIDTH, HEIGHT, TEXT, COLORS, hpColor } from '../config.js';
import { pixelText, drawWindow, Typewriter } from '../ui.js';
import { ensureTexture } from '../assets.js';

export const iconScale = sp => window.FRLG_SPRITES?.[SP[sp]?.dex] ? 0.5 : 1 / 3;
export const money = n => '₽ ' + Number(n || 0).toLocaleString('pt-BR');

export function defineScreenScene(engine) {
  return class ScreenScene extends Phaser.Scene {
    constructor(key) { super(key); this.engine = engine; }
    create() {
      this.root = this.add.container(0, 0);
      this.key = '';
      this.events.on('wake', () => { this.key = ''; this.cameras.main.fadeIn(160, 16, 20, 24); this.sync(); });
      this.events.on('sleep', () => { this.teardown(); this.key = ''; });
      this.events.on('rescale', () => { this.key = ''; this.sync(); });
      this.cameras.main.fadeIn(160, 16, 20, 24);
      this.sync();
    }
    update() { engine.input.pollGamepads(); }
    // Phaser only counts a scene as active after create(); a sleeping scene must not redraw.
    sync() {
      if (!this.root || this.sys.isSleeping()) return;
      const key = JSON.stringify(this.stateKey());
      if (key === this.key) return;
      this.key = key;
      this.teardown();
      this.build();
    }
    stateKey() { return []; }
    teardown() { this.menu?.destroy(); this.menu = null; this.typer?.destroy(); this.typer = null; this.overlay?.remove(); this.overlay = null; this.root?.removeAll(true); }

    backdrop(color = 0x20303c) { this.root.add(this.add.rectangle(0, 0, WIDTH, HEIGHT, color).setOrigin(0)); }
    header(title, kicker) {
      const g = this.add.graphics(); this.root.add(g);
      g.fillStyle(COLORS.panelHead, 1).fillRect(0, 0, WIDTH, 30).fillStyle(0x285878, 1).fillRect(0, 30, WIDTH, 2);
      this.root.add(pixelText(this, 12, 5, title, { size: TEXT.large, color: '#ffffff', shadow: '#285878' }));
      if (kicker) this.root.add(pixelText(this, WIDTH - 12, 10, kicker, { size: TEXT.small, color: '#e8f4fb' }).setOrigin(1, 0));
    }
    win(x, y, w, h, style = 'menu') {
      const g = this.add.graphics(); this.root.add(g);
      if (style === 'message') drawWindow(g, x, y, w, h, { fill: COLORS.messageFill, border: COLORS.messageBorder, inner: COLORS.messageInner, radius: 5 });
      else drawWindow(g, x, y, w, h, { fill: COLORS.menuFill, border: COLORS.menuBorder, inner: COLORS.menuInner, radius: 5 });
      return g;
    }
    message(text, { y = HEIGHT - 52, h = 48 } = {}) {
      this.win(4, y, WIDTH - 8, h, 'message');
      const t = pixelText(this, 16, y + 8, '', { size: TEXT.large, color: COLORS.white, shadow: COLORS.shadowLight, width: WIDTH - 32 });
      this.root.add(t);
      this.typer = new Typewriter(this, t); this.typer.show(text, { speed: CFG.speed || 1 });
    }
    hint(text) { this.root.add(pixelText(this, WIDTH - 8, HEIGHT - 12, text, { size: TEXT.small, color: '#c8d0d8' }).setOrigin(1, 0)); }
    card(c, x, y, w, h, focused, disabled) {
      const g = this.add.graphics(); c.add(g);
      g.fillStyle(disabled ? 0xd8d8d0 : 0xf8f8f0, 1).fillRoundedRect(x, y, w, h, 5);
      g.lineStyle(focused && !disabled ? 2 : 1, focused && !disabled ? COLORS.messageBorder : 0x8890a0, 1).strokeRoundedRect(x, y, w, h, 5);
      return g;
    }
    cover(key, url, dim = 0.45) {
      const bg = this.add.image(WIDTH / 2, HEIGHT / 2, '__DEFAULT').setVisible(false); this.root.add(bg);
      ensureTexture(this, key, url, () => { if (!bg.active) return; const s = this.textures.get(key).getSourceImage(); bg.setTexture(key).setScale(Math.max(WIDTH / s.width, HEIGHT / s.height)).setVisible(true); });
      if (dim) this.root.add(this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x0c1418, dim).setOrigin(0));
      return bg;
    }
    image(key, url, x, y, { originY = 1, scale = 1, into = this.root } = {}) {
      const img = this.add.image(x, y, '__DEFAULT').setOrigin(0.5, originY).setVisible(false); into.add(img);
      ensureTexture(this, key, url, () => { if (img.active) img.setTexture(key).setScale(scale).setVisible(true); });
      return img;
    }
    hpBar(c, x, y, w, mon) {
      const ratio = Math.max(0, mon.hp / mon.maxHp);
      c.add(this.add.graphics().fillStyle(COLORS.barBorder, 1).fillRoundedRect(x - 1, y - 1, w + 2, 6, 2).fillStyle(COLORS.barTrack, 1).fillRect(x, y, w, 4).fillStyle(hpColor(ratio), 1).fillRect(x, y, w * ratio, 4));
    }
  };
}
