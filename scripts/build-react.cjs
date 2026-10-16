'use strict';
require('esbuild').buildSync({entryPoints:['ui/src/main.jsx'],outfile:'game/react-ui.js',bundle:true,minify:true,format:'iife',target:['chrome120'],define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
// Phaser game layer (Phaser itself is loaded from game/vendor as a global).
require('esbuild').buildSync({entryPoints:['ui/engine/main.js'],outfile:'game/engine.js',bundle:true,minify:true,format:'iife',target:['chrome120'],legalComments:'eof'});
require('./build-trainer-sheets.cjs');
console.log('React interface and game engine bundled locally for Electron.');
