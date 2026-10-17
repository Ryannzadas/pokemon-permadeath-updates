// Turns keyboard and gamepad input into game actions (up, down, left, right, confirm, back).
// Only the top handler on the focus stack receives them, so a menu opened over another menu
// takes the input until it closes.
const KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'confirm', Enter: 'confirm', Space: 'confirm',
  KeyX: 'back', Escape: 'back', Backspace: 'back',
};
// Standard gamepad mapping: A confirms, B goes back, d-pad and left stick move.
const PAD_BUTTONS = { 0: 'confirm', 1: 'back', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

export class InputManager {
  constructor() {
    this.stack = [];
    this.enabled = false;
    // While walking in a world scene, keys go to that scene (Phaser keyboard) instead of the menus.
    this.passthrough = false;
    this.padHeld = new Set();
    addEventListener('keydown', event => this.onKey(event), true);
  }

  push(handler) { this.stack.push(handler); return () => this.remove(handler); }
  remove(handler) { this.stack = this.stack.filter(h => h !== handler); }
  clear() { this.stack = []; }

  emit(action) {
    const top = this.stack.at(-1);
    return !!top?.(action);
  }

  onKey(event) {
    if (!this.enabled || this.passthrough || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    const action = KEYS[event.code];
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.repeat || ['up', 'down', 'left', 'right'].includes(action)) this.emit(action);
  }

  // Called every frame by the active scene.
  pollGamepads() {
    if (!this.enabled) return;
    const pads = navigator.getGamepads?.() || [];
    const pressed = new Set();
    for (const pad of pads) {
      if (!pad) continue;
      for (const [index, action] of Object.entries(PAD_BUTTONS)) if (pad.buttons[index]?.pressed) pressed.add(action);
      const [x = 0, y = 0] = pad.axes;
      if (y < -0.6) pressed.add('up'); if (y > 0.6) pressed.add('down');
      if (x < -0.6) pressed.add('left'); if (x > 0.6) pressed.add('right');
    }
    for (const action of pressed) if (!this.padHeld.has(action)) this.emit(action);
    this.padHeld = pressed;
  }
}
