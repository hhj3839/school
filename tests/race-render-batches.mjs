import './resolve-ts.mjs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const {batchMeshes}=await import('../app/race/render-batches.ts');
const scene=new THREE.Scene(),materials=[new THREE.MeshLambertMaterial({color:'pink'}),new THREE.MeshLambertMaterial({color:'blue'})],owned=[];
for(let i=0;i<240;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,2,3),materials[i%2]);mesh.position.set(i%7,2,i/3);mesh.rotation.y=i*.1;mesh.userData.courseZ=i/3;scene.add(mesh);}
const moving=new THREE.Group(),blade=new THREE.Mesh(new THREE.BoxGeometry(12,5,1),materials[0]);moving.add(blade);scene.add(moving);
scene.updateMatrixWorld(true);const before=new THREE.Box3();for(const child of scene.children)if(child!==moving)before.union(new THREE.Box3().setFromObject(child));
const batches=batchMeshes(scene,new Set([moving]),owned);
assert.equal(batches,4,'240 course props use four material/spatial batches');assert.ok(scene.children.includes(moving));assert.ok(moving.children.includes(blade),'rotating wall remains independently movable');
const after=new THREE.Box3();for(const child of scene.children)if(child!==moving)after.union(new THREE.Box3().setFromObject(child));
assert.ok(before.min.distanceTo(after.min)<.0001&&before.max.distanceTo(after.max)<.0001,'batching preserves world geometry');
// Twenty avatars with seven pieces each become three material draws per avatar.
let avatarDraws=0;
for(let i=0;i<20;i++){const avatar=new THREE.Group();avatar.position.set(i,0,0);scene.add(avatar);for(let j=0;j<7;j++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),j<4?materials[0]:j<6?materials[1]:new THREE.MeshLambertMaterial());mesh.position.y=j*.2;avatar.add(mesh);}avatarDraws+=batchMeshes(avatar,new Set(),owned);assert.equal(avatar.children.length,3);}
assert.equal(avatarDraws,60,'twenty racers drop from 140 to 60 mesh draws');
console.log('PASS: 240 course props → 4 batches; 20 racers → 60 rather than 140 mesh draws; world positions and moving obstacles preserved');
