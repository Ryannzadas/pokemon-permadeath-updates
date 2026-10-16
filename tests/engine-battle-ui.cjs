'use strict';
// Phaser battle scene: played only with the keyboard, as a player would.
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
    localStorage.setItem('umavida-cfg', JSON.stringify({ sound: false, music: false, moveLanguage: 'pt' }));
    window.desktopAPI = { onStatus: () => {}, status: async () => ({ ok: true, value: { configured: true, user: { uid: 't' }, dirty: false, updatedAt: 1, update: { phase: 'disabled' } } }), sync: async () => ({ ok: true, value: {} }), storage: { getItem: k => localStorage.getItem(k), setItem: (k, v) => localStorage.setItem(k, v), removeItem: k => localStorage.removeItem(k) } };
  });
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.locator('.visual-title').waitFor({ state: 'attached' });
  const key = async code => { await page.keyboard.press(code); await page.waitForTimeout(120); };
  const scene = fn => page.evaluate(`(()=>{const s=GameEngine.game.scene.getScene('battle');return (${fn})(s);})()`);
  const labels = () => scene('s=>s.menu?s.menu.items.map(i=>i.label):[]');

  // Single wild battle: the stage takes over the window and the web interface is hidden.
  await page.evaluate(() => { S.pendingMode = 'classic'; S.pendingTrainer = 'red'; S.pendingTrainerName = 'T'; newRun('bulbasaur'); R.bag.potion = 3; R.team.push(mk('eevee', 18)); B = null; S.screen = 'hub'; R.battle = 2; startBattle(false); render(); });
  await page.waitForFunction(() => GameEngine.active === 'battle');
  assert.equal(await page.evaluate(() => document.getElementById('game-stage').hidden), false);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.react-header')).visibility), 'hidden');
  assert.deepEqual(await labels(), ['LUTAR', 'MOCHILA', 'POKÉMON', 'FUGIR']);

  // LUTAR shows the moves with the engine's own names; X goes back.
  await key('z');
  assert.equal(await scene('s=>s.fight'), true);
  assert((await labels()).includes('Investida'));
  await key('x');
  assert.equal(await scene('s=>s.fight'), false);

  // Bag and party lists come from the engine and go back with X.
  await key('ArrowRight'); await key('z');
  assert.equal(await page.evaluate(() => B.menu), 'bag');
  assert((await labels()).some(l => l.startsWith('Poção')));
  await key('x');
  await page.waitForFunction(() => B.menu === 'moves');
  await key('ArrowDown'); await key('ArrowLeft'); // left on the first column stays on POKÉMON
  await key('z');
  assert.equal(await page.evaluate(() => B.menu), 'switch');
  await key('x');

  // Forced replacement always opens the party; picking a survivor resumes the battle.
  await page.evaluate(() => { R.team[0].hp = 0; B.forced = true; B.switchReason = 'faint'; B.menu = 'switch'; render(); });
  await page.waitForFunction(() => GameEngine.game.scene.getScene('battle').menu?.items.some(i => i.label.startsWith('Eevee')));
  await key('z');
  await page.waitForFunction(() => !B.forced && !B.lock, null, { timeout: 15000 });

  // Play the battle to the end with the keyboard only; the stage hands back to the next screen.
  for (let i = 0; i < 80 && await page.evaluate(() => S.screen === 'battle'); i++) {
    if (await page.evaluate(() => !B.lock)) await key('z'); else await page.waitForTimeout(250);
  }
  assert.notEqual(await page.evaluate(() => S.screen), 'battle');
  // The battle scene hands over to the next screen (a result or journey scene, or an HTML screen).
  await page.waitForFunction(() => GameEngine.active !== 'battle');

  // Doubles: each Pokémon gets its turn and targets are picked in the text box.
  // A fresh run, so the previous battle's random outcome (win, loss, pending reward) does not matter.
  await page.evaluate(() => { ACT.visualHome(); S.pendingMode = 'classic'; S.pendingTrainer = 'red'; S.pendingTrainerName = 'T'; newRun('bulbasaur'); R.team.push(mk('eevee', 18)); R.team.push(mk('pikachu', 12)); B = null; S.screen = 'hub'; R.postgame = true; startBattle(false, true); render(); });
  await page.waitForFunction(() => GameEngine.active === 'battle' && B?.double);
  await key('z'); await key('z');
  assert.equal(await page.evaluate(() => B.menu), 'target');
  assert.equal((await labels()).length, 2);
  await key('z');
  await page.waitForFunction(() => B.commands.length === 1);
  assert.match(await scene('s=>s.typer?.full||""'), /vai fazer\?$/);

  assert.deepEqual(errors, []);
  console.log('PASS engine battle: Phaser stage takes the window, command/fight/bag/party menus by keyboard, forced replacement, full keyboard battle hands over to the next screen, doubles turn order and targets, no errors.');
  await browser.close(); server.close();
})().catch(async e => { console.error(e); await browser?.close(); server.close(); process.exit(1); });
