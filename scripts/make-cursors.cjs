'use strict';
// Pixel-art mouse cursors (arrow and pointing hand) in the game's palette, drawn at 2x so each art
// pixel is 2x2 screen pixels. Run once: node scripts/make-cursors.cjs → game/assets/ui/cursor-*.png
const fs = require('node:fs'), path = require('node:path'), UPNG = require('upng-js');
const out = path.resolve(__dirname, '../game/assets/ui');
const colors = { K: [32, 40, 48, 255], W: [248, 248, 248, 255], S: [200, 192, 224, 255] };
const ART = {
  arrow: [
    'K',
    'KK',
    'KWK',
    'KWWK',
    'KWWWK',
    'KWWWWK',
    'KWWWWWK',
    'KWWWWWSK',
    'KWWWWWSSK',
    'KWWWWKKKKK',
    'KWWKWSK',
    'KWK KWSK',
    'KK  KWSK',
    'K    KWSK',
    '     KWSK',
    '      KK',
  ],
  hand: [
    '     KK',
    '    KWWK',
    '    KWWK',
    '    KWWK',
    '    KWWKKK',
    '    KWWKWWKK',
    ' KK KWWKWWKWKK',
    'KWWKKWWKWWKWWK',
    'KWWWKWWWWWWWSK',
    ' KWWWWWWWWWWSK',
    '  KWWWWWWWWWSK',
    '  KWWWWWWWWSK',
    '   KWWWWWWWSK',
    '   KWWWWWWSK',
    '    KWWWWSSK',
    '    KKKKKKKK',
  ],
};
const SCALE = 2, SIZE = 16 * SCALE;
fs.mkdirSync(out, { recursive: true });
for (const [name, rows] of Object.entries(ART)) {
  const px = new Uint8Array(SIZE * SIZE * 4);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const c = colors[ch]; if (!c) return;
    for (let dy = 0; dy < SCALE; dy++) for (let dx = 0; dx < SCALE; dx++) px.set(c, ((y * SCALE + dy) * SIZE + x * SCALE + dx) * 4);
  }));
  fs.writeFileSync(path.join(out, `cursor-${name}.png`), Buffer.from(UPNG.encode([px.buffer], SIZE, SIZE, 0)));
}
console.log('Cursors:', Object.keys(ART).join(', '));
