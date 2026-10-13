import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';

// Load once; clones share geometry/textures across repeated floor visits.
export async function loadSportsCars(){
 const kiosk=new URLSearchParams(location.search).has('kiosk');
 const draco=new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}assets/draco/`);
 const loader=new GLTFLoader().setDRACOLoader(draco);
 const specs=[{id:'ferrari',model:'Ferrari 458 Italia',length:4.53},{id:'bmw',model:'BMW M4 Competition',length:4.79}];
 const templates=await Promise.all(specs.map(async spec=>{
  const {scene}=await loader.loadAsync(`${import.meta.env.BASE_URL}assets/cars/${spec.id}${kiosk?'-mobile':''}.glb`);
  scene.updateMatrixWorld(true);
  let bounds=new T.Box3().setFromObject(scene),size=bounds.getSize(new T.Vector3());
  if(size.x>size.z)scene.rotation.y+=Math.PI/2;
  scene.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(scene);size=bounds.getSize(new T.Vector3());
  scene.scale.multiplyScalar(spec.length/size.z);scene.updateMatrixWorld(true);
  bounds=new T.Box3().setFromObject(scene);const center=bounds.getCenter(new T.Vector3());
  scene.position.add(new T.Vector3(-center.x,-bounds.min.y,-center.z));
  scene.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;mesh.material.envMapIntensity=1.1;}});
  return {spec,scene};
 }));
 draco.dispose();
 const colors=['#b41320','#173c69','#f2bd24','#dce2e6','#b41320','#245c50'];
 const paints=colors.map(color=>kiosk?new T.MeshStandardMaterial({color,metalness:.75,roughness:.25}):new T.MeshPhysicalMaterial({color,metalness:.75,roughness:.25,clearcoat:1,clearcoatRoughness:.12}));
 return function addCar(parent,x,y,z,index){
  const {scene,spec}=templates[index%templates.length],car=new T.Group(),model=scene.clone(true);
  model.traverse(mesh=>{if(mesh.isMesh&&((spec.id==='ferrari'&&/Body_Color/i.test(mesh.material.name))||(spec.id==='bmw'&&/body151/i.test(mesh.material.name)))){
   mesh.material=paints[index%paints.length];
  }});
  car.add(model);car.position.set(x,y+.025,z);car.rotation.y=z>0?Math.PI:0;
  car.userData.sportsCar={model:spec.model,length:spec.length};parent.add(car);return car;
 };
}
