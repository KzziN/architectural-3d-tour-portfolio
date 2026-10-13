import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Keep commercial groups, collision data, hotspots and car identities intact.
export function batchInterior(group){
 if(group.userData.sportsCar)return;
 for(const child of [...group.children])if(child.isGroup)batchInterior(child);
 const buckets=new Map();
 for(const mesh of group.children){
  if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material))continue;
  const key=mesh.material.uuid+Object.keys(mesh.geometry.attributes).sort().join(',');
  if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(mesh);
 }
 for(const meshes of buckets.values()){
  if(meshes.length<3)continue;
  const geometries=meshes.map(mesh=>{mesh.updateMatrix();const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geometry.applyMatrix4(mesh.matrix);return geometry});
  const combined=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!combined)continue;
  const mesh=new T.Mesh(combined,meshes[0].material);mesh.userData.ownedBatch=true;mesh.receiveShadow=true;
  meshes.forEach(m=>group.remove(m));group.add(mesh);
 }
}

export function simplifyContext(group){
 const cache=new Map();
 group.traverse(mesh=>{if(!mesh.isMesh)return;const original=mesh.material;
  if(!cache.has(original))cache.set(original,new T.MeshLambertMaterial({color:original.color,side:original.side,transparent:original.transparent,opacity:original.opacity,map:original.name==='asphalt'||original.name==='ctx'?original.map:null}));
  mesh.material=cache.get(original);
 });
}

const interiorMaterials=new WeakMap();
export function simplifyInterior(group){
 group.traverse(mesh=>{if(!mesh.isMesh||Array.isArray(mesh.material))return;const original=mesh.material;
  if(!original.isMeshStandardMaterial||original.metalness>.03||original.transparent)return;
  if(!interiorMaterials.has(original))interiorMaterials.set(original,new T.MeshLambertMaterial({color:original.color,map:original.map,side:original.side,emissive:original.emissive,emissiveIntensity:original.emissiveIntensity}));
  mesh.material=interiorMaterials.get(original);
 });
}
