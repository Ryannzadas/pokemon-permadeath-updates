'use strict';
const {spawnSync}=require('node:child_process'),path=require('node:path');
const checks=['scripts/test-camp.cjs',...['current-types','level-cap','playtime','mode-store','sylveon','expansion','strategy','battle-effects','journal','auth-client','auth','sync-queue','cloud-errors','updates','install-gate','social','render-server','new-models','online-dex','league-admin','builder-options','firestore-battle'].map(n=>'tests/'+n+'.cjs')];
for(const file of checks){const r=spawnSync(process.execPath,[path.resolve(__dirname,'..',file)],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
console.log('PASS all local model, battle, account and updater checks.');
