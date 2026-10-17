'use strict';
// Walking worlds inside the game engine, played with the keyboard: camp (walk, talk, play, X menu),
// Pokémon Center (nurse heals, X menu exit) and a route walk (observe at the marker, wild encounter).
const assert = require('node:assert/strict'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../game'), shots = process.env.SHOTS;
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
  const key = async (code, hold = 0) => { if (hold) { await page.keyboard.down(code); await page.waitForTimeout(hold); await page.keyboard.up(code); } else await page.keyboard.press(code); await page.waitForTimeout(180); };
  const shot = async name => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png') }); };
  const place = (x, y, dir = 'up') => page.evaluate(([x, y, dir]) => { const w = GameEngine.world; w.player.setPosition(x, y); w.direction = dir; }, [x, y, dir]);
  const worldReady = () => page.waitForFunction(() => GameEngine.active === 'world' && !!GameEngine.world?.player);

  // Classic run with a living team and money.
  await page.evaluate(() => { ACT.visualHome(); S.pendingMode = 'classic'; S.pendingTrainer = 'red'; S.pendingTrainerName = 'Ryan'; newRun('bulbasaur'); R.team.push(mk('eevee', 12)); R.money = 500; render(); });
  await page.waitForFunction(() => GameEngine.active === 'hub');

  // Camp: one canvas (the world is a scene of the game), walking moves the trainer.
  await page.evaluate(() => { ACT.camp(); render(); });
  await worldReady();
  assert.equal(await page.locator('canvas').count(), 1, 'the camp runs inside the game canvas');
  const y0 = await page.evaluate(() => GameEngine.world.player.y);
  await key('ArrowUp', 450);
  assert(await page.evaluate(y => GameEngine.world.player.y < y - 5, y0), 'arrow keys walk');
  await shot('world-camp');
  // Next to a companion, Z opens its window; BRINCAR raises friendship; X menu returns to the journey.
  await page.evaluate(() => { const m = GameEngine.world.monsters.getChildren()[0]; m.body.setVelocity(0); GameEngine.world.player.setPosition(m.x, m.y + 24); });
  await key('z');
  await page.waitForFunction(() => GameEngine.game.scene.getScene('world').panel?.type === 'member');
  await shot('world-camp-member');
  const before = await page.evaluate(() => R.team[GameEngine.game.scene.getScene('world').panel.index].friendship);
  await key('z');
  await page.waitForFunction(b => R.team[GameEngine.game.scene.getScene('world').panel.index].friendship === b + 3 && R.camp.used === 1, before);
  await key('ArrowDown'); await key('ArrowDown'); await key('z');
  await page.waitForFunction(() => !GameEngine.game.scene.getScene('world').panel);
  await key('x');
  await page.waitForFunction(() => GameEngine.game.scene.getScene('world').panel?.type === 'menu');
  await shot('world-camp-menu');
  await key('z');
  await page.waitForFunction(() => S.screen === 'hub' && GameEngine.active === 'hub' && !GameEngine.world);

  // Pokémon Center (Classic): the nurse heals the team; X menu leaves.
  await page.evaluate(() => { R.team[0].hp = 1; ACT.center(); render(); });
  await worldReady();
  await place(320, 196);
  await key('z');
  await page.waitForFunction(() => GameEngine.game.scene.getScene('world').panel?.type === 'nurse');
  await shot('world-center-nurse');
  await key('z');
  await page.waitForFunction(() => R.team[0].hp === R.team[0].maxHp);
  await worldReady();
  // After healing the nurse says goodbye; closing her window lets the trainer walk again.
  await page.waitForFunction(() => GameEngine.game.scene.getScene('world').panel?.type === 'nurse');
  await key('z');
  await page.waitForFunction(() => !GameEngine.game.scene.getScene('world').panel && !GameEngine.world.blocked());
  await key('x');
  await page.waitForFunction(() => GameEngine.game.scene.getScene('world').panel?.type === 'menu');
  await key('z');
  await page.waitForFunction(() => S.screen === 'hub' && !R.inCenter && GameEngine.active === 'hub');

  // Route walk: Z at the marker observes the route species; the X menu starts a wild encounter.
  await page.evaluate(() => { ACT.routes(); render(); ACT.routeWalk(); render(); });
  await worldReady();
  await place(320, 200);
  await key('z');
  await page.waitForFunction(() => GameEngine.game.scene.getScene('world').panel?.type === 'discovery');
  await shot('world-route');
  await key('z');
  await page.waitForFunction(() => S.msg === 'Observação registrada.' && !GameEngine.game.scene.getScene('world').panel);
  await key('x'); await key('z');
  await page.waitForFunction(() => S.screen === 'battle' && GameEngine.active === 'battle' && !GameEngine.world);

  assert.deepEqual(errors, []);
  console.log('PASS engine world: camp/Center/route walks inside the game canvas, arrow keys walk, Z talks (companion play, nurse heal, route observation), X menu leaves or starts a wild encounter, world removed on exit; zero JavaScript errors.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); server.close(); });
