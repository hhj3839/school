import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Preserve world transforms and spatial culling while reducing one draw per prop.
export function batchMeshes(parent:THREE.Object3D,excluded:Set<THREE.Object3D>,owned:THREE.BufferGeometry[],chunkSize=40){
 parent.updateMatrixWorld(true);
 const inverse=parent.matrixWorld.clone().invert(),groups=new Map<string,{material:THREE.Material;parts:THREE.BufferGeometry[]}>();
 const roots=parent.children.filter(root=>!excluded.has(root)&&!(root instanceof THREE.Light));
 for(const root of roots){
  root.traverse(object=>{
   if(!(object instanceof THREE.Mesh)||Array.isArray(object.material))return;
   const key=object.material.uuid+':'+Math.floor((root.userData.courseZ||0)/chunkSize);
   let group=groups.get(key);if(!group){group={material:object.material,parts:[]};groups.set(key,group);}
   const geometry=object.geometry.clone();geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,object.matrixWorld));
   // Boxes and spheres have different UV layouts; lighting only needs positions/normals.
   for(const attribute of Object.keys(geometry.attributes))if(attribute!=='position'&&attribute!=='normal')geometry.deleteAttribute(attribute);
   group.parts.push(geometry.index?geometry.toNonIndexed():geometry);
   if(geometry.index)geometry.dispose();
  });
  parent.remove(root);
 }
 for(const {material,parts} of groups.values()){
  const geometry=mergeGeometries(parts,false);parts.forEach(part=>part.dispose());
  if(!geometry)throw new Error('Unable to batch race geometry');
  geometry.computeBoundingSphere();owned.push(geometry);const mesh=new THREE.Mesh(geometry,material);mesh.matrixAutoUpdate=false;parent.add(mesh);
 }
 return groups.size;
}
