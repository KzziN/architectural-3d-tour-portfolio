import * as T from 'three';

// Fit the complete plant, including transformed instanced leaves, into its planting strip.
// Scale uniformly when necessary; anisotropic scaling flattens the canopy into paper.
export function terracePlant(group,plant,x,y,z,size,bounds,kind=true){
 const start=group.children.length;plant(group,x,y,z,size,kind);const meshes=group.children.slice(start),box=new T.Box3();
 for(const mesh of meshes){if(mesh.isInstancedMesh)mesh.computeBoundingBox();box.expandByObject(mesh)}
 if(box.isEmpty())throw Error('Terrace plant has no geometry');
 const center=box.getCenter(new T.Vector3()),extent=box.getSize(new T.Vector3());
 const scale=Math.min(1,(bounds.xMax-bounds.xMin)/extent.x,(bounds.zMax-bounds.zMin)/extent.z),sx=scale,sz=scale;
 const tx=T.MathUtils.clamp(center.x,bounds.xMin+extent.x*sx/2,bounds.xMax-extent.x*sx/2);
 const tz=T.MathUtils.clamp(center.z,bounds.zMin+extent.z*sz/2,bounds.zMax-extent.z*sz/2);
 const matrix=new T.Matrix4().makeTranslation(tx,y,tz).multiply(new T.Matrix4().makeScale(scale,scale,scale)).multiply(new T.Matrix4().makeTranslation(-center.x,-y,-center.z));
 for(const mesh of meshes){mesh.applyMatrix4(matrix);mesh.userData.terraceVegetation=true;mesh.updateMatrixWorld(true)}
 const actual=new T.Box3();for(const mesh of meshes)actual.expandByObject(mesh);
 const record={bounds:{...bounds},actual:{xMin:actual.min.x,xMax:actual.max.x,zMin:actual.min.z,zMax:actual.max.z},y,size,uniformScale:scale};
 (group.userData.terracePlants??=[]).push(record);return record;
}

export function plantingBounds(w,d,x,z,side=false,palm=false){
 const radius=palm?1.25:.46;
 return side?{xMin:w/2+.08,xMax:w/2+.64,zMin:Math.max(-d/2+.12,z-radius),zMax:Math.min(d/2-.12,z+radius)}:{xMin:Math.max(-w/2+.12,x-radius),xMax:Math.min(w/2-.12,x+radius),zMin:d/2+.08,zMax:d/2+.64};
}
