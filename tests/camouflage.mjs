import assert from 'node:assert/strict';
import * as THREE from 'three';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){try{return next(s,c);}catch(e){if(e.code==='ERR_MODULE_NOT_FOUND'&&s.startsWith('.'))return next(s+'.ts',c);throw e;}}});
const {applyPoseRig,poseLift}=await import('../app/pose-rig.ts');
import {MAP_SCALE,adjustPose,makePlayer,CAMO_PROPS,WALLS,OBSTACLE_HEIGHTS,canStand} from '../app/game.ts';
const group=new THREE.Group();
const parts=[[.16,.1,0,1.52,0],[.19,.37,0,1.03,0],[.1,.46,-.105,.34,0],[.1,.46,.105,.34,0],[.09,.44,-.26,1.04,0],[.09,.44,.26,1.04,0]];
const meshes=parts.map(([radius,length,x,y,z])=>{const m=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length));m.position.set(x,y,z);m.userData.restPosition=m.position.clone();m.userData.restRotation=0;group.add(m);return m;});
function bounds(pose){applyPoseRig(group,meshes,pose);group.position.y=poseLift(pose);group.updateMatrixWorld(true);return new THREE.Box3().setFromObject(group);}
const standing=bounds('stand').getSize(new THREE.Vector3());
for(const pose of ['curl','side','flat']){const p=makePlayer('test','test',0);p.leftArm=140;adjustPose(p,{pose});assert.equal(p.pose,pose);assert.equal(p.leftArm,undefined);const box=bounds(pose),size=box.getSize(new THREE.Vector3());assert.ok(box.min.y>=-.01,pose+' stays above ground');if(pose==='flat')assert.ok(size.z<standing.z/2);else assert.ok(size.y<standing.y*.7);const reset=bounds('stand').getSize(new THREE.Vector3());assert.ok(reset.distanceTo(standing)<.0001,'pose changes fully reset');}
assert.equal(WALLS.length,OBSTACLE_HEIGHTS.length);
for(const p of CAMO_PROPS){assert.equal(canStand((p.x+p.w/2)*MAP_SCALE,(p.y+p.h/2)*MAP_SCALE),false);assert.equal(canStand(p.x*MAP_SCALE-25,(p.y+p.h/2)*MAP_SCALE),true);}
console.log('PASS: three distinct poses, ground clearance, reset, server pose validation, prop collision');
