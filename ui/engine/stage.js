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

// Zoom in physical screen pixels, so Windows display scaling (125%, 150%) still gives whole-pixel
// art. Filling the window is the default; CFG.fill === false keeps whole-pixel zoom with borders.
export function fitZoom() {
  const dpr = window.devicePixelRatio || 1, fit = Math.min(innerWidth / WIDTH, innerHeight / HEIGHT);
  if (window.CFG?.fill !== false || fit * dpr < 1) return fit;
  return Math.floor(fit * dpr) / dpr;
}

export function showStage(host, visible) {
  host.hidden = !visible;
  host.style.display = visible ? 'flex' : 'none';
  document.body.classList.toggle('game-stage-active', visible);
}
