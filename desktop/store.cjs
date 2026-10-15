'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const KEYS = ['umavida-save-v1','umavida-meta-v1','umavida-cfg'];
function cleanSlots(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Save inválido.');
  const result = {};
  for (const key of KEYS) if (value[key] != null) {
    if (typeof value[key] !== 'string' || value[key].length > 500000) throw new Error('Save inválido.');
    const parsed = JSON.parse(value[key]);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Save inválido.');
    if (key === 'umavida-save-v1' && (!parsed.R || !Array.isArray(parsed.R.team) || parsed.R.team.length > 6 || !parsed.S)) throw new Error('Jornada inválida.');
    if(key==='umavida-save-v1'&&parsed.runs){for(const [mode,run] of Object.entries(parsed.runs)){if(!['classic','permadeath','classic-double','permadeath-double'].includes(mode)||!run?.R||run.R.mode!==mode.replace('-double','')||(mode.endsWith('-double')&&!run.R.postgame)||!Array.isArray(run.R.team)||run.R.team.length>6||!run.S)throw new Error('Jornada inválida.');}}
    result[key] = value[key];
  }
  if (Buffer.byteLength(JSON.stringify(result)) > 650000) throw new Error('Save muito grande.');
  return result;
}
function atomicWrite(file, data) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  const tmp = file + '.tmp';
  const fd = fs.openSync(tmp, 'w', 0o600);
  try { fs.writeFileSync(fd, data); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  if (fs.existsSync(file)) fs.copyFileSync(file, file + '.bak');
  fs.renameSync(tmp, file);
}
class SaveStore {
  constructor(directory) { this.directory=directory; this.select(null); }
  file(uid) { return path.join(this.directory, (uid ? crypto.createHash('sha256').update(uid).digest('hex') : 'guest') + '.json'); }
  read(uid) {
    const file=this.file(uid);
    for (const candidate of [file,file+'.bak']) {
      if (!fs.existsSync(candidate)) continue;
      try { const doc=JSON.parse(fs.readFileSync(candidate,'utf8')); cleanSlots(doc.slots); return doc; } catch {}
    }
    if (fs.existsSync(file) || fs.existsSync(file+'.bak')) throw new Error('Não foi possível ler o save local. Os arquivos foram preservados.');
    return {schema:1, slots:{}, revision:0, dirty:false, cloudVersion:null, updatedAt:null};
  }
  select(uid) { const data=this.read(uid); this.uid=uid; this.data=data; return data; }
  save() { atomicWrite(this.file(this.uid), JSON.stringify(this.data)); }
  write(key, value) {
    if (!KEYS.includes(key)) throw new Error('Chave não permitida.');
    const next={...this.data.slots};
    if(value===null) delete next[key]; else next[key]=value;
    cleanSlots(next);
    if(JSON.stringify(next)===JSON.stringify(this.data.slots)) return;
    this.data={...this.data,slots:next,revision:this.data.revision+1,dirty:true,updatedAt:new Date().toISOString()};this.save();
  }
  replace(slots,cloudVersion,dirty=false) {
    cleanSlots(slots);
    if(Object.keys(this.data.slots).length){
      const backup=path.join(this.directory,'recovery',Date.now()+'-'+crypto.randomBytes(4).toString('hex')+'.json');
      atomicWrite(backup,JSON.stringify(this.data));
    }
    this.data={schema:1,slots:cleanSlots(slots),revision:this.data.revision+1,dirty,cloudVersion,updatedAt:new Date().toISOString()};this.save();
  }
  markSynced(version,revision) { this.data.cloudVersion=version; if(this.data.revision===revision)this.data.dirty=false;this.save(); }
}
module.exports={SaveStore,cleanSlots,atomicWrite,KEYS};
