import * as THREE from 'three';
import {geometry} from './solid-renderer';
import {coverShape} from './cover-layout';
import {applyPoseRig,poseLift} from './pose-rig';
import {mapGround,mapCover,areaWalls,roomSettings,SHOT_RANGE,poseHeight,type Room,type Player} from './game';

const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
const maps=new Map<string,THREE.Mesh[]>();
const shapes=new Map<string,THREE.BufferGeometry>();
function walls(r:Room){const key=roomSettings(r).mapId+':'+r.playArea;let result=maps.get(key);if(result)return result;
 result=[...mapGround(roomSettings(r).mapId),...mapCover(roomSettings(r).mapId),...areaWalls(r)].map(o=>{const shape=coverShape(o);if(!shapes.has(shape))shapes.set(shape,geometry(shape));const m=new THREE.Mesh(shapes.get(shape)!,material);m.position.set((o.x+o.w/2)/100,o.base+o.height/2,(o.y+o.h/2)/100);m.scale.set(o.w/200,o.height/2,o.h/200);m.updateMatrixWorld(true);return m;});maps.set(key,result);return result;
}
const body=new THREE.Group(),limbs:THREE.Mesh[]=[];
for(const [radius,length,x,y,z,rz] of [[.16,.1,0,1.52,0,0],[.19,.37,0,1.03,0,0],[.1,.46,-.105,.34,0,0],[.1,.46,.105,.34,0,0],[.09,.44,-.26,1.04,0,-.12],[.09,.44,.26,1.04,0,.12]]){const m=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,5,10),material);m.position.set(x,y,z);m.rotation.z=rz;m.userData.restPosition=m.position.clone();m.userData.restRotation=rz;body.add(m);limbs.push(m);}
const ray=new THREE.Raycaster();
const eye=(p:Player)=>new THREE.Vector3(p.x/100,(p.elevation||0)+(p.role==='seeker'?1.48:poseHeight(p.pose)),p.y/100);
export function validAim(aim:unknown):aim is {yaw:number;pitch:number}{const a=aim as {yaw:number;pitch:number}|null;return !!a&&Number.isFinite(a.yaw)&&Math.abs(a.yaw)<=Math.PI*4&&Number.isFinite(a.pitch)&&a.pitch>=-.35&&a.pitch<=.95;}
export function shotTarget(r:Room,p:Player,aim:{yaw:number;pitch:number}){
 const origin=eye(p),direction=new THREE.Vector3(-Math.sin(aim.yaw)*Math.cos(aim.pitch),-Math.sin(aim.pitch),-Math.cos(aim.yaw)*Math.cos(aim.pitch));ray.set(origin,direction);ray.near=0;ray.far=SHOT_RANGE/100;
 let distance=ray.intersectObjects(walls(r),false)[0]?.distance??ray.far,target='';
 for(const q of r.players){if(q.id===p.id||q.caught)continue;applyPoseRig(body,limbs,q.pose||'stand',q.leftArm,q.rightArm);body.position.set(q.x/100,(q.elevation||0)+poseLift(q.pose),q.y/100);body.rotation.y=q.angle||0;body.updateMatrixWorld(true);const hit=ray.intersectObjects(limbs,false)[0];if(hit&&hit.distance<distance){distance=hit.distance;target=q.role==='hider'?q.id:'';}}
 return target;
}
// Keep a generous view cone to avoid pop-in on wide tablets. Test centre and
// extremities, so a visible head/arm does not disappear behind partial cover.
export function visibleTo(r:Room,viewer:Player,target:Player){
 const origin=eye(viewer),yaw=viewer.viewYaw||0,pitch=viewer.viewPitch||0,forward=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
 applyPoseRig(body,limbs,target.pose||'stand',target.leftArm,target.rightArm);body.position.set(target.x/100,(target.elevation||0)+poseLift(target.pose),target.y/100);body.rotation.y=target.angle||0;body.updateMatrixWorld(true);
 for(const mesh of limbs){for(const offset of [0,-.3,.3]){const point=mesh.localToWorld(new THREE.Vector3(0,offset,0)),delta=point.sub(origin),distance=delta.length();if(distance<.1)return true;if(distance>35)continue;delta.normalize();if(forward.dot(delta)<.17)continue;ray.set(origin,delta);ray.near=0;ray.far=distance-.04;if(!ray.intersectObjects(walls(r),false).length)return true;}}
 return false;
}
