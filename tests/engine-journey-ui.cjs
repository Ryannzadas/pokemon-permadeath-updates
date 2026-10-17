'use strict';
// Phaser journey scenes played with the keyboard: journey menu, shop, bag, PC, summary, trainer preview and rewards.
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

  // Shop: pick an item, raise the quantity in the quantity window, buy, and leave with X.
  await pick('hub', 'LOJA');
  await page.waitForFunction(() => S.shop && GameEngine.active === 'shop');
  const shopItem = await page.evaluate(() => ShopView.data().items.find(e => !e.sold && e.max >= 2));
  for (let i = 0; i < await page.evaluate(id => GameEngine.game.scene.getScene('shop').menu.items.findIndex(x => x.e?.i === id), shopItem.i); i++) await key('ArrowDown');
  await key('z');
  await page.waitForFunction(() => GameEngine.game.scene.getScene('shop').buying != null);
  if (!shopItem.once) { await key('ArrowUp'); await page.waitForFunction(i => S.shopQty?.[i] === 2, shopItem.i); }
  const qty = shopItem.once ? 1 : 2, money = await page.evaluate(() => R.money);
  await key('z');
  await page.waitForFunction(([m, cost]) => R.money === m - cost, [money, shopItem.price * qty]);
  await key('x');
  await page.waitForFunction(() => !S.shop && GameEngine.active === 'hub');

  // Bag: a potion is used on the hurt lead through the target window, then back to the list.
  await page.evaluate(() => { R.bag.potion = 2; R.team[0].hp = 1; ACT.visualBag(); render(); });
  await page.waitForFunction(() => GameEngine.active === 'bag');
  const potion = await page.evaluate(() => GameEngine.game.scene.getScene('bag').menu.items.findIndex(x => x.e?.id === 'potion'));
  for (let i = 0; i < potion; i++) await key('ArrowDown');
  await key('z');
  await page.waitForFunction(() => S.sel === 'potion' && !!GameEngine.game.scene.getScene('bag').pop);
  await key('z');
  await page.waitForFunction(() => R.bag.potion === 1 && R.team[0].hp > 1 && !S.sel);
  await key('x');
  await page.waitForFunction(() => GameEngine.active === 'hub');

  // PC: withdraw from the box and deposit back from the party.
  await page.evaluate(() => { R.pc.push(mk('pidgey', 7)); ACT.visualPC(); render(); });
  await page.waitForFunction(() => GameEngine.active === 'pc');
  await key('z'); await key('z');
  await page.waitForFunction(() => R.pc.length === 0 && R.team.length === 2);
  await key('ArrowLeft'); await key('ArrowDown'); await key('z'); await key('z');
  await page.waitForFunction(() => R.pc.length === 1 && R.team.length === 1);
  await key('x');
  await page.waitForFunction(() => GameEngine.active === 'hub');

  // Simple pages (missions, event between battles) are game lists: X goes back, Z picks a choice.
  await page.evaluate(() => { ACT.missions(); render(); });
  await page.waitForFunction(() => GameEngine.active === 'list' && GameEngine.game.scene.getScene('list').menu?.items.length >= 3);
  await key('x');
  await page.waitForFunction(() => GameEngine.active === 'hub');
  await page.evaluate(() => { R.money = Math.max(R.money, 100); R.journey.pending = 'traveler'; S.screen = 'journeyEvent'; render(); });
  await page.waitForFunction(() => GameEngine.active === 'list');
  const berries = await page.evaluate(() => R.bag['oran-berry'] || 0);
  await key('z');
  await page.waitForFunction(b => GameEngine.active === 'hub' && R.bag['oran-berry'] === b + 1 && !R.journey.pending, berries);

  // Summary: pages with ◀ ▶; an owned TM is taught from APRENDER; X goes back.
  await page.evaluate(() => { R.team[0].hp = R.team[0].maxHp; const tm = SP[R.team[0].sp].learn.find(x => x.method === 'machine' && M[x.id] && !R.team[0].learned.includes(x.id)); R.bag['tm:' + tm.id] = 1; window.__tm = tm.id; ACT.summary(0); render(); });
  await page.waitForFunction(() => GameEngine.active === 'summary' && GameEngine.game.scene.getScene('summary').page === 'info');
  for (let i = 0; i < 3; i++) await key('ArrowRight');
  await page.waitForFunction(() => GameEngine.game.scene.getScene('summary').page === 'learn');
  const tmRow = await page.evaluate(() => GameEngine.game.scene.getScene('summary').menu.items.findIndex(i => i.id === window.__tm && i.tag === 'TM/HM'));
  assert(tmRow >= 0, 'owned TM listed');
  for (let i = 0; i < tmRow; i++) await key('ArrowDown');
  await key('z'); await key('z');
  await page.waitForFunction(() => R.team[0].learned.includes(window.__tm) && !R.bag['tm:' + window.__tm]);
  await key('x');
  await page.waitForFunction(() => GameEngine.active === 'hub' || GameEngine.active === 'team');

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
  await page.evaluate(async () => { for (let i = 0; i < 200 && S.screen === 'battle'; i++) { if (B && !B.lock && B.menu === 'moves') await GameCommands.dispatch('mv', '0'); await new Promise(r => setTimeout(r, 200)); } });
  await page.waitForFunction(() => S.screen === 'reward' && GameEngine.active === 'result');
  const rewards = await page.evaluate(() => GameEngine.game.scene.getScene('result').menu.items.map(i => i.label));
  assert.equal(rewards.length, 3);
  assert(rewards.every(l => l && l !== 'Pegar'), rewards.join());
  const before = await page.evaluate(() => JSON.stringify([R.relics, R.bag, R.money]));
  await key('z');
  await page.waitForFunction(() => S.screen !== 'reward');
  assert.notEqual(await page.evaluate(() => JSON.stringify([R.relics, R.bag, R.money])), before);

  assert.deepEqual(errors, []);
  console.log('PASS engine journey: journey menu options, shop purchase with quantity window, bag item use on a party member, PC withdraw/deposit, summary pages and TM teaching, missions list and event choice, trainer preview back without spending the battle, result scene with named rewards picked by keyboard.');
  await browser.close(); server.close();
})().catch(async e => { console.error(e); await browser?.close(); server.close(); process.exit(1); });
