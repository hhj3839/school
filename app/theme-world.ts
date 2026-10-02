import * as THREE from 'three';
import {MAP_SCALE,CEILING_HEIGHT,mapObstacles,mapName,type MapId} from './game';

// Layout coordinates use the original planning grid. Both the scene builder and
// server expand that grid by MAP_SCALE, leaving character and brush size alone.
export function buildTheme(mapId:MapId,scene:THREE.Scene,box:(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material,solid?:boolean)=>THREE.Mesh,textures:THREE.Texture[]){
 const forest=mapId==='forest',ocean=mapId==='ocean',museum=mapId==='museum';
 const palette=new Map<string,THREE.Material>();
 const flat=(color:string)=>{if(!palette.has(color))palette.set(color,new THREE.MeshBasicMaterial({color}));return palette.get(color)!;};
 const sky=ocean?'#378aa1':forest?'#b4dced':museum?'#d6cebb':'#b5e4fa';
 scene.background=new THREE.Color(sky);scene.fog=new THREE.Fog(sky,32,65);
 const floor=ocean?'#d8c18c':forest?'#7d985a':museum?'#d8d1bd':'#dbbd94';
 box(9,-.08,5.7,18,.16,11.4,flat(floor));
 const wall=flat(ocean?'#267b91':forest?'#426849':museum?'#eee3cb':'#7db4c8');
 for(const [x,z,w,d] of [[9,0,18,.15],[0,5.7,.15,11.4],[18,5.7,.15,11.4],[9,11.4,18,.15]])box(x,CEILING_HEIGHT/2,z,w,CEILING_HEIGHT,d,wall);
 if(museum)box(9,CEILING_HEIGHT+.08,5.7,18,.16,11.4,flat('#ede8db'));
 // The start clearing and two crossing lanes stay open for twenty players.
 box(9,.008,6.95,17.5,.016,1.5,flat(ocean?'#ecd7a4':forest?'#b9ac7d':museum?'#a9b7ad':'#eacb74'),false);
 for(let i=0;i<18;i++){
  const x=.5+i;
  if(forest){box(x,5,.14,.28,10,.12,flat('#78532f'),false);box(x,9,.17,.75,4,.12,flat(i%2?'#3d5d42':'#68875d'),false);}
  else if(ocean){for(let j=0;j<3;j++)box(x,1+j*2,.13,.18,1.4,.08,flat(j%2?'#53afa6':'#358b73'),false);}
  else if(museum){box(x,6,.12,.12,11.6,.1,flat('#c6b58e'),false);}
  else{box(x,1.6,.12,.46,3.2,.1,flat(['#ed5353','#f0bd4c','#569be0','#70b65b'][i%4]),false);box(x,8.7,.14,.55,.5,.12,flat(['#f0bd4c','#ed5353'][i%2]),false);}
 }
 function sign(x:number,y:number,z:number,w:number,h:number,title:string,bg:string,fg='#fff8df'){
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const ctx=cv.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,512,256);ctx.strokeStyle=fg;ctx.lineWidth=12;ctx.strokeRect(14,14,484,228);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 62px sans-serif';ctx.fillText(title,256,130,460);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;textures.push(tex);box(x,y,z,w,h,.025,new THREE.MeshBasicMaterial({map:tex}),false);
 }
 sign(9,10.8,.13,4.4,1.3,mapName(mapId),ocean?'#164f72':forest?'#344e32':museum?'#705d45':'#b54159');
 for(const o of mapObstacles(mapId)){
  const x=(o.x+o.w/2)/100/MAP_SCALE,z=(o.y+o.h/2)/100/MAP_SCALE,w=o.w/100/MAP_SCALE,d=o.h/100/MAP_SCALE,h=o.height,front=z+d/2+.015;
  // A visible solid backdrop always matches the server's full collision bounds.
  box(x,h/2,z,w,h,d,flat(o.color));
  if(o.kind==='tree'||o.kind==='kelp'){
   box(x,h*.23,front,w*.66,h*.46,.025,flat(o.kind==='tree'?'#78532f':'#276956'),false);
   for(let j=0;j<4;j++)box(x+(j%2?-.18:.18)*w,h*(.48+j*.13),front+.01,w*.64,h*.1,.03,flat(j%2?'#789568':'#3d5d42'),false);
  }else if(o.kind==='tent'){
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([(x-w*.38)*MAP_SCALE,0,front*MAP_SCALE,(x+w*.38)*MAP_SCALE,0,front*MAP_SCALE,x*MAP_SCALE,h*.88,front*MAP_SCALE],3));g.computeVertexNormals();scene.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:'#263f37',side:THREE.DoubleSide})));
   box(x,h*.96,front,w,.07,.04,flat('#f2eee2'),false);
  }else if(o.kind==='wheel'){
   const radius=Math.min(w*MAP_SCALE*.43,h*.38),cy=h*.55;
   const wheel=new THREE.Mesh(new THREE.TorusGeometry(radius,.065,6,32),flat('#fff2d1'));wheel.position.set(x*MAP_SCALE,cy,(front+.05)*MAP_SCALE);scene.add(wheel);
   for(let i=0;i<8;i++){const a=i*Math.PI/4,spoke=new THREE.Mesh(new THREE.BoxGeometry(radius*2,.04,.04),flat('#fff2d1'));spoke.position.copy(wheel.position);spoke.rotation.z=a;scene.add(spoke);box(x+Math.cos(a)*radius/MAP_SCALE,cy+Math.sin(a)*radius,front+.09,.3,.36,.14,flat(['#f0bd4c','#ed5353','#70b65b','#b377ce'][i%4]),false);}
   sign(x,.48,front+.03,w*.9,.65,'대관람차','#355784');
  }else if(o.kind==='booth'||o.kind==='carousel'){
   for(let i=0;i<6;i++)box(x-w/2+w*(i+.5)/6,h*.87,front,w/6,h*.22,.05,flat(i%2?'#f2eee2':o.color),false);
   box(x,h*.46,front,w*.78,h*.45,.025,flat('#3e5963'),false);box(x,h*.23,front+.05,w,.12,.15,flat('#fff0ca'),false);
   sign(x,h*.67,front+.04,w*.84,h*.19,o.kind==='carousel'?'회전목마':'간식 가게','#875038');
  }else if(o.kind==='gift'||o.kind==='chest'){
   const gold=flat(o.kind==='chest'?'#edc86c':'#f2eee2');box(x,h/2,front,w*.12,h,.03,gold,false);box(x,h*.65,front,w,h*.09,.04,gold,false);box(x,h+.01,z,w*.12,.02,d,gold,false);
   if(o.kind==='chest'){box(x,h*.43,front+.02,w*.2,h*.22,.05,flat('#644627'),false);box(x,h*.43,front+.05,w*.055,h*.08,.02,gold,false);}
  }else if(o.kind==='ship'){
   for(let j=0;j<6;j++)box(x,h*(j+.5)/6,front,w,.035,.025,flat('#4d382d'),false);
   for(let j=0;j<3;j++){const port=new THREE.Mesh(new THREE.TorusGeometry(.22,.06,6,12),flat('#d2b075'));port.position.set((x-w*.3+j*w*.3)*MAP_SCALE,h*.63,front*MAP_SCALE+.04);scene.add(port);}
   sign(x,h*.2,front+.03,w*.75,.55,'탐험선','#4d382d');
  }else if(o.kind==='coral'){
   for(let j=0;j<5;j++)box(x-w*.4+j*w*.2,h*.45+(j%3)*h*.12,front,w*.09,h*(.35+j%2*.15),.04,flat(j%2?'#f3c6ac':'#b34f87'),false);
   box(x,h*.3,front,w*.82,h*.1,.06,flat('#f3c6ac'),false);
  }else if(o.kind==='column'){
   for(let j=0;j<5;j++)box(x-w*.4+j*w*.2,h/2,front,w*.07,h*.85,.04,flat('#f5ead4'),false);
   box(x,h*.96,front,w,h*.07,.06,flat('#ab9976'),false);box(x,h*.05,front,w,h*.1,.06,flat('#ab9976'),false);
  }else if(['painting','fossil','vase','exhibit'].includes(o.kind)){
   box(x,h*.59,front,w*.86,h*.68,.03,flat('#f1e8d1'),false);box(x,h*.13,front,w,.12,.08,flat('#705d45'),false);
   if(o.kind==='painting')for(let j=0;j<6;j++)box(x-w*.34+j*w*.135,h*.55+(j%3)*h*.06,front+.04,w*.12,h*(.3+j%2*.15),.03,flat(['#436966','#dbba79','#923f37'][j%3]),false);
   if(o.kind==='vase'){const vase=new THREE.Mesh(new THREE.CylinderGeometry(w*.18,w*.3,h*.46,12),flat(o.color));vase.position.set(x*MAP_SCALE,h*.57,(front+.05)*MAP_SCALE);vase.scale.z=.15;scene.add(vase);}
   if(o.kind==='fossil'){for(let j=0;j<6;j++){box(x-w*.32+j*w*.13,h*.6,front+.04,w*.07,h*.35,.04,flat('#897b61'),false);}box(x,h*.59,front+.06,w*.73,.07,.06,flat('#897b61'),false);}
   if(o.kind==='exhibit')for(let j=0;j<3;j++)box(x-w*.24+j*w*.24,h*.52,front+.04,w*.16,h*(.25+j*.08),.04,flat(['#ad8051','#68875d','#689399'][j]),false);
   sign(x,h*.13,front+.1,w*.78,h*.15,o.kind==='fossil'?'화석':o.kind==='vase'?'도자기':o.kind==='painting'?'그림':'유물','#705d45');
  }else if(o.kind==='blocks'){
   for(let j=1;j<5;j++)box(x,h*j/5,front,w,.08,.03,flat('#f2eee2'),false);
  }else if(o.kind==='log'){
   for(let j=0;j<4;j++)box(x,h*(j+.5)/4,front,w,.025,.025,flat('#4d382d'),false);
  }else{box(x-w*.2,h*.7,front,w*.3,h*.22,.025,flat(ocean?'#82b7b5':'#b5bbaa'),false);}
 }
}
