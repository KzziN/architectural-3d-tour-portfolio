import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {rects} from './data.js';
import {envelope} from './building-envelope.js';
import {buildingGarden} from './building-garden.js';
import {referenceDetails} from './reference-details.js';

export function createGeometricFacadeMaterials(kiosk,mats){
 const Glass=kiosk?T.MeshStandardMaterial:T.MeshPhysicalMaterial;
 const glass=new Glass({color:'#456078',metalness:.48,roughness:.075,transparent:true,opacity:.83,depthWrite:false,envMapIntensity:1.8,...(!kiosk?{clearcoat:1,clearcoatRoughness:.07,transmission:0}:{} )});glass.name='geometric-facade-glass';
 const podiumGlass=glass.clone();podiumGlass.color.set('#829499');podiumGlass.opacity=.58;podiumGlass.metalness=.25;podiumGlass.name='geometric-podium-glass';
 const bronze=new T.MeshStandardMaterial({color:'#79503a',metalness:.62,roughness:.36});bronze.name='reference-bronze-surround';
 const frame=new T.MeshStandardMaterial({color:'#282b2c',metalness:.8,roughness:.3});
 const fascia=new T.MeshStandardMaterial({color:'#353331',metalness:.65,roughness:.35});
 const glow=new T.MeshStandardMaterial({color:'#eee4ce',emissive:'#ffd49a',emissiveIntensity:.15,roughness:.7});
 const plantingGlow=mats.soil;
 const room=new T.MeshLambertMaterial({color:'#e6e0d3',map:mats.white.map,emissive:'#ffce98',emissiveIntensity:0});room.name='geometric-room-wall';
 const furniture=new T.MeshLambertMaterial({color:'#b7a286',map:mats.wood.map});
 const chair=new T.MeshLambertMaterial({color:'#59615f'});
 const facade={bronze,podiumGlass,front:glass,side:glass,recessed:glass,wing:glass,podium:glass,frame,fascia,glow,plantingGlow,room,furniture,chair,geometric:true};
 facade.lighting=mode=>{const night=mode==='night',sunset=mode==='sunset';glass.opacity=night?.48:sunset?.7:.83;podiumGlass.opacity=night?.3:sunset?.45:.58;glass.envMapIntensity=night?.7:1.8;room.emissiveIntensity=night?.45:sunset?.12:0;glow.emissiveIntensity=night?2:sunset?.7:.15};
 return facade;
}

export function createGeometricTower({floors,mats,facade,plant,optimizePlants,kiosk}){
 const tower=new T.Group();tower.name='Portfolio Tower-geometric-tower';const shell=new T.Group(),rooms=new T.Group();shell.name='exterior-shell';rooms.name='exterior-room-volumes';tower.add(shell,rooms);
 const buckets=new Map(),base=new T.BoxGeometry(1,1,1),glassBuckets=new Map();let roomCount=0,panes=0,currentGlass=facade.front;
 function box(w,h,d,x,y,z,material,category='shell'){
  const g=base.clone();g.scale(w,h,d);g.translate(x,y,z);const key=category+material.uuid;
  if(!buckets.has(key))buckets.set(key,{material,category,geometries:[]});buckets.get(key).geometries.push(g);
 }
 function pane(w,h,d,x,y,z){const g=base.clone();g.scale(w,h,d);g.translate(x,y,z);const key=(d<.1?'front':'side')+currentGlass.uuid;if(!glassBuckets.has(key))glassBuckets.set(key,{material:currentGlass,geometries:[]});glassBuckets.get(key).geometries.push(g);panes++}
 for(const f of floors){if(f.id===0)continue;const podium=f.id<=3,upper=f.id===22,w=podium?33:upper?19.3:29,d=podium?23:upper?7.1:17,h=f.id===1?4:3.3,cx=upper?4.85:0,cz=upper?4.95:0,y=f.y;
  currentGlass=podium?facade.podiumGlass:facade.front;const e=envelope(f),segments=e.fronts;
  for(const r of e.slabs){const ww=r.x2-r.x1,dd=r.z2-r.z1,xx=(r.x1+r.x2)/2,zz=(r.z1+r.z2)/2;box(ww,.23,dd,xx,y,zz,facade.fascia);box(ww-.15,.05,dd-.15,xx,y+.14,zz,mats.floor);box(ww-.15,.09,dd-.15,xx,y+h-.16,zz,facade.room)}
  if(!upper)box(12,h-.28,6.7,-2.2,y+h/2,-5,facade.fascia);
  function backLimit(r){return Math.min(...segments.filter(s=>r.x2>s.x1&&r.x1<s.x2).map(s=>s.z))}
  for(const s of segments){const n=Math.ceil((s.x2-s.x1)/1.25),pitch=(s.x2-s.x1)/n;for(let i=0;i<n;i++){const x=s.x1+(i+.5)*pitch;pane(pitch-.055,h-.34,.025,x,y+h/2,s.z);box(.05,h-.12,.13,s.x1+i*pitch,y+h/2,s.z+.025,facade.frame)}box(.05,h-.12,.13,s.x2,y+h/2,s.z+.025,facade.frame);for(const yy of[y+.2,y+h-.12])box(s.x2-s.x1,.065,.14,(s.x1+s.x2)/2,yy,s.z+.035,facade.frame)}
  function sideGlass(x,z1,z2){const n=Math.ceil((z2-z1)/1.25),pitch=(z2-z1)/n;for(let i=0;i<n;i++){pane(.025,h-.34,pitch-.055,x,y+h/2,z1+(i+.5)*pitch);box(.13,h-.12,.05,x,y+h/2,z1+i*pitch,facade.frame)}for(const yy of[y+.2,y+h-.12])box(.14,.065,z2-z1,x,yy,(z1+z2)/2,facade.frame)}
  function opaqueSide(x,z1,z2){const n=Math.max(1,Math.round((z2-z1)/3.4)),pitch=(z2-z1)/n;
   for(let i=0;i<n;i++){const z=z1+(i+.5)*pitch,wh=1.15,ww=1.65;box(.16,.85,pitch,x,y+.5,z,facade.fascia);box(.16,h-2.12,pitch,x,y+2.12+(h-2.12)/2,z,facade.fascia);for(const sign of[-1,1])box(.16,wh,(pitch-ww)/2,x,y+1.54,z+sign*(ww/2+(pitch-ww)/4),facade.fascia);pane(.025,wh,ww,x,y+1.54,z);box(.19,.055,ww+.1,x,y+.96,z,facade.frame);box(.19,.055,ww+.1,x,y+2.12,z,facade.frame);box(.19,wh,.05,x,y+1.54,z,facade.frame)}
  }
  for(const side of e.sides){if(side.opaque)opaqueSide(side.x,side.z1,side.z2);else sideGlass(side.x,side.z1,side.z2)}
  if(e.recessed){box(.16,h-.15,1.15,-5,y+h/2,7.925,facade.fascia);box(1,h-.15,.16,14,y+h/2,1,facade.fascia)}
  if(!upper)box(w,h-.15,.15,0,y+h/2,-d/2,facade.fascia);
  if(upper){for(const r of e.slabs)box(r.x2-r.x1,.22,r.z2-r.z1,(r.x1+r.x2)/2,y+h,(r.z1+r.z2)/2,facade.fascia);
   box(9.5,.2,15.85,-9.75,y+.1,-.575,mats.stone);box(18.3,.2,9.5,4.25,y+.1,-3.75,mats.stone);
   box(9.5,1.2,.16,-9.75,y+.7,7.35,facade.fascia);box(.16,1.2,15.85,-14.5,y+.7,-.575,facade.fascia);box(28,1.2,.16,-.5,y+.7,-8.5,facade.fascia);
   // Lift inspection core is indicated on portfolio reference. Equipment types/heights are not supplied: no generic HVAC units.
   box(13,1.2,6.5,-1.8,y+.7,-4.2,facade.fascia);
  }
  if(f.id<=3){for(let x=-13;x<=13;x+=6.5)box(.4,h-.25,.4,x,y+h/2,5,facade.room);if(f.id===1)for(const x of[-9,1,10]){box(2.2,.85,.8,x,y+.6,7.5,facade.furniture,'rooms');box(2.3,.04,.9,x,y+1.05,7.5,mats.white,'rooms')} }
  else for(const r of rects(f)){
   const limit=backLimit(r);roomCount++;const back=r.cz<0,z=back?r.z1+2:Math.min(r.z2,limit)-2,depth=Math.min(3.6,r.d-.15),wallZ=back?r.z1+depth:Math.min(r.z2,limit)-depth;
   box(r.w-.2,h-.32,.09,r.cx,y+h/2,wallZ,facade.room);box(.09,h-.32,depth,r.x1,y+h/2,back?r.z1+depth/2:Math.min(r.z2,limit)-depth/2,facade.room);
   box(1.6,.065,.8,r.cx,y+.92,z,facade.furniture,'rooms');for(const dx of[-.65,.65])box(.045,.73,.6,r.cx+dx,y+.52,z,facade.frame,'rooms');box(.5,.33,.035,r.cx,y+1.13,z-.15,mats.screen,'rooms');box(.025,.14,.025,r.cx,y+.98,z-.15,facade.frame,'rooms');box(.5,.09,.5,r.cx,y+.61,z+.9,facade.chair,'rooms');box(.5,.48,.065,r.cx,y+.9,z+1.12,facade.chair,'rooms');box(.04,.45,.04,r.cx,y+.35,z+.9,facade.frame,'rooms');box(.5,.035,.05,r.cx,y+.15,z+.9,facade.frame,'rooms');box(1.1,.025,.1,r.cx,y+h-.23,z,facade.glow);
  }
  if([4,9,13].includes(f.id))buildingGarden(tower,f,y+.2,(_g,...args)=>box(...args),mats,facade,plant);
 }
 referenceDetails(floors,box,facade,mats);
 for(const {material,category,geometries} of buckets.values()){const mesh=new T.Mesh(mergeGeometries(geometries),material);mesh.castShadow=!kiosk;mesh.receiveShadow=true;mesh.userData.geometricFacade=true;(category==='rooms'?rooms:shell).add(mesh);geometries.forEach(g=>g.dispose())}
 for(const [orientation,{material,geometries}]of glassBuckets){const mesh=new T.Mesh(mergeGeometries(geometries),material);mesh.name=`geometric-glass-${orientation}`;mesh.receiveShadow=true;mesh.castShadow=false;shell.add(mesh);geometries.forEach(g=>g.dispose())}
 base.dispose();optimizePlants(tower);Object.assign(tower.userData,{geometric:true,visibleLevels:floors.filter(f=>f.id>0).map(f=>f.id),rooms:roomCount,panes});
 facade.setFurnished=value=>rooms.visible=value;return tower;
}
