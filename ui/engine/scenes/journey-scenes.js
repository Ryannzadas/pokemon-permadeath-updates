// Journey screens drawn in Phaser: the journey menu (hub), the trainer preview before a gym or
// league battle, and the result screens (victory, game over, champion).
// Menus call the same engine actions as the previous interface; result screens list the actions
// the engine offers (rewards, releases, evolutions) through the bridge, so those rules stay put.
import { WIDTH, HEIGHT, TEXT, COLORS, hpColor } from '../config.js';
import { pixelText, drawWindow, Menu, Typewriter } from '../ui.js';
import { command, engineOptions } from '../bridge.js';
import { ensureTexture, addSpecies, addIcon, addWalker, addTrainer } from '../assets.js';
import { defineScreenScene, iconScale, money } from './screen-base.js';

const GOLD = '#e3bd69';

export function defineJourneyScenes(engine) {
  const Base = defineScreenScene(engine);

  // ---------- Journey menu ----------
  class HubScene extends Base {
    constructor() { super('hub'); }
    stateKey() { return [R.battle, R.money, R.mode, R.trainer, R.trainerName, R.team.map(m => [m.sp, m.lvl, m.hp, m.maxHp]), R.active, S.msg, R.journey?.pending, R.leagueCleared, R.legendaryCompleted, R.postgame, R.team.map(canEvolve)]; }
    build() {
      this.cover('ui:camp', 'assets/visual/camp.png', 0.5);
      const boss = nextIsBoss(), next = nextBoss(), gym = Math.floor(R.battle / 5), trainer = gameExpansion.TRAINERS[gym];
      // Trainer panel: who, where, money, badges and the level cap.
      this.win(6, 6, 300, 66);
      const t = CAMP_ASSETS.trainers.find(x => x.id === R.trainer) || CAMP_ASSETS.trainers[0];
      addWalker(this, this.root, t.id, 38, 66, 1.25);
      this.root.add(pixelText(this, 70, 9, R.trainerName || 'Treinador', { size: TEXT.large }));
      this.root.add(pixelText(this, 70, 29, `${R.postgame ? 'Pós-game em duplas · ' : ''}${R.mode === 'classic' ? 'Clássico' : 'Permadeath'} · Batalha ${R.battle + 1}`, { size: TEXT.small, color: COLORS.inkSoft }));
      this.root.add(pixelText(this, 298, 9, money(R.money), { size: TEXT.large }).setOrigin(1, 0));
      this.root.add(pixelText(this, 298, 29, `Limite Nv ${JourneyLevelCap.current()}`, { size: TEXT.small, color: COLORS.inkSoft }).setOrigin(1, 0));
      const html = window.renderKantoBadges?.(gymIndex()) || '';
      [...html.matchAll(/assets\/badges\/(\w+)\.png/g)].forEach((m, i) => {
        const earned = i < gymIndex(), img = this.image('badge:' + m[1], `assets/badges/${m[1]}.png`, 80 + i * 26, 66);
        if (!earned) img.setTint(0x404850).setAlpha(0.55);
      });

      // Party: every member with level and HP; the lead is marked.
      this.win(6, 76, 300, 134);
      R.team.slice(0, 6).forEach((m, i) => {
        const x = 12 + (i % 2) * 148, y = 82 + Math.floor(i / 2) * 42, dead = m.hp <= 0, c = this.add.container(0, 0); this.root.add(c);
        c.add(this.add.graphics().fillStyle(dead ? 0xd8d8d0 : 0xffffff, 1).fillRoundedRect(x, y, 142, 38, 4).lineStyle(1, i === R.active ? COLORS.messageBorder : 0xa8b0c0, 1).strokeRoundedRect(x, y, 142, 38, 4));
        addIcon(this, c, m.sp, x + 18, y + 34, iconScale(m.sp)).setAlpha(dead ? 0.4 : 1);
        c.add(pixelText(this, x + 36, y + 3, nm(m), { size: TEXT.large, color: dead ? COLORS.disabled : COLORS.ink })); // the orange border marks the lead
        c.add(pixelText(this, x + 136, y + 6, `Nv${m.lvl}`, { size: TEXT.body, color: dead ? COLORS.disabled : COLORS.ink }).setOrigin(1, 0));
        this.hpBar(c, x + 36, y + 25, 64, m);
        c.add(pixelText(this, x + 136, y + 22, dead ? 'Desmaiado' : `${m.hp}/${m.maxHp}`, { size: TEXT.body, color: dead ? COLORS.disabled : COLORS.inkSoft }).setOrigin(1, 0));
        c.add(this.add.zone(x, y, 142, 38).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => command('summary', i)));
      });

      // Commands, like the start menu of the main games.
      const items = [];
      R.team.forEach((m, i) => { if (canEvolve(m)) evoReady(m).forEach((p, k) => items.push({ label: `EVOLUIR ${nm(m)}`.toUpperCase(), sub: SP[p[1]].n, textColor: '#b05a10', onSelect: () => command('evolve', `${i}:${k}`) })); });
      items.push({ label: boss && trainer ? `DESAFIAR ${trainer.name.toUpperCase()}` : 'BATALHAR', onSelect: () => command('go') });
      if (boss && gym < 8) items.push({ label: 'EXPLORAR ÁREA', onSelect: () => command('explore') });
      items.push(
        { label: 'ROTAS', onSelect: () => command('routes') },
        { label: 'ACAMPAMENTO', onSelect: () => command('camp') },
        { label: 'LOJA', onSelect: () => command('shop') },
        R.mode === 'classic' ? { label: 'CENTRO POKÉMON', onSelect: () => command('center') } : { label: 'RECUPERAR', sub: '₽60', onSelect: () => command('rest') },
        { label: 'EQUIPE', onSelect: () => command('visualTeam') },
        { label: 'MOCHILA', onSelect: () => command('reactBag') },
        { label: 'POKÉDEX', onSelect: () => command('dex') },
        { label: 'DIÁRIO', onSelect: () => command('journal', 'history') },
        { label: 'PC', onSelect: () => command('pc') },
        { label: 'TRAINER CARD', onSelect: () => command('trainerCard') },
        { label: 'MISSÕES', onSelect: () => command('missions') },
      );
      if (R.mode !== 'classic') items.push({ label: 'TREINO', sub: `${trainingLeft()}/${TRAIN_LIMIT}`, disabled: trainingLeft() <= 0, onSelect: () => command('train') });
      if (R.journey?.pending) items.push({ label: 'CONTINUAR EVENTO', onSelect: () => command('eventOpen') });
      if (R.leagueCleared && !R.legendaryCompleted) items.push({ label: 'MEWTWO', sub: 'Nv 100', onSelect: () => command('legendary') });
      items.push(
        { label: 'DESAFIOS', onSelect: () => command('daily') },
        { label: 'TEAM BUILDER', onSelect: () => command('teams') },
        { label: 'OPÇÕES', onSelect: () => engine.openWindow('options') },
        { label: 'MENU', onSelect: () => command('accountTitle') },
        { label: 'ABANDONAR', textColor: '#b83838', onSelect: () => command('abandon') },
      );
      this.win(312, 6, 162, 204);
      this.menu = new Menu(this, { x: 316, y: 13, columns: 1, cellW: 154, cellH: 21, rows: 9, items, input: engine.input, onBack: () => command('accountTitle') });
      this.root.add(this.menu.container);

      const info = trainer ? `Próximo desafio: ${trainer.name} · ${trainer.type ? TYPES[trainer.type]?.[0] : 'Tipos variados'} · ${trainer.team.length} Pokémon${boss ? ' · disponível agora' : ''}` : boss ? next.title : `Próxima batalha: ${R.battle + 1}`;
      this.message(S.msg || info, { y: HEIGHT - 56, h: 52 });
      if (trainer && !S.msg) addTrainer(this, this.root, trainer.sprite, WIDTH - 36, HEIGHT - 8, { scale: 0.5 });
    }
  }

  // ---------- Trainer preview ----------
  class IntroScene extends Base {
    constructor() { super('intro'); }
    stateKey() { return [B?.trainer?.name, B?.enemies?.map(m => [m.sp, m.lvl])]; }
    build() {
      const t = B.trainer;
      this.cover('arena:' + (window.battleArenaName?.() || 'Estádio'), `assets/visual/${window.battleArenaName?.() || 'Estádio'}.webp`, 0.55);
      const role = document.querySelector('#app .trainer-intro > p')?.textContent.trim() || 'Desafio';
      this.root.add(pixelText(this, WIDTH / 2, 12, role.toUpperCase(), { size: TEXT.body, color: GOLD, shadow: '#202020' }).setOrigin(0.5, 0));
      const leader = addTrainer(this, this.root, t.sprite, 96, 150, { scale: 1.5 });
      this.tweens.add({ targets: leader, x: { from: -40, to: 96 }, duration: 420, ease: 'Cubic.out' });
      this.root.add(pixelText(this, 172, 34, t.name, { size: 40, color: '#ffffff', shadow: '#202020' }));
      this.root.add(pixelText(this, 174, 76, `${t.type ? 'Especialidade: ' + TYPES[t.type]?.[0] : 'Tipos variados'} · ${B.enemies.length} Pokémon`, { size: TEXT.large, color: '#e8f4fb', shadow: '#202020' }));
      B.enemies.forEach((m, i) => {
        const x = 176 + i * 50, c = this.add.container(0, 0); this.root.add(c);
        c.add(this.add.graphics().fillStyle(0xf8f8f0, 0.9).fillRoundedRect(x, 100, 46, 56, 4));
        addIcon(this, c, m.sp, x + 23, 136, iconScale(m.sp));
        c.add(pixelText(this, x + 23, 140, `Nv${m.lvl}`, { size: TEXT.body }).setOrigin(0.5, 0));
      });
      this.win(4, HEIGHT - 62, WIDTH - 8, 58, 'message');
      this.root.add(pixelText(this, 16, HEIGHT - 52, 'Prepare sua equipe antes de começar.', { size: TEXT.large, color: COLORS.white, shadow: COLORS.shadowLight }));
      this.menu = new Menu(this, {
        x: 16, y: HEIGHT - 30, columns: 2, cellW: 220, cellH: 22, input: engine.input,
        items: [{ label: 'COMEÇAR BATALHA', textColor: '#ffffff', onSelect: () => command('beginTrainer') }, { label: 'VOLTAR À JORNADA', textColor: '#ffffff', onSelect: () => command('cancelTrainer') }],
        onBack: () => command('cancelTrainer'),
        drawCell: (c, item, x, y, focused) => {
          if (focused) c.add(pixelText(this, x, y + 2, '▶', { size: TEXT.body, color: GOLD }));
          c.add(pixelText(this, x + 12, y, item.label, { size: TEXT.large, color: focused ? GOLD : '#ffffff', shadow: '#202020' }));
        },
      });
      this.root.add(this.menu.container);
    }
  }

  // ---------- Results: victory, game over and champion ----------
  class ResultScene extends Base {
    constructor() { super('result'); }
    options() { return engineOptions('#app section.panel button[data-act]').filter(o => !['snd', 'mus'].includes(o.action)); }
    stateKey() { return [S.screen, R?.pending?.sp, R?.reward?.length, this.options().map(o => [o.action, o.value, o.label, o.disabled])]; }
    build() {
      this.cover('ui:camp', 'assets/visual/camp.png', 0.65);
      const title = S.screen === 'gameover' ? 'Tudo perdido.' : S.screen === 'win' ? 'Campeão!' : V?.training || V?.exploration ? 'Treino concluído!' : V?.boss ? 'Ginásio conquistado!' : 'Vitória!';
      this.root.add(pixelText(this, WIDTH / 2, 10, title, { size: 40, color: S.screen === 'gameover' ? '#f87070' : GOLD, shadow: '#202020' }).setOrigin(0.5, 0));
      const lines = S.screen === 'reward' ? [V?.gain ? `+${money(V.gain)}` : '', ...(V?.notes || [])].filter(Boolean)
        : S.screen === 'gameover' ? [`Vitórias: ${R.won} · Capturas: ${R.caught}`, `Recorde: ${META.best}`, ...((V?.unlocked) || []).map(n => 'Desbloqueado: ' + n)]
        : [`${R.won} vitórias · ${R.caught} capturas`];
      // Left: what happened (money, notes) and the party as it stands now.
      this.win(10, 56, 220, 150);
      lines.slice(0, 4).forEach((line, i) => this.root.add(pixelText(this, 20, 62 + i * 18, line, { size: i === 0 ? TEXT.large : TEXT.body, width: 200 })));
      R.team.slice(0, 6).forEach((m, i) => {
        const x = 18 + (i % 2) * 104, y = 136 + Math.floor(i / 2) * 22, c = this.add.container(0, 0); this.root.add(c);
        addIcon(this, c, m.sp, x + 10, y + 22, iconScale(m.sp) * 0.6).setAlpha(m.hp > 0 ? 1 : 0.4);
        c.add(pixelText(this, x + 22, y, `${nm(m)} Nv${m.lvl}`, { size: TEXT.body, color: m.hp > 0 ? COLORS.ink : COLORS.disabled }));
        this.hpBar(c, x + 22, y + 13, 72, m);
      });
      // Right: the choices the engine offers (rewards, releases, evolutions, continue).
      const opts = this.options();
      const items = opts.map(o => ({ label: o.label, sub: o.sub, icon: o.icon, disabled: o.disabled, onSelect: () => command(o.action, o.value) }));
      if (!items.length) items.push({ label: 'Continuar', onSelect: () => command('back') });
      this.win(236, 56, 238, 150);
      this.menu = new Menu(this, {
        x: 240, y: 62, columns: 1, cellW: 230, cellH: 46, rows: 3, items, input: engine.input,
        drawCell: (c, item, x, y, focused) => {
          c.add(this.add.graphics().fillStyle(item.disabled ? 0xe0e0e0 : 0xffffff, 1).fillRoundedRect(x, y, 226, 42, 4).lineStyle(focused && !item.disabled ? 2 : 1, focused && !item.disabled ? COLORS.messageBorder : 0xa8b0c0, 1).strokeRoundedRect(x, y, 226, 42, 4));
          if (item.icon) { const img = this.add.image(x + 16, y + 21, '__DEFAULT').setVisible(false); c.add(img); ensureTexture(this, 'item:' + item.icon, item.icon, () => { if (img.active) img.setTexture('item:' + item.icon).setDisplaySize(24, 24).setVisible(true); }); }
          const tx = x + (item.icon ? 32 : 8);
          c.add(pixelText(this, tx, y + 2, item.label, { size: TEXT.large, color: item.disabled ? COLORS.disabled : COLORS.ink }));
          if (item.sub) c.add(pixelText(this, tx, y + 24, item.sub, { size: TEXT.body, width: 226 - (tx - x) - 6, color: COLORS.inkSoft }));
        },
      });
      this.root.add(this.menu.container);
      const rewards = opts.filter(o => o.action === 'reward').length;
      const prompt = R?.pending ? `Equipe cheia: escolha quem sai para ficar com ${nm(R.pending)}.` : rewards ? `Escolha 1 de ${rewards} recompensas.` : items.length > 1 ? 'Escolha uma opção.' : 'Continue quando quiser.';
      this.message(prompt, { y: HEIGHT - 56, h: 52 });
    }
  }

  return { HubScene, IntroScene, ResultScene };
}
