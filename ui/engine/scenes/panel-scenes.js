// Game windows opened from the title or the journey: settings and the collection.
// They return to the screen they were opened from.
import { WIDTH, TEXT, COLORS } from '../config.js';
import { pixelText, Menu } from '../ui.js';
import { command } from '../bridge.js';
import { addSpecies } from '../assets.js';
import { defineScreenScene } from './screen-base.js';

const GOLD = '#b07818';

export function definePanelScenes(engine) {
  const ScreenScene = defineScreenScene(engine);

  // ---------- Settings ----------
  class OptionsScene extends ScreenScene {
    constructor() { super('options'); }
    stateKey() { return [CFG.music, CFG.sound, CFG.speed, CFG.moveLanguage, CFG.fill, CFG.fullscreen, CFG.theme]; }
    build() {
      this.backdrop(); this.header('Opções', 'Salvo automaticamente');
      const fill = CFG.fill !== false;
      const toggleFill = () => { CFG.fill = !fill; saveCfg(); engine.resize(); this.sync(); };
      const toggleFull = async () => { await engine.setFullScreen(!CFG.fullscreen); this.sync(); };
      const rows = [
        { label: 'Música', value: CFG.music ? 'Ligada' : 'Desligada', change: () => command('mus') },
        { label: 'Efeitos sonoros', value: CFG.sound ? 'Ligados' : 'Desligados', change: () => command('snd') },
        { label: 'Velocidade das animações', value: `×${CFG.speed || 1}`, change: () => command('spd') },
        { label: 'Nomes dos golpes', value: CFG.moveLanguage === 'en' ? 'English' : 'Português', change: () => command('moveLanguage') },
        engine.canFullScreen() && { label: 'Tela cheia (F11)', value: CFG.fullscreen ? 'Ligada' : 'Desligada', change: toggleFull },
        { label: 'Imagem', value: fill ? 'Preencher a janela' : 'Pixels perfeitos', change: toggleFill },
        { label: 'Telas em janela (perfil, loja…)', value: CFG.theme === 'dark' ? 'Escuras' : 'Claras', change: () => command('reactTheme') },
        { label: 'Voltar', back: true },
      ].filter(Boolean);
      const close = () => engine.closeWindow();
      this.menu = new Menu(this, {
        x: 24, y: 44, columns: 1, cellW: 432, cellH: 24, input: engine.input, index: this.lastIndex,
        items: rows.map(r => ({ ...r, onSelect: () => (r.back ? close() : r.change()) })),
        onBack: close,
        drawCell: (c, item, x, y, focused) => {
          c.add(this.add.graphics().fillStyle(focused ? COLORS.menuFocus : 0xf8f8f8, 1).fillRoundedRect(x, y, 428, 21, 3));
          if (focused) c.add(pixelText(this, x + 4, y + 5, '▶', { size: TEXT.body }));
          c.add(pixelText(this, x + 16, y + 1, item.label, { size: TEXT.large }));
          if (item.value) c.add(pixelText(this, x + 420, y + 1, `${focused ? '◀ ' : ''}${item.value}${focused ? ' ▶' : ''}`, { size: TEXT.large, color: GOLD }).setOrigin(1, 0));
        },
      });
      // Left/right also change the focused option, like the options menu of the main games.
      const handle = this.menu.handle.bind(this.menu);
      this.menu.handle = action => {
        this.lastIndex = this.menu.index;
        const row = this.menu.items[this.menu.index];
        if ((action === 'left' || action === 'right') && row.change) { row.change(); return true; }
        return handle(action);
      };
      const select = this.menu.select.bind(this.menu);
      this.menu.select = () => { this.lastIndex = this.menu.index; select(); };
      this.win(18, 38, WIDTH - 36, 182);
      this.root.add(this.menu.container);
      this.message('Z ou ◀ ▶ mudam a opção. X volta.');
    }
  }

  // ---------- Collection ----------
  class CollectionScene extends ScreenScene {
    constructor() { super('collection'); }
    stateKey() { return [(META.seen || []).length, (META.caught || []).length]; }
    build() {
      this.backdrop(); this.header('Coleção', 'Suas histórias');
      const seen = (META.seen || []).length, caught = (META.caught || []).length;
      const cards = [
        { label: 'Pokédex', text: `${seen} vistos · ${caught} obtidos`, sp: 'pikachu', act: ['dex'] },
        { label: 'Diário', text: 'Cada equipe tem uma história', sp: 'hoothoot', act: ['journal', 'history'] },
        { label: 'Conquistas', text: 'Objetivos e recompensas', sp: 'eevee', act: ['journal', 'achievements'] },
        { label: 'Desafios', text: 'Desafios diários', sp: 'machop', act: ['daily'] },
        { label: 'Jornadas clássicas', text: 'Retome jornadas salvas', sp: 'charmander', act: ['savedJourneys'] },
        { label: 'Memorial', text: 'Quem marcou suas jornadas', sp: 'gastly', act: ['memorial'] },
      ];
      this.menu = new Menu(this, {
        x: 14, y: 40, columns: 3, cellW: 152, cellH: 88, input: engine.input,
        // The window steps aside for the chosen screen and comes back when that screen closes.
        items: cards.map(c => ({ ...c, onSelect: () => { engine.leaveWindow(); command(...c.act); } })),
        onBack: () => engine.closeWindow(),
        drawCell: (c, item, x, y, focused) => {
          this.card(c, x, y, 146, 82, focused);
          addSpecies(this, c, item.sp, x + 26, y + 60, { scale: window.FRLG_SPRITES?.[SP[item.sp]?.dex] ? 0.75 : 0.5 });
          c.add(pixelText(this, x + 50, y + 18, item.label, { size: TEXT.large, width: 92 }));
          c.add(pixelText(this, x + 8, y + 64, item.text, { size: TEXT.body, color: COLORS.inkSoft, width: 132 }));
          if (focused) c.add(pixelText(this, x + 6, y + 4, '▶', { size: TEXT.body }));
        },
      });
      this.root.add(this.menu.container);
      this.message('O que você quer ver?');
    }
  }

  return { OptionsScene, CollectionScene };
}
