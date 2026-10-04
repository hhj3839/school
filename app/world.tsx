'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {brushContains,type BrushShape} from './brush';
import * as THREE from 'three';
import {solidRenderer} from './solid-renderer';
import {buildTheme} from './theme-world';
import {applyPoseRig,poseLift,poseCenter} from './pose-rig';
import {spectatorPlayers,roomBounds,areaWalls,hidingSpots,showHidingHints,mapGround,mapCover,MAP_SCALE,CEILING_HEIGHT,roomSettings,mapObstacles,WALLS,OBSTACLE_HEIGHTS,CAMO_PROPS,SHOT_RANGE,defaultPaint,makePlayer,PAINT_SIZE,type Room,type Player,type Pose} from './game';
export type SceneInput={dx:number;dy:number;dz?:number;yaw:number;pitch?:number};
export type ViewMode='move'|'paint'|'look';
export type SceneHandle={centerTarget:()=>string;shoot:()=>string;previewView:(side:number)=>void;resetView:()=>void;rotateView:(delta:number)=>void;zoom:(delta:number)=>void};
type Props={lateHint:{x:number;y:number;z:number}|null;previewDistance:number;lightMode:boolean;hints:boolean;room:Room|null;id:string;draft:string[];mode:ViewMode;color:string;brush:number;brushShape:BrushShape;input:MutableRefObject<SceneInput>;api:MutableRefObject<SceneHandle|null>;onPaint:(p:string[])=>void;onStroke:()=>void;preview:boolean;cameraLocked:boolean;watchId?:string;reveal:boolean;picking:boolean;onPick:(color:string)=>void};
function textureCanvas(pattern:'brick'|'wood'|'leaf'|'floor'|'blue'){
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d')!;
 if(pattern==='brick'){x.fillStyle='#d2c1a3';x.fillRect(0,0,256,256);for(let y=0;y<256;y+=32)for(let xx=-64;xx<256;xx+=64){x.fillStyle=((y+xx)/32)%3===0?'#98513d':'#ad6246';x.fillRect(xx+(y/32%2)*32+2,y+2,60,28);x.fillStyle='#bb735525';for(let i=0;i<8;i++)x.fillRect(xx+(y/32%2)*32+5+i*6,y+4,2,21);}}
 if(pattern==='wood'||pattern==='floor'){x.fillStyle=pattern==='wood'?'#ad8051':'#95856a';x.fillRect(0,0,256,256);for(let i=0;i<256;i+=32){x.fillStyle='#614a32';x.fillRect(i,0,2,256);x.fillStyle='#d6af7833';x.fillRect(i+4,0,3,256);for(let j=0;j<11;j++){x.strokeStyle='#5f43262b';x.beginPath();x.moveTo(i+6+j*2,0);x.bezierCurveTo(i+j*2,80,i+20+j,170,i+6+j*2,256);x.stroke();}}}
 if(pattern==='leaf'){x.fillStyle='#68875d';x.fillRect(0,0,256,256);for(let i=0;i<120;i++){x.fillStyle=i%2?'#3d5d42':'#789568';const xx=(i*67)%256,y=(i*43)%256;x.beginPath();x.ellipse(xx,y,14,7,i,0,7);x.fill();}}
 if(pattern==='blue'){x.fillStyle='#689399';x.fillRect(0,0,256,256);for(let i=0;i<256;i+=64){x.fillStyle='#3d666e';x.fillRect(i,0,3,256);for(let y=24;y<90;y+=9)x.fillRect(i+14,y,37,3);x.fillRect(i+47,134,5,20);}}
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;return tex;
}
function paintTexture(paint:string[]){const c=document.createElement('canvas');c.width=c.height=PAINT_SIZE;const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearFilter;updatePaint(c,texture,paint);return {canvas:c,texture};}
function updatePaint(c:HTMLCanvasElement,texture:THREE.CanvasTexture,paint:string[]){const ctx=c.getContext('2d')!,n=Math.sqrt(paint.length);for(let y=0;y<PAINT_SIZE;y++)for(let x=0;x<PAINT_SIZE;x++){ctx.fillStyle=paint[Math.floor(y*n/PAINT_SIZE)*n+Math.floor(x*n/PAINT_SIZE)]||'#f2eee2';ctx.fillRect(x,y,1,1);}texture.needsUpdate=true;}
function mannequin(p:Player){const group=new THREE.Group(),tex=paintTexture(p.paint),mat=new THREE.MeshBasicMaterial({map:tex.texture}),meshes:THREE.Mesh[]=[];
 function capsule(radius:number,length:number,x:number,y:number,z:number,rz=0){const g=new THREE.CapsuleGeometry(radius,length,5,10);const uv=g.attributes.uv,slot=meshes.length,col=slot%2,row=Math.floor(slot/2),bounds={left:col*64+2,right:col*64+61,top:row*42+2,bottom:row*42+39};for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,(bounds.left+.5+u*(bounds.right-bounds.left))/PAINT_SIZE,1-(bounds.top+.5+(1-v)*(bounds.bottom-bounds.top))/PAINT_SIZE);}uv.needsUpdate=true;const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.rotation.z=rz;m.userData.restPosition=m.position.clone();m.userData.restRotation=rz;m.userData.playerId=p.id;m.userData.paintBounds=bounds;meshes.push(m);group.add(m);return m;}
 capsule(.16,.1,0,1.52,0);capsule(.19,.37,0,1.03,0);capsule(.1,.46,-.105,.34,0);capsule(.1,.46,.105,.34,0);
 const left=capsule(.09,.44,-.26,1.04,0,-.12),right=capsule(.09,.44,.26,1.04,0,.12);
 group.position.set(p.x/100,0,p.y/100);group.rotation.y=p.angle||0;
 const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=64;const ctx=labelCanvas.getContext('2d')!;ctx.fillStyle='#18261be8';ctx.fillRect(0,0,256,64);ctx.fillStyle='#e1f5ae';ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillText(p.name.slice(0,12),128,42);const labelTexture=new THREE.CanvasTexture(labelCanvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture,depthTest:false}));label.scale.set(1.3,.325,1);label.position.y=1.95;group.add(label);label.visible=false;
 return {group,meshes,left,right,mat,label,labelTexture,...tex,paintKey:p.paint.join(''),paintRef:p.paint,pose:'stand' as Pose,poseKey:''};
}
function setPose(model:ReturnType<typeof mannequin>,pose:Pose,leftArm?:number,rightArm?:number){const key=pose+':'+leftArm+':'+rightArm;if(model.poseKey===key)return;model.poseKey=key;model.pose=pose;applyPoseRig(model.group,model.meshes,pose,leftArm,rightArm);}
export function WorldView(props:Props){const host=useRef<HTMLDivElement>(null),current=useRef(props),[failed,setFailed]=useState(false);current.current=props;
 useEffect(()=>{if(!host.current)return;const container=host.current;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:!props.lightMode,alpha:false});}catch{setFailed(true);return;}
 renderer.setPixelRatio(props.lightMode?1:Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=!props.lightMode;renderer.shadowMap.type=THREE.PCFSoftShadowMap;container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','3D 숨바꼭질 맵: 드래그로 둘러보고 캐릭터에 직접 색칠하세요');renderer.domElement.tabIndex=0;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#bcc6be');scene.fog=new THREE.Fog('#bcc6be',32,65);const camera=new THREE.PerspectiveCamera(58,1,.04,90);scene.add(new THREE.HemisphereLight('#ffefd4','#83908c',2));const sun=new THREE.DirectionalLight('#ffdfb2',2.4);sun.position.set(4,9,6);sun.castShadow=!props.lightMode;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;scene.add(sun);
 const blockers:THREE.Mesh[]=[],surfaces:THREE.Mesh[]=[],textures:THREE.Texture[]=[];
 function material(type:'brick'|'wood'|'leaf'|'floor'|'blue',rx=1,ry=1){const t=textureCanvas(type);t.repeat.set(rx,ry);textures.push(t);return new THREE.MeshStandardMaterial({map:t,roughness:1,metalness:0});}
 function box(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material,solid=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w*MAP_SCALE,h,d*MAP_SCALE),mat);m.position.set(x*MAP_SCALE,y,z*MAP_SCALE);m.receiveShadow=true;m.castShadow=true;scene.add(m);surfaces.push(m);if(solid)blockers.push(m);return m;}
 const mapId=props.room?roomSettings(props.room).mapId:'art';
 if(mapId==='art'){
 box(9,-.08,5.7,18,.16,11.4,material('floor',7.5,4.5));
 box(9,CEILING_HEIGHT/2,0,18,CEILING_HEIGHT,.15,material('brick',9,3.3));box(0,CEILING_HEIGHT/2,5.7,.15,CEILING_HEIGHT,11.4,material('wood',1,3.2));box(18,CEILING_HEIGHT/2,5.7,.15,CEILING_HEIGHT,11.4,material('brick',5.7,3.3));box(9,CEILING_HEIGHT/2,11.4,18,CEILING_HEIGHT,.15,material('wood',9,3.3));
 box(9,CEILING_HEIGHT+.08,5.7,18,.16,11.4,material('wood',6,4));
 WALLS.slice(0,WALLS.length-CAMO_PROPS.length).forEach((w,i)=>{const h=OBSTACLE_HEIGHTS[i];box((w.x+w.w/2)/100,h/2,(w.y+w.h/2)/100,w.w/100,h,w.h/100,material(i===0?'brick':i===2?'blue':i===4||i===5?'leaf':'wood',i===0?1.4:1,Math.max(1,h/2)));});
 // Functional camouflage backdrops mounted on the room walls.
 box(1.3,1.4,.11,1.7,2.5,.04,material('leaf',1,1.5),false);box(9,1.1,.12,1.5,2.1,.05,material('blue',1,1),false);
 // A wall bookshelf gives players several adjacent colours and lines to match.
 const flat=(color:string)=>new THREE.MeshBasicMaterial({color});
 const shelf=flat('#5c422d');
 box(6.0,1.35,.11,3.6,2.65,.04,flat('#302a24'),false);
 for(const y of [.08,.91,1.74,2.61])box(6,y,.18,3.65,.07,.15,shelf,false);
 for(const x of [4.18,6,7.82])box(x,1.35,.17,.08,2.7,.13,shelf,false);
 const bookColors=['#923f37','#dbba79','#436966','#d9d5bb','#536179','#694b39'];
 for(let row=0;row<3;row++)for(let i=0;i<17;i++){const h=.46+(i%4)*.075,x=4.36+i*.2,y=.13+row*.83+h/2,col=bookColors[(i+row*2)%bookColors.length];box(x,y,.20,.15,h,.12,flat(col),false);box(x,y+h*.28,.267,.11,.025,.008,flat('#e7d9b2'),false);box(x,y-h*.25,.267,.11,.02,.008,flat('#302a24'),false);}
 // Original framed artwork: simple stripes and a mountain silhouette for freehand camouflage.
 box(10.8,1.65,.13,1.55,2.35,.12,flat('#715333'),false);
 box(10.8,1.65,.20,1.35,2.15,.02,flat('#d8c8a3'),false);
 for(let i=0;i<8;i++)box(10.24+i*.16,1.27+i%3*.1,.22,.16,.95+i%3*.2,.02,flat(i%2?'#617768':'#43574e'),false);
 // Stacked books sit on the existing low cabinet and do not add invisible collision walls.
 for(let i=0;i<5;i++)box(1.67+(i%2)*.04,.94+i*.09,5.42,.7,.075,.32,flat(bookColors[i]),false);
 // High wall shelves and artwork provide reachable camouflage at several heights.
 for(const cx of [6,13.8]){
 box(cx,4.3,.12,3.6,3.5,.08,flat('#302a24'),false);
 for(const y of [2.7,3.75,4.8,5.85])box(cx,y,.24,3.7,.09,.28,shelf,false);
 for(let row=0;row<3;row++)for(let j=0;j<12;j++){const h=.65+(j%3)*.1;box(cx-1.6+j*.28,2.76+row*1.05+h/2,.26,.22,h,.2,flat(bookColors[(j+row)%6]),false);}
 }
 box(17.87,4.2,8.3,.12,2.6,2.8,flat('#715333'),false);
 box(17.79,4.2,8.3,.03,2.4,2.6,flat('#d8c8a3'),false);
 for(let i=0;i<8;i++)box(17.76,4.2,7.2+i*.3,.025,2.25,.14,flat(i%2?'#436966':'#dbba79'),false);
 // Clear two-colour backdrops let beginners camouflage with freehand paint.
 box(3.2,1.4,.13,1.8,2.5,.08,flat('#248354'),false);
 box(3.2,1.25,.19,.34,.78,.02,flat('#f2eee2'),false);
 box(3.2,1.93,.19,.33,.33,.02,flat('#f2eee2'),false);
 box(2.98,.59,.19,.15,.62,.02,flat('#f2eee2'),false);box(3.42,.59,.19,.15,.62,.02,flat('#f2eee2'),false);
 box(3.2,.26,.2,1.4,.13,.03,flat('#f2eee2'),false);
 // Curtain stripes are flat against the far wall, leaving the walkway open.
 const stripes=['#436966','#dbba79','#923f37','#d9d5bb'];
 for(let i=0;i<16;i++)box(7.1+i*.24,1.55,11.25,.24,3.1,.08,flat(stripes[i%4]),false);
 box(8.9,3.17,11.2,4.1,.1,.18,shelf,false);
 // Solid props use exactly the same footprint and height as server collision and sight lines.
 const trim=new THREE.MeshStandardMaterial({color:'#4c4a3c'});for(let z=.8;z<11.4;z+=2.2){box(.13,6.1,z,.12,.14,1.8,trim,false);box(17.87,6.1,z,.12,.14,1.8,trim,false);}box(9,6.35,5.7,.17,.18,11.4,trim,false);

 // Reachable upper gallery: large, flat camouflage panels at the new heights.
 for(let i=0;i<7;i++){box(1.4+i*2.5,9,.13,2,3.6,.08,flat(bookColors[i%6]),false);for(let j=0;j<4;j++)box(.65+i*2.5+j*.45,9,.19,.13,3.5,.04,flat(bookColors[(i+j+2)%6]),false);}
 }else{buildTheme(mapId,scene,box,textures);}
 const drawSolids=solidRenderer(scene,surfaces,blockers);
 drawSolids(mapGround(mapId).filter(o=>mapId!=='art'||o.kind!=='art'),true);
 drawSolids(mapCover(mapId));
 const boundaryParts=areaWalls(props.room);drawSolids(boundaryParts);
 for(const wall of boundaryParts){
  const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d')!;ctx.fillStyle='#f4d572';ctx.fillRect(0,0,512,128);ctx.fillStyle='#263627';ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.fillText('여기까지 놀이 구역',256,78);const tex=new THREE.CanvasTexture(cv);textures.push(tex);const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});const sign=new THREE.Mesh(new THREE.PlaneGeometry(4,.95),mat);sign.position.set((wall.x+wall.w/2)/100,2.6,(wall.y+wall.h/2)/100);if(wall.w===16){sign.rotation.y=-Math.PI/2;sign.position.x=wall.x/100-.02;}else sign.position.z=wall.y/100-.02;scene.add(sign);
 }
 const playBounds=roomBounds(props.room);
 const hintGroup=new THREE.Group();scene.add(hintGroup);
 for(const [i,spot] of hidingSpots(mapId).filter(s=>s.x<playBounds.width-28&&s.y<playBounds.height-28).entries()){
  const cv=document.createElement('canvas');cv.width=256;cv.height=128;const ctx=cv.getContext('2d')!;ctx.fillStyle='#d0ec92';ctx.beginPath();ctx.roundRect(4,4,248,120,24);ctx.fill();ctx.fillStyle='#193526';ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.fillText((i+1)+' · '+spot.label,128,58);ctx.font='22px sans-serif';ctx.fillText('나에게만 보이는 안내',128,96);const tex=new THREE.CanvasTexture(cv);textures.push(tex);const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,depthWrite:false,opacity:.88,transparent:true}));marker.position.set(spot.x/100,spot.elevation+1.3,spot.y/100);marker.scale.set(2.4,1.2,1);marker.renderOrder=10;hintGroup.add(marker);
 }
 const models=new Map<string,ReturnType<typeof mannequin>>(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let yaw=0,pitch=.16,distance=3.1,last=performance.now(),frame=0,down=false,lastX=0,lastY=0,startX=0,startY=0,paintDrag=false,button=0;let activePointer:number|null=null;let previousPaintPoint:{u:number;v:number;mesh:number}|null=null;let wasPreview=false;let targetCenter=new THREE.Vector3(5.8,1,1.1);
 const lateMarker=new THREE.Mesh(new THREE.TorusGeometry(2.8,.08,6,32),new THREE.MeshBasicMaterial({color:'#ffe28a',transparent:true,opacity:.7,depthTest:false,depthWrite:false}));lateMarker.rotation.x=Math.PI/2;lateMarker.visible=false;scene.add(lateMarker);
 function cast(clientX:number,clientY:number){const rect=renderer.domElement.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects([...surfaces,...Array.from(models.values()).filter(m=>m.group.visible).flatMap(m=>m.meshes)],false);}
 function targetAt(x:number,y:number){const hits=cast(x,y),hit=hits[0];return hit?.object.userData.playerId||'';}
 // A lightweight toy blaster follows the first-person camera; it never blocks aiming rays.
 scene.add(camera);const blaster=new THREE.Group();camera.add(blaster);blaster.position.set(.27,-.24,-.43);
 const gunMaterial=new THREE.MeshBasicMaterial({color:'#45c7d1'}),orange=new THREE.MeshBasicMaterial({color:'#ffb94f'});
 function gunPart(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material){const m=new THREE.Mesh(new THREE.BoxGeometry(w*MAP_SCALE,h,d*MAP_SCALE),mat);m.position.set(x*MAP_SCALE,y,z*MAP_SCALE);blaster.add(m);return m;}
 gunPart(.17,.15,.34,0,0,0,gunMaterial);gunPart(.12,.23,.1,0,-.14,.08,orange);gunPart(.2,.12,.08,0,.01,-.21,orange);gunPart(.05,.05,.08,0,.1,-.06,orange);
 const muzzle=new THREE.Mesh(new THREE.SphereGeometry(.065,8,6),new THREE.MeshBasicMaterial({color:'#fff5ad',transparent:true,opacity:.9}));muzzle.position.set(0,.01,-.28);blaster.add(muzzle);muzzle.visible=false;
 const beam=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:'#ffdc72',transparent:true,opacity:.85}));scene.add(beam);beam.visible=false;let shotAt=-1000;
 function shoot(){const c=current.current,r=c.room,p=r?.players.find(p=>p.id===c.id);if(r?.phase!=='seek'||r.paused||p?.role!=='seeker'||p.caught)return '';const rect=renderer.domElement.getBoundingClientRect(),hit=cast(rect.left+rect.width/2,rect.top+rect.height/2)[0];const destination=hit&&hit.distance<=SHOT_RANGE/100?hit.point:ray.ray.at(SHOT_RANGE/100,new THREE.Vector3());const source=muzzle.getWorldPosition(new THREE.Vector3());const pos=beam.geometry.getAttribute('position');pos.setXYZ(0,source.x,source.y,source.z);pos.setXYZ(1,destination.x,destination.y,destination.z);pos.needsUpdate=true;beam.geometry.computeBoundingSphere();shotAt=performance.now();return hit&&hit.distance<=SHOT_RANGE/100?hit.object.userData.playerId||'':'';}
 props.api.current={shoot,previewView:(side)=>{yaw=(current.current.room?.players.find(p=>p.id===current.current.id)?.angle||0)+side;},centerTarget:()=>{const rect=renderer.domElement.getBoundingClientRect();return targetAt(rect.left+rect.width/2,rect.top+rect.height/2);},resetView:()=>{yaw=current.current.preview?(current.current.room?.players.find(p=>p.id===current.current.id)?.angle||0):0;pitch=.16;distance=3.1;},rotateView:(delta)=>{yaw+=delta;previousPaintPoint=null;},zoom:(delta)=>{distance=Math.max(1.4,Math.min(5,distance+delta));}};
 function brushAt(x:number,y:number){
 const c=current.current,hit=cast(x,y)[0];
 if(!hit||hit.object.userData.playerId!==c.id||!hit.uv){previousPaintPoint=null;return false;}
 const p=[...c.draft],n=Math.sqrt(p.length),u=Math.max(0,Math.min(n-1,Math.floor(hit.uv.x*n))),v=Math.max(0,Math.min(n-1,Math.floor((1-hit.uv.y)*n))),bounds=hit.object.userData.paintBounds;
 // Never connect strokes across separate limbs, missed surfaces, or the back UV seam.
 const last=previousPaintPoint,prev=last&&last.mesh===hit.object.id&&Math.abs(u-last.u)<(bounds.right-bounds.left)/2?last:null;
 const steps=prev?Math.max(1,Math.ceil(Math.hypot(u-prev.u,v-prev.v))):1;
 for(let s=1;s<=steps;s++){const pu=prev?Math.round(prev.u+(u-prev.u)*s/steps):u,pv=prev?Math.round(prev.v+(v-prev.v)*s/steps):v;for(let yy=-c.brush;yy<=c.brush;yy++)for(let xx=-c.brush;xx<=c.brush;xx++)if(brushContains(c.brushShape,xx,yy,c.brush)&&pu+xx>=bounds.left&&pu+xx<=bounds.right&&pv+yy>=bounds.top&&pv+yy<=bounds.bottom)p[(pv+yy)*n+pu+xx]=c.color;}
 previousPaintPoint={u,v,mesh:hit.object.id};c.onPaint(p);current.current={...c,draft:p};return true;
 }
 function sampleColor(x:number,y:number){
 const rect=renderer.domElement.getBoundingClientRect(),target=new THREE.WebGLRenderTarget(1,1);target.texture.colorSpace=THREE.SRGBColorSpace;
 const pixel=new Uint8Array(4);
 try{camera.setViewOffset(rect.width,rect.height,Math.floor(x-rect.left),Math.floor(y-rect.top),1,1);renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,1,1,pixel);current.current.onPick('#'+Array.from(pixel.slice(0,3),v=>v.toString(16).padStart(2,'0')).join(''));}
 finally{renderer.setRenderTarget(null);camera.clearViewOffset();target.dispose();renderer.render(scene,camera);}
 }
 function pointerDown(e:PointerEvent){if(activePointer!==null)return;activePointer=e.pointerId;if(current.current.picking&&e.button===0){sampleColor(e.clientX,e.clientY);activePointer=null;return;}renderer.domElement.focus();renderer.domElement.setPointerCapture(e.pointerId);down=true;button=e.button;lastX=startX=e.clientX;lastY=startY=e.clientY;paintDrag=false;previousPaintPoint=null;if(current.current.mode==='paint'&&e.button!==2&&targetAt(e.clientX,e.clientY)===current.current.id){current.current.onStroke();paintDrag=brushAt(e.clientX,e.clientY);}}
 function pointerMove(e:PointerEvent){if(!down||e.pointerId!==activePointer)return;if(current.current.room?.players.find(p=>p.id===current.current.id)?.caught)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(paintDrag)brushAt(e.clientX,e.clientY);else if(!(current.current.cameraLocked&&current.current.mode==='paint')){const aiming=current.current.room?.phase==='seek'&&current.current.room?.players.find(p=>p.id===current.current.id)?.role==='seeker';yaw-=dx*(aiming?.0035:.006);pitch=Math.max(-.35,Math.min(.95,pitch+dy*(aiming?.0025:.004)));}}
 function pointerUp(e:PointerEvent){if(e.pointerId!==activePointer)return;activePointer=null;down=false;paintDrag=false;}
 function wheel(e:WheelEvent){e.preventDefault();distance=Math.max(1.4,Math.min(5,distance+e.deltaY*.003));}
 function context(e:Event){e.preventDefault();}const canvas=renderer.domElement;canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);const cancelPointer=(e:PointerEvent)=>{if(e.pointerId===activePointer){activePointer=null;down=false;paintDrag=false;previousPaintPoint=null;}};canvas.addEventListener('pointercancel',cancelPointer);canvas.addEventListener('lostpointercapture',cancelPointer);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('contextmenu',context);
 const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(container);
 const previewBase=makePlayer('preview','나',0);
 let renderedAt=0;
 function render(time:number){if((document.hidden&&time-renderedAt<500)||(current.current.lightMode&&time-renderedAt<1000/30)){frame=requestAnimationFrame(render);return;}renderedAt=time;const dt=Math.min(.1,(time-last)/1000);last=time;const c=current.current,r=c.room,self=r?.players.find(p=>p.id===c.id);const previewPlayer={...previewBase,id:c.id,x:585,y:220,angle:0,pose:'arms' as Pose,paint:c.draft};const players=r?.players||[previewPlayer];hintGroup.visible=showHidingHints(r,c.id,c.hints,c.preview);if(hintGroup.visible&&self){const closest=[...hintGroup.children].sort((a,b)=>a.position.distanceToSquared(new THREE.Vector3(self.x/100,(self.elevation||0)+1,self.y/100))-b.position.distanceToSquared(new THREE.Vector3(self.x/100,(self.elevation||0)+1,self.y/100))).slice(0,2);hintGroup.children.forEach(o=>o.visible=closest.includes(o));}
 for(const [key,m] of models)if(!players.some(p=>p.id===key)){scene.remove(m.group);m.meshes.forEach(o=>o.geometry.dispose());m.mat.dispose();m.texture.dispose();m.label.material.dispose();m.labelTexture.dispose();models.delete(key);}
 for(const p of players){let m=models.get(p.id);if(!m){m=mannequin(p);models.set(p.id,m);scene.add(m.group);}const texture=p.id===c.id&&!c.reveal&&(!r||['lobby','paint','hide','result'].includes(r.phase))?c.draft:p.paint;if(texture!==m.paintRef){const key=texture.join('');if(key!==m.paintKey){updatePaint(m.canvas,m.texture,texture);m.paintKey=key;}m.paintRef=texture;}setPose(m,p.pose||'stand',p.leftArm,p.rightArm);m.label.visible=c.reveal&&p.role==='hider'&&p.id===c.watchId;m.group.position.lerp(new THREE.Vector3(p.x/100,poseLift(p.pose)+(p.elevation||0),p.y/100),Math.min(1,dt*14));m.group.rotation.y=p.angle||0;m.group.visible=!p.hidden&&!!p.x&&(!p.caught||c.reveal)&&!(p.id===(c.watchId||c.id)&&p.role==='seeker'&&r?.phase==='seek'&&!c.preview);}
 const observing=!!self?.caught&&r?.phase==='seek',seekers=r?spectatorPlayers(r):[];const mine=(observing?(seekers.find(p=>p.id===c.watchId)||seekers[0]):c.watchId?r?.players.find(p=>p.id===c.watchId):undefined)||self||previewPlayer;if(observing){yaw=mine.viewYaw??((mine.angle||0)+Math.PI);pitch=mine.viewPitch??.16;}if(c.preview&&!wasPreview)yaw=mine.angle||0;wasPreview=c.preview;const first=mine.role==='seeker'&&r?.phase==='seek'&&!c.preview;targetCenter.lerp(new THREE.Vector3(mine.x/100,(first?1.48:poseCenter(mine.pose))+(mine.elevation||0),mine.y/100),Math.min(1,dt*12));c.input.current.yaw=yaw;c.input.current.pitch=pitch;lateMarker.visible=!!c.lateHint&&(self?.role==='seeker'||observing);if(c.lateHint){lateMarker.position.set(c.lateHint.x/100,c.lateHint.z,c.lateHint.y/100);lateMarker.scale.setScalar(1+.12*Math.sin(time/180));}
 if(first){camera.position.copy(targetCenter);camera.lookAt(targetCenter.clone().add(new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch))));}
 else if(c.preview){const eye=new THREE.Vector3(mine.x/100,1.48,mine.y/100),dir=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));ray.set(eye,dir);const obstruction=ray.intersectObjects(blockers,false).find(h=>h.distance>.08);const dist=obstruction?Math.min(c.previewDistance,Math.max(.3,obstruction.distance-.2)):c.previewDistance;camera.position.copy(eye).addScaledVector(dir,dist);camera.lookAt(targetCenter);}
 else{const aim=targetCenter.clone(),viewPitch=pitch,viewDistance=distance,dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(viewPitch),Math.sin(viewPitch),Math.cos(yaw)*Math.cos(viewPitch));ray.set(aim,dir);const obstruction=ray.intersectObjects(blockers,false).find(h=>h.distance>.08);const dist=obstruction?Math.min(viewDistance,Math.max(.25,obstruction.distance-.15)):viewDistance;camera.position.copy(aim).addScaledVector(dir,dist);camera.lookAt(aim);}
 blaster.visible=first&&!c.reveal&&!r?.paused;const firing=time-shotAt<130;muzzle.visible=firing;beam.visible=firing&&blaster.visible;blaster.position.z=-.43+(firing?.045:0);renderer.render(scene,camera);frame=requestAnimationFrame(render);}
 frame=requestAnimationFrame(render);return()=>{cancelAnimationFrame(frame);resize.disconnect();props.api.current=null;models.forEach(m=>{m.mat.dispose();m.texture.dispose();m.label.material.dispose();m.labelTexture.dispose();});scene.traverse(o=>{if(o instanceof THREE.Sprite)o.material.dispose();if(o instanceof THREE.Mesh){o.geometry.dispose();if(!Array.isArray(o.material))o.material.dispose();}});beam.geometry.dispose();beam.material.dispose();textures.forEach(t=>t.dispose());renderer.dispose();canvas.remove();};
 },[]);
 return <div className={"world-canvas "+(props.picking?'picking':props.mode==='paint'?'painting':'')} ref={host}>{failed&&<div className="graphics-error">이 브라우저에서 3D 화면을 열 수 없어요. WebGL을 지원하는 최신 브라우저로 열어 주세요.</div>}</div>;
}




