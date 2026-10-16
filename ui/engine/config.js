// Shared constants for the Phaser game layer.
export const WIDTH = 480;
export const HEIGHT = 270;

// Jersey 10 is drawn on a 10px em: text stays crisp only at whole multiples of 10.
export const FONT = 'Jersey 10';
export const TEXT = { small: 10, body: 10, large: 20 };

export const COLORS = {
  ink: '#303030',
  inkSoft: '#606878',
  white: '#ffffff',
  disabled: '#a8a8b0',
  shadowLight: '#50586a',
  statusFill: 0xf8f8e0,
  statusBorder: 0x405040,
  statusShadow: 0x405040,
  messageFill: 0x304860,
  messageBorder: 0xd8683c,
  messageInner: 0xf0c8a0,
  menuFill: 0xf8f8f8,
  menuBorder: 0x706890,
  menuInner: 0xc8c0e0,
  menuFocus: 0xe8e0f8,
  barTrack: 0x506058,
  barBorder: 0x384838,
  hpHigh: 0x58d080,
  hpMid: 0xf8c038,
  hpLow: 0xf85838,
  exp: 0x48a8f8,
  hpLabel: '#f8d040',
  frame: 0x182028,
  letterbox: '#101418',
  panelFill: 0xf0f0e0,
  panelHead: 0x58a8d8,
};

export const hpColor = ratio => ratio > 0.5 ? COLORS.hpHigh : ratio > 0.2 ? COLORS.hpMid : COLORS.hpLow;
