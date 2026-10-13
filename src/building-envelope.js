// Approximate coordinates traced from portfolio reference; shared by exterior and interior.
export function envelope(f){
 const podium=f.id<=3,upper=f.type==='upper',recessed=['C','D'].includes(f.type),balcony=f.type==='B',conference=f.type==='conference';
 const front=conference?5.6:balcony?7.3:8.5,right=conference?13.2:balcony?13.3:14.5;
 const fronts=upper?[{x1:-4.8,x2:14.5,z:8.5}]:recessed?[{x1:-14.5,x2:-5,z:7.35},{x1:-5,x2:14.5,z:8.5}]:[{x1:podium?-16.5:-14.5,x2:podium?16.5:right,z:podium?11.5:front}];
 const sides=upper?[{x:14.5,z1:1,z2:8.5,opaque:false},{x:-4.8,z1:1,z2:8.5,opaque:false}]:recessed?[{x:14.5,z1:1,z2:8.5,opaque:false},{x:13.5,z1:-8.5,z2:1,opaque:true},{x:-14.5,z1:-8.5,z2:7.35,opaque:true}]:[{x:right,z1:podium?-11.5:-8.5,z2:podium?11.5:front,opaque:false},{x:podium?-16.5:-14.5,z1:podium?-11.5:-8.5,z2:podium?11.5:front,opaque:true}];
 const slabs=upper?[{x1:-4.8,x2:14.5,z1:1,z2:8.5}]:recessed?[{x1:-14.5,x2:-5,z1:-8.5,z2:7.35},{x1:-5,x2:14.5,z1:1,z2:8.5},{x1:-5,x2:13.5,z1:-8.5,z2:1}]:[{x1:podium?-16.5:-14.5,x2:podium?16.5:14.5,z1:podium?-11.5:-8.5,z2:podium?11.5:8.5}];
 return{fronts,sides,slabs,right,front,upper,recessed,balcony,conference};
}
