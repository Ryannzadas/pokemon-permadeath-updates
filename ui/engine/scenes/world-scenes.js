// Walking worlds (camp, Pokémon Center, route walk). The map itself is the shared walking scene from
// game/camp/scene.js, hosted inside this game; this HUD draws the game windows over it: the place,
// messages, the companion/nurse/discovery windows and the X menu. Rules stay in the engine actions
// (campInteract, centerHeal, routeObserve...).
import { WIDTH, HEIGHT, TEXT, COLORS } from '../config.js';
import { pixelText, Menu } from '../ui.js';
import { command } from '../bridge.js';
import { defineScreenScene, money } from './screen-base.js';

export const WORLD_SCREENS = ['camp', 'center', 'routeWorld'];
const moveName = id => window.gameExpansion.moveName(id);

export function defineWorldScenes(engine) {
  const ScreenScene = defineScreenScene(engine);

  class WorldScene extends ScreenScene {
    constructor() { super('world'); }
    create() {
      super.create();
      // The Center reloads the world after healing (fresh sprites); the nurse window stays open.
      this.game.events.on('world-changed', () => { if (!(this.panel?.type === 'nurse' && S.screen === 'center')) this.panel = null; this.tip = ''; this.key = ''; this.sync(); });
      this.events.on('sleep', () => { engine.input.passthrough = false; this.panel = null; this.tip = ''; });
    }
    update() { super.update(); engine.input.passthrough = !this.panel && !!engine.world && this.sys.isActive(); }
    stateKey() {
      return [S.screen, R?.money, S.msg, S.campNotice, this.panel, this.tip, R?.camp?.used, R?.team.map(m => [m.hp, m.friendship]), !!engine.world, engine.world?.options?.kind];
    }
    teardown() { this.pop?.destroy(); this.pop = null; super.teardown(); }

    // The world's callbacks open game windows here instead of the old HTML side panel.
    wrap(world) {
      const o = world?.options;
      if (!o || o.__hud) return;
      o.__hud = true;
      const open = panel => { this.panel = panel; this.tip = ''; this.key = ''; this.sync(); };
      const { onSelect, onNurse, onDiscovery, onHint, onError, isBlocked } = o;
      o.isBlocked = () => isBlocked() || !!this.panel;
      if (o.kind !== 'route') o.onSelect = index => { if (this.panel) return; onSelect(index); open({ type: 'member', index }); };
      if (onNurse) o.onNurse = () => { if (this.panel) return; onNurse(); open({ type: 'nurse' }); };
      if (onDiscovery) o.onDiscovery = () => { if (this.panel) return; onDiscovery(); if (S.screen === 'routeWorld') open({ type: 'discovery' }); };
      o.onEscape = () => { if (!this.panel) open({ type: 'menu' }); };
      o.onHint = message => { onHint(message); this.tip = message; this.key = ''; this.sync(); };
      o.onError = message => { onError(message); this.tip = message; this.key = ''; this.sync(); };
    }
    place() {
      if (S.screen === 'center') return 'Centro Pokémon';
      if (S.screen === 'routeWorld') { const j = JourneyModel.normalize(R); return JourneyModel.routes[j.route]?.name || 'Caminho'; }
      return 'Acampamento';
    }

    build() {
      this.wrap(engine.world);
      // Place and money, top-left, like a location sign.
      this.win(4, 4, 150, 30);
      this.root.add(pixelText(this, 12, 8, this.place(), { size: TEXT.body }));
      this.root.add(pixelText(this, 12, 20, `${R.trainerName || 'Treinador'} · ${money(R.money)}`, { size: TEXT.small, color: COLORS.inkSoft }));
      if (S.screen === 'camp') {
        const left = CampModel.LIMIT - (R.camp?.used || 0);
        this.win(WIDTH - 104, 4, 100, 20);
        this.root.add(pixelText(this, WIDTH - 54, 8, `Interações ${left}/${CampModel.LIMIT}`, { size: TEXT.small }).setOrigin(0.5, 0));
      }
      if (!engine.world) { this.message('Preparando…'); return; }
      const p = this.panel;
      if (p?.type === 'member' && S.screen === 'camp') this.campMember(p.index);
      else if (p?.type === 'member') this.centerMember(p.index);
      else if (p?.type === 'nurse') this.nurse();
      else if (p?.type === 'discovery') this.discovery();
      else if (p?.type === 'menu') this.pauseMenu();
      const text = this.notice();
      if (text) this.message(text);
      else if (!p) {
        this.root.add(this.add.rectangle(WIDTH - 4, HEIGHT - 4, 196, 16, 0x101820, 0.6).setOrigin(1, 1));
        this.root.add(pixelText(this, WIDTH - 10, HEIGHT - 17, S.screen === 'routeWorld' ? 'Setas: andar · Z: observar · X: menu' : 'Setas: andar · Z: falar · X: menu', { size: TEXT.small, color: '#e8f0f4' }).setOrigin(1, 0));
      }
    }
    notice() {
      if (this.tip) return this.tip;
      if (S.screen === 'camp') return S.campNotice || (this.panel ? '' : '');
      return S.msg || '';
    }
    choices(items, { x = WIDTH - 156, w = 150, title } = {}) {
      const h = items.length * 18 + 12 + (title ? 16 : 0), y = HEIGHT - 60 - h;
      if (title) {
        this.win(x, y, w, h);
        this.root.add(pixelText(this, x + 8, y + 5, title, { size: TEXT.small, color: COLORS.inkSoft }));
      }
      this.pop = this.popup({ x, y: title ? y + 14 : y, w, cellH: 18, items: items.map(i => ({ size: TEXT.body, ...i })), onClose: items.at(-1).onSelect });
    }
    close(actionToClose) { this.panel = null; this.tip = ''; if (actionToClose) command(actionToClose); else { this.key = ''; this.sync(); } }

    // Camp: play or share a snack with a companion (friendship), limited per journey stage.
    campMember(index) {
      const m = R.team[index]; if (!m) return;
      const left = CampModel.LIMIT - (R.camp?.used || 0), full = m.friendship >= 255;
      this.companion(m, 10);
      this.choices([
        { label: 'BRINCAR · +3', disabled: !left || full, onSelect: () => command('campInteract', 'play') },
        { label: 'LANCHE · ₽15 · +5', disabled: !left || full || R.money < 15, onSelect: () => command('campInteract', 'feed') },
        { label: 'VOLTAR A CAMINHAR', onSelect: () => this.close('campClose') },
      ], { w: 160, x: WIDTH - 166 });
      if (!S.campNotice) this.tip = !left ? 'A equipe já aproveitou esta pausa. Vença uma batalha para renovar.' : full ? 'A amizade já está no máximo.' : `O que fazer com ${nm(m)}?`;
    }
    // A small card with the companion's name, level and friendship.
    companion(m, y) {
      const x = 4, w = 160;
      this.win(x, 38 + y, w, 46);
      this.root.add(pixelText(this, x + 8, 42 + y, nm(m), { size: TEXT.body }));
      this.root.add(pixelText(this, x + w - 8, 43 + y, `Nv${m.lvl}`, { size: TEXT.small }).setOrigin(1, 0));
      const ratio = Math.min(1, (m.friendship || 0) / 255);
      this.root.add(pixelText(this, x + 8, 58 + y, `Amizade ${m.friendship}/255`, { size: TEXT.small, color: COLORS.inkSoft }));
      this.root.add(this.add.graphics().fillStyle(COLORS.barBorder, 1).fillRoundedRect(x + 8, 72 + y, w - 16, 6, 2).fillStyle(COLORS.barTrack, 1).fillRect(x + 9, 73 + y, w - 18, 4).fillStyle(0xe87898, 1).fillRect(x + 9, 73 + y, (w - 18) * ratio, 4));
    }
    // Center: a team member's HP and PP.
    centerMember(index) {
      const m = R.team[index]; if (!m) return;
      const x = 4, w = 200, h = 34 + m.moves.length * 12;
      this.win(x, 48, w, h);
      this.root.add(pixelText(this, x + 8, 52, `${nm(m)}  Nv${m.lvl}`, { size: TEXT.body }));
      this.root.add(pixelText(this, x + w - 8, 53, `HP ${m.hp}/${m.maxHp}`, { size: TEXT.small, color: m.hp < m.maxHp ? '#b83838' : COLORS.inkSoft }).setOrigin(1, 0));
      m.moves.forEach((id, i) => this.root.add(pixelText(this, x + 8, 70 + i * 12, `${moveName(id)}  ${m.pp[id] ?? M[id].pp}/${M[id].pp} PP`, { size: TEXT.small, color: COLORS.inkSoft })));
      this.choices([{ label: 'VOLTAR A CAMINHAR', onSelect: () => this.close('centerClose') }]);
    }
    nurse() {
      const needs = CenterModel.needsHealing(R);
      if (!S.msg) this.tip = needs ? 'Bem-vindo ao Centro Pokémon! Quer que eu recupere seus Pokémon? É de graça.' : 'Seus Pokémon estão em plena forma. Cuide bem deles!';
      this.choices(needs
        ? [{ label: 'RECUPERAR EQUIPE', onSelect: () => { this.tip = ''; command('centerHeal'); } }, { label: 'NÃO, OBRIGADO', onSelect: () => this.close('centerClose') }]
        : [{ label: 'ATÉ LOGO', onSelect: () => this.close('centerClose') }]);
    }
    discovery() {
      this.tip = 'Uma descoberta! Dá para observar a espécie sem batalhar.';
      this.choices([{ label: 'OBSERVAR', onSelect: () => { this.panel = null; this.tip = ''; command('routeObserve'); } }, { label: 'CANCELAR', onSelect: () => this.close('routeClose') }]);
    }
    // X menu: leave the place (and, on a route, start a wild encounter).
    pauseMenu() {
      const items = [];
      if (S.screen === 'routeWorld') items.push({ label: 'ENCONTRAR POKÉMON', onSelect: () => { this.panel = null; command('routeWild'); } });
      items.push({ label: S.screen === 'center' ? 'SAIR DO CENTRO' : S.screen === 'routeWorld' ? 'VOLTAR AOS CAMINHOS' : 'VOLTAR À JORNADA', onSelect: () => { this.panel = null; command(S.screen === 'center' ? 'centerExit' : S.screen === 'routeWorld' ? 'routeWorldBack' : 'campExit'); } });
      items.push({ label: 'CONTINUAR', onSelect: () => this.close() });
      this.choices(items, { w: 170, x: WIDTH - 176 });
    }
  }

  return { WorldScene };
}
