'use strict';
// Phaser journey scenes played with the keyboard: journey menu, HTML handoff, trainer preview and rewards.
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
  await page.locator('.visual-title').waitFor({ state: 'attached' });
  const key = async code => { await page.keyboard.press(code); await page.waitForTimeout(150); };
  const labels = scene => page.evaluate(k => GameEngine.game.scene.getScene(k).menu?.items.map(i => i.label), scene);
  const pick = async (scene, label) => {
    const items = await labels(scene), index = items.findIndex(l => l.startsWith(label));
    assert(index >= 0, `${label} in ${items}`);
    for (let i = 0; i < index; i++) await key('ArrowDown');
    await key('z');
  };

  // Journey menu in a Permadeath run (training and recovery are Permadeath options).
  await page.evaluate(() => { ACT.visualHome(); S.pendingMode = 'permadeath'; S.pendingTrainer = 'red'; S.pendingTrainerName = 'Ryan'; newRun('charmander'); R.team[0].lvl = 12; R.money = 1234; render(); });
  await page.waitForFunction(() => GameEngine.active === 'hub');
  const hub = await labels('hub');
  for (const l of ['BATALHAR', 'ROTAS', 'ACAMPAMENTO', 'LOJA', 'RECUPERAR', 'EQUIPE', 'MOCHILA', 'POKÉDEX', 'DIÁRIO', 'PC', 'TREINO', 'MENU']) assert(hub.includes(l), l);

  // Screens that are still HTML take over and hand back to the Phaser journey.
  await pick('hub', 'LOJA');
  await page.waitForFunction(() => S.shop && GameEngine.active === null);
  await page.evaluate(() => { ACT.shop(); render(); });
  await page.waitForFunction(() => GameEngine.active === 'hub');

  // Trainer preview: back returns without spending the battle.
  await page.evaluate(() => { R.battle = 4; S.msg = ''; render(); });
  await page.waitForFunction(() => GameEngine.game.scene.getScene('hub').menu?.items[0]?.label === 'DESAFIAR BROCK');
  await key('z');
  await page.waitForFunction(() => GameEngine.active === 'intro' && S.screen === 'intro');
  await key('x');
  await page.waitForFunction(() => GameEngine.active === 'hub');
  assert.equal(await page.evaluate(() => R.battle), 4);

  // A won battle shows the result scene; a reward is picked with the keyboard.
  await page.evaluate(() => { R.battle = 1; B = null; S.screen = 'hub'; startBattle(false); B.enemy.hp = 1; render(); });
  await page.waitForFunction(() => GameEngine.active === 'battle');
  // The battle itself is covered by engine-battle-ui; here it is finished through commands so no
  // stray key press lands on the result screen.
  await page.evaluate(async () => { for (let i = 0; i < 60 && S.screen === 'battle'; i++) { if (B && !B.lock && B.menu === 'moves') await GameCommands.dispatch('mv', '0'); await new Promise(r => setTimeout(r, 200)); } });
  await page.waitForFunction(() => S.screen === 'reward' && GameEngine.active === 'result');
  const rewards = await page.evaluate(() => GameEngine.game.scene.getScene('result').menu.items.map(i => i.label));
  assert.equal(rewards.length, 3);
  assert(rewards.every(l => l && l !== 'Pegar'), rewards.join());
  const before = await page.evaluate(() => JSON.stringify([R.relics, R.bag, R.money]));
  await key('z');
  await page.waitForFunction(() => S.screen !== 'reward');
  assert.notEqual(await page.evaluate(() => JSON.stringify([R.relics, R.bag, R.money])), before);

  assert.deepEqual(errors, []);
  console.log('PASS engine journey: journey menu options, HTML shop handoff and return, trainer preview back without spending the battle, result scene with named rewards picked by keyboard.');
  await browser.close(); server.close();
})().catch(async e => { console.error(e); await browser?.close(); server.close(); process.exit(1); });
