// Game engine entry point. Owns one Phaser game and decides which scene draws the current
// screen; screens not migrated yet keep their previous interface underneath.
import { WIDTH, HEIGHT, FONT } from './config.js';
import { createStage, fitZoom, showStage } from './stage.js';
import { InputManager } from './input.js';
import { installRenderHook, onStateChange } from './bridge.js';
import { defineBattleScene, battleOwnsScreen } from './scenes/battle-scene.js';
import { defineLoaderScene } from './assets.js';
import { defineMenuScenes } from './scenes/menu-scenes.js';
import { defineJourneyScenes } from './scenes/journey-scenes.js';
import { definePanelScenes } from './scenes/panel-scenes.js';
import { defineCollectionScenes } from './scenes/collection-scenes.js';
import { definePartyScenes } from './scenes/party-scenes.js';
import { defineSummaryScene } from './scenes/summary-scene.js';
import { defineListScenes, LIST_SCREENS } from './scenes/list-scenes.js';
import { defineWorldScenes, WORLD_SCREENS } from './scenes/world-scenes.js';

// Which scene owns a screen. Screens not listed keep the previous interface for now.
const titlePanel = () => document.body.dataset.visualPanel || '';
const SCENES = {
  battle: () => battleOwnsScreen(),
  title: () => S.screen === 'title' && !titlePanel(),
  mode: () => S.screen === 'modeSelect',
  continue: () => S.screen === 'continueSelect',
  character: () => S.screen === 'character',
  name: () => S.screen === 'trainerName',
  starter: () => S.screen === 'starter',
  hub: () => S.screen === 'hub' && !!R && !S.shop && !titlePanel(),
  intro: () => S.screen === 'intro' && !!B?.trainer,
  result: () => ['reward', 'gameover', 'win'].includes(S.screen) && !!R,
  dex: () => S.screen === 'dex',
  journal: () => S.screen === 'journal',
  team: () => S.screen === 'hub' && !!R && !S.shop && titlePanel() === 'team',
  bag: () => S.screen === 'hub' && !!R && !S.shop && titlePanel() === 'bag',
  shop: () => S.screen === 'hub' && !!R && !!S.shop,
  pc: () => S.screen === 'pc',
  summary: () => S.screen === 'summary' && !!R,
  list: () => LIST_SCREENS.includes(S.screen),
  world: () => WORLD_SCREENS.includes(S.screen) && !!R,
};
// The Trainer Card is still a full HTML screen: it takes the screen while open.
const htmlWindowOpen = () => !!window.journeyModalOpen;
// Confirmations, the evolution sequence and the profile are windows drawn over the scene: the game
// stays on screen and the keyboard goes to the window until it closes.
const overlayOpen = () => !!document.querySelector('.game-confirm-overlay,.evo,.profile-panel') || (typeof EVOLVING !== 'undefined' && EVOLVING);

// Automated UI tests drive the previous interface by clicking HTML; they enable the engine
// explicitly (window.FORCE_GAME_ENGINE) when testing it. Players always get the engine.
const enabled = !navigator.webdriver || window.FORCE_GAME_ENGINE === true;

const engine = { input: new InputManager(), game: null, active: null, ready: false, window: null, renderScale: 1 };

// Game windows (settings, collection) open over the title or the journey and return there.
function ownedScene() {
  if (!enabled || !engine.ready || htmlWindowOpen()) return null;
  const base = Object.keys(SCENES).find(key => SCENES[key]()) || null;
  // A screen opened from a window (e.g. Pokédex from Collection) returns to that window on back.
  if (engine.returnTo) {
    const { window, from } = engine.returnTo;
    if (S.screen === from) { engine.returnTo = null; engine.window = window; }
    else if (!RETURNABLE.includes(S.screen)) engine.returnTo = null;
  }
  if (engine.window && base && base !== 'battle') return engine.window;
  if (!base) engine.window = null;
  return base;
}
engine.openWindow = key => { engine.window = key; route(); };
engine.closeWindow = () => { engine.window = null; route(); };
// Walking worlds (camp, Center, route walk) are separate scenes under the 'world' HUD scene. The
// world's own code (game/camp/scene.js) asks to be hosted; it is added once the game is ready.
const WORLD_KEY = 'Camp';
engine.hostWorld = scene => { engine.pendingWorld = scene; mountWorld(); };
function mountWorld() {
  const scene = engine.pendingWorld;
  if (!scene || !engine.ready) return;
  engine.pendingWorld = null;
  const manager = engine.game.scene;
  if (manager.getScene(WORLD_KEY)) engine.removeWorld();
  engine.world = scene;
  manager.add(WORLD_KEY, scene, true);
  manager.sendToBack(WORLD_KEY);
  engine.game.events.emit('world-changed');
}
// Removes the world and the textures/animations it made, so the next visit (another team, another
// place) starts clean.
engine.removeWorld = (scene = engine.world) => {
  if (engine.pendingWorld === scene) engine.pendingWorld = null;
  if (!scene || engine.world !== scene) return;
  engine.world = null;
  const game = engine.game;
  game.scene.remove(WORLD_KEY);
  const own = key => /^((trainer|mon-\d+)(-|$)|camp-|center-ground$)/.test(key);
  game.textures.getTextureKeys().filter(own).forEach(key => game.textures.remove(key));
  [...game.anims.anims.keys()].filter(own).forEach(key => game.anims.remove(key));
  game.events.emit('world-changed');
};
// Leave a window for a screen and come back to it when that screen closes.
const RETURNABLE = ['dex', 'journal', 'daily', 'memorial', 'savedJourneys', 'summary', 'pc'];
engine.leaveWindow = () => { engine.returnTo = { window: engine.window, from: S.screen }; engine.window = null; };
engine.resize = () => resize();
// Full screen (desktop app): remembered in CFG.fullscreen and toggled with F11 or the options.
engine.canFullScreen = () => typeof window.desktopAPI?.fullScreen === 'function';
engine.setFullScreen = async on => {
  if (!engine.canFullScreen()) return;
  CFG.fullscreen = !!on; saveCfg();
  await window.desktopAPI.fullScreen(!!on);
  setTimeout(resize, 120);
};
addEventListener('keydown', event => { if (event.key === 'F11') { event.preventDefault(); engine.setFullScreen(!CFG.fullscreen); } });

// HTML screens that stay in HTML (hybrid scope) wear the game's window style while the engine runs.
const SKINNED = ['social', 'friendMenu', 'multiplayer', 'inviteBattle', 'acceptBattle', 'league', 'leagueCreate', 'leagueEdit', 'teams', 'teamEdit', 'teamText'];
function route() {
  const key = ownedScene();
  document.documentElement.classList.toggle('game-skin', enabled && !key && SKINNED.includes(S.screen));
  document.documentElement.classList.toggle('game-skin-windows', enabled);
  engine.input.enabled = !!key && !overlayOpen();
  if (key === engine.active) return;
  const previous = engine.active;
  engine.active = key;
  engine.input.clear();
  engine.input.enabled = !!key && !overlayOpen();
  if (previous) engine.game.scene.sleep(previous);
  if (key) {
    const manager = engine.game.scene;
    if (manager.isSleeping(key)) manager.wake(key); else manager.start(key);
  }
  showStage(engine.host, !!key);
}

// The world is 480x270, but it is drawn at the screen's real resolution (render scale R): every
// camera zooms by R and text is rasterized at R, so small letters stay sharp at any window size.
// Exactly the device pixels the game occupies, so nothing is resampled after drawing.
function renderScale() { return Math.max(1, Math.min(8, fitZoom() * (window.devicePixelRatio || 1))); }
function resize() {
  // HTML windows over the game size themselves in game units: 1u = --gz CSS pixels.
  document.documentElement.style.setProperty('--gz', String(fitZoom()));
  // Before Phaser has booted there is no canvas to scale yet; 'ready' calls this again.
  if (!engine.game?.canvas) return;
  const R = renderScale();
  if (Math.abs(R - engine.renderScale) > 0.001) {
    engine.renderScale = R;
    engine.game.registry.set('renderScale', R);
    engine.game.scale.resize(Math.round(WIDTH * R), Math.round(HEIGHT * R));
    engine.game.scene.getScenes(false).forEach(scene => { scene.cameras?.main?.setZoom(R).centerOn(WIDTH / 2, HEIGHT / 2); scene.events.emit('rescale'); });
  }
  engine.game.scale.setZoom(1 / (window.devicePixelRatio || 1));
}

async function boot() {
  if (!window.Phaser) return;
  installRenderHook();
  engine.host = createStage();
  // Text is drawn on canvas, so the pixel font must be loaded before the first scene.
  try { await document.fonts.load(`10px "${FONT}"`); } catch { /* fall back to monospace */ }
  engine.game = new Phaser.Game({
    type: Phaser.AUTO, parent: engine.host, pixelArt: true, roundPixels: false,
    // Arcade physics for the walking worlds (camp, Center, routes).
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    backgroundColor: '#101418', banner: false, audio: { noAudio: true },
    // The game's content policy blocks XHR (connect-src 'none'); images load as <img> instead.
    loader: { imageLoadType: 'HTMLImageElement' },
    width: Math.round(WIDTH * renderScale()), height: Math.round(HEIGHT * renderScale()),
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / (window.devicePixelRatio || 1) },
    scene: [new (defineLoaderScene())(), new (defineBattleScene())(engine), ...[defineMenuScenes, defineJourneyScenes, definePanelScenes, defineCollectionScenes, definePartyScenes, defineSummaryScene, defineListScenes, defineWorldScenes].flatMap(define => Object.values(define(engine)).map(Scene => new Scene()))],
  });
  engine.renderScale = renderScale();
  engine.game.registry.set('renderScale', engine.renderScale);
  // Every scene draws the 480x270 world through a camera zoomed to the render scale.
  engine.game.events.on('step', () => engine.game.scene.getScenes(true).forEach(scene => {
    const cam = scene.cameras.main;
    if (cam.zoom !== engine.renderScale) cam.setZoom(engine.renderScale).centerOn(WIDTH / 2, HEIGHT / 2);
  }));
  engine.game.events.once('ready', () => {
    engine.game.scene.getScenes(false).forEach(scene => { if (scene.sys.settings.key !== 'assets-loader') engine.game.scene.stop(scene.sys.settings.key); });
    engine.ready = true;
    resize();
    route();
    mountWorld();
  });
  addEventListener('resize', resize);
  resize();
  if (CFG.fullscreen) engine.setFullScreen(true);
  // HTML windows can open or close without a game render; keep the owner in sync.
  setInterval(route, 250);
  onStateChange(() => {
    route();
    const scene = engine.active && engine.game.scene.getScene(engine.active);
    if (scene?.sys.isActive()) scene.sync?.();
  });
}

window.GameEngine = Object.freeze({
  enabled,
  hostWorld: scene => engine.hostWorld(scene),
  removeWorld: scene => engine.removeWorld(scene),
  get world() { return engine.world; },
  // True when a Phaser scene draws the current screen (checked live, before routing settles).
  claims: () => !!ownedScene(),
  owns: screen => !!engine.active && (screen === undefined || SCENES[engine.active]?.()),
  get active() { return engine.active; },
  get game() { return engine.game; },
});

boot();
