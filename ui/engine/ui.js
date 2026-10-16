// Game UI building blocks drawn with Phaser: pixel text, GBA-style windows, a cursor menu and a
// typewriter message box. Screens compose these instead of HTML.
import { FONT, TEXT, COLORS } from './config.js';

export function pixelText(scene, x, y, text, { size = TEXT.body, color = COLORS.ink, shadow, align = 'left', width } = {}) {
  const t = scene.add.text(x, y, text, {
    fontFamily: `"${FONT}", monospace`, fontSize: `${size}px`, color, align,
    wordWrap: width ? { width, useAdvancedWrap: true } : undefined,
  });
  // Rasterize at the render scale so the pixel font stays sharp when the world is drawn larger.
  t.setResolution(scene.game.registry.get('renderScale') || 1);
  if (shadow) t.setShadow(1, 1, shadow, 0, false, true);
  return t;
}

// A rounded window with an outer border and an inner highlight line, like the GBA boxes.
export function drawWindow(g, x, y, w, h, { fill, border, inner, radius = 4, shadow } = {}) {
  if (shadow !== undefined) { g.fillStyle(shadow, 0.4); g.fillRoundedRect(x + 2, y + 2, w, h, radius); }
  g.fillStyle(border, 1); g.fillRoundedRect(x, y, w, h, radius);
  if (inner !== undefined) { g.fillStyle(inner, 1); g.fillRoundedRect(x + 2, y + 2, w - 4, h - 4, Math.max(1, radius - 1)); }
  g.fillStyle(fill, 1); g.fillRoundedRect(x + (inner !== undefined ? 3 : 2), y + (inner !== undefined ? 3 : 2), w - (inner !== undefined ? 6 : 4), h - (inner !== undefined ? 6 : 4), Math.max(1, radius - 2));
}

// Grid menu with a ▶ cursor. Items: { label, sub, disabled, color, textColor, onSelect, onFocus }.
// Keyboard/gamepad move between enabled items; the mouse hovers and clicks them.
export class Menu {
  constructor(scene, { x, y, columns = 1, cellW, cellH, items, input, onBack, cursor = true, drawCell, rows = Infinity, index }) {
    Object.assign(this, { scene, x, y, columns, cellW, cellH, items, input, onBack, cursor, drawCell, rows });
    this.offset = 0; // first visible row when the list is longer than `rows`
    this.container = scene.add.container(0, 0);
    // Start on the requested item (e.g. where the cursor was before a redraw) when it can be selected.
    this.index = index !== undefined && items[index] && !items[index].disabled ? index : Math.max(0, items.findIndex(i => !i.disabled));
    this.render();
    this.release = input.push(action => this.handle(action));
  }

  cellPos(i) { return { cx: this.x + (i % this.columns) * this.cellW, cy: this.y + (Math.floor(i / this.columns) - this.offset) * this.cellH }; }

  visible(i) { const row = Math.floor(i / this.columns); return row >= this.offset && row < this.offset + this.rows; }

  render() {
    this.container.removeAll(true);
    const row = Math.floor(this.index / this.columns);
    if (row < this.offset) this.offset = row;
    if (row >= this.offset + this.rows) this.offset = row - this.rows + 1;
    const totalRows = Math.ceil(this.items.length / this.columns);
    if (this.offset > 0) this.container.add(pixelText(this.scene, this.x + this.columns * this.cellW - 12, this.y - 11, '▲', { size: TEXT.body }));
    if (this.offset + this.rows < totalRows) this.container.add(pixelText(this.scene, this.x + this.columns * this.cellW - 12, this.y + this.rows * this.cellH - 2, '▼', { size: TEXT.body }));
    this.items.forEach((item, i) => {
      if (!this.visible(i)) return;
      const { cx, cy } = this.cellPos(i), focused = i === this.index;
      if (this.drawCell) this.drawCell(this.container, item, cx, cy, focused);
      else {
        if (focused && !item.disabled) {
          const g = this.scene.add.graphics(); g.fillStyle(COLORS.menuFocus, 1); g.fillRoundedRect(cx, cy, this.cellW - 4, this.cellH - 2, 3); this.container.add(g);
        }
        if (this.cursor && focused && !item.disabled) this.container.add(pixelText(this.scene, cx + 3, cy + 2, '▶', { size: TEXT.body, color: COLORS.ink }));
        this.container.add(pixelText(this.scene, cx + 14, cy + 2, item.label, { size: item.size || TEXT.large, color: item.disabled ? COLORS.disabled : item.textColor || COLORS.ink }));
        // Secondary info (a cost, a count) sits at the right end of the same row.
        if (item.sub) this.container.add(pixelText(this.scene, cx + this.cellW - 8, cy + 7, item.sub, { size: TEXT.small, color: item.disabled ? COLORS.disabled : COLORS.inkSoft }).setOrigin(1, 0));
      }
      const zone = this.scene.add.zone(cx, cy, this.cellW - 4, this.cellH - 2).setOrigin(0).setInteractive({ useHandCursor: !item.disabled });
      zone.on('pointerover', () => { if (!item.disabled && this.index !== i) this.focus(i); });
      zone.on('pointerdown', () => { if (!item.disabled) { this.focus(i); this.select(); } });
      this.container.add(zone);
    });
  }

  focus(i) { this.index = i; this.items[i]?.onFocus?.(this.items[i], i); this.render(); }

  // Left/right stay on the current row; up/down move by whole rows.
  move(step) {
    const n = this.items.length, row = Math.floor(this.index / this.columns), horizontal = Math.abs(step) === 1 && this.columns > 1;
    for (let next = this.index + step; next >= 0 && next < n; next += step) {
      if (horizontal && Math.floor(next / this.columns) !== row) return;
      if (!this.items[next].disabled) { this.focus(next); return; }
    }
  }

  handle(action) {
    if (action === 'left') this.move(-1);
    else if (action === 'right') this.move(1);
    else if (action === 'up') this.move(-this.columns);
    else if (action === 'down') this.move(this.columns);
    else if (action === 'confirm') this.select();
    else if (action === 'back') { if (!this.onBack) return false; this.onBack(); }
    return true;
  }

  select() { const item = this.items[this.index]; if (item && !item.disabled) item.onSelect?.(item); }

  destroy() { this.release?.(); this.container.destroy(true); }
}

// Message box text that types out letter by letter. Same text again is shown at once.
export class Typewriter {
  constructor(scene, textObject) { this.scene = scene; this.text = textObject; this.full = ''; this.timer = null; }
  show(full, { speed = 1 } = {}) {
    if (full === this.full) { this.text.setText(full); return; }
    this.full = full; this.timer?.remove();
    const reduce = matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !full) { this.text.setText(full); return; }
    let shown = 0;
    const step = Math.max(8, 16 / speed);
    this.text.setText('');
    this.timer = this.scene.time.addEvent({ delay: step, repeat: full.length - 1, callback: () => { shown++; this.text.setText(full.slice(0, shown)); } });
  }
  destroy() { this.timer?.remove(); }
}
