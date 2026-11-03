import * as THREE from 'three';
import {coverShape,type Cover,type SolidShape} from './cover-layout';

export {geometry} from './solid-geometry';
import {geometry} from './solid-geometry';
export function solidRenderer(scene:THREE.Scene,surfaces:THREE.Mesh[],blockers:THREE.Mesh[]){
 const geometries=new Map<SolidShape,THREE.BufferGeometry>(),materials=new Map<string,THREE.Material>();
 return (parts:Cover[],shaded=false)=>{for(const o of parts){const shape=coverShape(o),key=o.color+shaded;if(!geometries.has(shape))geometries.set(shape,geometry(shape));if(!materials.has(key))materials.set(key,shaded?new THREE.MeshStandardMaterial({color:o.color,roughness:1,side:THREE.DoubleSide}):new THREE.MeshBasicMaterial({color:o.color,side:THREE.DoubleSide}));
  const mesh=new THREE.Mesh(geometries.get(shape)!,materials.get(key)!);mesh.position.set((o.x+o.w/2)/100,o.base+o.height/2,(o.y+o.h/2)/100);mesh.scale.set(o.w/200,o.height/2,o.h/200);scene.add(mesh);surfaces.push(mesh);blockers.push(mesh);
 }};
}
