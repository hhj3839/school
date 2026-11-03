import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gzipSync} from 'node:zlib';

// Run after npm run build. Check the shipped files, not just bundler settings.
const root=new URL('../dist/client/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('.vite/manifest.json',root),'utf8'));
const chunks=Object.entries(manifest).filter(([,entry])=>entry.file.endsWith('.js')).map(([key,entry])=>{
  const bytes=readFileSync(new URL(entry.file,root));
  assert.ok(bytes.length<=500_000,`${entry.file}: ${bytes.length} bytes exceeds the default 500 kB budget`);
  for(const dependency of [...entry.imports||[],...entry.dynamicImports||[]]){
    assert.ok(manifest[dependency],`${key}: missing manifest entry ${dependency}`);
    assert.ok(existsSync(new URL(manifest[dependency].file,root)),`${key}: missing asset ${dependency}`);
  }
  return {key,file:entry.file,bytes:bytes.length,gzip:gzipSync(bytes).length,imports:entry.imports||[]};
});

function staticClosure(key,seen=new Set()){
  if(seen.has(key))return seen;
  assert.ok(manifest[key],`missing entry: ${key}`);
  seen.add(key);
  for(const dependency of manifest[key].imports||[])staticClosure(dependency,seen);
  return seen;
}
const shaderKeys=chunks.filter(chunk=>manifest[chunk.key].name==='three-shaders').map(chunk=>chunk.key);
assert.equal(shaderKeys.length,1,'one shared shader asset for both 3D games');
for(const route of ['app/page.tsx','app/blocks/page.tsx']){
  const initial=staticClosure('virtual:vinext-app-browser-entry',staticClosure(route));
  assert.ok(!initial.has(shaderKeys[0]),`${route}: 3D shaders must not be loaded by the home/block screens`);
}
for(const route of ['app/hideout-game.tsx','app/race/page.tsx']){
  assert.ok(staticClosure(route).has(shaderKeys[0]),`${route}: missing 3D renderer dependency`);
}
assert.equal(manifest[shaderKeys[0]].imports?.length||0,0,'shader data must not introduce a dependency cycle with the renderer');

console.log(JSON.stringify({chunks,totalBytes:chunks.reduce((sum,chunk)=>sum+chunk.bytes,0),totalGzip:chunks.reduce((sum,chunk)=>sum+chunk.gzip,0)},null,2));
