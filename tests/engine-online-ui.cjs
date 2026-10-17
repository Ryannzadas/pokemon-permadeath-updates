'use strict';
// Online battle drawn by the Phaser battle scene, two clients against the in-memory Social service:
// both trainers fight with the keyboard (LUTAR → move), the turn replays, one forfeits through the
// game's confirmation window and the winner returns to Social with Z.
const assert = require('node:assert/strict'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const { SocialService } = require('../server/social-service.cjs'), { MemoryRepository } = require('../server/repository.cjs'), E = require('../server/battle-engine.cjs');
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
  const service = new SocialService(new MemoryRepository(), { getUnlocked: async () => Object.keys(E.data.species) }), errors = [], pages = {};
  for (const uid of ['a', 'b']) {
    const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    pages[uid] = page;
    page.on('pageerror', e => errors.push(uid + ': ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(uid + ': ' + m.text()); });
    await page.exposeFunction('serverRequest', async (op, arg) => { try { return { ok: true, value: await service.call(uid, op, arg) }; } catch (e) { return { ok: false, error: e.message }; } });
    await page.addInitScript(() => {
      window.FORCE_GAME_ENGINE = true;
      localStorage.setItem('umavida-cfg', JSON.stringify({ sound: false, music: false }));
      window.renderEndpoint = 'https://league-test.onrender.com';
      window.desktopAPI = { configureMultiplayer: async url => { window.renderEndpoint = url; return { ok: true, value: { url } }; }, status: async () => ({ ok: true, value: { multiplayerURL: window.renderEndpoint } }), onStatus: () => () => {}, social: (op, arg) => window.serverRequest(op, arg) };
    });
    await page.goto('http://127.0.0.1:' + server.address().port);
    await page.locator('.visual-title').waitFor({ state: 'attached' });
    await page.evaluate(uid => {
      META.teamBuilder = [{ id: 'one', name: 'Time nacional', team: [{ sp: uid === 'a' ? 'greninja' : 'pecharunt', moves: [uid === 'a' ? 'water-pulse' : 'shadow-ball'], abilitySlot: 1, heldItem: null }] }];
      ACT.social(); render();
    }, uid);
    await page.waitForFunction(() => document.querySelector('#friend-id'));
  }
  const { a, b } = pages;
  const key = async (page, code) => { await page.keyboard.press(code); await page.waitForTimeout(200); };
  const shot = async (page, name) => { if (shots) await page.screenshot({ path: path.join(shots, name + '.png') }); };
  const mode = page => page.evaluate(() => { const s = GameEngine.game.scene.getScene('battle'); return s.src?.mode(s.fight); });

  // Friendship and invitation through the (HTML) Social screens, then both open the match.
  const profileB = await service.call('b', 'hello');
  await a.evaluate(id => { document.getElementById('friend-id').value = id; ACT.addFriend(); }, profileB.id);
  await a.waitForTimeout(500);
  await b.locator('[data-act="socialRefresh"]').click();
  await b.locator('[data-act="acceptFriend"]').click();
  await a.locator('[data-act="socialRefresh"]').click();
  await a.locator('[data-friend-id]').click({ button: 'right' });
  await a.locator('[data-act="inviteBattle"]').click();
  await a.locator('[data-act="sendBattle"]').click();
  await b.locator('[data-act="socialRefresh"]').click();
  await b.locator('[data-act="acceptBattle"]').click();
  await b.locator('[data-act="answerBattle"]').click();
  await b.waitForFunction(() => S.screen === 'multiplayer' && GameEngine.active === 'battle');
  await a.locator('[data-act="socialRefresh"]').click();
  await a.evaluate(() => ACT.openMatch(document.querySelector('[data-act="openMatch"]').dataset.v));
  await a.waitForFunction(() => S.screen === 'multiplayer' && GameEngine.active === 'battle');
  for (const page of [a, b]) await page.waitForFunction(() => GameEngine.game.scene.getScene('battle').src?.online && GameEngine.game.scene.getScene('battle').mons.size === 2, null, { timeout: 8000 }).catch(async e => { console.log('DEBUG', await page.evaluate(() => { const s = GameEngine.game.scene.getScene('battle'); return JSON.stringify({ online: s.src?.online, mons: s.mons?.size, active: s.sys.isActive(), sleeping: s.sys.isSleeping(), st: !!window.OnlineBattle.state() }); }), errors); throw e; });
  assert.equal(await mode(a), 'command');
  await shot(a, 'online-command');

  // Both choose LUTAR → their only move; the turn is resolved by the service and replayed.
  for (const page of [a, b]) { await key(page, 'z'); assert.equal(await mode(page), 'fight'); }
  await shot(a, 'online-fight');
  await key(a, 'z');
  await a.waitForFunction(() => GameEngine.game.scene.getScene('battle').src.mode() === 'message');
  await key(b, 'z');
  await a.waitForFunction(() => window.OnlineBattle.state()?.turn > 0 || /usou/.test(window.OnlineBattle.state()?.status || ''), null, { timeout: 15000 });
  await a.waitForFunction(() => (window.OnlineBattle.state()?.status || '') && !window.OnlineBattle.state().waiting, null, { timeout: 15000 }).catch(() => {});
  await shot(a, 'online-turn');

  // B forfeits from the command menu (DESISTIR) and confirms in the game window; A wins.
  await b.waitForFunction(() => GameEngine.game.scene.getScene('battle').src.mode(false) === 'command', null, { timeout: 15000 });
  await key(b, 'ArrowRight'); await key(b, 'ArrowDown'); await key(b, 'z');
  await b.locator('.game-confirm-panel .btn').filter({ hasText: 'Desistir' }).click();
  await a.waitForFunction(() => window.OnlineBattle.state()?.winner === 'won', null, { timeout: 15000 });
  await a.waitForFunction(() => GameEngine.game.scene.getScene('battle').src.mode() === 'message');
  await shot(a, 'online-won');
  await key(a, 'z');
  await a.waitForFunction(() => S.screen === 'social' && GameEngine.active === null);

  assert.deepEqual(errors, []);
  console.log('PASS engine online: two clients battle in the Phaser battle scene by keyboard (LUTAR → move), turn replay, DESISTIR with the game confirmation, winner returns to Social with Z; zero JavaScript errors.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); server.close(); });
