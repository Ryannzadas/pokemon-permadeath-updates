'use strict';
// Phaser title and new-game flow, played with the keyboard: title → mode → character → name → starter → journey.
const assert = require('node:assert/strict'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../game');
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/$/, '/index.html'));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (e, data) => { if (e) { res.writeHead(404); return res.end(); } res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(data); });
});
let browser;
(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } }), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    window.FORCE_GAME_ENGINE = true;
    localStorage.setItem('umavida-cfg', JSON.stringify({ sound: false, music: false }));
    window.desktopAPI = { onStatus: () => {}, status: async () => ({ ok: true, value: { configured: true, user: { uid: 't' }, dirty: false, updatedAt: 1, update: { phase: 'disabled' } } }), sync: async () => ({ ok: true, value: {} }), storage: { getItem: k => localStorage.getItem(k), setItem: (k, v) => localStorage.setItem(k, v), removeItem: k => localStorage.removeItem(k) } };
  });
  await page.goto('http://127.0.0.1:' + server.address().port);
  const key = async code => { await page.keyboard.press(code); await page.waitForTimeout(150); };
  const on = (scene, screen) => page.waitForFunction(([a, s]) => GameEngine.active === a && S.screen === s, [scene, screen]);
  const labels = scene => page.evaluate(k => GameEngine.game.scene.getScene(k).menu?.items.map(i => i.label), scene);

  await on('title', 'title');
  assert.deepEqual(await labels('title'), ['JOGAR', 'COLEÇÃO', 'JOGAR COM AMIGOS', 'TEAM BUILDER', 'CONFIGURAÇÕES', 'PERFIL']);
  // Panels that are still HTML hand the screen back, and X/back returns to the Phaser title.
  await key('ArrowDown'); await key('z');
  await page.waitForFunction(() => GameEngine.active === null && document.body.dataset.visualPanel === 'collection');
  await page.evaluate(() => { ACT.visualHome(); render(); });
  await on('title', 'title');

  await key('z'); await on('mode', 'modeSelect');
  await key('x'); await on('title', 'title');
  await key('z'); await on('mode', 'modeSelect');
  await key('ArrowRight'); await key('z'); await on('character', 'character');
  assert.equal(await page.evaluate(() => S.pendingMode), 'permadeath');
  await key('x'); await on('mode', 'modeSelect');                       // back changes the mode
  await key('z'); await on('character', 'character');
  assert.equal(await page.evaluate(() => S.pendingMode), 'classic');
  await key('ArrowRight'); await key('z'); await on('name', 'trainerName');
  assert.equal(await page.evaluate(() => S.pendingTrainer), 'red');

  // The name is typed in the game's text field; an empty name is refused by the engine.
  await page.locator('.game-text-field').waitFor();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => S.msg === 'Digite o nome do seu treinador.');
  await page.locator('.game-text-field').fill('Ryan');
  await page.keyboard.press('Enter');
  await on('starter', 'starter');
  assert.equal(await page.locator('.game-text-field').count(), 0);

  // Generations change from the edges; the starter starts the journey with the chosen name.
  await key('ArrowLeft');
  assert.equal(await page.evaluate(() => S.starterCategory), 'extras');
  await key('ArrowRight');
  assert.equal(await page.evaluate(() => S.starterCategory), 'kanto');
  await key('ArrowRight'); await key('z');
  await page.waitForFunction(() => S.screen === 'hub' && R?.team[0]?.sp === 'charmander');
  assert.equal(await page.evaluate(() => [R.trainer, R.trainerName, R.mode].join()), 'red,Ryan,classic');

  // With a save, the title offers Continue first.
  await page.evaluate(() => { persist(); S.screen = 'title'; ACT.visualHome(); render(); });
  await on('title', 'title');
  assert.equal((await labels('title'))[0], 'CONTINUAR');

  assert.deepEqual(errors, []);
  console.log('PASS engine menus: title options and HTML panels handoff, mode/character/name/starter by keyboard, back steps, name validation and field, generation switching, journey starts with chosen name, Continue with a save.');
  await browser.close(); server.close();
})().catch(async e => { console.error(e); await browser?.close(); server.close(); process.exit(1); });
