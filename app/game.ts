import {groundParts} from './ground-parts';
import {createCover,coverContains,coverOverlaps} from './cover-layout';
export const MAP_SCALE=Math.sqrt(3);
export const W=1800*MAP_SCALE,H=1140*MAP_SCALE,SPEED=250,PAINT_SIZE=128;
export const SHOT_COOLDOWN=800,SHOT_RANGE=750,MAGAZINE=3,RELOAD_MS=3000;
export function ammunition(p:Player,now:number){const wait=Math.max(0,(p.reloadUntil||0)-now);return {remaining:wait?0:(p.reloadUntil?MAGAZINE:MAGAZINE-(p.shots||0)),wait};}
export function finalHint(r:Room,now:number){const left=r.end-now;if(r.phase!=='seek'||r.paused||left<=0||left>30000||left%10000<8000)return null;const hiders=r.players.filter(p=>p.role==='hider'&&!p.caught);if(!hiders.length)return null;const p=hiders[Math.floor(left/10000)%hiders.length];const bounds=roomBounds(r);return {x:Math.min(bounds.width-100,Math.max(100,Math.floor(p.x/400)*400+200)),y:Math.min(bounds.height-100,Math.max(100,Math.floor(p.y/400)*400+200)),z:Math.floor((p.elevation||0)/3)*3+1.5};}
export function spectatorPlayers(r:Room){return r.players.filter(p=>p.role==='seeker'&&!p.caught);}
export const COLORS=['#ad6246','#78442f','#d2c1a3','#e0d9c8','#68875d','#3d5d42','#ad8051','#78532f','#689399','#3d666e','#536882','#f2eee2','#ffffff','#171717','#ed5353','#f0bd4c','#70b65b','#569be0','#b377ce','#eb89ac'];
export const ZONES=[{x:0,y:0,w:W,h:H,c:'#b5aa8c',name:'오래된 미술실'}];
export const CAMO_PROPS=[{x:1120,y:740,w:100,h:75,height:1.1,kind:'crates'},{x:180,y:770,w:65,h:65,height:1.65,kind:'plant'},{x:1550,y:420,w:70,h:65,height:1.5,kind:'plant'},{x:790,y:920,w:100,h:70,height:1.1,kind:'books'}] as const;
export const WALLS=[{x:270,y:110,w:26,h:225},{x:710,y:395,w:210,h:30},{x:940,y:100,w:110,h:65},{x:120,y:510,w:110,h:65},{x:475,y:120,w:65,h:65},{x:1000,y:565,w:62,h:62},{x:1350,y:210,w:180,h:40},{x:1450,y:730,w:40,h:220},{x:450,y:870,w:200,h:45},...CAMO_PROPS.map(({x,y,w,h})=>({x,y,w,h}))];
export const OBSTACLE_HEIGHTS=[2.6,1.3,2.4,.9,1.4,1.3,5.6,4.8,2.8,...CAMO_PROPS.map(p=>p.height)];
export type MapId='art'|'amusement'|'forest'|'ocean'|'museum';
export const MAPS=[
 {id:'art',name:'미술교실',icon:'🎨',description:'책장 · 그림 · 색칠 도구',colors:['#923f37','#dbba79','#436966']},
 {id:'amusement',name:'놀이공원',icon:'🎡',description:'대관람차 · 매점 · 선물',colors:['#ed5353','#f0bd4c','#569be0']},
 {id:'forest',name:'숲속 캠핑',icon:'⛺',description:'키 큰 나무 · 텐트 · 통나무',colors:['#68875d','#78532f','#ad8051']},
 {id:'ocean',name:'해저탐험',icon:'🐠',description:'산호 · 난파선 · 보물 상자',colors:['#2294ab','#ed7891','#dfba72']},
 {id:'museum',name:'박물관',icon:'🏛️',description:'유물 · 전시대 · 그림 전시',colors:['#d8cdb6','#ab8055','#456c79']}
] as const;
export type MapObstacle={x:number;y:number;w:number;h:number;height:number;kind:string;color:string};
const prop=(x:number,y:number,w:number,h:number,height:number,kind:string,color:string):MapObstacle=>({x,y,w,h,height,kind,color});
const layouts:Record<MapId,MapObstacle[]>={
 art:WALLS.map((w,i)=>({...w,height:OBSTACLE_HEIGHTS[i],kind:i<WALLS.length-CAMO_PROPS.length?'art':CAMO_PROPS[i-(WALLS.length-CAMO_PROPS.length)].kind,color:'#ad8051'})),
 amusement:[prop(180,120,200,100,5.8,'wheel','#569be0'),prop(600,120,150,100,3,'booth','#ed5353'),prop(980,100,180,100,3.3,'booth','#f0bd4c'),prop(1410,140,200,150,4.5,'carousel','#b377ce'),prop(170,420,130,110,2,'gift','#70b65b'),prop(730,390,210,90,2.8,'booth','#eb89ac'),prop(1200,460,110,100,2,'gift','#569be0'),prop(1550,560,110,100,3,'blocks','#f0bd4c'),prop(170,850,180,130,3,'blocks','#ed5353'),prop(570,890,180,100,2,'gift','#b377ce'),prop(960,900,180,110,3.2,'booth','#569be0'),prop(1390,850,200,150,5,'wheel','#ed5353')],
 forest:[prop(230,130,110,110,10.5,'tree','#3d5d42'),prop(520,230,100,100,8.5,'tree','#68875d'),prop(960,120,240,190,2.6,'tent','#d2a65c'),prop(1460,150,120,120,11,'tree','#3d5d42'),prop(1260,480,150,100,1.3,'rock','#89938a'),prop(220,840,260,65,.85,'log','#78532f'),prop(730,900,100,100,9,'tree','#68875d'),prop(1340,870,250,150,2.4,'tent','#689399'),prop(170,440,95,95,7,'tree','#4f7140'),prop(730,430,120,80,1.7,'rock','#89938a'),prop(1630,550,85,85,10,'tree','#3d5d42'),prop(1020,940,180,60,1,'log','#78532f')],
 ocean:[prop(190,120,170,110,4,'coral','#ed7891'),prop(600,160,170,110,5,'reef','#456c79'),prop(980,100,280,150,3.8,'ship','#78532f'),prop(1480,150,110,100,7.8,'kelp','#358b73'),prop(180,460,180,100,2,'chest','#ad8051'),prop(730,400,160,120,3.5,'coral','#b377ce'),prop(1250,470,130,100,5.8,'reef','#426882'),prop(1580,570,100,100,7,'kelp','#358b73'),prop(180,870,200,140,3,'reef','#689399'),prop(590,900,200,100,2,'chest','#ad8051'),prop(990,870,170,130,4.2,'coral','#f0bd4c'),prop(1420,890,180,100,6,'kelp','#358b73')],
 museum:[prop(180,120,140,100,5.5,'column','#d8cdb6'),prop(570,120,190,85,3.4,'exhibit','#456c79'),prop(1030,140,210,80,3.6,'painting','#ab8055'),prop(1460,120,140,100,7,'column','#d8cdb6'),prop(170,440,170,100,3.2,'vase','#ad6246'),prop(700,410,200,110,3.6,'fossil','#b7ab8f'),prop(1220,450,210,80,3.6,'painting','#436966'),prop(1570,540,100,100,8.5,'column','#d8cdb6'),prop(180,860,210,100,3.6,'painting','#923f37'),prop(580,900,170,100,3.5,'vase','#689399'),prop(990,900,190,100,3.2,'exhibit','#dbba79'),prop(1400,860,200,120,4,'fossil','#b7ab8f')]
};
const scaledLayouts=Object.fromEntries(Object.entries(layouts).map(([id,items])=>[id,items.map(o=>({...o,x:o.x*MAP_SCALE,y:o.y*MAP_SCALE,w:o.w*MAP_SCALE,h:o.h*MAP_SCALE}))])) as Record<MapId,MapObstacle[]>;
const ground=Object.fromEntries(Object.entries(scaledLayouts).map(([id,items])=>[id,items.flatMap(groundParts)]));
export function mapGround(mapId:MapId='art'){return ground[normalizeMapId(mapId)];}
export function normalizeMapId(id:unknown):MapId{return id==='toys'?'amusement':MAPS.some(m=>m.id===id)?id as MapId:'art';}
export function mapObstacles(mapId:MapId='art'):MapObstacle[]{return scaledLayouts[normalizeMapId(mapId)];}
const covers=Object.fromEntries(MAPS.map(m=>[m.id,createCover(m.id,MAP_SCALE)]));
export function mapCover(mapId:MapId='art'){return covers[normalizeMapId(mapId)];}
export function mapName(mapId:MapId='art'){return MAPS.find(m=>m.id===normalizeMapId(mapId))!.name;}
export const CEILING_HEIGHT=13.2,MAX_ELEVATION=9.2;
export type Pose='stand'|'arms'|'crouch'|'lie'|'slim'|'curl'|'side'|'flat';
export type Player={hidden?:boolean;id:string;token?:string;name:string;paint:string[];paintVersion?:number;x:number;y:number;angle?:number;elevation?:number;pose?:Pose;leftArm?:number;rightArm?:number;locked?:boolean;role:'hider'|'seeker';caught:boolean;last:number;connection?:{rtt:number;at:number};moveAt:number;catchAt:number;heightStepAt?:number;shots?:number;reloadUntil?:number;viewYaw?:number;viewPitch?:number};
export type RoomSettings={paintSeconds:number;hideSeconds:number;seekSeconds:number;maxPlayers:number;seekerCount:number;mapId:MapId};
export const DEFAULT_SETTINGS:RoomSettings={paintSeconds:180,hideSeconds:0,seekSeconds:120,maxPlayers:6,seekerCount:1,mapId:'art'};
export function parseSettings(value:unknown):RoomSettings|null{if(!value||typeof value!=='object')return null;const v=value as RoomSettings,seekerCount=v.seekerCount===undefined?1:v.seekerCount,mapId=(v.mapId as string)==='toys'?'amusement':v.mapId===undefined?'art':v.mapId;if(!MAPS.some(m=>m.id===mapId)||!Number.isInteger(seekerCount)||seekerCount<1||seekerCount>=v.maxPlayers||![60,120,180,300].includes(v.paintSeconds)||![0,15,30,60].includes(v.hideSeconds)||![60,120,180,300].includes(v.seekSeconds)||!Number.isInteger(v.maxPlayers)||v.maxPlayers<2||v.maxPlayers>20)return null;return {paintSeconds:v.paintSeconds,hideSeconds:v.hideSeconds,seekSeconds:v.seekSeconds,maxPlayers:v.maxPlayers,seekerCount,mapId};}
export function roomSettings(r:Room){return {...DEFAULT_SETTINGS,...r.settings,mapId:normalizeMapId(r.settings?.mapId)};}
export type Room={finalHint?:{x:number;y:number;z:number}|null;playArea?:'small'|'medium'|'full';settings?:RoomSettings;code:string;host:string;phase:'lobby'|'paint'|'hide'|'seek'|'result';end:number;paused:number;round:number;players:Player[];winner:string;message:string};
export function areaForCount(count:number):NonNullable<Room['playArea']>{return count<=6?'small':count<=12?'medium':'full';}
export function roomBounds(room?:Room|null){const area=room?.playArea;return {width:(area==='small'?1200:area==='medium'?1500:1800)*MAP_SCALE,height:(area==='small'?900:1140)*MAP_SCALE};}
export function areaName(area:Room['playArea']){return area==='small'?'작은 구역':area==='medium'?'중간 구역':'전체 맵';}
export function areaWalls(room?:Room|null){const b=roomBounds(room),parts:ReturnType<typeof mapCover>=[];if(b.width<W)parts.push({x:b.width,y:0,w:16,h:b.height,base:0,height:CEILING_HEIGHT,color:'#68875d',kind:'boundary'});if(b.height<H)parts.push({x:0,y:b.height,w:b.width+16,h:16,base:0,height:CEILING_HEIGHT,color:'#ad8051',kind:'boundary'});return parts;}
export function defaultPaint(color='#f2eee2'){return Array(PAINT_SIZE*PAINT_SIZE).fill(color) as string[];}
export function patternPaint(pattern:'brick'|'wood'|'leaf'|'plain'){
 const result=defaultPaint();for(let y=0;y<PAINT_SIZE;y++)for(let x=0;x<PAINT_SIZE;x++){
 if(pattern==='brick'){const row=Math.floor(y/6),mortar=y%6===0||(x+(row%2)*8)%16===0;result[y*PAINT_SIZE+x]=mortar?COLORS[2]:((x*7+y*3)%11<3?COLORS[1]:COLORS[0]);}
 if(pattern==='wood')result[y*PAINT_SIZE+x]=x%9===0?COLORS[7]:(x+y*3)%7===0?'#bc945f':COLORS[6];
 if(pattern==='leaf')result[y*PAINT_SIZE+x]=Math.sin(x*.8)+Math.cos(y*.7)>.2?COLORS[4]:COLORS[5];
 }return result;
}
export function makePlayer(id:string,name:string,now:number):Player{return {id,name,paint:defaultPaint(),x:560*MAP_SCALE,y:700*MAP_SCALE,angle:Math.PI,pose:'stand',locked:false,role:'hider',caught:false,last:now,moveAt:now,catchAt:0};}
export function makeRoom(code:string,p:Player):Room{return {code,host:p.id,phase:'lobby',end:0,paused:0,round:0,players:[p],winner:'',message:''};}
export function canStand(x:number,y:number,mapId:MapId='art',elevation=0,bodyHeight=1.7,bounds=roomBounds()){return x>=28&&y>=28&&x<=bounds.width-28&&y<=bounds.height-28&&!mapGround(mapId).some(r=>coverOverlaps(r,x,y,elevation,bodyHeight))&&!mapCover(mapId).some(r=>coverOverlaps(r,x,y,elevation,bodyHeight));}
export function move(p:Player,dx:number,dy:number,dt:number,mapId:MapId='art',bounds=roomBounds()){if(p.locked||![dx,dy,dt].every(Number.isFinite))return;const n=Math.hypot(dx,dy);if(!n)return;const d=SPEED*Math.min(Math.max(dt,0),.3),steps=Math.max(1,Math.ceil(d/8));for(let i=0;i<steps;i++){const x=p.x+dx/n*d/steps,y=p.y+dy/n*d/steps;if(canStand(x,p.y,mapId,p.elevation||0,bodyHeight(p.pose),bounds))p.x=x;if(canStand(p.x,y,mapId,p.elevation||0,bodyHeight(p.pose),bounds))p.y=y;}p.angle=Math.atan2(dx,dy);}
export function bodyHeight(pose?:Pose){return pose==='curl'?.75:pose==='side'?.7:pose==='lie'?.65:pose==='crouch'?1:1.7;}
export function poseHeight(pose?:Pose){return pose==='curl'?.42:pose==='side'?.4:pose==='lie'?.35:pose==='crouch'?.55:1;}
export function visibleLine(a:Player,b:Player,mapId:MapId='art'){const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);for(let i=0;i<=steps;i++){const t=i/Math.max(steps,1),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;const from=(a.elevation||0)+(a.role==='seeker'?1.48:poseHeight(a.pose)),to=(b.elevation||0)+poseHeight(b.pose),height=from+(to-from)*t;if(mapGround(mapId).some(r=>coverContains(r,x,y,height)))return false;if(mapCover(mapId).some(r=>coverContains(r,x,y,height)))return false;}return true;}
export function nextPhase(r:Room,now:number){
 if(r.phase==='lobby'||r.phase==='result'){if(r.players.length<=roomSettings(r).seekerCount)return;r.playArea=areaForCount(r.players.length);r.round++;r.phase='paint';r.end=now+roomSettings(r).paintSeconds*1000;r.winner='';r.message='';r.players.forEach((p,i)=>{p.role=(i-(r.round-1)%r.players.length+r.players.length)%r.players.length<roomSettings(r).seekerCount?'seeker':'hider';p.caught=false;p.x=(380+(i%10)*65)*MAP_SCALE;p.y=(650+Math.floor(i/10)*65)*MAP_SCALE;p.angle=Math.PI;p.elevation=0;p.pose='stand';delete p.leftArm;delete p.rightArm;p.locked=false;p.moveAt=now;p.catchAt=0;p.shots=0;p.reloadUntil=0;p.viewYaw=0;p.viewPitch=.16;});}
 else if(r.phase==='paint'){r.phase='seek';r.end=now+roomSettings(r).seekSeconds*1000;r.message='숨기 시간 끝! 술래가 출발해요.';}
 else if(r.phase==='hide'){r.phase='seek';r.end=now+roomSettings(r).seekSeconds*1000;}
 else if(r.phase==='seek'){r.phase='result';r.winner=r.players.some(p=>p.role==='hider'&&!p.caught)?'숨는 친구들':'술래';r.end=0;}
}
export function advance(r:Room,now:number){if(r.paused)return;if(!['lobby','result'].includes(r.phase)&&!r.players.some(p=>p.role==='seeker')){r.phase='result';r.end=0;r.winner='술래가 모두 나가서 판이 끝났어요';return;}while(r.phase!=='lobby'&&r.phase!=='result'&&now>=r.end)nextPhase(r,r.end);if(r.phase==='seek'&&r.players.filter(p=>p.role==='hider').every(p=>p.caught))nextPhase(r,now);}
export function catchTarget(r:Room,p:Player,targetId:string,now:number){if(r.phase!=='seek'||r.paused||p.role!=='seeker'||p.caught||ammunition(p,now).wait>0||now-p.catchAt<SHOT_COOLDOWN)return false;if(p.reloadUntil){p.shots=0;p.reloadUntil=0;}p.shots=(p.shots||0)+1;if(p.shots>=MAGAZINE)p.reloadUntil=now+RELOAD_MS;p.catchAt=now;const target=r.players.find(q=>q.id===targetId&&q.role==='hider'&&!q.caught&&Math.hypot(q.x-p.x,q.y-p.y,((q.elevation||0)-(p.elevation||0))*100)<=SHOT_RANGE&&visibleLine(p,q,roomSettings(r).mapId));if(target){target.caught=true;r.message=target.name+' 발견!';advance(r,now);return true;}return false;}
export function catchNearest(r:Room,p:Player,now:number){const target=r.players.filter(q=>q.role==='hider'&&!q.caught&&Math.hypot(q.x-p.x,q.y-p.y)<=85&&visibleLine(p,q,roomSettings(r).mapId)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];return target?catchTarget(r,p,target.id,now):false;}
const hiddenPaint=defaultPaint();
export function publicRoom(r:Room,id:string,canSee?:(viewer:Player,target:Player)=>boolean,watch?:string){const me=r.players.find(p=>p.id===id),viewer=me?.caught?(spectatorPlayers(r).find(p=>p.id===watch)||spectatorPlayers(r)[0]):me;return {...r,finalHint:me&&(me.role==='seeker'||me.caught)?finalHint(r,Date.now()):null,players:r.players.map(p=>{const {token,...safe}=p;const hidden=p.id!==id&&p.role==='hider'&&(['paint','hide'].includes(r.phase)&&me?.role==='seeker'||r.phase==='seek'&&!p.caught&&!!canSee&&(!viewer||viewer.role!=='seeker'||!canSee(viewer,p)));return hidden?{...safe,hidden:true,x:0,y:0,elevation:0,angle:0,pose:'stand' as Pose,leftArm:undefined,rightArm:undefined,locked:false,paint:hiddenPaint,paintVersion:-1}:{...safe,hidden:false};})};}


export function attachToWall(p:Player,mapId:MapId='art',bounds=roomBounds()){
 const candidates=[{x:p.x,y:28,angle:0},{x:p.x,y:bounds.height-28,angle:Math.PI},{x:28,y:p.y,angle:Math.PI/2},{x:bounds.width-28,y:p.y,angle:-Math.PI/2}];
 for(const w of [...mapGround(mapId),...mapCover(mapId)]){if((p.elevation||0)+bodyHeight(p.pose)<=w.base||(p.elevation||0)>=w.base+w.height)continue;if(p.y>=w.y&&p.y<=w.y+w.h)candidates.push({x:w.x-20,y:p.y,angle:-Math.PI/2},{x:w.x+w.w+20,y:p.y,angle:Math.PI/2});if(p.x>=w.x&&p.x<=w.x+w.w)candidates.push({x:p.x,y:w.y-20,angle:Math.PI},{x:p.x,y:w.y+w.h+20,angle:0});}
 const target=candidates.filter(c=>canStand(c.x,c.y,mapId,p.elevation||0,1.7,bounds)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 if(!target||Math.hypot(target.x-p.x,target.y-p.y)>95)return false;
 p.x=target.x;p.y=target.y;p.angle=target.angle;p.pose='arms';delete p.leftArm;delete p.rightArm;p.locked=true;p.elevation=Math.max(p.elevation||0,.22);return true;
}

export function adjustPose(p:Player,a:{pose?:unknown;leftArm?:unknown;rightArm?:unknown}){
 if(['stand','arms','crouch','lie','slim','curl','side','flat'].includes(String(a.pose))){p.pose=a.pose as Pose;delete p.leftArm;delete p.rightArm;}
 for(const key of ['leftArm','rightArm'] as const)if(typeof a[key]==='number'&&Number.isFinite(a[key]))p[key]=Math.max(0,Math.min(160,Math.round(a[key] as number)));
}

export function moveHeight(p:Player,dz:number,dt:number,mapId:MapId='art'){if(p.locked||p.caught||!Number.isFinite(dz)||!Number.isFinite(dt))return;const z=Math.max(0,Math.min(MAX_ELEVATION,(p.elevation||0)+Math.max(-1,Math.min(1,dz))*.9*Math.max(0,Math.min(.3,dt))));const from=p.elevation||0,steps=Math.max(1,Math.ceil(Math.abs(z-from)/.05));for(let i=1;i<=steps;i++){const next=from+(z-from)*i/steps;if(!canStand(p.x,p.y,mapId,next,bodyHeight(p.pose)))break;p.elevation=next;}}

export function stepHeight(r:Room,p:Player,direction:unknown,now:number){if(direction!==1&&direction!==-1)return false;if(r.paused||p.caught||p.locked||r.phase==='result'||p.role==='seeker'&&r.phase!=='seek'||now-(p.heightStepAt||0)<180)return false;p.heightStepAt=now;moveHeight(p,direction,1/6,roomSettings(r).mapId);return true;}

export function hidingSpots(mapId:MapId){
 const cover=mapCover(mapId);const mural=cover.filter(o=>o.kind==='camo-panel').map(o=>({x:o.x+o.w/2,y:o.y+o.h+38,elevation:o.base,label:'무늬 맞추기'})).filter(s=>canStand(s.x,s.y,mapId,s.elevation));return [...mural,...[.35,3.65,7.7].flatMap((base,i)=>{const candidates=cover.filter(o=>o.kind.startsWith('wall')&&o.base===base&&o.y<100&&o.w>200);for(let j=0;j<candidates.length;j++){const o=candidates[(i+j)%candidates.length],x=o.x+o.w/2,y=o.y+o.h+35;if(canStand(x,y,mapId,base))return [{x,y,elevation:base,label:i===0?'쉬운 자리':i===1?'중간 높이':'높은 자리'}];}return [];})];
}
export function showHidingHints(r:Room|null,id:string,enabled:boolean,preview=false){const p=r?.players.find(p=>p.id===id);return !!(enabled&&!preview&&r&&!r.paused&&['paint','hide'].includes(r.phase)&&p?.role==='hider'&&!p.caught);}
