import * as THREE from 'three';
import {MAP_SCALE,CEILING_HEIGHT,mapName,type MapId} from './game';

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
}
