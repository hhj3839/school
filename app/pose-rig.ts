import type {Group,Mesh} from 'three';
import {poseHeight,type Pose} from './game';

export function poseLift(pose?:Pose){return pose==='lie'?.19:pose==='side'?.38:0;}
export const poseCenter=poseHeight;
export function applyPoseRig(group:Group,meshes:Mesh[],pose:Pose,leftArm?:number,rightArm?:number){
 group.scale.set(1,1,1);group.rotation.x=group.rotation.z=0;
 for(const m of meshes){m.position.copy(m.userData.restPosition);m.rotation.set(0,0,m.userData.restRotation);m.scale.set(1,1,1);}
 const [head,body,legL,legR,left,right]=meshes;
 if(pose==='arms'){left.rotation.z=.9;right.rotation.z=-.9;left.position.set(-.34,1.3,0);right.position.set(.34,1.3,0);}
 if(pose==='slim'||pose==='flat'){left.position.set(-.12,1.03,.04);right.position.set(.12,1.03,.04);left.rotation.z=right.rotation.z=0;legL.position.x=-.06;legR.position.x=.06;}
 if(pose==='flat'){group.scale.z=.24;group.scale.x=1.12;}
 if(pose==='crouch')group.scale.y=.57;
 if(pose==='lie')group.rotation.x=-Math.PI/2;
 if(pose==='side'){group.rotation.z=Math.PI/2;group.scale.y=.8;left.position.set(-.12,1.03,.04);right.position.set(.12,1.03,.04);left.rotation.z=right.rotation.z=0;}
 if(pose==='curl'){
  head.position.set(0,.55,.22);body.position.set(0,.4,0);body.scale.y=.62;body.rotation.x=.5;
  legL.position.set(-.14,.22,.12);legR.position.set(.14,.22,.12);legL.rotation.x=legR.rotation.x=1.35;
  left.position.set(-.21,.4,.24);right.position.set(.21,.4,.24);left.rotation.z=-.65;right.rotation.z=.65;left.scale.y=right.scale.y=.72;
 }
 if(!['curl','side','flat'].includes(pose))for(const [mesh,degrees,side] of [[left,leftArm,-1],[right,rightArm,1]] as const){if(degrees===undefined)continue;const rad=degrees*Math.PI/180;mesh.rotation.z=side*rad;mesh.position.set(side*(.18+.26*Math.sin(rad)),1.27-.26*Math.cos(rad),0);}
}
