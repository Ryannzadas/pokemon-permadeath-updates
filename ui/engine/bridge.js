// Connects Phaser scenes to the existing game engine without touching its rules.
// - State: the engine calls render() after every change; scenes are notified and read R/S/B.
// - Commands: sent through GameCommands.dispatch, the same path (and duplicate guard) as the old UI.
// - Options: lists the engine already decides (bag items, party, targets) are read from the
//   controls it renders. This adapter is the only place that does it, until the engine exposes
//   those lists as data (migration phase 6).
const listeners = new Set();

export function onStateChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }

export function installRenderHook() {
  const previous = window.render;
  window.render = (...args) => {
    const result = previous(...args);
    for (const listener of listeners) {
      try { listener(); } catch (error) { console.error('Game scene update failed:', error); }
    }
    return result;
  };
}

export function command(action, value = '') {
  return window.GameCommands ? GameCommands.dispatch(action, String(value)) : (ACT[action]?.(String(value)), render());
}

// Reads the engine's own option buttons: [{ action, value, label, sub, disabled, color }].
export function engineOptions(selector) {
  const root = document.getElementById('app');
  return [...root.querySelectorAll(selector)].map(button => {
    const small = button.querySelector('small');
    const label = [...button.childNodes].filter(n => n !== small && !(n.nodeType === 1 && n.matches('.art,img,.item-sprite')))
      .map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
    return {
      action: button.dataset.act, value: button.dataset.v ?? '', label,
      sub: small?.textContent.trim() || '', disabled: button.disabled,
      color: button.style.getPropertyValue('--move-color').trim(),
      icon: button.querySelector('img')?.getAttribute('src') || '',
    };
  }).filter(o => o.action);
}

export function enginePrompt() {
  const p = document.querySelector('#app .react-battle-choices > p, #app .react-battle-choices .pvp-journey-controls > p');
  return p?.textContent.trim() || '';
}
