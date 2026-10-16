// Title and new-game flow drawn in Phaser: title menu, mode, continue, character, name and starter.
// Each scene rebuilds from engine state (R, S, META, ModeSaveStore) and sends the same commands
// the previous interface used, so the flow rules stay in the engine.
import { WIDTH, HEIGHT, TEXT, COLORS } from '../config.js';
import { pixelText, drawWindow, Menu, Typewriter } from '../ui.js';
import { command } from '../bridge.js';
import { ensureTexture, addSpecies } from '../assets.js';
import { defineScreenScene } from './screen-base.js';

const GOLD = '#e3bd69';
const typeName = t => TYPES[t]?.[0] || t;
const typeColor = t => TYPES[t]?.[1] || '#a8a878';

export function defineMenuScenes(engine) {
  const ScreenScene = defineScreenScene(engine);

  // ---------- Title ----------
  class TitleScene extends ScreenScene {
    constructor() { super('title'); }
    stateKey() { return [Object.keys(ModeSaveStore.slots()).length, !!(META.champ || (META.championTeams || []).length), CFG.theme]; }
    build() {
      const bg = this.add.image(WIDTH / 2, HEIGHT / 2, '__DEFAULT').setVisible(false); this.root.add(bg);
      ensureTexture(this, 'ui:title', 'assets/visual/title.png', () => { if (bg.active) { const src = this.textures.get('ui:title').getSourceImage(); bg.setTexture('ui:title').setScale(Math.max(WIDTH / src.width, HEIGHT / src.height)).setVisible(true); } });
      const shade = this.add.graphics(); this.root.add(shade);
      shade.fillGradientStyle(0x0c1418, 0x0c1418, 0x0c1418, 0x0c1418, 0.82, 0.05, 0.82, 0.05).fillRect(0, 0, WIDTH * 0.7, HEIGHT);
      this.root.add(pixelText(this, 22, 14, 'POKÉMON', { size: 40, color: '#ffffff', shadow: '#1e4032' }));
      this.root.add(pixelText(this, 24, 50, 'PERMADEATH', { size: TEXT.large, color: GOLD, shadow: '#1e4032' }));
      const partner = addSpecies(this, this.root, 'eevee', 396, 238, {});
      this.tweens.add({ targets: partner, y: 234, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const saves = Object.keys(ModeSaveStore.slots()).length > 0, doubles = !!(META.champ || (META.championTeams || []).length);
      const items = [
        saves && { label: 'CONTINUAR', onSelect: () => command('cont') },
        { label: saves ? 'NOVO JOGO' : 'JOGAR', onSelect: () => command('start') },
        doubles && { label: 'PÓS-GAME EM DUPLAS', onSelect: () => command('openDouble') },
        { label: 'COLEÇÃO', onSelect: () => engine.openWindow('collection') },
        { label: 'JOGAR COM AMIGOS', onSelect: () => command('social') },
        { label: 'TEAM BUILDER', onSelect: () => command('teams') },
        { label: 'OPÇÕES', onSelect: () => engine.openWindow('options') },
        // Account and profile are an HTML window (typing and sign-in) shown over the game.
        { label: 'PERFIL', onSelect: () => { document.querySelector('.profile-toggle')?.click(); render(); } },
      ].filter(Boolean);
      const g = this.add.graphics(); this.root.add(g);
      const h = items.length * 22 + 14;
      drawWindow(g, 18, 80, 200, h, { fill: COLORS.menuFill, border: COLORS.menuBorder, inner: COLORS.menuInner, radius: 5 });
      this.menu = new Menu(this, { x: 24, y: 87, columns: 1, cellW: 190, cellH: 22, items, input: engine.input });
      this.root.add(this.menu.container);
      this.hint('Setas: mover · Z: confirmar · X: voltar');
    }
  }

  // ---------- Mode ----------
  class ModeScene extends ScreenScene {
    constructor() { super('mode'); }
    stateKey() { return [S.msg]; }
    build() {
      this.backdrop(); this.header('Como você quer jogar?', 'Cada modo tem seu próprio progresso');
      const modes = [
        { id: 'classic', label: 'CLÁSSICO', color: 0x3878c8, text: 'Se sua equipe desmaiar, você volta ao Centro Pokémon. A jornada continua.' },
        { id: 'permadeath', label: 'PERMADEATH', color: 0xb83838, text: 'Pokémon desmaiados não voltam. Perder toda a equipe encerra a jornada.' },
      ];
      this.menu = new Menu(this, {
        x: 16, y: 44, columns: 2, cellW: 228, cellH: 160, input: engine.input,
        items: modes.map(m => ({ ...m, onSelect: () => command('chooseMode', m.id) })),
        onBack: () => command('modeBack'),
        drawCell: (c, item, x, y, focused) => {
          this.card(c, x, y, 220, 150, focused);
          c.add(this.add.rectangle(x + 1, y + 1, 218, 34, item.color).setOrigin(0));
          c.add(pixelText(this, x + 110, y + 7, item.label, { size: TEXT.large, color: '#ffffff', shadow: '#202020' }).setOrigin(0.5, 0));
          c.add(pixelText(this, x + 12, y + 48, item.text, { size: TEXT.large, width: 196 }));
          if (focused) c.add(pixelText(this, x + 110, y + 128, '▶ Escolher', { size: TEXT.large, color: '#d8683c' }).setOrigin(0.5, 0));
        },
      });
      this.root.add(this.menu.container);
      this.message(S.msg || 'Escolha um modo para a nova jornada.');
    }
  }

  // ---------- Continue ----------
  class ContinueScene extends ScreenScene {
    constructor() { super('continue'); }
    stateKey() { return [Object.keys(ModeSaveStore.slots())]; }
    build() {
      this.backdrop(); this.header('Continue sua jornada', 'Bom ter você de volta');
      const slots = Object.entries(ModeSaveStore.slots());
      this.menu = new Menu(this, {
        x: 16, y: 40, columns: 2, cellW: 228, cellH: 80, rows: 2, input: engine.input,
        items: slots.map(([slot, { R: r }]) => ({ slot, r, onSelect: () => command('contMode', slot) })),
        onBack: () => command('modeBack'),
        drawCell: (c, item, x, y, focused) => {
          const r = item.r;
          this.card(c, x, y, 220, 74, focused);
          c.add(pixelText(this, x + 10, y + 4, ModeSaveStore.label(item.slot), { size: TEXT.small, color: COLORS.inkSoft }));
          c.add(pixelText(this, x + 10, y + 15, r.trainerName || 'Treinador', { size: TEXT.large }));
          c.add(pixelText(this, x + 210, y + 19, `Batalha ${r.battle + 1}`, { size: TEXT.small, color: COLORS.inkSoft }).setOrigin(1, 0));
          r.team.slice(0, 6).forEach((m, i) => addSpecies(this, c, m.sp, x + 24 + i * 34, y + 70, { scale: window.FRLG_SPRITES?.[SP[m.sp]?.dex] ? 0.5 : 1 / 3 }).setAlpha(m.hp > 0 ? 1 : 0.35));
          if (focused) c.add(pixelText(this, x - 8, y + 30, '▶', { size: TEXT.body }));
        },
      });
      this.root.add(this.menu.container);
      this.message('Qual jornada você quer continuar?');
    }
  }

  // ---------- Character ----------
  class CharacterScene extends ScreenScene {
    constructor() { super('character'); }
    stateKey() { return [S.characterFor, S.pendingMode, R?.mode]; }
    build() {
      const continuing = S.characterFor === 'existing', mode = (continuing ? R?.mode : S.pendingMode) === 'classic' ? 'Clássico' : 'Permadeath';
      this.backdrop(); this.header('Quem vai nessa jornada?', mode);
      const trainers = CAMP_ASSETS.trainers;
      this.menu = new Menu(this, {
        x: 14, y: 40, columns: 5, cellW: 92, cellH: 84, input: engine.input,
        items: trainers.map(t => ({ ...t, onSelect: () => command('pickTrainer', t.id) })),
        // Back steps through the new-game flow; an existing save returns to the menu.
        onBack: () => command(continuing ? 'characterBack' : 'changeMode'),
        drawCell: (c, item, x, y, focused) => {
          this.card(c, x, y, 86, 78, focused);
          const img = this.add.image(x + 43, y + 58, '__DEFAULT').setOrigin(0.5, 1).setVisible(false); c.add(img);
          ensureTexture(this, 'trainer:' + item.id, item.portrait, () => { if (img.active) img.setTexture('trainer:' + item.id).setScale(item.portrait && this.textures.get('trainer:' + item.id).getSourceImage().height > 70 ? 0.75 : 1).setVisible(true); });
          c.add(pixelText(this, x + 43, y + 60, item.name, { size: TEXT.body }).setOrigin(0.5, 0));
        },
      });
      this.root.add(this.menu.container);
      this.message(continuing ? 'Escolha a aparência do seu treinador.' : 'Escolha uma aparência. Depois, dê seu próprio nome. (X: trocar modo)');
    }
  }

  // ---------- Name ----------
  // Typing stays an HTML text field (accents, paste, IME), placed over the game window.
  class NameScene extends ScreenScene {
    constructor() { super('name'); }
    stateKey() { return [S.pendingTrainer, S.msg]; }
    build() {
      this.backdrop(); this.header('Qual é o seu nome?');
      const g = this.add.graphics(); this.root.add(g);
      drawWindow(g, 60, 52, 360, 140, { fill: COLORS.menuFill, border: COLORS.menuBorder, inner: COLORS.menuInner, radius: 6 });
      const t = CAMP_ASSETS.trainers.find(x => x.id === S.pendingTrainer) || CAMP_ASSETS.trainers[0];
      const img = this.add.image(120, 172, '__DEFAULT').setOrigin(0.5, 1).setVisible(false); this.root.add(img);
      ensureTexture(this, 'trainer:' + t.id, t.portrait, () => { if (img.active) img.setTexture('trainer:' + t.id).setVisible(true); });
      this.root.add(pixelText(this, 176, 66, 'Nome do treinador', { size: TEXT.large }));
      this.root.add(pixelText(this, 176, 150, 'Enter: confirmar · Esc: voltar', { size: TEXT.small, color: COLORS.inkSoft }));
      this.field = { x: 176, y: 96, w: 220, h: 26 };
      const fg = this.add.graphics(); this.root.add(fg);
      fg.fillStyle(0xffffff, 1).fillRoundedRect(this.field.x, this.field.y, this.field.w, this.field.h, 4).lineStyle(2, COLORS.messageBorder, 1).strokeRoundedRect(this.field.x, this.field.y, this.field.w, this.field.h, 4);
      this.message(S.msg && S.msg !== 'Escolha seu Pokémon inicial.' ? S.msg : 'Digite seu nome. Ele aparece no Trainer Card e na jornada.');
      this.overlayInput();
      // X/Esc go back only when the text field is not being edited (handled in the field itself).
      this.release = engine.input.push(action => { if (action === 'back') { command('trainerNameBack'); return true; } return false; });
    }
    teardown() { this.release?.(); this.release = null; super.teardown(); }
    overlayInput() {
      const input = document.createElement('input');
      Object.assign(input, { type: 'text', maxLength: 24, autocomplete: 'off', spellcheck: false, value: document.getElementById('trainer-name')?.value || R?.trainerName || '' });
      input.setAttribute('aria-label', 'Nome do treinador');
      input.className = 'game-text-field';
      input.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.key === 'Enter') { event.preventDefault(); this.confirm(input.value); }
        if (event.key === 'Escape') { event.preventDefault(); command('trainerNameBack'); }
      });
      document.getElementById('game-stage').append(input);
      this.overlay = input;
      const place = () => {
        const canvas = this.game.canvas.getBoundingClientRect(), z = canvas.width / WIDTH;
        Object.assign(input.style, { left: `${canvas.left + this.field.x * z}px`, top: `${canvas.top + this.field.y * z}px`, width: `${this.field.w * z}px`, height: `${this.field.h * z}px`, fontSize: `${Math.max(10, Math.floor(z * 1.5) * 10)}px` });
      };
      place(); this.scale.on('resize', place); addEventListener('resize', place);
      this.events.once('shutdown', () => removeEventListener('resize', place));
      setTimeout(() => input.focus(), 0);
    }
    confirm(name) {
      // The engine reads the name from its own field; keep the same contract.
      const engineField = document.getElementById('trainer-name');
      if (engineField) engineField.value = name;
      command('confirmTrainer');
    }
  }

  // ---------- Starter ----------
  class StarterScene extends ScreenScene {
    constructor() { super('starter'); }
    stateKey() { return [S.starterCategory, S.msg, META.best]; }
    build() {
      const cats = STARTER_CATEGORIES, current = cats.find(c => c.id === S.starterCategory) || cats[0], ci = cats.indexOf(current);
      this.backdrop(); this.header('Escolha seu Pokémon inicial', `◀ ${current.n} ▶`);
      // Category tabs (mouse) — keyboard changes category from the edges of the card row.
      cats.forEach((c, i) => {
        const x = 10 + i * 78, active = c.id === current.id;
        const tg = this.add.graphics().fillStyle(active ? 0xffffff : 0x3a5468, 1).fillRoundedRect(x, 38, 74, 18, 4); this.root.add(tg);
        this.root.add(pixelText(this, x + 37, 39, c.n.split(' · ')[0], { size: TEXT.body, color: active ? '#285878' : '#e8f4fb' }).setOrigin(0.5, 0));
        this.root.add(this.add.zone(x, 38, 74, 18).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => command('starterCategory', c.id)));
      });
      const list = STARTERS.filter(st => st.category === current.id);
      const goCategory = step => command('starterCategory', cats[(ci + step + cats.length) % cats.length].id);
      this.menu = new Menu(this, {
        x: 12, y: 62, columns: 3, cellW: 154, cellH: 150, input: engine.input,
        items: list.map(st => ({ st, disabled: !!(st.need && META.best < st.need), onSelect: () => command('pickStarter', st.id) })),
        onBack: () => command('starterBack'),
        drawCell: (c, item, x, y, focused) => this.drawStarter(c, item, x, y, focused),
      });
      // Left/right past the first or last card switch category.
      const handle = this.menu.handle.bind(this.menu);
      // Left/right switch generation when the cursor cannot move further (edge or locked cards).
      this.menu.handle = action => {
        const before = this.menu.index, result = handle(action);
        if ((action === 'left' || action === 'right') && this.menu.index === before) goCategory(action === 'left' ? -1 : 1);
        return result;
      };
      this.root.add(this.menu.container);
      this.message(S.msg || 'Escolha seu Pokémon inicial.', { y: HEIGHT - 50, h: 46 });
    }
    drawStarter(c, item, x, y, focused) {
      const st = item.st, s = SP[st.id], locked = item.disabled;
      this.card(c, x, y, 148, 146, focused, locked);
      const img = addSpecies(this, c, st.id, x + 74, y + 84, { room: 80 });
      if (locked) img.setTint(0x202020);
      c.add(pixelText(this, x + 74, y + 86, s.n, { size: TEXT.large, color: locked ? COLORS.disabled : COLORS.ink }).setOrigin(0.5, 0));
      s.t.forEach((t, i) => {
        const tx = x + 74 + (i - (s.t.length - 1) / 2) * 50;
        c.add(this.add.rectangle(tx, y + 112, 46, 13, Phaser.Display.Color.HexStringToColor(typeColor(t)).color).setStrokeStyle(1, 0x303030, 0.5));
        c.add(pixelText(this, tx, y + 107, typeName(t), { size: TEXT.small, color: '#202020' }).setOrigin(0.5, 0));
      });
      c.add(pixelText(this, x + 74, y + 124, locked ? `Bloqueado: ${st.need} vitórias` : 'Disponível', { size: TEXT.small, color: locked ? '#b83838' : COLORS.inkSoft }).setOrigin(0.5, 0));
      if (focused && !locked) c.add(pixelText(this, x + 6, y + 6, '▶', { size: TEXT.body }));
    }
  }

  return { TitleScene, ModeScene, ContinueScene, CharacterScene, NameScene, StarterScene };
}
