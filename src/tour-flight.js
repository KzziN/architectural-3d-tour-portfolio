// Vertical travel always stays beyond the facade and its terraces.
export function windowRoute(from, destination) {
 const points=[];
 if(from.inside){
  points.push(...(from.egress||[]));
  const portal=from.portal||{inside:[13.6,3.375],outside:[17,3.375]};
  points.push({position:[portal.inside[0],from.y,portal.inside[1]],stage:'inside',duration:700});
  points.push({position:[portal.outside[0],from.y,portal.outside[1]],stage:'exit',duration:1000});
  points.push({position:[24,from.y,16],stage:'outside',duration:700});
 } else points.push({position:[24,from.position[1],16],stage:'outside',duration:900});
 if(destination.inside){
  const portal=destination.portal||{inside:[13.6,3.375],outside:[17,3.375]};
  points.push({position:[24,destination.y,16],stage:'outside',duration:2400});
  points.push({position:[portal.outside[0],destination.y,portal.outside[1]],stage:'prepare',duration:900});
  points.push({position:[portal.inside[0],destination.y,portal.inside[1]],stage:'inside',duration:1000});
  points.push(...(destination.ingress||[]));
  points.push({position:destination.position,stage:'arrive',duration:1200});
 } else {
  points.push({position:[24,from.y ?? from.position[1],24],stage:'outside',duration:700});
  points.push({position:destination.position,stage:'arrive',duration:2600});
 }
 return points;
}
