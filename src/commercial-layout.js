import * as T from 'three';
import {rounded,cylinder,chair,desk,plant} from './realism.js';
export const useLabels={mixed:'Mixed environments',office:'Office',clinic:'Medical clinic',dental:'Dental clinic',therapy:'Therapy / client care',corporate:'Coworking',meeting:'Meeting room',lounge:'Reception / lounge',retail:'Retail / showroom',cafe:'Cafe / service'};
const uses=['clinic','office','dental','therapy','corporate','meeting','lounge'];
export function commercialUse(floor,unit,selected='mixed'){
 if(selected!=='mixed')return selected;
 if(floor===1)return ['cafe','retail','lounge'][Number(unit)-1]||'retail';
 return uses[((floor-5+Number(unit)-1)%uses.length+uses.length)%uses.length];
}
export function entranceZone(r){const back=r.cz<0;return {x1:r.cx-.78,x2:r.cx+.78,z1:back?r.z2-2.3:r.z1-.1,z2:back?r.z2+.1:r.z1+2.3}}
export function overlaps(a,b){return a.x1<b.x2&&a.x2>b.x1&&a.z1<b.z2&&a.z2>b.z1}
export function addCommercialFitout(parent,r,y,use,mats){
 const back=r.cz<0,compact=r.d<5,far=back?r.z1+1.85:r.z2-1.85;
 const assets=[];
 function asset(kind,x,z,build,rotation=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;g.userData.commercial={kind,use,unit:r.id};build(g);parent.add(g);assets.push(g);return g}
 const surface=(g,w,h,d,x,yy,z,m=mats.wood)=>rounded(g,w,h,d,x,yy,z,m);
 function seat(g,x,z,rot=0){chair(g,x,0,z,rot,mats)}
 function cabinet(g,w=1.4){surface(g,w,.85,.4,0,.425,0);surface(g,w,.035,.43,0,.87,0,mats.white)}
 function armchair(g,x,z,rot=0){const a=new T.Group();a.position.set(x,0,z);a.rotation.y=rot;surface(a,.72,.16,.7,0,.42,0,mats.chair);surface(a,.74,.58,.12,0,.73,.3,mats.chair);for(const sign of [-1,1]){surface(a,.11,.35,.65,sign*.35,.59,0,mats.chair);cylinder(a,.028,.3,sign*.26,.15,-.23,mats.chrome)}g.add(a)}
 if(compact){
  asset('compact-desk',r.x1+.8,r.z2-1.08,g=>{surface(g,1.15,.06,.5,0,.76,0);for(const sign of [-1,1])surface(g,.04,.73,.42,sign*.49,.365,0,mats.chrome);surface(g,.42,.3,.03,0,.98,-.08,mats.screen);seat(g,0,.65)});
 }else if(use==='clinic'||use==='dental'){
  asset('consultation',r.x1+1.65,far,g=>desk(g,0,0,0,false,mats));
  asset(use==='dental'?'dental-chair':'examination',r.x2-1.75,far,g=>{
   surface(g,.48,.62,1.3,0,.31,0,mats.white);surface(g,.72,.15,1.85,0,.79,0,mats.white);
   const backrest=surface(g,.66,.12,.65,0,1.02,-.61,mats.chair);backrest.rotation.x=use==='dental'?-.5:-.08;
   surface(g,.36,.12,.28,0,1.21,-.88,mats.white);
   cylinder(g,.035,1.85,-.45,.925,-.4,mats.chrome);surface(g,.07,.07,.8,-.45,1.82,0,mats.chrome);surface(g,.28,.08,.2,-.45,1.8,.35,mats.light);
  });
  asset('medical-storage',r.x1+.85,back?r.z1+.35:r.z2-.32,g=>cabinet(g,1.15));
 }else if(use==='therapy'){
  asset('therapy-seating',r.cx-.35,far,g=>{armchair(g,-.75,0,-Math.PI/2);armchair(g,.7,0,Math.PI/2);surface(g,.5,.05,.6,0,.42,.05);cylinder(g,.035,.4,0,.2,.05,mats.chrome)});
  asset('storage',r.x1+.8,back?r.z1+.3:r.z2-.3,g=>cabinet(g,1.1));
 }else if(use==='lounge'){
  asset('reception',r.cx-.45,far,g=>{surface(g,1.8,.95,.55,0,.475,0);surface(g,1.84,.05,.6,0,.98,0,mats.white);surface(g,.5,.3,.035,.35,1.16,-.05,mats.screen);seat(g,0,.8)});
  asset('waiting',r.x1+.6,back?r.z2-2.7:r.z1+2.7,g=>{armchair(g,0,0,-Math.PI/2)});
 }else if(use==='meeting'){
  asset('meeting-table',r.cx-.3,far,g=>{surface(g,2.5,.07,.85,0,.78,0);surface(g,1.6,.73,.5,0,.365,0,mats.metal);for(const x of [-.8,.8]){seat(g,x,.85);seat(g,x,-.85,Math.PI)}});
 }else if(use==='retail'){
  asset('showroom',r.x1+.55,far,g=>{for(const height of [.6,1.2,1.8]){surface(g,.75,.06,2.2,0,height,0);for(const z of [-.7,0,.7])surface(g,.3,.27,.3,0,height+.15,z,mats.white)}});
  asset('retail-counter',r.cx-.4,back?r.z1+1:r.z2-.85,g=>cabinet(g,1.8));
 }else if(use==='cafe'){
  asset('cafe-counter',r.x1+.5,far,g=>{surface(g,.7,1,2.5,0,.5,0);surface(g,.75,.06,2.55,0,1.03,0,mats.white);surface(g,.45,.45,.55,0,1.28,-.7,mats.metal)});
  asset('cafe-table',r.cx+.1,far,g=>{cylinder(g,.5,.055,0,.75,0,mats.wood);cylinder(g,.055,.72,0,.36,0,mats.chrome);seat(g,0,.88);seat(g,0,-.88,Math.PI)});
 }else{
  asset(use==='corporate'?'coworking-desk':'office-desk',r.cx-.45,far,g=>desk(g,0,0,0,false,mats));
  if(use==='corporate'&&r.d>7)asset('second-workstation',r.x1+.9,back?r.z2-3.4:r.z1+3.4,g=>{surface(g,.95,.06,.55,0,.77,0);surface(g,.6,.72,.4,0,.36,0,mats.metal);surface(g,.4,.28,.03,0,.96,-.15,mats.screen);seat(g,0,.65)});
  asset('storage',r.x1+.85,back?r.z1+.28:r.z2-.28,g=>cabinet(g,1.2));
 }
 // Keep the entire natural canopy clear of glazing, not only the pot center.
 if(!compact){const first=parent.children.length;plant(parent,r.x2-.85,y,back?r.z1+.85:r.z2-.85,.6,mats);for(const mesh of parent.children.slice(first))mesh.userData.indoorVegetation=true;}
 return assets;
}
