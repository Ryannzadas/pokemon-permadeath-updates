// Game engine entry point. Owns one Phaser game and decides which scene draws the current
// screen; screens not migrated yet keep their previous interface underneath.
import { WIDTH, HEIGHT, FONT } from './config.js';
import { createStage, fitZoom, showStage } from './stage.js';
import { InputManager } from './input.js';
import { installRenderHook, onStateChange } from './bridge.js';
import { defineBattleScene } from './scenes/battle-scene.js';
import { defineMenuScenes } from './scenes/menu-scenes.js';
import { defineJourneyScenes } from './scenes/journey-scenes.js';

// Which scene owns a screen. Screens not listed keep the previous interface for now.
const titlePanel = () => document.body.dataset.visualPanel || '';
const SCENES = {
  battle: () => S.screen === 'battle' && !!B,
  title: () => S.screen === 'title' && !titlePanel(),
  mode: () => S.screen === 'modeSelect',
  continue: () => S.screen === 'continueSelect',
  character: () => S.screen === 'character',
  name: () => S.screen === 'trainerName',
  starter: () => S.screen === 'starter',
  hub: () => S.screen === 'hub' && !!R && !S.shop && !titlePanel(),
  intro: () => S.screen === 'intro' && !!B?.trainer,
  result: () => ['reward', 'gameover', 'win'].includes(S.screen) && !!R,
};
// HTML windows that sit over the game (profile, confirmations, evolution) take the screen while open.
const htmlWindowOpen = () => !!document.querySelector('.profile-panel,.game-confirm-overlay') || (typeof EVOLVING !== 'undefined' && EVOLVING) || !!window.journeyModalOpen;

// Automated UI tests drive the previous interface by clicking HTML; they enable the engine
// explicitly (window.FORCE_GAME_ENGINE) when testing it. Players always get the engine.
const enabled = !navigator.webdriver || window.FORCE_GAME_ENGINE === true;

const engine = { input: new InputManager(), game: null, active: null, ready: false };

function ownedScene() {
  if (!enabled || !engine.ready || htmlWindowOpen()) return null;
  return Object.keys(SCENES).find(key => SCENES[key]()) || null;
}

function route() {
  const key = ownedScene();
  if (key === engine.active) return;
  const previous = engine.active;
  engine.active = key;
  engine.input.clear();
  engine.input.enabled = !!key;
  if (previous) engine.game.scene.sleep(previous);
  if (key) {
    const manager = engine.game.scene;
    if (manager.isSleeping(key)) manager.wake(key); else manager.start(key);
  }
  showStage(engine.host, !!key);
}

function resize() {
  if (!engine.game) return;
  engine.game.scale.setZoom(fitZoom());
}

async function boot() {
  if (!window.Phaser) return;
  installRenderHook();
  engine.host = createStage();
  // Text is drawn on canvas, so the pixel font must be loaded before the first scene.
  try { await document.fonts.load(`10px "${FONT}"`); } catch { /* fall back to monospace */ }
  engine.game = new Phaser.Game({
    type: Phaser.AUTO, parent: engine.host, width: WIDTH, height: HEIGHT, pixelArt: true, roundPixels: true,
    backgroundColor: '#101418', banner: false, audio: { noAudio: true },
    // The game's content policy blocks XHR (connect-src 'none'); images load as <img> instead.
    loader: { imageLoadType: 'HTMLImageElement' },
    scale: { mode: Phaser.Scale.NONE, zoom: fitZoom() },
    scene: [new (defineBattleScene())(engine), ...[defineMenuScenes, defineJourneyScenes].flatMap(define => Object.values(define(engine)).map(Scene => new Scene()))],
  });
  engine.game.events.once('ready', () => {
    engine.game.scene.getScenes(false).forEach(scene => engine.game.scene.stop(scene.sys.settings.key));
    engine.ready = true;
    route();
  });
  addEventListener('resize', resize);
  // HTML windows can open or close without a game render; keep the owner in sync.
  setInterval(route, 250);
  onStateChange(() => {
    route();
    const scene = engine.active && engine.game.scene.getScene(engine.active);
    if (scene?.sys.isActive()) scene.sync?.();
  });
}

window.GameEngine = Object.freeze({
  // True when a Phaser scene draws the current screen (checked live, before routing settles).
  claims: () => !!ownedScene(),
  owns: screen => !!engine.active && (screen === undefined || SCENES[engine.active]?.()),
  get active() { return engine.active; },
  get game() { return engine.game; },
});

boot();
