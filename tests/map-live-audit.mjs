import './resolve-ts.mjs';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {MAPS,DEFAULT_SETTINGS,canStand,roomBounds}=await import('../app/game.ts');

const base='https://kkokkkok-hideout.hhj3839.chatgpt.site',reports=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function call(action,extra={},session={}){
  for(let i=0;i<6;i++){
    const response=await fetch(base+'/api/room',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({...session,action,...extra}),signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    if(response.status===503||(action==='create'&&response.status===429)){await sleep(action==='create'?5100:250*(i+1));continue;}
    assert.equal(response.status,200,`${action}: ${response.status} ${data.error}`);
    return data;
  }
  throw Error('Map audit retries exhausted');
}
try{
  for(const {id,name} of MAPS){
    const sessions=[];
    try{
      const made=await call('create',{name:'맵 점검',settings:{...DEFAULT_SETTINGS,mapId:id,maxPlayers:20,seekerCount:3}});
      const host={code:made.room.code,token:made.token};sessions.push(host);
      for(let i=1;i<20;i++){
        const joined=await call('join',{code:host.code,name:'맵점검 '+(i+1)});sessions.push({code:host.code,token:joined.token});
      }
      await call('next',{},host);
      // Hiders can see peers during paint; a seeker response redacts positions.
      const started=await call('state',{},sessions[3]),room=started.room;
      assert.equal(room.settings.mapId,id);assert.equal(room.players.length,20);
      assert.equal(room.playArea,'full');
      assert.equal(new Set(room.players.map(p=>p.x+','+p.y)).size,20);
      assert.ok(room.players.every(p=>canStand(p.x,p.y,id,0,1.7,roomBounds(room))),'All live spawn points must be clear');
      const state=await call('state',{},sessions[1]);assert.equal(state.room.settings.mapId,id);
      reports.push({map:id,name,players:20,uniqueClearSpawns:true,sharedMap:true,area:room.playArea});
      console.log('PASS: '+name+' — 20 players, clear spawns, shared map');
    }finally{
      for(const session of [...sessions].reverse())await call('leave',{},session);
    }
  }
}finally{
  await mkdir(new URL('../outputs/',import.meta.url),{recursive:true});
  await writeFile(new URL('../outputs/map-live-audit.json',import.meta.url),JSON.stringify({testedAt:new Date().toISOString(),origin:base,reports},null,2));
}
