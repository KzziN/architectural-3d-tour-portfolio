// Visible features in the marketing perspectives. Dimensions are visual approximations.
export function referenceDetails(floors,box,facade,mats){
 const b=facade.bronze;
 function surround(x1,x2,z1,z2,start,end){
  const bottom=floors[start].y-.08,top=floors[end].y+3.3,height=top-bottom,w=x2-x1,d=z2-z1;
  for(const yy of[bottom,top]){box(w+.45,.38,d+.45,(x1+x2)/2,yy,(z1+z2)/2,b);}
  for(const x of[x1,x2]){box(.32,height,.42,x,(top+bottom)/2,z2+.07,b);box(.34,height,.34,x,(top+bottom)/2,z1,b)}
  box(.42,height,.32,x2+.07,(top+bottom)/2,z1,b);
 }
 // Lower four floors, middle three floors, upper front volume: portfolio reference section.
 surround(-14.5,14.5,-8.5,8.5,5,8);
 surround(-14.5,14.5,-8.5,8.5,10,12);
 surround(-5,14.5,1,8.5,14,22);
 // Street podium: broad fascia, projecting canopy and vertical screening seen in the renders.
 for(const yy of[.2,4,7.3,10.6]){box(33.4,.38,.55,0,yy,11.65,b);box(.55,.38,23.4,16.65,yy,0,b)}
 for(const x of[-16.5,16.5])box(.38,10.6,.5,x,5.3,11.65,b);
 box(22,.2,2.25,-2.8,3.85,12.35,b);
 box(.22,.2,9.4,16.8,3.85,6.8,b);
 // Brises occupy the opaque/screened portions; no unrelated facade ornament.
 for(let x=6.4;x<12.6;x+=.22)box(.075,9.75,.28,x,5.05,11.48,b);
 for(let z=6.8;z<11.3;z+=.22)box(.28,9.75,.075,16.48,5.05,z,b);
 box(.3,10.4,1.2,-16.55,5.2,11.1,b);
}
