'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {coursePoint,TURNS} from './course';
import {START,RAFT,WALL_HEIGHT,GATES,PENDULUMS,BELTS,BOUNCERS,gateAngle,pendulum,MOVERS,moverX,spinnerAngle,FINISH,GAPS,SPINNERS,WALLS,PALETTE,platformX,raceTime,type RaceRoom} from './engine';
export function RaceScene({room,id,now}:{room:RaceRoom;id:string;now:number}){
 const host=useRef<HTMLDivElement>(null),live=useRef({room,id,now}),[failed,setFailed]=useState(false);live.current={room,id,now};
 useEffect(()=>{const el=host.current!;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{setFailed(true);return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#c0eaf3');scene.fog=new THREE.Fog('#c0eaf3',60,145);
 const camera=new THREE.PerspectiveCamera(48,1,.1,220);scene.add(new THREE.HemisphereLight('#ffffff','#91b9aa',2.5));const sun=new THREE.DirectionalLight('#fff5db',2.2);sun.position.set(-8,25,-10);scene.add(sun);
 const materials=new Map<string,THREE.MeshStandardMaterial>();const mat=(c:string)=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.75}));return materials.get(c)!;};
 function place(o:THREE.Object3D,x:number,y:number,z:number){const p=coursePoint(x,z);o.position.set(p.x,y,p.z);o.rotation.y=p.heading;}
 const geometries:THREE.BufferGeometry[]=[];function box(x:number,y:number,z:number,w:number,h:number,d:number,c:string,parent:THREE.Object3D=scene){const g=new THREE.BoxGeometry(w,h,d);geometries.push(g);const m=new THREE.Mesh(g,mat(c));if(parent===scene)place(m,x,y,z);else m.position.set(x,y,z);parent.add(m);return m;}
 function sphere(x:number,y:number,z:number,r:number,c:string,parent:THREE.Object3D){const g=new THREE.SphereGeometry(r,12,8);geometries.push(g);const m=new THREE.Mesh(g,mat(c));if(parent===scene)place(m,x,y,z);else m.position.set(x,y,z);parent.add(m);return m;}
 box(0,-6,80,350,.3,340,'#6bbfd6');
 function ribbon(a:number,b:number,left:number,right:number,low:number,high:number,color:string){const vertices:number[]=[];const quad=(v:number[][])=>{for(const i of [0,1,2,0,2,3])vertices.push(...v[i]);};const point=(x:number,y:number,z:number)=>{const p=coursePoint(x,z);return [p.x,y,p.z];};const n=Math.ceil(b-a);for(let i=0;i<n;i++){const z0=a+(b-a)*i/n,z1=a+(b-a)*(i+1)/n,l0=point(left,high,z0),r0=point(right,high,z0),l1=point(left,high,z1),r1=point(right,high,z1),lb0=point(left,low,z0),rb0=point(right,low,z0),lb1=point(left,low,z1),rb1=point(right,low,z1);quad([l0,l1,r1,r0]);quad([rb0,rb1,lb1,lb0]);quad([lb0,lb1,l1,l0]);quad([r0,r1,rb1,rb0]);if(i===0)quad([r0,rb0,lb0,l0]);if(i===n-1)quad([l1,lb1,rb1,r1]);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();geometries.push(g);scene.add(new THREE.Mesh(g,mat(color)));}
 const segments=[[-3,GAPS[0][0]],[GAPS[0][1],GAPS[1][0]],[GAPS[1][1],RAFT[0]],[RAFT[1],FINISH+8]];
 for(const [a,b] of segments){ribbon(a,b,-7,7,-1.2,0,'#ffe4ac');ribbon(a,b,-7,-6.7,0,.2,'#f6b39a');ribbon(a,b,6.7,7,0,.2,'#f6b39a');for(let z=a+1;z<b;z+=3)box(0,.008,z,13.6,.015,.06,'#e8c991');}
 // Direction chevrons are part of the track, including the approach to each bend.
 for(const turn of TURNS){for(let z=turn.start-4;z<turn.end;z+=6){if(GAPS.some(([a,b])=>z>a&&z<b))continue;const left=box(-.45,.04,z,.2,.05,1.3,'#fffdf0'),right=box(.45,.04,z,.2,.05,1.3,'#fffdf0');left.rotation.y+=.7;right.rotation.y-=.7;}const sign=new THREE.Group();place(sign,-8,0,turn.start-3);scene.add(sign);box(0,1.3,0,.18,2.6,.18,'#fffdf0',sign);box(0,2.6,0,2.4,1.4,.15,'#65b7c7',sign);box(0,2.6,-.1,1.5,.15,.08,'#fffdf0',sign);const tip=box(turn.angle>0?.6:-.6,2.6,-.1,.6,.6,.08,'#fffdf0',sign);tip.rotation.z=Math.PI/4;}
 for(const [a,b] of GAPS){box(0,.015,a-.3,14,.04,.4,'#f593a2');box(0,.015,b+.3,14,.04,.4,'#f593a2');}
 const raftZ=(RAFT[0]+RAFT[1])/2,raft=box(0,-.35,raftZ,5.6,.7,RAFT[1]-RAFT[0]+.2,'#9a91df');for(let z=-3;z<4;z+=2)box(0,.37,z,5.2,.04,.18,'#d4cef4',raft);
 function wall(x:number,z:number,w:number,moving=false){const group=new THREE.Group();place(group,x,0,z);scene.add(group);box(0,WALL_HEIGHT/2,0,w,WALL_HEIGHT,1.4,moving?'#9e92db':'#efa888',group);box(0,WALL_HEIGHT+.04,0,w,.08,1.4,moving?'#d9d2fc':'#ffe0c2',group);for(let y=.5;y<WALL_HEIGHT;y+=1)box(0,y,-.71,w,.12,.03,moving?'#c8bfee':'#ffcaac',group);return group;}
 WALLS.forEach(w=>wall(w.x,w.z,w.w));const movingWalls=MOVERS.map(z=>{box(0,.025,z,13,.05,1.6,'#d6caf1');return wall(0,z,5,true);});
 const doors=GATES.map(z=>{const g=new THREE.Group();place(g,0,0,z);scene.add(g);box(0,2.5,0,.4,5,.4,'#546f90',g);for(const x of [-3,3]){box(x,2.5,0,5.6,5,.4,'#71c9d2',g);box(x,2.5,-.23,5,.22,.04,'#defbfb',g);}return g;});
 const swings=PENDULUMS.map(z=>{box(-6.8,3.5,z,.35,7,.35,'#f1bd67');box(6.8,3.5,z,.35,7,.35,'#f1bd67');box(0,7,z,14,.35,.35,'#f1bd67');const ball=sphere(0,1.5,z,1.35,'#ed92b2',scene);const rope=box(0,4,z,.12,1,.12,'#647b88');return {ball,rope,z};});
 const belts=BELTS.map(b=>{box(0,.035,b.z,13.7,.07,b.d,'#66bfd5');const stripes=[];for(let i=0;i<7;i++){const stripe=new THREE.Group();place(stripe,i*2-6,.09,b.z);scene.add(stripe);const a=box(0,0,0,.13,.03,1.1,'#edfcff',stripe),c=box(0,0,0,.13,.03,1.1,'#edfcff',stripe);a.position.z=-.35;c.position.z=.35;a.rotation.y=-b.dir*.7;c.rotation.y=b.dir*.7;stripes.push(stripe);}return {b,stripes};});
 const beams=SPINNERS.map((z,i)=>{const pivot=new THREE.Group();place(pivot,0,.65,z);scene.add(pivot);box(0,0,0,12,.45,.55,i%2?'#9489d7':'#ef91aa',pivot);sphere(0,.05,0,.7,'#fff1b9',pivot);return pivot;});
 for(const z of BOUNCERS){box(0,.03,z,4.8,.08,2.8,'#84d4b9');box(0,.09,z,.5,.06,1.8,'#fff7d3');box(0,.09,z+ .5,1.7,.06,.4,'#fff7d3');}
 box(0,.015,START-1,14,.03,.8,'#9cdac8');
 for(let i=0;i<14;i++)for(let j=0;j<2;j++)box(i-6.5,.03,FINISH+j*.6,1,.05,.6,(i+j)%2?'#49647e':'#fffdf4');
 box(-6,2.6,FINISH,.5,5.2,.5,'#f7a6ab');box(6,2.6,FINISH,.5,5.2,.5,'#f7a6ab');box(0,5.2,FINISH,12.5,.8,.6,'#f7a6ab');
 for(let z=5;z<FINISH+6;z+=15){for(const x of [-11,11]){box(x,-1,z,4,1.5,4,'#97d5b5');box(x,.9,z,.2,2.4,.2,'#fff8dc');box(x-.7,1.7,z,1.4,.8,.12,z%2?'#f3be68':'#ac9fdd');}}
 const avatars=new Map<string,THREE.Group>();const projected=new THREE.Vector3();
 function avatar(key:string,color:number){const a=new THREE.Group(),c=PALETTE[color%PALETTE.length];sphere(0,.9,0,.65,c,a);sphere(0,1.6,0,.55,c,a);sphere(-.22,1.7,.46,.105,'#344e59',a);sphere(.22,1.7,.46,.105,'#344e59',a);sphere(-.3,.23,0,.23,'#fff8e8',a);sphere(.3,.23,0,.23,'#fff8e8',a);box(0,1.05,-.51,.8,.6,.2,'#fff2bd',a);scene.add(a);avatars.set(key,a);return a;}
 let raf=0;const resize=()=>{const {width,height}=el.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
 const render=()=>{const {room:r,id,now}=live.current,t=raceTime(r,now),me=r.players.find(p=>p.id===id)||r.players[0];
  beams.forEach((b,i)=>b.rotation.y=coursePoint(0,SPINNERS[i]).heading-spinnerAngle(t,SPINNERS[i]));place(raft,platformX(t),-.35,raftZ);movingWalls.forEach((w,i)=>place(w,moverX(t,MOVERS[i]),0,MOVERS[i]));
  doors.forEach((g,i)=>g.rotation.y=coursePoint(0,GATES[i]).heading-gateAngle(t,GATES[i]));
  swings.forEach(({ball,rope,z})=>{const p=pendulum(t,z);place(ball,p.x,p.y,z);const anchor=coursePoint(0,z),end=coursePoint(p.x,z);rope.position.set((anchor.x+end.x)/2,(p.y+7)/2,(anchor.z+end.z)/2);const delta=new THREE.Vector3(end.x-anchor.x,p.y-7,end.z-anchor.z);rope.scale.y=delta.length();rope.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());});
  belts.forEach(({b,stripes})=>stripes.forEach((s,i)=>place(s,((i*2+t*3.2*b.dir)%14+14)%14-7,.09,b.z)));
  for(const p of r.players){const a=avatars.get(p.id)||avatar(p.id,p.color);const cp=coursePoint(p.x,p.z),goal=new THREE.Vector3(cp.x,p.y,cp.z);if(a.userData.ready)a.position.lerp(goal,.38);else{a.position.copy(goal);a.userData.ready=true;}a.rotation.y=cp.heading+Math.sin(t*3+p.color)*.05;}
  for(const [key,a]of avatars)if(!r.players.some(p=>p.id===key)){scene.remove(a);avatars.delete(key);}
  if(me){const follow=me.finished?(r.players.find(p=>!p.finished)||me):me;const here=coursePoint(follow.x*.35,follow.z),ahead=coursePoint(follow.x*.25,follow.z+8),goal=new THREE.Vector3(here.x-Math.sin(here.heading)*20,18,here.z-Math.cos(here.heading)*20);if(!camera.userData.ready||camera.position.distanceTo(goal)>35){camera.position.copy(goal);camera.userData.ready=true;}else camera.position.lerp(goal,.16);camera.lookAt(ahead.x,0,ahead.z);}
  const named=new Set(r.players.filter(p=>p.id!==id).sort((a,b)=>Math.hypot(a.x-(me?.x||0),a.z-(me?.z||0))-Math.hypot(b.x-(me?.x||0),b.z-(me?.z||0))).slice(0,4).map(p=>p.id));named.add(id);
  camera.updateMatrixWorld();el.querySelectorAll<HTMLElement>('[data-racer]').forEach(label=>{const a=avatars.get(label.dataset.racer!);if(!a)return;projected.copy(a.position).add(new THREE.Vector3(0,2.7,0)).project(camera);label.style.display=!named.has(label.dataset.racer!)||Math.abs(projected.x)>1||Math.abs(projected.y)>1||projected.z>1?'none':'block';label.style.left=(projected.x*.5+.5)*el.clientWidth+'px';label.style.top=(-projected.y*.5+.5)*el.clientHeight+'px';});
  renderer.render(scene,camera);raf=requestAnimationFrame(render);
 };raf=requestAnimationFrame(render);const lost=(e:Event)=>{e.preventDefault();setFailed(true);};renderer.domElement.addEventListener('webglcontextlost',lost);
 return()=>{cancelAnimationFrame(raf);observer.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="race-scene" ref={host} role="img" aria-label="세 개의 커브가 있는 바다 위 장애물 달리기 코스. 이동 패드와 점프 버튼으로 달려요.">{room.players.map(p=><span key={p.id} data-racer={p.id} className={'racer-label '+(p.id===id?'mine':'')}>{p.name}{p.id===id?' · 나':''}{p.finished?' ✓':''}</span>)}{failed&&<div className="race-overlay"><strong>게임 화면을 다시 열어 주세요</strong><p>3D 화면을 표시하지 못했어요. 나갔다가 다시 들어와 주세요.</p></div>}</div>;
}
