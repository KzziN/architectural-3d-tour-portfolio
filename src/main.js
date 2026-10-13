import {addPantry} from './pantry.js';
import {createContextMaterials} from './facade-materials.js';
import {createGeometricFacadeMaterials,createGeometricTower} from './geometric-tower.js';
import {envelope} from './building-envelope.js';
import {buildingGarden} from './building-garden.js';
import {tourStops} from './tour-program.js';
import {loadSportsCars} from './cars.js';
import {batchInterior,simplifyContext,simplifyInterior} from './kiosk-performance.js';
import {addCommercialFitout,commercialUse,useLabels,entranceZone} from './commercial-layout.js';
import {windowRoute} from './tour-flight.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {setupRendering,plant as detailedPlant,chair as detailedChair,desk as detailedDesk,optimizePlants} from './realism.js';
import {floors,spaces,rects,areas} from './data.js';
import './style.css';

const $=id=>document.getElementById(id), v=(x,y,z)=>new T.Vector3(x,y,z);
const assetUrl = path => `${import.meta.env.BASE_URL}${path}`;
const kiosk=new URLSearchParams(location.search).has('kiosk');
const manualVisit=new URLSearchParams(location.search).has('manual');
// Android WebView in immersive/fullscreen mode can settle its real height after 100dvh
// has already been measured, leaving fixed-offset panels clipped by the physical screen.
// Re-measuring in JS and feeding it back as a CSS var keeps #app honest once the
// system bars finish hiding.
function setAppHeight(){document.documentElement.style.setProperty('--app-h',`${(window.visualViewport?window.visualViewport.height:innerHeight)}px`)}
setAppHeight();addEventListener('resize',setAppHeight);addEventListener('orientationchange',()=>setTimeout(setAppHeight,300));window.visualViewport?.addEventListener('resize',setAppHeight);
if(kiosk){setTimeout(setAppHeight,400);setTimeout(setAppHeight,1500)}
if(kiosk){const style=document.createElement('style');style.textContent='aside,.minimap{backdrop-filter:none!important}aside{background:#f5f2ec!important}#record,#fullscreen{display:none!important}';document.head.append(style)}
const state={mode:'exterior',floor:5,unit:'1',night:false,light:'day',furnished:true,use:'mixed',integrated:false,walk:false,tour:false,ready:false};

const scene=new T.Scene();scene.background=new T.Color('#cadbe2');scene.fog=new T.Fog('#cadbe2',170,440);
const camera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.12,900);
const renderer=new T.WebGLRenderer({antialias:!kiosk,preserveDrawingBuffer:!kiosk});renderer.setPixelRatio(kiosk?Math.min(devicePixelRatio,1920/innerWidth):Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=!kiosk;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;$('viewport').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.maxDistance=220;controls.minDistance=12;controls.maxPolarAngle=Math.PI/2+.06;controls.target.set(0,35,0);
const sun=new T.DirectionalLight('#fff0d7',3.2);sun.position.set(-65,115,65);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-90,right:90,top:105,bottom:-70,near:1,far:260});sun.shadow.bias=-.0005;scene.add(sun,sun.target);
const hemi=new T.HemisphereLight('#dcebf5','#b9aa93',2);scene.add(hemi);const insideLight=new T.HemisphereLight('#fff4df','#b4b0a1',1.7);insideLight.visible=false;scene.add(insideLight);
const mats={};function mat(name,color,extra={}){return mats[name]=new T.MeshStandardMaterial({color,roughness:.65,...extra})}
mat('concrete','#ddd9ce');mat('stone','#c7c5b9');mat('metal','#263740',{metalness:.8,roughness:.3});mat('bronze','#9d6b43',{metalness:.65,roughness:.36});mat('glass','#7e9daa',{metalness:.65,roughness:.17,envMapIntensity:1.8});mat('glassWarm','#b8aa8c',{metalness:.42,roughness:.24});mat('leaf','#567447');mat('leafLight','#81925b');mat('wood','#bc976d');mat('white','#eeeae0');mat('chair','#3a535c');mat('asphalt','#677277');mat('floor','#dedbd1');mat('light','#f5dbb0',{emissive:'#f3c67a',emissiveIntensity:.5});
const realism=await setupRendering(scene,renderer,camera,mats);
const addSportsCar=await loadSportsCars();
const facade=createGeometricFacadeMaterials(kiosk,mats),neighbours=createContextMaterials();
sun.intensity=1.8;sun.shadow.normalBias=.025;sun.shadow.radius=3;hemi.intensity=.45;insideLight.intensity=.35;
const sharedBox=new T.BoxGeometry(1,1,1), sharedSphere=new T.IcosahedronGeometry(1,1);
let batching=null;
function box(g,w,h,d,x,y,z,m=mats.concrete){if(batching){const geom=sharedBox.clone();geom.scale(w,h,d);geom.translate(x,y,z);if(!batching.has(m))batching.set(m,[]);batching.get(m).push(geom);return null}const mesh=new T.Mesh(sharedBox,m);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh}
function beginBatch(){batching=new Map()}function endBatch(g){for(const [m,geoms] of batching){const mesh=new T.Mesh(mergeGeometries(geoms),m);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);geoms.forEach(a=>a.dispose())}batching=null}
function plant(g,x,y,z,size=1,terrace=false){detailedPlant(g,x,y,z,size,mats,size>=1.7,terrace)}
const tower=createGeometricTower({floors,mats,facade,plant,optimizePlants,kiosk});scene.add(tower);
const context=new T.Group();scene.add(context);beginBatch();box(context,450,.4,450,0,-.9,0,mats.stone);box(context,450,.08,12,0,-.65,25,mats.asphalt);box(context,12,.08,450,26,-.64,0,mats.asphalt);box(context,40,.3,29,0,-.35,0,mats.concrete);
for(let x=-180;x<180;x+=11)box(context,4,.03,.15,x,-.59,25,mats.white);for(let z=-160;z<180;z+=11)box(context,.15,.03,4,26,-.58,z,mats.white);
for(let x=-100;x<130;x+=27)for(let z=-105;z<110;z+=30){if((Math.abs(x)<40&&Math.abs(z)<40)||(x>0&&z>25))continue;const h=6+((Math.abs(x*13+z*7)%23));box(context,18,h,19,x,h/2-.5,z,neighbours[Math.abs(Math.round(x/27+z/30))%3]);box(context,18.5,.5,19.5,x,h,z,mats.concrete)}endBatch(context);
for(let x=-20;x<24;x+=7)plant(context,x,0,16,2);for(let z=-14;z<22;z+=7)plant(context,19,0,z,1.7);
optimizePlants(context);if(kiosk)simplifyContext(context);
function textSprite(text,x,y,z,scale=1){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#183346';ctx.fillRect(0,0,c.width,c.height);ctx.font='32px Segoe UI';ctx.fillStyle='#f5f2ec';ctx.textAlign='center';ctx.fillText(text,384,74);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true}));s.position.set(x,y,z);s.scale.set(12*scale,2*scale,1);return s}
context.add(textSprite('FRONT AVENUE',-20,2,25,1.3),textSprite('SIDE STREET',26,2,-19,1.3));tower.add(textSprite('COMMERCIAL TOWER',0,2.8,12.1,1.2));
let interior=new T.Group();scene.add(interior);let walls=[],furnitureBlocks=[],hotspots=[],transition=null,yaw=0,pitch=0,drag=null,keys={},tourStart=0,recording=false;
function makeTourActor(){
 const g=new T.Group();g.name='tour-actor';g.visible=false;
 const jacket=new T.MeshStandardMaterial({color:'#1f3b4b',roughness:.68,metalness:.03});
 const shirt=new T.MeshStandardMaterial({color:'#e8edf0',roughness:.72});
 const pants=new T.MeshStandardMaterial({color:'#24292d',roughness:.74});
 const skin=new T.MeshStandardMaterial({color:'#c79b76',roughness:.68});
 const hair=new T.MeshStandardMaterial({color:'#2b211a',roughness:.62});
 const shoe=new T.MeshStandardMaterial({color:'#161b1d',roughness:.5});
 function add(mesh,name,x,y,z){mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh}
 const hips=add(new T.Mesh(new T.BoxGeometry(.26,.12,.14),pants),'hips',0,.72,0);
 const torso=add(new T.Mesh(new T.CylinderGeometry(.18,.14,.58,12),jacket),'torso',0,1.04,0);
 torso.scale.z=.58;
 const chest=add(new T.Mesh(new T.BoxGeometry(.16,.42,.018),shirt),'shirt-front',0,1.08,.085);
 const shoulders=add(new T.Mesh(new T.BoxGeometry(.42,.08,.15),jacket),'shoulders',0,1.34,0);
 const neck=add(new T.Mesh(new T.CylinderGeometry(.055,.065,.11,12),skin),'neck',0,1.44,0);
 const head=add(new T.Mesh(new T.SphereGeometry(.15,18,14),skin),'head',0,1.61,.015);head.scale.set(.92,1.04,.88);
 const hairCap=add(new T.Mesh(new T.SphereGeometry(.152,18,8,0,Math.PI*2,0,Math.PI*.62),hair),'hair',0,1.68,-.018);
 const nose=add(new T.Mesh(new T.ConeGeometry(.024,.055,8),skin),'nose',0,1.6,.145);nose.rotation.x=Math.PI/2;
 for(const x of [-.132,.132]){const ear=add(new T.Mesh(new T.SphereGeometry(.025,8,6),skin),'ear',x,1.6,.008);ear.scale.set(.7,1, .45)}
 function limb(name,w,h,d,mat,x,y,z){const p=new T.Group();p.name=name;p.position.set(x,y,z);const mesh=new T.Mesh(new T.CapsuleGeometry(w,h,4,10),mat);mesh.position.y=-h/2;mesh.scale.set(1,1,d/w);mesh.castShadow=true;p.add(mesh);g.add(p);return p}
 const leftArm=limb('leftArm',.035,.49,.026,jacket,-.235,1.31,.005);
 const rightArm=limb('rightArm',.035,.49,.026,jacket,.235,1.31,.005);
 const leftHand=add(new T.Mesh(new T.SphereGeometry(.042,10,8),skin),'leftHand',-.235,.79,.005);leftHand.scale.set(.8,1.18,.75);
 const rightHand=add(new T.Mesh(new T.SphereGeometry(.042,10,8),skin),'rightHand',.235,.79,.005);rightHand.scale.set(.8,1.18,.75);
 const leftLeg=limb('leftLeg',.044,.58,.036,pants,-.075,.72,0);
 const rightLeg=limb('rightLeg',.044,.58,.036,pants,.075,.72,0);
 const leftFoot=add(new T.Mesh(new T.BoxGeometry(.11,.045,.22),shoe),'leftFoot',-.075,.023,.065);
 const rightFoot=add(new T.Mesh(new T.BoxGeometry(.11,.045,.22),shoe),'rightFoot',.075,.023,.065);
 const base=new T.Mesh(new T.CircleGeometry(.31,24),new T.MeshBasicMaterial({color:'#102536',transparent:true,opacity:.12,depthWrite:false}));
 base.rotation.x=-Math.PI/2;base.position.y=.003;g.add(base);
 g.userData.parts={torso,hips,leftArm,rightArm,leftLeg,rightLeg,leftFoot,rightFoot};
 g.scale.setScalar(.82);
 return g;
}
const tourActor=makeTourActor();scene.add(tourActor);
function clearInterior(){scene.remove(interior);interior.traverse(o=>{if(o.isSprite&&o.material?.map){o.material.map.dispose();o.material.dispose()}if(o.isInstancedMesh)o.dispose();if(o.userData.ownedBatch)o.geometry.dispose()});interior=new T.Group();scene.add(interior);walls=[];furnitureBlocks=[];hotspots=[]}
function wall(w,d,x,z,y,h=2.95){box(interior,w,h,d,x,y+h/2,z,mats.white);walls.push({x1:x-w/2-.22,x2:x+w/2+.22,z1:z-d/2-.22,z2:z+d/2+.22})}
function doorWall(x1,x2,z,y,doorX){const gap=1.35;const l=doorX-gap/2-x1,r=x2-doorX-gap/2;if(l>0)wall(l,.15,x1+l/2,z,y);if(r>0)wall(r,.15,x2-r/2,z,y);box(interior,gap,.65,.16,doorX,y+2.65,z,mats.white);box(interior,.09,2.2,.19,doorX-gap/2,y+1.1,z,mats.wood);box(interior,.09,2.2,.19,doorX+gap/2,y+1.1,z,mats.wood)}
function block(x,z,w,d,pad=.52){furnitureBlocks.push({x1:x-w/2-pad,x2:x+w/2+pad,z1:z-d/2-pad,z2:z+d/2+pad})}
function blockAssets(assets){
 for(const a of assets){
  const kind=a.userData?.commercial?.kind||'asset';
  const size=kind.includes('desk')||kind.includes('consultation')?[2.2,1.5]:kind.includes('meeting')?[3.1,2.2]:kind.includes('chair')||kind.includes('seating')||kind.includes('waiting')?[1.8,1.5]:kind.includes('counter')||kind.includes('reception')||kind.includes('storage')||kind.includes('showroom')?[2.2,1.2]:[1.4,1.2];
  block(a.position.x,a.position.z,size[0],size[1],.28);
 }
}
function blockDistance(x,z,b){const dx=Math.max(b.x1-x,0,x-b.x2),dz=Math.max(b.z1-z,0,z-b.z2);return Math.hypot(dx,dz)}
function actorClearance(x,z){if(!canWalk(x,z))return -1;let nearest=99;for(const b of furnitureBlocks){if(x>b.x1&&x<b.x2&&z>b.z1&&z<b.z2)return -1;nearest=Math.min(nearest,blockDistance(x,z,b))}return nearest}
function actorClear(x,z){return actorClearance(x,z)>=.45}
function actorSpot(origin,dir,side){
 const candidates=[
  origin.clone().add(dir.clone().multiplyScalar(2.9)).add(side.clone().multiplyScalar(.52)),
  origin.clone().add(dir.clone().multiplyScalar(2.55)).add(side.clone().multiplyScalar(-.62)),
  origin.clone().add(dir.clone().multiplyScalar(2.15)).add(side.clone().multiplyScalar(.88)),
  origin.clone().add(dir.clone().multiplyScalar(1.75)).add(side.clone().multiplyScalar(-.95)),
  origin.clone().add(dir.clone().multiplyScalar(1.45)),
  origin.clone().add(dir.clone().multiplyScalar(1.2)).add(side.clone().multiplyScalar(1.15)),
  origin.clone().add(dir.clone().multiplyScalar(1.2)).add(side.clone().multiplyScalar(-1.15))
 ];
 let best=null,bestScore=-2;
 for(const p of candidates){const score=actorClearance(p.x,p.z);if(score>bestScore){best=p;bestScore=score}}
 return bestScore>=0?best:(candidates.find(p=>canWalk(p.x,p.z))||candidates[0]);
}
function chair(x,y,z,rot=0,auditorium=false){detailedChair(interior,x,y,z,rot,mats);block(x,z,.75,.75,.25);const seat=interior.children.at(-1);seat.userData.auditoriumSeat=auditorium;}
function desk(x,y,z,clinic=false){detailedDesk(interior,x,y,z,clinic,mats);block(x,z,1.8,1.25,.35)}
function bathroom(r,y){const back=r.cz<0,x=r.x1+.85,z=back?r.z2-1:r.z1+1;wall(.12,1.9,r.x1+1.7,z,y);doorWall(r.x1,r.x1+1.7,back?r.z2-1.9:r.z1+1.9,y,x);box(interior,.45,.45,.65,x,y+.24,z,mats.white);box(interior,.55,.08,.4,x,y+.85,z+(back?.5:-.5),mats.white);box(interior,.55,.7,.03,x,y+1.45,z+(back?.7:-.7),mats.glass)}
function hit(name,x,y,z,unit){const h=textSprite(name,x,y,z,.3);h.userData={name,unit};interior.add(h);hotspots.push(h)}
function buildInterior(){clearInterior();const f=floors[state.floor],y=f.y;for(const r of envelope(f).slabs){box(interior,r.x2-r.x1,.18,r.z2-r.z1,(r.x1+r.x2)/2,y-.12,(r.z1+r.z2)/2,mats.floor);box(interior,r.x2-r.x1,.18,r.z2-r.z1,(r.x1+r.x2)/2,y+3.12,(r.z1+r.z2)/2,mats.white)}
 // Tile lines and ceiling fixtures establish scale without textures downloaded at runtime.
 for(let x=-14;x<15;x+=1.2)box(interior,.012,.015,17,x,y+.001,0,mats.stone);for(let z=-8;z<9;z+=1.2)box(interior,29,.015,.012,0,y+.003,z,mats.stone);
 for(let x=-10;x<=10;x+=5)for(let z=-4;z<=5;z+=4)box(interior,1.1,.06,.18,x,y+3,z,mats.light);
 if(f.type==='parking'){box(interior,33,.13,23,0,y+3.05,0,mats.concrete);for(let x=-14;x<16;x+=5)for(let z of [-8,8]){box(interior,.12,.01,5,x,y+.01,z,mats.white);box(interior,.6,3,.6,x,y+1.5,z,mats.concrete);if((x+14)%10===0){addSportsCar(interior,x+2,y,z,Math.round((x+14)/10)+(z>0?3:0))}}hit('Vagas \u00b7 sistema rotativo',0,y+1.8,5,'parking');hit('Hall / elevadores',0,y+1.8,-5,'lobby');wall(33,.2,0,-11.5,y);wall(.2,23,-16.5,0,y);wall(.2,23,16.5,0,y);return}
 const boundary=envelope(f);
 wall(29,.2,0,-8.5,y);
 for(const side of boundary.sides){const length=side.z2-side.z1,z=(side.z1+side.z2)/2;if(side.opaque)wall(.15,length,side.x,z,y);else{walls.push({x1:side.x-.25,x2:side.x+.25,z1:side.z1,z2:side.z2});box(interior,.045,2.9,length,side.x,y+1.5,z,mats.window).castShadow=false;for(let zz=side.z1;zz<side.z2;zz+=1.25)box(interior,.12,3.1,.075,side.x,y+1.55,zz,mats.metal)}}
 for(const front of boundary.fronts){const width=front.x2-front.x1;box(interior,width,2.9,.045,(front.x1+front.x2)/2,y+1.5,front.z,mats.window).castShadow=false;walls.push({x1:front.x1,x2:front.x2,z1:front.z-.2,z2:front.z+.2});for(let x=front.x1;x<front.x2;x+=1.25)box(interior,.075,3.1,.12,x,y+1.55,front.z,mats.metal)}
 // Four social lifts and emergency/service shaft in the same rear core as the plan.
 wall(15.4,.15,-1.8,-1,y);wall(.15,6,7.4,-4,y);wall(.15,7.4,-9.6,-4.7,y);
 for(const x of [-8,-2.1])for(const z of [-5.7,-2.8]){box(interior,2.3,2.7,2.3,x,y+1.35,z,mats.stone);box(interior,1.5,2.2,.06,x+.1,y+1.1,z+1.17,mats.metal)}
 box(interior,2,2.7,3.2,3,y+1.35,-4.9,mats.stone);hit('Hall \u00b7 elevadores',-5,y+2,-.8,'hall');
 const rs=rects(f);
 if(f.type==='upper'){for(const r of rs){wall(.15,r.d,r.x1,r.cz,y);doorWall(r.x1,r.x2,r.z1,y,r.cx);hit(spaces(f).find(s=>s.id===r.id)?.name,r.cx,y+1.8,r.cz,r.id);if(state.furnished)blockAssets(addCommercialFitout(interior,r,y,commercialUse(f.id,r.id,state.use),mats))}}
 else for(const r of rs){const upperBack=r.cz<0;if(!state.integrated||!areas[f.type]){if(r.id==='auditorium'){wall(.14,6.3,r.x1,-3.85,y);wall(.14,4.9,r.x1,3.15,y);}else{if(upperBack)doorWall(r.x1,r.x2,r.z2,y,r.cx);else doorWall(r.x1,r.x2,r.z1,y,r.cx);if(!upperBack)wall(.14,r.d,r.x1,r.cz,y);}if(upperBack)wall(.14,r.d,r.x2,r.cz,y)}
 if(areas[f.type])bathroom(r,y);
 const info=spaces(f).find(s=>s.id===r.id);hit(`${info?.name||r.id}${info?.area?' \u00b7 '+info.area.toLocaleString('pt-BR')+' m\u00b2':''}`,r.id==='auditorium'?7.8:r.cx,y+2.1,r.id==='auditorium'?0:upperBack?-1.15:1.2,r.id);
 if(state.furnished){if(r.id==='auditorium'){for(let row=0;row<9;row++)for(let col=0;col<5;col++)chair(r.x1+.65+col*(r.w-1.3)/4,y,r.z1+1.7+row*1.1+(row>=5?1.3:0),0,true);box(interior,4,.3,1.2,r.cx,y+.15,r.z1+.6,mats.wood);block(r.cx,r.z1+.6,4.4,1.5,.3);box(interior,4,1.8,.07,r.cx,y+1.6,r.z1+.1,mats.white)}else if(r.id.startsWith('meeting')){box(interior,1.5,.1,3,r.cx,y+.78,r.cz,mats.wood);block(r.cx,r.cz,2.2,3.6,.35);box(interior,1,.74,2,r.cx,y+.37,r.cz,mats.metal);for(let i=0;i<5;i++){chair(r.cx-1.1,y,r.cz-1.3+i*.65,-Math.PI/2);chair(r.cx+1.1,y,r.cz-1.3+i*.65,Math.PI/2)}}else if(r.id==='pantry'){addPantry(interior,r,y,mats);block(r.cx,r.cz,Math.max(2,r.w-1.2),Math.max(2,r.d-1.2),.15)}else{blockAssets(addCommercialFitout(interior,r,y,commercialUse(f.id,r.id,state.use),mats))}}
 if(f.type==='D'&&['1','3','4','5'].includes(r.id)){for(let step=0;step<14;step++)box(interior,.8,.16,.26,r.x1+.65,y+.15+step*.225,r.z2-.2-step*.24,mats.wood);hit('Subir ao mezanino',r.x1+.6,y+1.6,r.z2-1,'duplex')}
 }
 if(f.type==='conference'||f.type==='B')buildingGarden(interior,f,y-.05,box,mats,facade,plant);
 optimizePlants(interior);
}
function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,4500)}
function stopWalk(){state.walk=false;keys={};controls.enabled=true;$('walk').textContent='Caminhar em primeira pessoa';$('crosshair').hidden=true;$('touch').hidden=true;if(document.pointerLockElement)document.exitPointerLock()}
function moveCamera(pos,target,duration=1400){stopWalk();transition={start:performance.now(),duration,from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),toTarget:target};controls.enabled=false}
const views={corner:[v(74,21,90),v(0,34,0)],street:[v(49,8,65),v(0,30,0)],aerial:[v(68,115,81),v(0,31,0)]};
function external(view='corner'){state.mode='exterior';setKioskResolution();context.visible=true;realism.lighting(state.light,false);sun.target.position.set(0,30,0);sun.position.set(-65,115,65);Object.assign(sun.shadow.camera,{left:-90,right:90,top:105,bottom:-70,near:1,far:260});sun.shadow.camera.updateProjectionMatrix();camera.fov=43;camera.updateProjectionMatrix();stopWalk();tower.visible=true;interior.visible=false;insideLight.visible=false;state.integrated=false;$('integrated').checked=false;controls.minDistance=12;controls.maxDistance=230;controls.maxPolarAngle=Math.PI/2+.06;moveCamera(...views[view]);applyLighting();syncUI();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===view))}
function enterFloor(id=state.floor,unit=null){state.floor=Number(id);state.mode='interior';setKioskResolution();context.visible=state.floor!==0;realism.lighting(state.light,true);const lightY=floors[state.floor].y;sun.target.position.set(0,lightY,0);sun.position.set(-22,lightY+22,30);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:100});sun.shadow.camera.updateProjectionMatrix();camera.fov=62;camera.updateProjectionMatrix();tower.visible=false;insideLight.visible=true;buildInterior();if(kiosk){simplifyInterior(interior);batchInterior(interior);}controls.minDistance=.5;controls.maxDistance=45;controls.maxPolarAngle=Math.PI*.98;if(unit)visit(unit);else{moveCamera(v(-7,floors[state.floor].y+1.65,0),v(7,floors[state.floor].y+1.65,0));state.unit='hall'}applyLighting();syncUI()}
function visit(id){state.unit=String(id);const f=floors[state.floor];if(id==='duplex'){enterFloor(22,state.unit==='duplex'?'1':state.unit);return}let r=rects(f).find(a=>a.id===String(id));if(r){const back=r.cz<0;if(id==='auditorium')moveCamera(v(r.x2-.8,f.y+1.65,r.z2-.8),v(r.cx,f.y+1.5,r.z1));else moveCamera(v(r.x2-.9,f.y+1.65,back?r.z2-1:r.z1+1),v(r.cx-.7,f.y+1.5,back?r.z1:r.z2));}else if(id==='parking')moveCamera(v(2,f.y+1.65,-1),v(-2,f.y+.9,-8));else moveCamera(v(-7,f.y+1.65,0),v(7,f.y+1.6,0));syncUI()}
function syncUI(){const f=floors[state.floor],inside=state.mode==='interior';$('leave-building').hidden=!inside;$('external-panel').hidden=inside;$('inside-panel').hidden=!inside;$('mini').hidden=!inside;$('mode-label').textContent=inside?'INTERIOR':'EXTERIOR';$('exterior').classList.toggle('active',!inside);$('floors-tab').classList.toggle('active',inside);$('units-tab').classList.toggle('active',inside&&state.unit!=='hall');$('scene-title').innerHTML=inside?f.label:'A real-time building tour<br>for sales presentations.';const s=spaces(f).find(a=>a.id===state.unit);$('scene-subtitle').textContent=inside?(s?`${s.name}${s.area?' \u00b7 '+s.area.toLocaleString('en-US')+' m\u00b2':''}${(areas[f.type]||f.type==='upper'||f.type==='ground')?' \u00b7 '+useLabels[commercialUse(f.id,state.unit,state.use)]:''}`:'Access hall · choose your space'):'Explore floors, units, fit-outs and guided camera paths.';$('floor').value=String(state.floor);$('unit').innerHTML=spaces(f).map(s=>`<option value="${s.id}">${s.name}${s.area?' \u00b7 '+s.area.toLocaleString('en-US')+' m\u00b2':''}</option>`).join('');if(s)$('unit').value=state.unit;$('floor-info').textContent=areas[f.type]?'8 independent units · private access and restroom':f.type==='conference'?'45-seat auditorium · 2 meeting rooms for 10 people':f.type==='upper'?'4 mezzanines connected to the penthouse floor':f.type==='ground'?'3 retail spaces · lobby · parking access':'Rotating parking · 70 spaces in the building';$('fitout').hidden=!areas[f.type]&&f.type!=='upper';$('integrated').disabled=!areas[f.type];$('duplex').hidden=!(f.type==='D'&&s?.duplex)&&f.type!=='upper';$('duplex').textContent=f.type==='upper'?'Go down to penthouse ↓':'Go up to mezzanine ↑';$('mini-title').textContent=f.label.toUpperCase();$('floor-down').disabled=state.floor===0;$('floor-up').disabled=state.floor===22;drawMap()}
$('floor').innerHTML=floors.map(f=>`<option value="${f.id}">${f.label}</option>`).reverse().join('');
function applyLighting(){facade.setFurnished(state.furnished);
 const night=state.light==='night',sunset=state.light==='sunset',inside=state.mode==='interior';facade.lighting(state.light);mats.leaf.emissive.set('#416b29');mats.leaf.emissiveIntensity=night?.38:sunset?.12:0;
 realism.lighting(state.light,inside);
 const targetY=inside?floors[state.floor].y:30;
 sun.target.position.set(0,targetY,0);sun.position.set(sunset?70:inside?-22:-65,targetY+(sunset?18:inside?22:85),sunset?60:inside?30:65);
 sun.color.set(sunset?'#ffd3a0':'#fff0d7');sun.intensity=night?.08:sunset?1.65:1.8;
 hemi.color.set(sunset?'#d0dcf0':'#dcebf5');hemi.intensity=night?.15:sunset?.52:.45;insideLight.intensity=night?.45:.35;
 mats.glass.emissive.set(night?'#c99857':'#000000');mats.glass.emissiveIntensity=night?.08:0;
 mats.glassWarm.emissive.set(night?'#e2af72':'#000000');mats.glassWarm.emissiveIntensity=night?.4:0;mats.light.emissiveIntensity=night?2:sunset?.8:.5;
}
function setLighting(light){state.light=light;state.night=light==='night';document.body.classList.toggle('night',state.night);applyLighting();for(const id of ['day','sunset','night'])$(id).classList.toggle('active',light===id)}
function dayNight(night){setLighting(night?'night':'day')}
function rebuild(){const unit=state.unit;enterFloor(state.floor,unit)}
function leaveBuilding(){stopTour();if(state.mode==='interior')guidedFlight({inside:false,view:'corner'});else external('corner')}
const humanizedChoices=[
 {img:'modelo-1-corporativo-clean.png',detail:'modelo-1-corporativo-clean.png',title:'Premium corporate office',desc:'High-end office layout with reception, private rooms and meeting space.',floor:5,unit:'1',use:'office',furnished:true},
 {img:'modelo-2-clinica-clean.png',detail:'modelo-2-clinica-clean.png',title:'Healthcare clinic',desc:'Consulting rooms, reception, waiting area and support spaces.',floor:6,unit:'2',use:'clinic',furnished:true},
 {img:'modelo-3-coworking-clean.png',detail:'modelo-3-coworking-clean.png',title:'Coworking',desc:'Workstations, meeting room and collaborative lounge.',floor:9,unit:'3',use:'corporate',furnished:true},
 {img:'modelo-4-mix-clean.png',detail:'modelo-4-mix-clean.png',title:'Commercial mix',desc:'Offices, clinics, support pantry and meeting spaces on the same floor.',floor:5,unit:'4',use:'mixed',furnished:true},
 {img:'modelo-5-vazio-clean.png',detail:'modelo-5-vazio-clean.png',title:'Empty delivered floor',desc:'Open floor plate ready for customization, with core and infrastructure.',floor:5,unit:'1',use:'office',furnished:false}
];
let humanizedIndex=3;
function syncHumanized(){
 const item=humanizedChoices[humanizedIndex];
 $('humanized-big').src=assetUrl(`assets/humanized/${item.img}`);
 $('humanized-title').textContent=item.title;
 $('humanized-desc').textContent=item.desc;
 document.querySelectorAll('.humanized-card').forEach((card,i)=>card.classList.toggle('active',i===humanizedIndex));
}
function openHumanizedEntry(){
 stopTour();stopWalk();controls.autoRotate=false;
 const entry=$('humanized-entry');entry.hidden=false;entry.classList.remove('closing');entry.classList.add('opening');document.body.classList.add('humanized-active');syncHumanized();
}
function closeHumanizedEntry(){
 const entry=$('humanized-entry');entry.classList.remove('opening');entry.classList.add('closing');document.body.classList.remove('humanized-active');
 setTimeout(()=>{entry.hidden=true;entry.classList.remove('closing')},280);
}
function enterHumanizedChoice(){
 const item=humanizedChoices[humanizedIndex];
 $('humanized-detail-img').src=assetUrl(`assets/humanized/${item.detail||item.img}`);
 $('humanized-detail-title').textContent=item.title;
 $('humanized-detail-desc').textContent=item.desc;
 document.body.classList.remove('humanized-active');
 document.body.classList.add('humanized-detail-active');
 $('humanized-detail').hidden=false;
}
humanizedChoices.forEach((item,i)=>{const button=document.createElement('button');button.className='humanized-card';button.type='button';button.innerHTML=`<img src="${assetUrl(`assets/humanized/${item.img}`)}" alt="${item.title}"><b>${String(i+1).padStart(2,'0')} · ${item.title}</b><span>${item.desc}</span>`;button.onclick=()=>{humanizedIndex=i;syncHumanized()};$('humanized-options').append(button)});
$('humanized-close').onclick=closeHumanizedEntry;$('humanized-go').onclick=enterHumanizedChoice;
$('humanized-detail-back').onclick=()=>{$('humanized-detail').hidden=true;document.body.classList.remove('humanized-detail-active');openHumanizedEntry()};
$('leave-building').onclick=leaveBuilding;
$('exterior').onclick=leaveBuilding;$('floors-tab').onclick=()=>{stopTour();enterFloor()};$('units-tab').onclick=()=>{stopTour();enterFloor(areas[floors[state.floor].type]||state.floor===1?state.floor:5,'1')};$('enter').onclick=openHumanizedEntry;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{stopTour();external(b.dataset.view)});
$('floor').onchange=e=>{stopTour();enterFloor(e.target.value)};$('floor-down').onclick=()=>{stopTour();enterFloor(Math.max(0,state.floor-1))};$('floor-up').onclick=()=>{stopTour();enterFloor(Math.min(22,state.floor+1))};$('visit').onclick=()=>{stopTour();visit($('unit').value)};$('hall').onclick=()=>{stopTour();visit('hall')};$('unit').onchange=()=>syncDuplex();function syncDuplex(){const s=spaces(floors[state.floor]).find(a=>a.id===$('unit').value);$('duplex').hidden=!s?.duplex&&state.floor!==22}
$('duplex').onclick=()=>enterFloor(state.floor===22?21:22,$('unit').value);$('day').onclick=()=>dayNight(false);$('night').onclick=()=>dayNight(true);$('sunset').onclick=()=>setLighting('sunset');
function furnished(value){state.furnished=value;facade.setFurnished(value);$('empty').classList.toggle('active',!value);$('furnished').classList.toggle('active',value);if(state.mode==='interior')rebuild()}
$('empty').onclick=()=>furnished(false);$('furnished').onclick=()=>furnished(true);$('use').onchange=e=>{stopTour();state.use=e.target.value;rebuild()};$('integrated').onchange=e=>{state.integrated=e.target.checked;rebuild();toast(state.integrated?'Simula\u00e7\u00e3o de integra\u00e7\u00e3o. N\u00facleo e lavabos preservados.':'Divis\u00f5es independentes restauradas.')};
function startWalk(){if(transition||lift)return;stopTour();state.walk=true;controls.enabled=false;const dir=controls.target.clone().sub(camera.position).normalize();yaw=Math.atan2(-dir.x,-dir.z);pitch=Math.asin(dir.y);camera.position.y=floors[state.floor].y+1.65;camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);$('walk').textContent='Exit walk mode';$('touch').hidden=false;$('crosshair').hidden=false;toast('Drag to look. Use WASD or arrows to walk. Double-click the scene to capture the mouse.')}
$('walk').onclick=()=>state.walk?stopWalk():startWalk();renderer.domElement.ondblclick=()=>{if(state.walk)renderer.domElement.requestPointerLock?.()};
addEventListener('keydown',e=>{if(['SELECT','INPUT','BUTTON'].includes(document.activeElement?.tagName))return;if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys[e.key]=true}if(e.key==='Escape'){stopWalk();stopTour()}});addEventListener('keyup',e=>keys[e.key]=false);addEventListener('blur',()=>{keys={};drag=null});
renderer.domElement.addEventListener('pointerdown',e=>{if(state.walk){drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)}});renderer.domElement.addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('pointermove',e=>{if(state.walk&&(drag||document.pointerLockElement)){let dx=document.pointerLockElement?e.movementX:e.clientX-drag.x,dy=document.pointerLockElement?e.movementY:e.clientY-drag.y;yaw-=dx*.003;pitch=T.MathUtils.clamp(pitch-dy*.003,-1.3,1.3);if(drag)drag={x:e.clientX,y:e.clientY};camera.rotation.set(pitch,yaw,0)}else hover(e)});
document.querySelectorAll('[data-move]').forEach(b=>{b.onpointerdown=e=>{keys[b.dataset.move]=true;b.setPointerCapture(e.pointerId)};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.move]=false});
function canWalk(x,z){if(Math.abs(x)>14.1||Math.abs(z)>8.1)return false;return !walls.some(w=>x>w.x1&&x<w.x2&&z>w.z1&&z<w.z2)}
function walkStep(dt){const forward=(keys.w||keys.ArrowUp?1:0)-(keys.s||keys.ArrowDown?1:0),side=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0);if(!forward&&!side)return;const speed=3.1*dt/Math.max(1,Math.hypot(forward,side));const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;if(canWalk(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(canWalk(camera.position.x,camera.position.z+dz))camera.position.z+=dz;controls.target.copy(camera.position).add(v(-Math.sin(yaw),0,-Math.cos(yaw)));}
const raycaster=new T.Raycaster();function hover(e){if(state.mode!=='interior'||state.walk){$('tooltip').hidden=true;return}raycaster.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1),camera);const h=raycaster.intersectObjects(hotspots.filter(h=>h.visible))[0];$('tooltip').hidden=!h;if(h){$('tooltip').textContent=h.object.userData.name;$('tooltip').style.left=`${Math.min(e.clientX+10,innerWidth-290)}px`;$('tooltip').style.top=`${e.clientY+14}px`}}
renderer.domElement.addEventListener('click',e=>{if(state.walk||state.mode!=='interior')return;raycaster.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1),camera);const h=raycaster.intersectObjects(hotspots.filter(h=>h.visible))[0];if(h)visit(h.object.userData.unit)});
function drawMap(){if(state.mode!=='interior')return;const c=$('minimap'),ctx=c.getContext('2d');ctx.clearRect(0,0,290,175);ctx.fillStyle='#e6e4db';ctx.fillRect(9,8,272,157);const f=floors[state.floor];const mx=x=>9+(x+16.5)/33*272,mz=z=>8+(z+11.5)/23*157;ctx.fillStyle='#b8c2bf';ctx.fillRect(mx(-9.7),mz(-8),mx(7.5)-mx(-9.7),mz(-1)-mz(-8));ctx.fillStyle='#536c75';ctx.font='9px Segoe UI';ctx.textAlign='center';ctx.fillText('ELEVADORES / N\u00daCLEO',mx(-1),mz(-4));for(const r of rects(f)){ctx.fillStyle=r.id===state.unit?'#b17e5266':'#f9f7f1';ctx.strokeStyle='#93a09d';ctx.lineWidth=1;ctx.fillRect(mx(r.x1),mz(r.z1),r.w/33*272,r.d/23*157);ctx.strokeRect(mx(r.x1),mz(r.z1),r.w/33*272,r.d/23*157);ctx.fillStyle='#183346';ctx.fillText(r.id.replace('meeting','R').replace('auditorium','AUD').replace('pantry','COPA'),mx(r.cx),mz(r.cz))}ctx.fillStyle='#b17e52';ctx.beginPath();ctx.arc(mx(camera.position.x),mz(camera.position.z),4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b17e52';ctx.beginPath();ctx.moveTo(mx(camera.position.x),mz(camera.position.z));const dir=new T.Vector3();camera.getWorldDirection(dir);ctx.lineTo(mx(camera.position.x+dir.x*1.7),mz(camera.position.z+dir.z*1.7));ctx.stroke();}
$('minimap').onclick=e=>{const b=e.currentTarget.getBoundingClientRect();const x=((e.clientX-b.left)/b.width*290-9)/272*33-16.5,z=((e.clientY-b.top)/b.height*175-8)/157*23-11.5;const r=rects(floors[state.floor]).find(r=>x>=r.x1&&x<=r.x2&&z>=r.z1&&z<=r.z2);if(r)visit(r.id)};
function showRef(){if(!$('ref-dialog').open)$('ref-dialog').showModal();stopWalk()}
$('references').onclick=()=>showRef();$('plan-open').onclick=()=>showRef();$('close-dialog').onclick=()=>$('ref-dialog').close();document.querySelectorAll('[data-ref]').forEach(b=>b.onclick=()=>showRef());$('fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
// Advance after each completed flight, so a slower device never skips a floor.
const TOUR_SECONDS=null; // Completion follows the full itinerary, not a fixed timer.
let flight=null,lift=null,tourIndex=-1,tourHoldUntil=0,tourVisited=[];
const liftCurtain=new T.Mesh(new T.PlaneGeometry(2,2),new T.MeshBasicMaterial({color:'#182932',transparent:true,opacity:0,depthTest:false,depthWrite:false}));
liftCurtain.position.z=-.2;liftCurtain.renderOrder=10000;liftCurtain.visible=false;camera.add(liftCurtain);scene.add(camera);
function portalFor(floor){const f=floors[floor],e=envelope(f);return f.type==='parking'?{inside:[0,10],outside:[0,16]}:{inside:[e.right-.45,f.type==='conference'?0:3.375],outside:[e.right+3,f.type==='conference'?0:3.375]}}
function roomView(floor,unit){const f=floors[floor],r=rects(f).find(r=>r.id===unit),y=f.y+1.65;
 if(!r)return {position:[f.type==='upper'?0:-6,y,f.type==='upper'?1.15:0],target:v(7,y,f.type==='upper'?1.15:0)};
 if(unit==='auditorium')return {position:[r.x1+.65,y,r.cz+.9],target:v(r.cx,y,r.z1+.8)};
 const back=r.cz<0,viewZ=back?r.z1+.85:r.z2-.85,lookZ=back?r.z2-1.15:r.z1+1.15;
 const viewX=T.MathUtils.clamp(r.cx+(r.cx<0?1.2:-1.2),r.x1+1,r.x2-1);
 return {position:[viewX,y,viewZ],target:v(r.cx,y,lookZ)};
}
function roomSurveyRoute(floor,unit){const f=floors[floor],r=rects(f).find(r=>r.id===unit),y=f.y+1.65;
 if(!r)return [];
 if(unit==='auditorium')return [
  {position:[r.x1+.65,y,r.cz+.9],target:[r.cx,y,r.z1+.8],stage:'survey',duration:1500},
  {position:[r.cx,y,r.z2-1.1],target:[r.cx,y,r.z1+.6],stage:'survey',duration:1500}
 ];
 const back=r.cz<0,nearGlass=back?r.z1+.85:r.z2-.85,nearDoor=back?r.z2-1.25:r.z1+1.25;
 const left=T.MathUtils.clamp(r.x1+1.1,r.x1+.9,r.x2-.9),right=T.MathUtils.clamp(r.x2-1.1,r.x1+.9,r.x2-.9);
 const firstX=r.cx<0?right:left,secondX=r.cx<0?left:right;
 return [
  {position:[firstX,y,nearGlass],target:[r.cx,y,nearDoor],stage:'survey',duration:1450},
  {position:[secondX,y,nearDoor],target:[r.cx,y,nearGlass],stage:'survey',duration:1450}
 ];
}
function corridorRoute(floor,unit,entering){const f=floors[floor],r=rects(f).find(r=>r.id===unit),y=f.y+1.65;
 if(!r)return [];
 const positions=r.id==='auditorium'?[[r.x1-.4,y,0],[r.x1+.45,y,0]]:[[r.cx,y,f.type==='upper'?1.15:0],[r.cx,y,r.cz<0?r.z2-.5:r.z1+.5]];
 if(!entering)positions.reverse();return positions.map(position=>({position,stage:'corridor',duration:650}));
}
function portalPassage(floor,entering){const f=floors[floor],r=rects(f).find(r=>r.id===(f.type==='conference'?'auditorium':f.type==='ground'?'2':'1'));
 if(!r)return [];const y=f.y+1.65,p=portalFor(floor),points=corridorRoute(floor,r.id,true);
 if(f.type!=='conference')points.push({position:[r.cx,y,p.inside[1]],stage:'corridor',duration:600});
 if(!entering)points.reverse();return points;
}
function guidedLift(destination){
 transition=null;flight=null;stopWalk();controls.enabled=false;controls.autoRotate=false;
 lift={start:performance.now(),destination,changed:false};liftCurtain.visible=true;
 toast('Acesso ao subsolo pelo elevador.');
}
function liftTick(now){const elapsed=Math.max(0,now-lift.start);
 liftCurtain.material.opacity=Math.min(1,elapsed/650);
 if(elapsed>=650&&!lift.changed){
  const d=lift.destination;
  if(d.inside){enterFloor(d.floor,d.unit);const view=roomView(d.floor,d.unit);camera.position.set(...view.position);controls.target.copy(view.target);camera.lookAt(view.target)}
  else {external(d.view);camera.position.copy(views[d.view][0]);controls.target.copy(views[d.view][1]);camera.lookAt(controls.target)}
  transition=null;controls.enabled=false;lift.changed=true;lift.reveal=performance.now()+200;
 }
 if(lift.changed){const p=Math.max(0,(now-lift.reveal)/700);liftCurtain.material.opacity=1-Math.min(1,p);if(p>=1){lift=null;liftCurtain.visible=false;controls.enabled=true}}
}
function configureWithoutMoving(action){
 const position=camera.position.clone(),target=controls.target.clone();
 action();transition=null;camera.position.copy(position);controls.target.copy(target);camera.lookAt(target);controls.enabled=false;
}
function guidedFlight(destination){
 if((state.mode==='interior'&&state.floor===0)||(destination.inside&&destination.floor===0)){guidedLift(destination);return}
 const source={inside:state.mode==='interior',y:state.mode==='interior'?floors[state.floor].y+1.65:camera.position.y,position:camera.position.toArray(),portal:portalFor(state.floor),egress:[...corridorRoute(state.floor,state.unit,false),...portalPassage(state.floor,true)]};
 let target;
 if(destination.inside){const view=roomView(destination.floor,destination.unit);destination.position=view.position;destination.y=floors[destination.floor].y+1.65;destination.portal=portalFor(destination.floor);destination.survey=roomSurveyRoute(destination.floor,destination.unit);destination.ingress=[...portalPassage(destination.floor,false),...corridorRoute(destination.floor,destination.unit,true)];target=view.target}
 else{destination.position=views[destination.view][0].toArray();target=views[destination.view][1].clone()}
 transition=null;stopWalk();controls.autoRotate=false;
 const sameFloor=source.inside&&destination.inside&&state.floor===destination.floor;
 const points=sameFloor?[...corridorRoute(state.floor,state.unit,false),...corridorRoute(destination.floor,destination.unit,true),...(destination.survey||[]),{position:destination.position,target:target.toArray(),stage:'arrive',duration:900}]:[...windowRoute(source,destination),...(destination.inside?(destination.survey||[]):[])];
 if(sameFloor){state.unit=destination.unit;syncUI()}
 flight={points,destination,target,index:0};
 if(!source.inside)configureWithoutMoving(()=>external(destination.view||'corner'));
 nextFlightSegment();
}
function nextFlightSegment(){
 if(!flight)return;
 const point=flight.points[flight.index++];
 if(!point){flight=null;controls.enabled=true;return}
 // Intermediate waypoints look along the route at eye level, never at the next floor.
 let look;
 if(point.target)look=v(...point.target);
 else if(point.stage==='arrive')look=flight.target;
 else{
  const next=flight.points.slice(flight.index).find(p=>Math.hypot(p.position[0]-point.position[0],p.position[2]-point.position[2])>.4);
  const direction=next?v(next.position[0]-point.position[0],0,next.position[2]-point.position[2]):camera.getWorldDirection(new T.Vector3()).setY(0);
  if(direction.lengthSq()<.01)direction.set(-1,0,0);
  look=v(...point.position).add(direction.normalize().multiplyScalar(6));
  if(state.mode==='interior')controls.target.y=camera.position.y;
 }
 moveCamera(v(...point.position),look,point.duration);
 transition.flightStage=point.stage;
}
function finishFlightSegment(stage){
 if(!flight)return;
 if(stage==='exit')configureWithoutMoving(()=>external('corner'));
 if(stage==='prepare')configureWithoutMoving(()=>enterFloor(flight.destination.floor,flight.destination.unit));
 nextFlightSegment();
}
let kioskIdleSince=performance.now();
if(kiosk)addEventListener('pointerdown',()=>{kioskIdleSince=performance.now()},{passive:true});
function tourCaption(stop,moving=false){
 const f=stop.floor!==undefined?floors[stop.floor]:null,s=f?spaces(f).find(s=>s.id===stop.unit):null;
 $('tour-caption-floor').textContent=f?f.label:'COMMERCIAL TOWER';
 $('tour-caption-room').textContent=f?(s?.name||'Access hall'):(stop.view==='aerial'?'Sobrevoo do edif\u00edcio':'Architecture and facade');
 $('tour-caption-detail').textContent=[s?.area?`${s.area.toLocaleString('en-US')} m\u00b2`:null,moving?'On the way to this space':f?'Conhe\u00e7a o espa\u00e7o':'Vista externa'].filter(Boolean).join(' \u00b7 ');
}
function startTour(){stopTour();state.use='mixed';$('use').value='mixed';state.tour=true;document.body.classList.add('tour-active');$('tour-caption').hidden=false;$('tooltip').hidden=true;tourCaption(tourStops[0]);tourStart=performance.now();tourIndex=-1;tourHoldUntil=0;tourVisited=[];$('tour').textContent='Pausar tour';stopWalk()}
function stopTour(){kioskIdleSince=performance.now();state.tour=false;tourActor.visible=false;document.body.classList.remove('tour-active');$('tour-caption').hidden=true;$('tour').textContent='Iniciar tour guiado';controls.autoRotate=false;flight=null;lift=null;liftCurtain.visible=false;transition=null;controls.enabled=true;}
$('tour').onclick=()=>state.tour?stopTour():startTour();
function tourTick(now){
 if(flight||transition||lift){tourHoldUntil=0;return}
 if(tourIndex>=0&&!tourHoldUntil){const stop=tourStops[tourIndex];tourCaption(stop);tourHoldUntil=now+stop.hold;if(stop.floor!==undefined&&!tourVisited.includes(stop.floor))tourVisited.push(stop.floor)}
 if(now<tourHoldUntil)return;
 if(tourIndex===tourStops.length-1){if(kiosk&&!activeRecording){state.completedCycles=(state.completedCycles||0)+1;state.lastTourVisited=[...tourVisited];startTour();return}stopTour();if(activeRecording&&!activeRecording.cancelled&&activeRecording.recorder.state!=='inactive')activeRecording.recorder.stop();return}
 const stop=tourStops[++tourIndex];tourCaption(stop,true);tourHoldUntil=0;setLighting(stop.light);
 if(stop.floor!==undefined)guidedFlight({inside:true,floor:stop.floor,unit:stop.unit});
 else if(state.mode==='interior')guidedFlight({inside:false,view:stop.view});
 else external(stop.view);
 controls.autoRotate=false;
}
function updateTourActor(){
 const show=false;
 if(!show){tourActor.visible=false;tourActor.userData.ready=false;return}
 tourActor.visible=true;
 const floor=floors[state.floor],dir=camera.getWorldDirection(new T.Vector3());dir.y=0;
 if(dir.lengthSq()<.001)dir.set(0,0,-1);
 dir.normalize();
 const side=v(dir.z,0,-dir.x);
 const pos=actorSpot(camera.position,dir,side);
 pos.y=floor.y;
 if(!tourActor.userData.ready||tourActor.position.distanceTo(pos)>5||transition||flight){tourActor.position.copy(pos);tourActor.userData.ready=true}
 else tourActor.position.lerp(pos,.28);
 tourActor.rotation.y=Math.atan2(dir.x,dir.z);
 const t=performance.now()*.0075,step=Math.sin(t),counter=Math.cos(t);
 tourActor.position.y=floor.y-.018;
 const parts=tourActor.userData.parts||{};
 if(parts.leftLeg){
  parts.leftLeg.rotation.x=step*.34;parts.rightLeg.rotation.x=-step*.34;
  parts.leftArm.rotation.x=-step*.3;parts.rightArm.rotation.x=step*.3;
  parts.torso.rotation.z=counter*.018;parts.hips.rotation.z=-counter*.014;
  parts.leftFoot.rotation.x=-Math.max(0,step)*.22;parts.rightFoot.rotation.x=-Math.max(0,-step)*.22;
 }
}
let activeRecording=null;
function cancelRecording(){
 if(!activeRecording)return;
 activeRecording.cancelled=true;
 clearTimeout(activeRecording.timer);
 if(activeRecording.recorder.state!=='inactive')activeRecording.recorder.stop();
 stopTour();toast('Grava\u00e7\u00e3o cancelada.');
}
async function recordTour(seconds=null,download=true){
 if(recording)return;
 if(typeof MediaRecorder==='undefined'){toast('Use Chrome ou Edge para gravar.');return}
 const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mimeType){toast('Este navegador n\u00e3o suporta grava\u00e7\u00e3o WebM. Use Chrome ou Edge.');return}
 let stream,recorder;
 try{stream=renderer.domElement.captureStream(30);recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:6500000})}
 catch{stream?.getTracks().forEach(t=>t.stop());toast('N\u00e3o foi poss\u00edvel iniciar a grava\u00e7\u00e3o.');return}
 recording=true;$('record').disabled=false;$('record').textContent='Cancelar grava\u00e7\u00e3o';
 const session={recorder,timer:null,cancelled:false},chunks=[];activeRecording=session;
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 const result=new Promise(resolve=>{
  let settled=false;
  function finish(error=false){
   if(settled)return;settled=true;clearTimeout(session.timer);stream.getTracks().forEach(t=>t.stop());
   const blob=error||session.cancelled?null:new Blob(chunks,{type:mimeType});
   if(download&&blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Portfolio Tower-Business-tour.webm';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
   activeRecording=null;recording=false;$('record').disabled=false;$('record').textContent='Gravar v\u00eddeo';stopTour();if(error)toast('Falha na grava\u00e7\u00e3o. Voc\u00ea pode tentar novamente.');resolve(blob);
  }
  recorder.onstop=()=>finish();recorder.onerror=()=>finish(true);
 });
 try{startTour();recorder.start(1000);if(seconds!==null)session.timer=setTimeout(()=>{if(recorder.state!=='inactive')recorder.stop()},seconds*1000);toast(seconds===null?'Recording o tour completo: andares comerciais e salas. Clique em Cancelar grava\u00e7\u00e3o para interromper.':`Recording ${seconds} segundos. Clique em Cancelar grava\u00e7\u00e3o para interromper.`)}
 catch{session.cancelled=true;recorder.dispatchEvent(new Event('error'))}
 return result;
}
$('record').onclick=()=>recording?cancelRecording():recordTour();
let previous=performance.now(),mapTime=0;function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.05);previous=now;if(state.tour)tourTick(now);if(lift)liftTick(now);else if(transition){const p=T.MathUtils.clamp((now-transition.start)/transition.duration,0,1),ease=p*p*(3-2*p);camera.position.lerpVectors(transition.from,transition.to,ease);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,ease);camera.lookAt(controls.target);if(p===1){const stage=transition.flightStage;transition=null;controls.enabled=true;if(stage)finishFlightSegment(stage)}}else if(state.walk)walkStep(dt);else controls.update();updateTourActor();if(now-mapTime>80){drawMap();mapTime=now}for(const h of hotspots){const dist=h.position.distanceTo(camera.position);h.visible=!state.tour&&dist>3.5;h.scale.set(3.6*Math.min(1,dist/15),.6*Math.min(1,dist/15),1)}realism.render()}
function setKioskResolution(){if(!kiosk)return;renderer.setPixelRatio(Math.min(devicePixelRatio,(state.mode==='exterior'?1920:1440)/innerWidth));renderer.setSize(innerWidth,innerHeight);realism.resize()}
addEventListener('resize',()=>{setKioskResolution();camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);realism.resize()});
camera.position.copy(views.corner[0]);controls.target.copy(views.corner[1]);camera.lookAt(controls.target);syncUI();state.ready=true;applyLighting();requestAnimationFrame(animate);
window.portfolioTour={facade,scene,tower,context,realism,setLighting,tourStops,tourProgress:()=>({index:tourIndex,visited:[...tourVisited],moving:!!(flight||transition||lift)}),interior:()=>interior,tourActor,rects,commercialUse,entranceZone,guidedFlight,startTour,stopTour,tourSeconds:TOUR_SECONDS,state,floors,spaces,enterFloor,visit,external,dayNight,furnished,startWalk,stopWalk,recordTour,cancelRecording,renderer,camera,canWalk,stats:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})};







