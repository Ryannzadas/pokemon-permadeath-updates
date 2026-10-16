// The game canvas: a fixed 480x270 world drawn at the largest whole-number zoom that fits the
// window, centered over a dark letterbox. Integer zoom keeps every pixel the same size.
import { WIDTH, HEIGHT, COLORS } from './config.js';

export function createStage() {
  const host = document.createElement('div');
  host.id = 'game-stage';
  host.hidden = true;
  Object.assign(host.style, {
    position: 'fixed', inset: '0', zIndex: '1000', display: 'none',
    alignItems: 'center', justifyContent: 'center', background: COLORS.letterbox,
  });
  document.body.appendChild(host);
  return host;
}

export function fitZoom() {
  const fit = Math.min(innerWidth / WIDTH, innerHeight / HEIGHT);
  return fit >= 1 ? Math.floor(fit) : fit;
}

export function showStage(host, visible) {
  host.hidden = !visible;
  host.style.display = visible ? 'flex' : 'none';
  document.body.classList.toggle('game-stage-active', visible);
}
