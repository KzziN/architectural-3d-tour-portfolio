import * as T from 'three';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const kioskProfile=new URLSearchParams(location.search).has('kiosk');
const textureLoader=new T.TextureLoader(),geometryCache=new Map();
const assetUrl=path=>`${import.meta.env.BASE_URL}${path}`;
function textureCanvas(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;return t}
function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
const fabric=textureCanvas((ctx,s)=>{ctx.fillStyle='#c0c0ba';ctx.fillRect(0,0,s,s);const rand=seeded(7);for(let y=0;y<s;y+=2)for(let x=0;x<s;x+=2){const a=150+Math.floor(rand()*65);ctx.fillStyle=`rgb(${a},${a},${a})`;ctx.fillRect(x,y,1,2)}});
const floorMap=textureCanvas((ctx,s)=>{const r=seeded(14);ctx.fillStyle='#b8b6b0';ctx.fillRect(0,0,s,s);for(let i=0;i<70000;i++){const a=166+r()*38;ctx.fillStyle=`rgba(${a},${a-2},${a-6},.2)`;ctx.fillRect(r()*s,r()*s,2,2)}ctx.strokeStyle='#928f87';ctx.lineWidth=2;ctx.strokeRect(0,0,s,s);ctx.strokeStyle='#d9d7cf';ctx.lineWidth=1;ctx.strokeRect(3,3,s-6,s-6)});floorMap.repeat.set(22,14);
const asphaltMap=textureCanvas((ctx,s)=>{const r=seeded(32);ctx.fillStyle='#696a65';ctx.fillRect(0,0,s,s);for(let i=0;i<60000;i++){const a=40+r()*95;ctx.fillStyle=`rgb(${a},${a},${a})`;ctx.fillRect(r()*s,r()*s,1,1)}});asphaltMap.repeat.set(45,3);
export async function setupRendering(scene,renderer,camera,mats){
 const kiosk=new URLSearchParams(location.search).has('kiosk');
 const load=async(name,srgb=true)=>{const t=await textureLoader.loadAsync(assetUrl(`assets/pbr/${name}`));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(srgb)t.colorSpace=T.SRGBColorSpace;return t};
 const [sky,plaster,pNormal,pRough,wood,wNormal,wRough]=await Promise.all([new RGBELoader().loadAsync(assetUrl('assets/pbr/sky.hdr')),load('plaster.jpg'),load('plaster-normal.jpg',false),load('plaster-rough.jpg',false),load('wood.jpg'),load('wood-normal.jpg',false),load('wood-rough.jpg',false)]);
 sky.mapping=T.EquirectangularReflectionMapping;scene.background=sky;scene.backgroundRotation.y=.65;scene.backgroundIntensity=.72;scene.backgroundBlurriness=.04;
 // Keep the photographic clouds at sunset; gently warm their horizon radiance.
 const sunsetSky=sky.clone(),source=sky.image.data, sunsetData=new source.constructor(source.length);
 const width=sky.image.width,height=sky.image.height,half=sky.type===T.HalfFloatType;
 for(let row=0;row<height;row++){
  const horizon=Math.exp(-Math.pow((row/height-.5)/.16,2)),warm=[1+.5*horizon,1+.12*horizon,1-.24*horizon];
  for(let col=0;col<width;col++)for(let channel=0;channel<4;channel++){
   const i=(row*width+col)*4+channel;
   const value=half?T.DataUtils.fromHalfFloat(source[i]):source[i];
   const tinted=channel===3?value:value*warm[channel]*(.65+.15*horizon);
   sunsetData[i]=half?T.DataUtils.toHalfFloat(tinted):tinted;
  }
 }
 sunsetSky.image={...sky.image,data:sunsetData};sunsetSky.needsUpdate=true;
 const generator=new T.PMREMGenerator(renderer);const environment=generator.fromEquirectangular(sky).texture,sunsetEnvironment=generator.fromEquirectangular(sunsetSky).texture;generator.dispose();scene.environment=environment;scene.environmentIntensity=.75;
 for(const name of ['concrete','stone','white']){Object.assign(mats[name],{map:name==='white'?null:plaster,normalMap:pNormal,roughnessMap:pRough,roughness:.9});mats[name].normalScale.set(name==='white'?.015:.05,name==='white'?.015:.05);mats[name].color.set(name==='white'?'#eeece5':name==='stone'?'#c2bfb7':'#d2cfc8')}
 // A light oak finish keeps photographic grain, with calibrated color instead of dark stained timber.
 const oak=document.createElement('canvas');oak.width=oak.height=1024;const oakCtx=oak.getContext('2d');oakCtx.drawImage(wood.image,0,0,1024,1024);const pixels=oakCtx.getImageData(0,0,1024,1024);for(let i=0;i<pixels.data.length;i+=4){const l=pixels.data[i]*.21+pixels.data[i+1]*.72+pixels.data[i+2]*.07;pixels.data[i]=138+l*.43;pixels.data[i+1]=116+l*.42;pixels.data[i+2]=85+l*.4}oakCtx.putImageData(pixels,0,0);wood.image=oak;wood.needsUpdate=true;
 Object.assign(mats.wood,{map:wood,normalMap:wNormal,roughnessMap:wRough,roughness:.62});mats.wood.color.set('#e7d9c2');mats.wood.normalScale.set(.15,.15);
 Object.assign(mats.floor,{map:floorMap,roughness:.32,metalness:.03,color:new T.Color('#f4f0e6')});
 Object.assign(mats.asphalt,{map:asphaltMap,roughness:.95,color:new T.Color('#898b85')});
 mats.glass=new (kiosk?T.MeshStandardMaterial:T.MeshPhysicalMaterial)({color:'#526e76',metalness:.6,roughness:.06,...(kiosk?{}:{clearcoat:1,clearcoatRoughness:.06}),envMapIntensity:1.8});
 mats.glassWarm=new (kiosk?T.MeshStandardMaterial:T.MeshPhysicalMaterial)({color:'#718180',metalness:.55,roughness:.1,...(kiosk?{}:{clearcoat:1}),envMapIntensity:1.4});
 mats.window=kiosk?new T.MeshStandardMaterial({color:'#bfd8dc',metalness:.2,roughness:.12,transparent:true,opacity:.17,envMapIntensity:.65,depthWrite:false}):new T.MeshPhysicalMaterial({color:'#d2e6e8',metalness:0,roughness:.03,transmission:.72,thickness:.045,ior:1.5,transparent:true,opacity:.26,envMapIntensity:1});
 mats.rail=new T.MeshPhysicalMaterial({color:'#b3c2be',metalness:.08,roughness:.08,transparent:true,opacity:.28,envMapIntensity:1.4});
 mats.chair=new T.MeshStandardMaterial({color:'#4b5150',map:fabric,roughness:.86});
 mats.leaf=kiosk?new T.MeshLambertMaterial({color:'#35502a',side:T.DoubleSide}):new T.MeshPhysicalMaterial({color:'#35502a',roughness:.66,side:T.DoubleSide,clearcoat:.18});
 mats.chrome=new T.MeshStandardMaterial({color:'#aeb4b2',metalness:.95,roughness:.2});
 mats.screen=new T.MeshStandardMaterial({color:'#101719',roughness:.2,metalness:.3,emissive:'#20323a',emissiveIntensity:.16});
 mats.soil=new T.MeshStandardMaterial({color:'#403b2f',roughness:1});mats.bark=new T.MeshStandardMaterial({map:wood,color:'#6b5741',roughness:1});
 renderer.toneMapping=kiosk?T.NeutralToneMapping:T.AgXToneMapping;renderer.toneMappingExposure=.95;
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 let ao=null,fxaa=null,aaEnabled=true;
 if(kiosk){
  fxaa=new ShaderPass({...FXAAShader,fragmentShader:FXAAShader.fragmentShader.replace('gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );','gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );\n#include <tonemapping_fragment>\n#include <colorspace_fragment>')});composer.addPass(fxaa);
 }else{ao=new SSAOPass(scene,camera,innerWidth,innerHeight,16);ao.kernelRadius=.65;ao.minDistance=.0001;ao.maxDistance=.055;composer.addPass(ao);composer.addPass(new OutputPass());}
 const resize=()=>{composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);if(ao)ao.enabled=innerWidth>=700;if(fxaa){const size=renderer.getDrawingBufferSize(new T.Vector2());fxaa.uniforms.resolution.value.set(1/size.x,1/size.y)}};resize();
 function lighting(mode,inside){const night=mode===true||mode==='night',sunset=mode==='sunset';scene.background=sunset?sunsetSky:sky;scene.environment=sunset?sunsetEnvironment:environment;scene.backgroundIntensity=night?.035:sunset?.64:.72;scene.environmentIntensity=night?(inside?.34:.25):(inside?.62:sunset?.78:.75);scene.fog.color.set(night?'#152330':sunset?'#bba897':'#b6bcc0');renderer.toneMappingExposure=night?1.05:sunset?1:.95;if(ao)ao.enabled=innerWidth>=700;}
 renderer.info.autoReset=false;
 return {render:()=>{renderer.info.reset();if(kiosk&&!aaEnabled)renderer.render(scene,camera);else composer.render()},resize,setAA:value=>{aaEnabled=value},lighting};
}
export function rounded(group,w,h,d,x,y,z,material,r=.04){const key=[w,h,d,r].join(',');let geom=geometryCache.get(key);if(!geom){geom=new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3));geometryCache.set(key,geom)}const m=new T.Mesh(geom,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
const cylinderGeometry=new T.CylinderGeometry(1,1,1,12);
export function cylinder(group,r,h,x,y,z,material){const m=new T.Mesh(cylinderGeometry,material);m.scale.set(r,h,r);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
// Curved leaf blades: real silhouettes and varied normals, rather than polyhedral foliage balls.
const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.2,.15,-.25,.58,0,1);leafShape.bezierCurveTo(.25,.58,.2,.15,0,0);
const leafGeometry=new T.ExtrudeGeometry(leafShape,{depth:.012,steps:1,bevelEnabled:false,curveSegments:kioskProfile?3:6});const leafPositions=leafGeometry.attributes.position;for(let i=0;i<leafPositions.count;i++){const y=leafPositions.getY(i),x=leafPositions.getX(i);leafPositions.setZ(i,leafPositions.getZ(i)+.1*Math.sin(y*Math.PI)+.2*x*x)}leafGeometry.computeVertexNormals();
export function plant(group,x,y,z,size,mats,palm=false,terrace=false){
 const firstChild=group.children.length;
 const rng=seeded(Math.round((x+100)*117+(z+100)*79+y*21)),dummy=new T.Object3D();
 if(!terrace){cylinder(group,.27*size,.43*size,x,y+.21*size,z,mats.stone);cylinder(group,.24*size,.015*size,x,y+.43*size,z,mats.soil)}
 if(palm){cylinder(group,.065*size,1.75*size,x,y+.9*size,z,mats.bark)}
 if(terrace&&!mats.terraceLeaf){mats.terraceLeaf=mats.leaf.clone();mats.terraceLeaf.color.set('#699747')}
 const count=terrace==='trailing'?(kioskProfile?18:36):kioskProfile?(palm?60:36):(palm?150:90),leaves=new T.InstancedMesh(leafGeometry,terrace?mats.terraceLeaf:mats.leaf,count);leaves.castShadow=true;leaves.receiveShadow=true;
 for(let i=0;i<count;i++){const angle=rng()*Math.PI*2;if(palm){const perFrond=kioskProfile?6:15;const frond=Math.floor(i/perFrond),t=(i%perFrond)/perFrond;const a=frond/10*Math.PI*2;dummy.position.set(x+Math.cos(a)*t*size,y+(2.02-.4*t*t)*size,z+Math.sin(a)*t*size);dummy.rotation.set(-.5+rng()*.6,a+(i%2?1:-1)*.7,1.2+rng()*.3);dummy.scale.setScalar(size*(.3+.18*(1-t)))}else{const rad=Math.sqrt(rng())*.48*size;dummy.position.set(x+Math.cos(angle)*rad,y+(.45+rng()*.85)*size,z+Math.sin(angle)*rad);dummy.rotation.set(-.85+rng()*1.3,angle,-.55+rng()*1.1);dummy.scale.set(.65*size,(.23+rng()*.3)*size,.8*size)}dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new T.Color().setHSL(.24+rng()*.06,.2+rng()*.14,.2+rng()*.18))}
 if(terrace){
  for(let i=0;i<count;i++){
   const angle=i*2.399963;
   if(terrace==='trailing'){
    const t=rng(),a=Math.floor(i/6)*2.399963;dummy.position.set(x+(Math.cos(a)*.16+Math.sin(t*4+a)*.08)*size,y-t*.95*size,z+Math.sin(a)*.13*size);dummy.rotation.set(.15+rng()*.3,a,Math.PI*(.55+rng()*.2));dummy.scale.setScalar((.24+rng()*.09)*size);
   }else if(palm){const perFrond=kioskProfile?6:15,t=(i%perFrond)/perFrond,a=Math.floor(i/perFrond)/10*Math.PI*2;
    dummy.position.set(x+Math.cos(a)*t*.55*size,y+(2.02-.48*t*t)*size,z+Math.sin(a)*t*.55*size);
    dummy.rotation.set(-.25,a+(i%2?1:-1)*.7,1.05+.2*t);dummy.scale.setScalar(size*(.23+.14*(1-t)));
   }else{const rad=Math.sqrt(rng())*.34*size;dummy.position.set(x+Math.cos(angle)*rad,y+(.45+rng()*.7)*size,z+Math.sin(angle)*rad);dummy.rotation.set(-.6+rng()*.9,angle,-.45+rng()*.9);dummy.scale.set(.65*size,(.25+rng()*.3)*size,.8*size)}
   dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new T.Color().setHSL(.25+rng()*.06,.45+rng()*.2,.35+rng()*.2));
  }
 }
 leaves.instanceMatrix.needsUpdate=true;group.add(leaves);for(let i=firstChild;i<group.children.length;i++)group.children[i].userData.vegetation=true;
}
export function optimizePlants(group){
 const batches=new Map();
 for(const mesh of [...group.children]){if(!mesh.userData.vegetation)continue;const terrace=mesh.userData.terraceVegetation===true,indoor=mesh.userData.indoorVegetation===true,key=mesh.geometry.uuid+mesh.material.uuid+(terrace?'terrace':indoor?'indoor':'general');if(!batches.has(key))batches.set(key,{geometry:mesh.geometry,material:mesh.material,terrace,indoor,entries:[]});const entries=batches.get(key).entries;mesh.updateMatrix();if(mesh.isInstancedMesh){for(let i=0;i<mesh.count;i++){const matrix=new T.Matrix4(),color=new T.Color();mesh.getMatrixAt(i,matrix);mesh.getColorAt(i,color);entries.push({matrix:mesh.matrix.clone().multiply(matrix),color})}mesh.dispose()}else entries.push({matrix:mesh.matrix.clone(),color:new T.Color('#ffffff')});group.remove(mesh)}
 for(const {geometry,material,terrace,indoor,entries} of batches.values()){const merged=new T.InstancedMesh(geometry,material,entries.length);entries.forEach((e,i)=>{merged.setMatrixAt(i,e.matrix);merged.setColorAt(i,e.color)});merged.castShadow=true;merged.receiveShadow=true;merged.userData.terraceVegetation=terrace;merged.userData.indoorVegetation=indoor;merged.computeBoundingSphere();group.add(merged)}
}
export function chair(group,x,y,z,rot,mats){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;rounded(g,.58,.11,.55,0,.46,0,mats.chair,.045);const back=rounded(g,.55,.55,.08,0,.76,.23,mats.chair,.035);back.rotation.x=-.12;cylinder(g,.025,.37,0,.22,0,mats.chrome);for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;const spoke=rounded(g,.035,.035,.3,Math.sin(angle)*.15,.07,Math.cos(angle)*.15,mats.chrome,.015);spoke.rotation.y=angle;const wheel=cylinder(g,.046,.045,Math.sin(angle)*.29,.055,Math.cos(angle)*.29,mats.metal);wheel.rotation.z=Math.PI/2}for(const sign of [-1,1]){rounded(g,.035,.23,.035,sign*.3,.63,0,mats.chrome,.012);rounded(g,.065,.04,.29,sign*.3,.75,.015,mats.chair,.02)}group.add(g)}
export function desk(group,x,y,z,clinic,mats){rounded(group,1.6,.065,.78,x,y+.77,z,mats.wood,.018);for(const sign of [-1,1]){rounded(group,.045,.74,.045,x+sign*.68,y+.37,z-.28,mats.chrome,.012);rounded(group,.045,.74,.045,x+sign*.68,y+.37,z+.28,mats.chrome,.012);rounded(group,.045,.045,.61,x+sign*.68,y+.025,z,mats.chrome,.012)}
 rounded(group,.55,.35,.045,x,y+1.045,z-.19,mats.metal,.018);rounded(group,.5,.3,.008,x,y+1.045,z-.162,mats.screen,.006);cylinder(group,.025,.2,x,y+.865,z-.2,mats.chrome);rounded(group,.23,.02,.16,x,y+.813,z-.2,mats.metal,.01);rounded(group,.4,.02,.14,x-.06,y+.82,z+.1,mats.metal,.01);rounded(group,.06,.03,.09,x+.24,y+.828,z+.13,mats.metal,.02);rounded(group,.24,.018,.3,x-.5,y+.819,z+.13,mats.white,.004);
 chair(group,x,y,z+.7,0,mats);chair(group,x,y,z-.8,Math.PI,mats);
 if(clinic){rounded(group,.8,.13,1.85,x+1.3,y+.78,z+2,mats.white,.06);for(const dz of [-.7,.7])rounded(group,.055,.7,.6,x+1.3,y+.35,z+2+dz,mats.chrome,.02);const pillow=rounded(group,.62,.12,.35,x+1.3,y+.91,z+1.35,mats.white,.055);pillow.rotation.x=-.1}
}

