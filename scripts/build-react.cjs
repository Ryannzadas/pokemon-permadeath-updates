'use strict';
require('esbuild').buildSync({entryPoints:['ui/src/main.jsx'],outfile:'game/react-ui.js',bundle:true,minify:true,format:'iife',target:['chrome120'],define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
console.log('React interface bundled locally for Electron.');
