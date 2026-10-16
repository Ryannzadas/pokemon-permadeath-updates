// Image loading and sprite measurement shared by every scene.

// Loads an image once per game (textures are shared between scenes) and calls done when ready.
const pending = new Set();
export function ensureTexture(scene, key, url, done) {
  if (scene.textures.exists(key)) { done(); return; }
  scene.load.once(`filecomplete-image-${key}`, done);
  // Several pieces of a screen may ask for the same image at once: queue it only once.
  if (!pending.has(key)) { pending.add(key); scene.load.image(key, url); scene.load.once(`filecomplete-image-${key}`, () => pending.delete(key)); }
  if (!scene.load.isLoading()) scene.load.start();
}

const bounds = new Map();
// Visible pixel box of a sprite, so Pokémon rest on the ground whatever the padding in the file.
export function pixelBounds(scene, key) {
  if (bounds.has(key)) return bounds.get(key);
  const src = scene.textures.get(key).getSourceImage(), w = src.width, h = src.height;
  let box = { left: 0, right: w - 1, top: 0, bottom: h - 1, width: w, height: h };
  try {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.drawImage(src, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    let left = w, right = -1, top = -1, bottom = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 16) { if (x < left) left = x; if (x > right) right = x; if (top < 0) top = y; bottom = y; }
    if (right >= 0) box = { left, right, top, bottom, width: w, height: h };
  } catch { /* unreadable image: keep the full box */ }
  bounds.set(key, box);
  return box;
}

// Front/back sprite for a species: FireRed/LeafGreen art (#1-386) or the regular sprite.
export function speciesSprite(sp, back = false) {
  const dex = SP[sp]?.dex;
  if (window.FRLG_SPRITES?.[dex]) return { key: `frlg:${dex}-${back ? 'b' : 'f'}`, url: `assets/sprites-frlg/${dex}-${back ? 'b' : 'f'}.png`, frlg: true };
  const url = SPRITE(dex, back);
  return { key: `spr:${url}`, url, frlg: false };
}

// Adds a species sprite standing on (x, ground). Scale: FireRed art at 2x; regular sprites at 2x
// when the Pokémon fits in `room` pixels of height, otherwise 1x.
export function addSpecies(scene, container, sp, x, ground, { back = false, room = 110, scale } = {}) {
  const info = speciesSprite(sp, back);
  const img = scene.add.image(x, ground, '__DEFAULT').setOrigin(0.5, 1).setVisible(false);
  container?.add(img);
  ensureTexture(scene, info.key, info.url, () => {
    if (!img.active) return;
    const b = pixelBounds(scene, info.key);
    const s = scale ?? (info.frlg ? 2 : (b.bottom - b.top + 1) * 2 <= room ? 2 : 1);
    img.setTexture(info.key).setScale(s).setOrigin((b.left + b.right + 1) / 2 / b.width, (b.bottom + 1) / b.height).setVisible(true);
  });
  return img;
}

// Menu icon (Gen VII, 40x30) for party lists; falls back to a shrunken battle sprite.
export function addIcon(scene, container, sp, x, ground, fallbackScale = 0.5) {
  const dex = SP[sp]?.dex;
  if (!window.POKEMON_ICONS?.has(dex)) return addSpecies(scene, container, sp, x, ground, { scale: fallbackScale });
  const key = `icon:${dex}`, img = scene.add.image(x, ground, '__DEFAULT').setOrigin(0.5, 1).setVisible(false);
  container?.add(img);
  ensureTexture(scene, key, `assets/icons/${dex}.png`, () => { if (img.active) img.setTexture(key).setVisible(true); });
  return img;
}

// Player character walking in place (facing the camera), from the camp walking sheets (4x4 frames of 32x48).
export function addWalker(scene, container, trainerId, x, ground, scale = 1.5) {
  const t = CAMP_ASSETS.trainers.find(tr => tr.id === trainerId) || CAMP_ASSETS.trainers[0];
  const key = `walk:${t.id}`, sprite = scene.add.sprite(x, ground, '__DEFAULT').setOrigin(0.5, 1).setVisible(false);
  container?.add(sprite);
  const start = () => {
    if (!sprite.active) return;
    if (!scene.anims.exists(key)) scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
    sprite.setTexture(key, 0).setScale(scale).setVisible(true).play(key);
  };
  if (scene.textures.exists(key)) start();
  else { scene.load.spritesheet(key, t.sheet, { frameWidth: 32, frameHeight: 48 }); scene.load.once(`filecomplete-spritesheet-${key}`, start); if (!scene.load.isLoading()) scene.load.start(); }
  return sprite;
}

// Leaders only exist as still images: a slow breathing loop keeps them alive on screen.
export function breathe(scene, target) {
  scene.tweens.add({ targets: target, scaleY: { from: target.scaleY || 1, to: (target.scaleY || 1) * 1.025 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  return target;
}

// Gym leaders and league trainers: their original animation (APNG converted to frame strips at build).
export function addTrainer(scene, container, sprite, x, y, { scale = 1, originY = 1 } = {}) {
  const info = window.TRAINER_ANIMS?.[sprite], key = `trainer-anim:${sprite}`;
  const img = scene.add.sprite(x, y, '__DEFAULT').setOrigin(0.5, originY).setVisible(false);
  container?.add(img);
  if (!info) { ensureTexture(scene, 'leader:' + sprite, `assets/trainers/${sprite}.png`, () => { if (img.active) img.setTexture('leader:' + sprite).setScale(scale).setVisible(true); }); return img; }
  const start = () => {
    if (!img.active) return;
    if (!scene.anims.exists(key)) scene.anims.create({ key, repeat: -1, frames: info.delays.map((duration, frame) => ({ key, frame, duration })) });
    img.setTexture(key, 0).setScale(scale).setVisible(true).play(key);
  };
  if (scene.textures.exists(key)) start();
  else { scene.load.spritesheet(key, `assets/trainers/sheets/${sprite}.png`, { frameWidth: info.width, frameHeight: info.height }); scene.load.once(`filecomplete-spritesheet-${key}`, start); if (!scene.load.isLoading()) scene.load.start(); }
  return img;
}
