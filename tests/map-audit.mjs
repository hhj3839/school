import './resolve-ts.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const g=await import('../app/game.ts'),reports=[];

// Grid sampling checks disconnected floor pockets across every playable size.
// It does not prove that every continuous 3D position or pose is reachable.
for(const {id,name} of g.MAPS)for(const count of [2,6,12,20]){
  const r=g.makeRoom('AUD222',g.makePlayer('0','0',0));
  r.settings={...g.DEFAULT_SETTINGS,mapId:id,maxPlayers:20};
  for(let i=1;i<count;i++)r.players.push(g.makePlayer(''+i,''+i,0));
  g.nextPhase(r,0);const bounds=g.roomBounds(r);
  assert.ok(r.players.every(p=>g.canStand(p.x,p.y,id,0,1.7,bounds)),`${name}/${count}: clear spawns`);
  assert.equal(new Set(r.players.map(p=>p.x+','+p.y)).size,count);
  const step=35,walk=new Set();
  for(let x=1;x*step<bounds.width-28;x++)for(let y=1;y*step<bounds.height-28;y++)if(g.canStand(x*step,y*step,id,0,1.7,bounds))walk.add(x+','+y);
  const components=[];
  while(walk.size){
    const first=walk.values().next().value,queue=[first];walk.delete(first);
    for(let i=0;i<queue.length;i++){
      const [x,y]=queue[i].split(',').map(Number);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const key=(x+dx)+','+(y+dy);if(walk.delete(key))queue.push(key);}
    }
    components.push(queue.length);
  }
  assert.equal(components.length,1,`${name}/${count}: connected sampled floor`);
  for(const p of r.players)for(let i=0;i<100;i++){
    g.move(p,Math.sin(i*1.3),Math.cos(i*.7),.3,id,bounds);
    assert.ok(g.canStand(p.x,p.y,id,p.elevation||0,g.bodyHeight(p.pose),bounds),`${name}: movement cannot enter solids`);
  }
  const spots=g.hidingSpots(id).filter(s=>s.x<bounds.width-28&&s.y<bounds.height-28);
  assert.ok(spots.length>0);
  assert.ok(spots.every(s=>g.canStand(s.x,s.y,id,s.elevation,1.7,bounds)),`${name}: hints are valid standing positions`);
  reports.push({map:id,name,count,area:r.playArea,floorSamples:components[0],hintSpots:spots.length,clearSpawns:true,movement:true});
}
await mkdir(new URL('../outputs/',import.meta.url),{recursive:true});
await writeFile(new URL('../outputs/map-static-audit.json',import.meta.url),JSON.stringify({testedAt:new Date().toISOString(),gridStep:35,reports},null,2));
console.log('PASS: 5 maps × 4 player counts; unique clear spawns, connected sampled floors, 20,000 movement steps, valid hiding hints');
