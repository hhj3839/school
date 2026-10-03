import * as THREE from 'three';
import {coverShape,type Cover,type SolidShape} from './cover-layout';

export function geometry(shape:SolidShape){
 if(shape==='ellipsoid')return new THREE.SphereGeometry(1,16,10);
 if(shape==='cylinder')return new THREE.CylinderGeometry(1,1,2,16);
 if(shape==='ring'||shape==='wheelRing'){
  const ring=new THREE.Shape();ring.absarc(0,0,1,0,Math.PI*2,false);const hole=new THREE.Path();hole.absarc(0,0,.65,0,Math.PI*2,true);ring.holes.push(hole);
  const g=new THREE.ExtrudeGeometry(ring,{depth:2,bevelEnabled:false,curveSegments:24});g.translate(0,0,-1);if(shape==='ring')g.rotateX(-Math.PI/2);return g;
 }
 if(shape==='prism'||shape==='hull'){
  const vertices=shape==='prism'?[-1,-1,-1,1,-1,-1,0,1,-1,-1,-1,1,1,-1,1,0,1,1]:[-.55,-1,-.65,.55,-1,-.65,.55,-1,.65,-.55,-1,.65,-1,1,-1,1,1,-1,1,1,1,-1,1,1];
  const indices=shape==='prism'?[0,2,1,3,4,5,0,1,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,4]:[0,1,2,0,2,3,4,7,6,4,6,5,0,4,5,0,5,1,3,2,6,3,6,7,0,3,7,0,7,4,1,5,6,1,6,2];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 return new THREE.BoxGeometry(2,2,2);
}
export function solidRenderer(scene:THREE.Scene,surfaces:THREE.Mesh[],blockers:THREE.Mesh[]){
 const geometries=new Map<SolidShape,THREE.BufferGeometry>(),materials=new Map<string,THREE.Material>();
 return (parts:Cover[],shaded=false)=>{for(const o of parts){const shape=coverShape(o),key=o.color+shaded;if(!geometries.has(shape))geometries.set(shape,geometry(shape));if(!materials.has(key))materials.set(key,shaded?new THREE.MeshStandardMaterial({color:o.color,roughness:1,side:THREE.DoubleSide}):new THREE.MeshBasicMaterial({color:o.color,side:THREE.DoubleSide}));
  const mesh=new THREE.Mesh(geometries.get(shape)!,materials.get(key)!);mesh.position.set((o.x+o.w/2)/100,o.base+o.height/2,(o.y+o.h/2)/100);mesh.scale.set(o.w/200,o.height/2,o.h/200);scene.add(mesh);surfaces.push(mesh);blockers.push(mesh);
 }};
}
