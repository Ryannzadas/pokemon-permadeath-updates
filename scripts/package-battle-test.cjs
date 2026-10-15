'use strict';
// Reuse the verified Windows runtime of the previous test edition. No release upload.
const fs=require('node:fs'),path=require('node:path'),asar=require('@electron/asar');
(async()=>{
 const root=process.cwd(),runtime=process.env.TEST_RUNTIME&&path.resolve(process.env.TEST_RUNTIME);
 if(!runtime||!fs.existsSync(path.join(runtime,'resources/app.asar')))throw Error('Informe TEST_RUNTIME com o aplicativo Windows de teste anterior.');
 const stage=path.join(root,'.build-stage/app');fs.rmSync(stage,{recursive:true,force:true});fs.mkdirSync(stage,{recursive:true});
 asar.extractAll(path.join(runtime,'resources/app.asar'),stage);
 for(const dir of ['game','desktop']){fs.rmSync(path.join(stage,dir),{recursive:true,force:true});fs.cpSync(path.join(root,dir),path.join(stage,dir),{recursive:true});}
 for(const f of ['package.json','firebase-config.json','multiplayer-config.json'])fs.copyFileSync(path.join(root,f),path.join(stage,f));
 await asar.createPackageWithOptions(stage,path.join(runtime,'resources/app.asar'),{dot:false});asar.uncache(path.join(runtime,'resources/app.asar'));
 let checked=0;
 for(const f of asar.listPackage(path.join(runtime,'resources/app.asar'))){const rel=f.replace(/^\//,'');if(!/^(game|desktop)\//.test(rel)||!fs.existsSync(path.join(root,rel))||!fs.statSync(path.join(root,rel)).isFile())continue;if(!asar.extractFile(path.join(runtime,'resources/app.asar'),rel).equals(fs.readFileSync(path.join(root,rel))))throw Error('Mismatch '+rel);checked++;}
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'))),version=pkg.version.replace('-test.','.');
 const resedit=require('resedit'),exePath=path.join(runtime,'Pokemon Permadeath - Teste Visual.exe'),exe=resedit.NtExecutable.from(fs.readFileSync(exePath)),resources=resedit.NtExecutableResource.from(exe);
 const info=resedit.Resource.VersionInfo.fromEntries(resources.entries)[0];if(info){info.setFileVersion(version,1033);info.setProductVersion(version,1033);info.setStringValues({lang:1033,codepage:1200},{ProductName:'Pokemon Permadeath - Teste Visual',FileDescription:'Pokemon Permadeath - Teste Visual',ProductVersion:pkg.version});info.outputToResourceEntries(resources.entries);resources.outputResource(exe);fs.writeFileSync(exePath,Buffer.from(exe.generate()));}
 for(const f of ['$PLUGINSDIR','uninstall.exe','Desinstalar.exe','LEIA-ME.md'])fs.rmSync(path.join(runtime,f),{recursive:true,force:true});
 console.log('PASS packaged game/desktop files byte-identical:',checked,'version',pkg.version);
})().catch(e=>{console.error(e);process.exitCode=1});
