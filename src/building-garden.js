import {terracePlant} from './terrace-plant.js';
import {envelope} from './building-envelope.js';
export function buildingGarden(group,f,y,box,mats,facade,plant){
 const e=envelope(f);if(!e.balcony&&!e.conference)return;
 const minX=-14.5,maxX=14.5,minZ=-8.5,maxZ=8.5,front=e.front,right=e.right;
 const add=(w,h,d,x,yy,z,m)=>box(group,w,h,d,x,yy,z,m);
 add(29,.18,8.5-front,0,y,(front+8.5)/2,mats.stone);
 add(14.5-right,.18,front+8.5,(right+14.5)/2,y,(front-8.5)/2,mats.stone);
 add(29,.34,.52,0,y+.22,8.17,facade.fascia);add(.52,.34,17,14.17,y+.22,0,facade.fascia);
 add(29,.035,.44,0,y+.4,8.17,mats.soil);add(.44,.035,17,14.17,y+.4,0,mats.soil);
 add(29,.7,.035,0,y+.48,8.48,mats.rail||mats.glass);add(.035,.7,17,14.48,y+.48,0,mats.rail||mats.glass);
 function grow(x,z,size,side=false){const palm=size>=1.7,r=palm?1.7:.55;
  const bounds=side?{xMin:right+.1,xMax:15.5,zMin:Math.max(minZ+.1,z-r),zMax:Math.min(maxZ-.1,z+r)}:{xMin:Math.max(minX+.1,x-r),xMax:Math.min(maxX-.1,x+r),zMin:front+.1,zMax:9.5};
  terracePlant(group,plant,x,y+.4,z,size,bounds);
 }
 let i=0;for(let x=-14;x<14;x+=.5)grow(x,8.05,.7+(i++%5)*.12);
 for(let z=-8;z<7.5;z+=.6)grow(14.05,z,.7+(i++%4)*.12,true);
 for(const x of[-12.5,11.7])grow(x,8.02,2.1);
 grow(14.05,-6.5,2.05,true);
 // Hanging foliage visible in the daytime marketing views stays beyond the glass of the floor below.
 for(let x=-14;x<14;x+=.85)terracePlant(group,plant,x,y+.55,8.8,.85,{xMin:x-.35,xMax:x+.35,zMin:8.58,zMax:9.15},'trailing');
 for(let z=-8;z<7.5;z+=1)terracePlant(group,plant,14.8,y+.55,z,.85,{xMin:14.58,xMax:15.15,zMin:z-.35,zMax:z+.35},'trailing');
}
