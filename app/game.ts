export const W=1800,H=1140,SPEED=250,PAINT_SIZE=128;
export const SHOT_COOLDOWN=800,SHOT_RANGE=750;
export const COLORS=['#ad6246','#78442f','#d2c1a3','#e0d9c8','#68875d','#3d5d42','#ad8051','#78532f','#689399','#3d666e','#536882','#f2eee2','#ffffff','#171717','#ed5353','#f0bd4c','#70b65b','#569be0','#b377ce','#eb89ac'];
export const ZONES=[{x:0,y:0,w:1800,h:1140,c:'#b5aa8c',name:'오래된 미술실'}];
export const CAMO_PROPS=[{x:1120,y:740,w:100,h:75,height:1.1,kind:'crates'},{x:180,y:770,w:65,h:65,height:1.65,kind:'plant'},{x:1550,y:420,w:70,h:65,height:1.5,kind:'plant'},{x:790,y:920,w:100,h:70,height:1.1,kind:'books'}] as const;
export const WALLS=[{x:270,y:110,w:26,h:225},{x:710,y:395,w:210,h:30},{x:940,y:100,w:110,h:65},{x:120,y:510,w:110,h:65},{x:475,y:120,w:65,h:65},{x:1000,y:565,w:62,h:62},{x:1350,y:210,w:180,h:40},{x:1450,y:730,w:40,h:220},{x:450,y:870,w:200,h:45},...CAMO_PROPS.map(({x,y,w,h})=>({x,y,w,h}))];
export const OBSTACLE_HEIGHTS=[2.6,1.3,2.4,.9,1.4,1.3,5.6,4.8,2.8,...CAMO_PROPS.map(p=>p.height)];
export type MapId='art'|'toys'|'forest';
export const MAPS=[{id:'art',name:'미술 교실',description:'책장과 그림 속에 꼭꼭',colors:['#923f37','#dbba79','#436966']},{id:'toys',name:'장난감 방',description:'알록달록 블록과 선물 상자',colors:['#ed5353','#f0bd4c','#569be0']},{id:'forest',name:'숲속 캠핑장',description:'나무와 텐트 사이로 쏙',colors:['#68875d','#78532f','#ad8051']}] as const;
export type MapObstacle={x:number;y:number;w:number;h:number;height:number;kind:string;color:string};
const TOY_OBSTACLES:MapObstacle[]=[
 {x:220,y:180,w:150,h:110,height:2.4,kind:'blocks',color:'#ed5353'},
 {x:630,y:120,w:110,h:100,height:3.8,kind:'blocks',color:'#569be0'},
 {x:1050,y:190,w:240,h:75,height:1.5,kind:'gift',color:'#b377ce'},
 {x:1430,y:90,w:170,h:150,height:4.6,kind:'blocks',color:'#f0bd4c'},
 {x:1250,y:500,w:150,h:140,height:2.1,kind:'gift',color:'#70b65b'},
 {x:180,y:820,w:180,h:140,height:1.6,kind:'gift',color:'#eb89ac'},
 {x:630,y:900,w:280,h:65,height:1.1,kind:'blocks',color:'#f0bd4c'},
 {x:1450,y:850,w:160,h:160,height:3.3,kind:'blocks',color:'#569be0'}];
const FOREST_OBSTACLES:MapObstacle[]=[
 {x:230,y:130,w:110,h:110,height:5.5,kind:'tree',color:'#3d5d42'},
 {x:520,y:230,w:100,h:100,height:4.5,kind:'tree',color:'#68875d'},
 {x:960,y:120,w:240,h:190,height:2.6,kind:'tent',color:'#d2a65c'},
 {x:1460,y:150,w:120,h:120,height:5.8,kind:'tree',color:'#3d5d42'},
 {x:1260,y:560,w:150,h:100,height:1.3,kind:'rock',color:'#89938a'},
 {x:220,y:840,w:260,h:65,height:.85,kind:'log',color:'#78532f'},
 {x:730,y:900,w:100,h:100,height:4.8,kind:'tree',color:'#68875d'},
 {x:1340,y:870,w:250,h:150,height:2.4,kind:'tent',color:'#689399'}];
const ART_OBSTACLES:MapObstacle[]=WALLS.map((w,i)=>({...w,height:OBSTACLE_HEIGHTS[i],kind:'art',color:'#ad8051'}));
export function mapObstacles(mapId:MapId='art'):MapObstacle[]{return mapId==='toys'?TOY_OBSTACLES:mapId==='forest'?FOREST_OBSTACLES:ART_OBSTACLES;}
export function mapName(mapId:MapId='art'){return MAPS.find(m=>m.id===mapId)?.name||MAPS[0].name;}
export const CEILING_HEIGHT=6.6,MAX_ELEVATION=4.6;
export type Pose='stand'|'arms'|'crouch'|'lie'|'slim'|'curl'|'side'|'flat';
export type Player={id:string;token?:string;name:string;paint:string[];paintVersion?:number;x:number;y:number;angle?:number;elevation?:number;pose?:Pose;leftArm?:number;rightArm?:number;locked?:boolean;role:'hider'|'seeker';caught:boolean;last:number;moveAt:number;catchAt:number};
export type RoomSettings={paintSeconds:number;hideSeconds:number;seekSeconds:number;maxPlayers:number;seekerCount:number;mapId:MapId};
export const DEFAULT_SETTINGS:RoomSettings={paintSeconds:180,hideSeconds:0,seekSeconds:120,maxPlayers:6,seekerCount:1,mapId:'art'};
export function parseSettings(value:unknown):RoomSettings|null{if(!value||typeof value!=='object')return null;const v=value as RoomSettings,seekerCount=v.seekerCount===undefined?1:v.seekerCount,mapId=v.mapId===undefined?'art':v.mapId;if(!MAPS.some(m=>m.id===mapId)||!Number.isInteger(seekerCount)||seekerCount<1||seekerCount>=v.maxPlayers||![60,120,180,300].includes(v.paintSeconds)||![0,15,30,60].includes(v.hideSeconds)||![60,120,180,300].includes(v.seekSeconds)||!Number.isInteger(v.maxPlayers)||v.maxPlayers<2||v.maxPlayers>20)return null;return {paintSeconds:v.paintSeconds,hideSeconds:v.hideSeconds,seekSeconds:v.seekSeconds,maxPlayers:v.maxPlayers,seekerCount,mapId};}
export function roomSettings(r:Room){return {...DEFAULT_SETTINGS,...r.settings};}
export type Room={settings?:RoomSettings;code:string;host:string;phase:'lobby'|'paint'|'hide'|'seek'|'result';end:number;paused:number;round:number;players:Player[];winner:string;message:string};
export function defaultPaint(color='#f2eee2'){return Array(PAINT_SIZE*PAINT_SIZE).fill(color) as string[];}
export function patternPaint(pattern:'brick'|'wood'|'leaf'|'plain'){
 const result=defaultPaint();for(let y=0;y<PAINT_SIZE;y++)for(let x=0;x<PAINT_SIZE;x++){
 if(pattern==='brick'){const row=Math.floor(y/6),mortar=y%6===0||(x+(row%2)*8)%16===0;result[y*PAINT_SIZE+x]=mortar?COLORS[2]:((x*7+y*3)%11<3?COLORS[1]:COLORS[0]);}
 if(pattern==='wood')result[y*PAINT_SIZE+x]=x%9===0?COLORS[7]:(x+y*3)%7===0?'#bc945f':COLORS[6];
 if(pattern==='leaf')result[y*PAINT_SIZE+x]=Math.sin(x*.8)+Math.cos(y*.7)>.2?COLORS[4]:COLORS[5];
 }return result;
}
export function makePlayer(id:string,name:string,now:number):Player{return {id,name,paint:defaultPaint(),x:560,y:470,angle:Math.PI,pose:'stand',locked:false,role:'hider',caught:false,last:now,moveAt:now,catchAt:0};}
export function makeRoom(code:string,p:Player):Room{return {code,host:p.id,phase:'lobby',end:0,paused:0,round:0,players:[p],winner:'',message:''};}
export function canStand(x:number,y:number,mapId:MapId='art'){return x>=28&&y>=28&&x<=W-28&&y<=H-28&&!mapObstacles(mapId).some(r=>x>r.x-18&&x<r.x+r.w+18&&y>r.y-18&&y<r.y+r.h+18);}
export function move(p:Player,dx:number,dy:number,dt:number,mapId:MapId='art'){if(p.locked||![dx,dy,dt].every(Number.isFinite))return;const n=Math.hypot(dx,dy);if(!n)return;const d=SPEED*Math.min(Math.max(dt,0),.3),steps=Math.max(1,Math.ceil(d/8));for(let i=0;i<steps;i++){const x=p.x+dx/n*d/steps,y=p.y+dy/n*d/steps;if(canStand(x,p.y,mapId))p.x=x;if(canStand(p.x,y,mapId))p.y=y;}p.angle=Math.atan2(dx,dy);}
export function poseHeight(pose?:Pose){return pose==='curl'?.42:pose==='side'?.4:pose==='lie'?.35:pose==='crouch'?.55:1;}
export function visibleLine(a:Player,b:Player,mapId:MapId='art'){const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);for(let i=0;i<=steps;i++){const t=i/Math.max(steps,1),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;const from=(a.elevation||0)+(a.role==='seeker'?1.48:poseHeight(a.pose)),to=(b.elevation||0)+poseHeight(b.pose),height=from+(to-from)*t;if(mapObstacles(mapId).some(r=>height<=r.height&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h))return false;}return true;}
export function nextPhase(r:Room,now:number){
 if(r.phase==='lobby'||r.phase==='result'){if(r.players.length<=roomSettings(r).seekerCount)return;r.round++;r.phase='paint';r.end=now+roomSettings(r).paintSeconds*1000;r.winner='';r.message='';r.players.forEach((p,i)=>{p.role=(i-(r.round-1)%r.players.length+r.players.length)%r.players.length<roomSettings(r).seekerCount?'seeker':'hider';p.caught=false;p.x=380+(i%10)*65;p.y=650+Math.floor(i/10)*65;p.angle=Math.PI;p.elevation=0;p.pose='stand';delete p.leftArm;delete p.rightArm;p.locked=false;p.moveAt=now;p.catchAt=0;});}
 else if(r.phase==='paint'){r.phase='seek';r.end=now+roomSettings(r).seekSeconds*1000;r.message='숨기 시간 끝! 술래가 출발해요.';}
 else if(r.phase==='hide'){r.phase='seek';r.end=now+roomSettings(r).seekSeconds*1000;}
 else if(r.phase==='seek'){r.phase='result';r.winner=r.players.some(p=>p.role==='hider'&&!p.caught)?'숨는 친구들':'술래';r.end=0;}
}
export function advance(r:Room,now:number){if(r.paused)return;if(!['lobby','result'].includes(r.phase)&&!r.players.some(p=>p.role==='seeker')){r.phase='result';r.end=0;r.winner='술래가 모두 나가서 판이 끝났어요';return;}while(r.phase!=='lobby'&&r.phase!=='result'&&now>=r.end)nextPhase(r,r.end);if(r.phase==='seek'&&r.players.filter(p=>p.role==='hider').every(p=>p.caught))nextPhase(r,now);}
export function catchTarget(r:Room,p:Player,targetId:string,now:number){if(r.phase!=='seek'||r.paused||p.role!=='seeker'||now-p.catchAt<SHOT_COOLDOWN)return false;p.catchAt=now;const target=r.players.find(q=>q.id===targetId&&q.role==='hider'&&!q.caught&&Math.hypot(q.x-p.x,q.y-p.y,((q.elevation||0)-(p.elevation||0))*100)<=SHOT_RANGE&&visibleLine(p,q,roomSettings(r).mapId));if(target){target.caught=true;r.message=target.name+' 발견!';advance(r,now);return true;}return false;}
export function catchNearest(r:Room,p:Player,now:number){const target=r.players.filter(q=>q.role==='hider'&&!q.caught&&Math.hypot(q.x-p.x,q.y-p.y)<=85&&visibleLine(p,q,roomSettings(r).mapId)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];return target?catchTarget(r,p,target.id,now):false;}
export function publicRoom(r:Room,id:string){const me=r.players.find(p=>p.id===id);return {...r,players:r.players.map(p=>{const {token,...safe}=p;return ['paint','hide'].includes(r.phase)&&me?.role==='seeker'&&p.id!==id?{...safe,x:0,y:0}:safe;})};}

export function attachToWall(p:Player,mapId:MapId='art'){
 const candidates=[{x:p.x,y:28,angle:0},{x:p.x,y:H-28,angle:Math.PI},{x:28,y:p.y,angle:Math.PI/2},{x:W-28,y:p.y,angle:-Math.PI/2}];
 for(const w of mapObstacles(mapId)){if(p.y>=w.y&&p.y<=w.y+w.h)candidates.push({x:w.x-20,y:p.y,angle:-Math.PI/2},{x:w.x+w.w+20,y:p.y,angle:Math.PI/2});if(p.x>=w.x&&p.x<=w.x+w.w)candidates.push({x:p.x,y:w.y-20,angle:Math.PI},{x:p.x,y:w.y+w.h+20,angle:0});}
 const target=candidates.filter(c=>canStand(c.x,c.y,mapId)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
 if(!target||Math.hypot(target.x-p.x,target.y-p.y)>95)return false;
 p.x=target.x;p.y=target.y;p.angle=target.angle;p.pose='arms';delete p.leftArm;delete p.rightArm;p.locked=true;p.elevation=Math.max(p.elevation||0,.22);return true;
}

export function adjustPose(p:Player,a:{pose?:unknown;leftArm?:unknown;rightArm?:unknown}){
 if(['stand','arms','crouch','lie','slim','curl','side','flat'].includes(String(a.pose))){p.pose=a.pose as Pose;delete p.leftArm;delete p.rightArm;}
 for(const key of ['leftArm','rightArm'] as const)if(typeof a[key]==='number'&&Number.isFinite(a[key]))p[key]=Math.max(0,Math.min(160,Math.round(a[key] as number)));
}

export function moveHeight(p:Player,dz:number,dt:number){if(p.locked||p.caught||!Number.isFinite(dz)||!Number.isFinite(dt))return;p.elevation=Math.max(0,Math.min(MAX_ELEVATION,(p.elevation||0)+Math.max(-1,Math.min(1,dz))*.9*Math.max(0,Math.min(.3,dt))));}
