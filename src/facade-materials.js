import * as T from 'three';

// These local architectural textures show room depth behind the curtain wall.
// Lighting is baked into the facade map rather than hundreds of realtime lights.
function rand(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function rooms(columns,seed=0){
 const W=112,H=320,canvas=document.createElement('canvas');canvas.width=columns*W;canvas.height=H;const c=canvas.getContext('2d');
 const r=rand(seed*977+columns);
 for(let i=0;i<columns;i++){
  const x=i*W,roll=r(),lit=roll>.1,warm=roll>.55,cool=!warm&&lit&&r()>.7;
  const hue=cool?[196,214,226]:warm?[255,196,112]:[255,222,170];
  const level=lit?(.75+r()*.25):0;
  // Dark tinted glass base with a soft sky reflection fading toward the floor.
  c.fillStyle='#0b161b';c.fillRect(x,0,W,H);
  // Room volume: ceiling, back wall and floor as perspective trapezoids.
  const back=c.createLinearGradient(x,50,x,H-60);
  back.addColorStop(0,`rgba(${hue},${.82*level})`);back.addColorStop(1,`rgba(${hue.map(v=>v*.55)},${.55*level})`);
  c.fillStyle='#10191c';c.fillRect(x+4,6,W-8,H-12);
  c.fillStyle=back;c.fillRect(x+16,52,W-32,H-118);
  c.fillStyle=`rgba(${hue.map(v=>v*.7)},${.5*level})`;c.beginPath();c.moveTo(x+4,6);c.lineTo(x+W-4,6);c.lineTo(x+W-16,52);c.lineTo(x+16,52);c.fill();
  c.fillStyle=`rgba(${hue.map(v=>v*.42)},${.55*level})`;c.beginPath();c.moveTo(x+4,H-6);c.lineTo(x+W-4,H-6);c.lineTo(x+W-16,H-66);c.lineTo(x+16,H-66);c.fill();
  c.fillStyle=`rgba(${hue.map(v=>v*.5)},${.4*level})`;c.fillRect(x+4,6,12,H-12);c.fillRect(x+W-16,6,12,H-12);
  if(lit){
   // Recessed ceiling lights and their glow on the wall.
   const g=c.createRadialGradient(x+W/2,40,2,x+W/2,40,120);g.addColorStop(0,`rgba(255,236,190,${.85*level})`);g.addColorStop(1,'rgba(255,200,120,0)');c.fillStyle=g;c.fillRect(x,6,W,170);
   c.fillStyle=`rgba(255,246,222,${.95*level})`;c.fillRect(x+W/2-22,32,44,3);
   // Soft furniture silhouettes: desk, chair and a cabinet, not cartoon outlines.
   c.fillStyle='rgba(18,16,14,.78)';
   if(r()>.25){c.fillRect(x+24,H-112,W-48,5);c.fillRect(x+28,H-107,3,40);c.fillRect(x+W-31,H-107,3,40)}
   if(r()>.4){c.beginPath();c.ellipse(x+44+r()*20,H-132,9,13,0,0,6.3);c.fill();c.fillRect(x+40,H-120,9,24)}
   if(r()>.5)c.fillRect(x+W-34,92,20,H-190);
   if(r()>.55){c.fillStyle=`rgba(${hue.map(v=>v*.9)},.5)`;c.fillRect(x+20,60,W-40,16+r()*50)}
  }
  // Floor slab shadow line, mullion shadows and a vertical sky-reflection gradient.
  const sky=c.createLinearGradient(x,0,x,H);sky.addColorStop(0,'rgba(150,185,215,.3)');sky.addColorStop(.45,'rgba(70,105,130,.2)');sky.addColorStop(1,'rgba(10,22,30,.3)');c.fillStyle=sky;c.fillRect(x,0,W,H);
  const diag=c.createLinearGradient(x,0,x+W,H*.8);diag.addColorStop(0,'rgba(255,255,255,.14)');diag.addColorStop(.4,'rgba(255,255,255,0)');c.fillStyle=diag;c.fillRect(x,0,W,H);
  c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x,H-18,W,18);
 }
 // Fine grain and a little blur remove the flat-vector look.
 const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;const o=out.getContext('2d');o.filter='blur(.8px)';o.drawImage(canvas,0,0);o.filter='none';
 const img=o.getImageData(0,0,out.width,out.height),n=rand(seed+91);for(let k=0;k<img.data.length;k+=4){const d=(n()-.5)*9;img.data[k]+=d;img.data[k+1]+=d;img.data[k+2]+=d}o.putImageData(img,0,0);
 const texture=new T.CanvasTexture(out);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;return texture;
}
export function createFacadeMaterials(){
 const materials=[];
 const photo=new URLSearchParams(location.search).has('photo');
 const loader=new T.TextureLoader();
 const photoMap=(file,columns)=>{const t=loader.load(`/assets/pbr/${file}`);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.repeat.set(columns/32,2/32);return t};
 const glass=(columns,seed)=>{if(photo){const m=new T.MeshStandardMaterial({color:'#ffffff',map:photoMap('facade-photo.jpg',columns),emissiveMap:photoMap('facade-photo-emit.jpg',columns),emissive:'#ffffff',emissiveIntensity:.3,metalness:.25,roughness:.3,envMapIntensity:1.2});materials.push(m);return m}const map=rooms(columns,seed);const m=new T.MeshStandardMaterial({color:'#ffffff',map,emissiveMap:map,emissive:'#ffffff',emissiveIntensity:.3,metalness:.45,roughness:.09,envMapIntensity:1.6});materials.push(m);return m};
 const front=glass(23,1),side=glass(14,3),recessed=glass(15,2),wing=glass(8,4),podium=glass(26,3);
 const frame=new T.MeshStandardMaterial({color:'#1b1a18',metalness:.85,roughness:.34,envMapIntensity:1.2});
 const fascia=new T.MeshStandardMaterial({color:'#4a3524',metalness:.85,roughness:.38,envMapIntensity:1.5});
 const glow=new T.MeshBasicMaterial({color:'#ffbf66',toneMapped:false});
 const plantingGlow=new T.MeshStandardMaterial({color:'#817749',emissive:'#ffc46f',emissiveIntensity:.05,roughness:.75});
 function lighting(mode){const night=mode==='night',sunset=mode==='sunset';for(const m of materials){m.emissiveIntensity=night?1.25:sunset?.85:.3;m.envMapIntensity=night?.7:1.6}glow.color.set(night?'#ffc068':sunset?'#e7b977':'#8d7957');plantingGlow.emissiveIntensity=night?.65:sunset?.25:.05;}
 return {front,side,recessed,wing,podium,frame,fascia,glow,plantingGlow,lighting};
}

// Neighbouring towers: muted concrete with dark glazing bands, so they read as real buildings behind the Portfolio Tower.
export function createContextMaterials(){
 const make=(base,glass,seed)=>{const c=document.createElement('canvas');c.width=256;c.height=512;const x=c.getContext('2d'),r=rand(seed);
  x.fillStyle=base;x.fillRect(0,0,256,512);
  for(let row=0;row<8;row++)for(let col=0;col<5;col++){const px=col*51.2+6,py=row*64+10,lit=r()>.93;x.fillStyle=lit?'#a8875a':glass;x.fillRect(px,py,34,36);const g=x.createLinearGradient(px,py,px,py+36);g.addColorStop(0,'rgba(180,205,225,.35)');g.addColorStop(1,'rgba(0,0,0,.25)');x.fillStyle=g;x.fillRect(px,py,34,36)}
  const img=x.getImageData(0,0,256,512),n=rand(seed+5);for(let k=0;k<img.data.length;k+=4){const d=(n()-.5)*14;img.data[k]+=d;img.data[k+1]+=d;img.data[k+2]+=d}x.putImageData(img,0,0);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;const m=new T.MeshStandardMaterial({color:'#ffffff',map:t,roughness:.7,metalness:.05});m.name='ctx';return m};
 return [make('#7d7a73','#1d2a31',3),make('#5f6468','#16222a',8),make('#8b8478','#243239',13)];
}
