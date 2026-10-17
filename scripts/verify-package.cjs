'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const asar=require('@electron/asar'),yaml=require('js-yaml');
const project=path.resolve(__dirname,'..'),output=path.resolve(process.argv[2]||path.join(project,'dist'));
const archive=path.join(output,'win-unpacked/resources/app.asar');
// The version and names come from package.json, so test builds (0.4.1-test.N) are checked too.
const pkg=JSON.parse(fs.readFileSync(path.join(project,'package.json'),'utf8')),expected=pkg.version,product=pkg.build.productName;
let checked=0;
function compare(directory){
 for(const entry of fs.readdirSync(path.join(project,directory),{withFileTypes:true})){
  const name=path.join(directory,entry.name); // the archive uses the platform's separators
  if(entry.isDirectory())compare(name);
  else {assert(fs.readFileSync(path.join(project,name)).equals(asar.extractFile(archive,name)),`Packaged file differs: ${name}`);checked++;}
 }
}
compare('game');compare('desktop');
assert(fs.readFileSync(path.join(project,'multiplayer-config.json')).equals(asar.extractFile(archive,'multiplayer-config.json')));
assert(fs.readFileSync(path.join(project,'firebase-config.json')).equals(asar.extractFile(archive,'firebase-config.json')));
const packaged=JSON.parse(asar.extractFile(archive,'package.json').toString());assert.equal(packaged.version,expected);assert.equal(packaged.main,'desktop/main.cjs');
assert(!asar.listPackage(archive).some(name=>name.includes('gb_music_files')));
// latest.yml (update metadata) exists only when the build is meant for the updater.
const metadataFile=path.join(output,'latest.yml'),metadata=fs.existsSync(metadataFile)?yaml.load(fs.readFileSync(metadataFile,'utf8')):null;
const file=path.join(output,metadata?metadata.path:`Pokemon-Permadeath-Setup-${expected}.exe`),bytes=fs.readFileSync(file);
assert.equal(bytes.subarray(0,2).toString(),'MZ');assert(bytes.length>100000000);
if(metadata&&metadata.version===expected)assert.equal(crypto.createHash('sha512').update(bytes).digest('base64'),metadata.sha512);
require('node:child_process').execFileSync(process.platform==='win32'?'python':'python3',['-I',path.join(project,'scripts/verify-nsis.py'),file],{stdio:'inherit'});
if(metadata&&metadata.version===expected)assert.equal(metadata.files[0].size,bytes.length);assert(fs.statSync(file+'.blockmap').size>1000);
const executable=fs.readFileSync(path.join(output,`win-unpacked/${product}.exe`));assert.equal(executable.subarray(0,2).toString(),'MZ');assert(executable.length>200000000);
const resedit=require('resedit'),resources=resedit.NtExecutableResource.from(resedit.NtExecutable.from(executable)),icons=resources.entries.filter(x=>x.type===3);assert.equal(icons.length,7);const version=resedit.Resource.VersionInfo.fromEntries(resources.entries)[0].getStringValues({lang:1033,codepage:1200});assert(version.FileVersion.startsWith(expected.split('-')[0]),`File version ${version.FileVersion}`);for(const name of ['builder-util-runtime','fs-extra','js-yaml','lazy-val','lodash.escaperegexp','lodash.isequal','tiny-typed-emitter'])assert(asar.listPackage(archive).some(p=>p.split(path.sep).join('/').includes('/node_modules/'+name+'/')),`Missing updater dependency: ${name}`);
console.log(`PASS package: ${checked} game/desktop files byte-identical to tested source, version/main/config, GB removed, Windows runtime and installer headers/sizes, update SHA-512 (when latest.yml is present) and blockmap (${bytes.length} installer bytes).`);
