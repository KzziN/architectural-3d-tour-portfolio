import * as T from 'three';
import {rounded,cylinder,chair} from './realism.js';

export function addPantry(parent,r,y,m){
 const items=[];
 function item(kind,x,z,build,rotation=0){
  const g=new T.Group();g.name=`pantry-${kind}`;g.position.set(x,y,z);g.rotation.y=rotation;
  g.userData.pantry=kind;build(g);parent.add(g);items.push(g);return g;
 }
 const box=(g,w,h,d,x,yy,z,material=m.white)=>rounded(g,w,h,d,x,yy,z,material,.015);
 const back=r.z2-.43;
 item('counter',r.cx+.65,back,g=>{
  const w=r.w-2.15;box(g,w,.85,.65,0,.425,0,m.wood);box(g,w+.06,.055,.72,0,.9,0);
  for(let x=-w/2+.4;x<w/2;x+=.8){box(g,.015,.74,.025,x,.44,-.34,m.metal);box(g,.23,.022,.03,x+.2,.7,-.36,m.chrome);}
  box(g,.62,.022,.43,w/2-.6,.935,0,m.chrome);box(g,.5,.012,.32,w/2-.6,.948,-.025,m.metal);
  cylinder(g,.022,.3,w/2-.6,1.1,.16,m.chrome);box(g,.03,.03,.22,w/2-.6,1.245,.065,m.chrome);
 });
 item('fridge',r.x1+.68,r.z2-.75,g=>{
  box(g,.88,1.86,.75,0,.93,0);box(g,.82,.49,.035,0,1.56,-.39);box(g,.82,1.14,.035,0,.7,-.39);
  box(g,.83,.018,.03,0,1.28,-.415,m.metal);
  for(const h of [.95,1.52])box(g,.035,.28,.055,.3,h,-.435,m.chrome);
  box(g,.16,.055,.012,0,1.78,-.415,m.metal);
 });
 item('microwave',r.x1+2.15,back-.06,g=>{
  box(g,.67,.39,.44,0,1.145,0,m.chrome);box(g,.51,.28,.018,-.055,1.145,-.23,m.screen);
  box(g,.026,.24,.045,.19,1.145,-.25,m.chrome);box(g,.08,.06,.02,.265,1.24,-.23,m.light);
  for(const h of [1.08,1.14])cylinder(g,.016,.024,.267,h,-.239,m.metal).rotation.x=Math.PI/2;
 });
 item('coffee-maker',r.cx+.4,back-.08,g=>{
  box(g,.32,.04,.4,0,.955,0,m.metal);box(g,.3,.42,.14,0,1.16,.12,m.metal);
  box(g,.29,.08,.29,0,1.36,.02,m.metal);cylinder(g,.11,.22,0,1.09,-.05,m.glassWarm);
  cylinder(g,.105,.025,0,1.22,-.05,m.metal);box(g,.035,.13,.085,.125,1.1,-.05,m.chrome);
  box(g,.035,.017,.018,.09,1.28,-.11,m.light);
  for(const x of [.36,.54]){cylinder(g,.057,.09,x,.99,-.05,m.white);box(g,.02,.055,.05,x+.065,1.0,-.05,m.white);}
 });
 item('television',r.x1+.16,2.95,g=>{
  box(g,1.55,.91,.075,0,2.06,0,m.metal);box(g,1.43,.79,.012,0,2.06,.045,m.screen);
  box(g,1.43,.12,.008,0,1.82,.054,m.wood);box(g,.8,.025,.008,-.2,2.18,.054,m.light);
  box(g,.48,.018,.008,-.36,2.1,.054,m.white);box(g,.025,.025,.015,.68,1.64,.047,m.light);
 },Math.PI/2);
 for(const [i,x] of [r.x1+2.05,r.x2-1.5].entries())item(`table-${i+1}`,x,2.95,g=>{
  box(g,1.15,.065,.8,0,.77,0,m.wood);
  for(const xx of [-.46,.46])for(const zz of [-.29,.29])box(g,.045,.73,.045,xx,.365,zz,m.chrome);
  chair(g,0,0,-.8,Math.PI,m);chair(g,0,0,.8,0,m);
  cylinder(g,.12,.025,.2,.825,0,m.white);
 });
 return items;
}
